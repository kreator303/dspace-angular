import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { APP_CONFIG, AppConfig } from '../../../../../config/app-config.interface';
import { cleanSectionName, compareSections } from '../../shared/section-order';

interface BrowseCollection { uuid: string; name: string; }
interface BrowseSubsection { uuid: string; name: string; collections: BrowseCollection[]; }
interface BrowseSection { uuid: string; name: string; anchor: string; subsections: BrowseSubsection[]; }

/**
 * Always-expanded Section → Subsection → Collection index for the browse page,
 * with a sticky table of contents. Top-level section order comes from the shared
 * section-order module (single source, same as the home list); within sections
 * we preserve DSpace's default (name) order. All levels show cleaned names.
 *
 * Item counts (s121): read from the native archivedItemsCount field carried on
 * each community/collection object the tree already fetches — recorded as the
 * tree is walked, into the `counts` signal. No separate count fetch. Requires
 * webui.strengths.show=true on the backend (set via the .dspace-env config-as-code
 * override in load-secrets.sh); Solr-backed + cached on first load. Replaced the
 * old ~156-parallel-call Discover scope-count loop (the same native field also
 * drives the stock collection/community list-element count badges).
 *
 * Tier 2: a new theme-local component, hosted on the /community-list route by a
 * template-only override of the community-list-page. No stock TS logic touched.
 *
 * NOTE: fetches client-side (like bhbta-sections-list), so links are not yet in
 * the SSR HTML — a TransferState/HttpClient pass is a follow-up for full
 * crawler indexability.
 */
@Component({
  selector: 'bhbta-browse-sections',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './browse-sections.component.html',
  styleUrls: ['./browse-sections.component.scss'],
})
export class BhbtaBrowseSectionsComponent implements OnInit {

  sections = signal<BrowseSection[]>([]);
  counts = signal<Record<string, number>>({});
  loading = signal(true);

  private restBase: string;

  constructor(@Inject(APP_CONFIG) private appConfig: AppConfig) {
    const r = this.appConfig.rest;
    this.restBase = `${r.ssl ? 'https' : 'http'}://${r.host}:${r.port}${r.nameSpace}/api`;
  }

  private async json(url: string): Promise<any> {
    const r = await fetch(url);
    return r.json();
  }

  private anchorFor(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  private async buildTree(): Promise<{ sections: BrowseSection[]; counts: Record<string, number> }> {
    // Count comes from the native archivedItemsCount on each fetched object
    // (webui.strengths.show enabled backend-side, s121) — recorded as the tree is
    // walked, so there is no separate count fetch.
    const counts: Record<string, number> = {};
    const rec = (o: { uuid: string; archivedItemsCount?: number }) => {
      counts[o.uuid] = o.archivedItemsCount ?? 0;
    };

    const top = await this.json(`${this.restBase}/core/communities/search/top?size=50`);
    const comms = (top._embedded?.communities ?? []).sort(compareSections);

    const sections = await Promise.all(
      comms.map(async (c: { uuid: string; name: string; archivedItemsCount?: number }) => {
        rec(c);
        const subResp = await this.json(`${this.restBase}/core/communities/${c.uuid}/subcommunities?size=100`);
        const subs = subResp._embedded?.subcommunities ?? [];
        const subsections: BrowseSubsection[] = await Promise.all(
          subs.map(async (s: { uuid: string; name: string; archivedItemsCount?: number }) => {
            rec(s);
            const colResp = await this.json(`${this.restBase}/core/communities/${s.uuid}/collections?size=100`);
            const cols = colResp._embedded?.collections ?? [];
            return {
              uuid: s.uuid,
              name: cleanSectionName(s.name),
              collections: cols.map((col: { uuid: string; name: string; archivedItemsCount?: number }) => {
                rec(col);
                return { uuid: col.uuid, name: cleanSectionName(col.name) };
              }),
            };
          }),
        );
        const name = cleanSectionName(c.name);
        return { uuid: c.uuid, name, anchor: this.anchorFor(name), subsections };
      }),
    );
    return { sections, counts };
  }

  async ngOnInit() {
    try {
      const { sections, counts } = await this.buildTree();
      this.sections.set(sections);
      this.counts.set(counts);   // counts arrive WITH the tree (native field) — no pop-in
      this.loading.set(false);
    } catch (e) {
      console.error('[bhbta-browse-sections] fetch failed', e);
      this.loading.set(false);
    }
  }
}
