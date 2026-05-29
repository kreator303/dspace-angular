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
 * Item counts (s112): the TREE renders first (≈4s), then counts populate into a
 * separate reactive `counts` signal so the page is never blocked on them. Each
 * node's count is its own Discover scope count (`size=0` → totalElements) —
 * authoritative (matches what DSpace shows on that community/collection page) and
 * cheap: ~156 tiny parallel calls finish in ~4-5s. (Rejected `embed=owningCollection`
 * tally: only ~5 calls but each page embeds 100 full collection objects → ~46s,
 * which blocked the whole page. DSpace exposes no location facet for a 1-call path.)
 * If browse traffic grows, a cached backend counts endpoint is the optimization.
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

  private async buildTree(): Promise<BrowseSection[]> {
    const top = await this.json(`${this.restBase}/core/communities/search/top?size=50`);
    const comms = (top._embedded?.communities ?? []).sort(compareSections);

    return Promise.all(
      comms.map(async (c: { uuid: string; name: string }) => {
        const subResp = await this.json(`${this.restBase}/core/communities/${c.uuid}/subcommunities?size=100`);
        const subs = subResp._embedded?.subcommunities ?? [];
        const subsections: BrowseSubsection[] = await Promise.all(
          subs.map(async (s: { uuid: string; name: string }) => {
            const colResp = await this.json(`${this.restBase}/core/communities/${s.uuid}/collections?size=100`);
            const cols = colResp._embedded?.collections ?? [];
            return {
              uuid: s.uuid,
              name: cleanSectionName(s.name),
              collections: cols.map((col: { uuid: string; name: string }) => ({
                uuid: col.uuid,
                name: cleanSectionName(col.name),
              })),
            };
          }),
        );
        const name = cleanSectionName(c.name);
        return { uuid: c.uuid, name, anchor: this.anchorFor(name), subsections };
      }),
    );
  }

  /** One Discover scope count (size=0 → totalElements) per node, in parallel. */
  private async fetchScopeCounts(sections: BrowseSection[]): Promise<void> {
    const uuids: string[] = [];
    for (const s of sections) {
      uuids.push(s.uuid);
      for (const sub of s.subsections) {
        uuids.push(sub.uuid);
        for (const col of sub.collections) {
          uuids.push(col.uuid);
        }
      }
    }
    const entries = await Promise.all(
      uuids.map(async (u): Promise<[string, number]> => {
        try {
          const d = await this.json(`${this.restBase}/discover/search/objects?dsoType=item&size=0&scope=${u}`);
          return [u, d._embedded?.searchResult?.page?.totalElements ?? 0];
        } catch {
          return [u, 0];
        }
      }),
    );
    const map: Record<string, number> = {};
    for (const [u, n] of entries) {
      map[u] = n;
    }
    this.counts.set(map);
  }

  async ngOnInit() {
    try {
      const sections = await this.buildTree();
      this.sections.set(sections);
      this.loading.set(false);          // render the tree immediately — never block on counts
      void this.fetchScopeCounts(sections); // fill counts asynchronously into the signal
    } catch (e) {
      console.error('[bhbta-browse-sections] fetch failed', e);
      this.loading.set(false);
    }
  }
}
