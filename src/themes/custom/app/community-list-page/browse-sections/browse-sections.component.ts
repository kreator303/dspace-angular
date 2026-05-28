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

  async ngOnInit() {
    try {
      const top = await this.json(`${this.restBase}/core/communities/search/top?size=50`);
      const comms = (top._embedded?.communities ?? []).sort(compareSections);

      const sections: BrowseSection[] = await Promise.all(
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
      this.sections.set(sections);
    } catch (e) {
      console.error('[bhbta-browse-sections] fetch failed', e);
    } finally {
      this.loading.set(false);
    }
  }
}
