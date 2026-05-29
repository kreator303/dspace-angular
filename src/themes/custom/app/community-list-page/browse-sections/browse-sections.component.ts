import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { APP_CONFIG, AppConfig } from '../../../../../config/app-config.interface';
import { cleanSectionName, compareSections } from '../../shared/section-order';

interface BrowseCollection { uuid: string; name: string; count: number; }
interface BrowseSubsection { uuid: string; name: string; collections: BrowseCollection[]; count: number; }
interface BrowseSection { uuid: string; name: string; anchor: string; subsections: BrowseSubsection[]; count: number; }

/**
 * Always-expanded Section → Subsection → Collection index for the browse page,
 * with a sticky table of contents. Top-level section order comes from the shared
 * section-order module (single source, same as the home list); within sections
 * we preserve DSpace's default (name) order. All levels show cleaned names.
 *
 * Item counts (s112): tallied client-side from a paginated Discover walk with
 * `embed=owningCollection` (~5 calls for the whole corpus) — far cheaper than a
 * per-collection scope query (one call each, 124 collections). Counts are by
 * OWNING collection (an item mapped into extra collections counts only in its
 * home one); subsection/section counts roll up as sums (each item has exactly
 * one owning collection, so no double-counting). DSpace exposes no location
 * facet, so the tally is the cheap path; exact scope-counts would need 124 calls
 * or a backend Discovery-facet config + reindex.
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

  /** Tally archived-item counts per OWNING collection via a paginated Discover walk. */
  private async fetchOwningCounts(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    const size = 100;
    let page = 0;
    for (;;) {
      const url = `${this.restBase}/discover/search/objects?dsoType=item&size=${size}&page=${page}&embed=owningCollection`;
      const d = await this.json(url);
      const sr = d._embedded?.searchResult;
      const objs = sr?._embedded?.objects ?? [];
      for (const o of objs) {
        const oc = o._embedded?.indexableObject?._embedded?.owningCollection;
        if (oc?.uuid) {
          counts[oc.uuid] = (counts[oc.uuid] ?? 0) + 1;
        }
      }
      const pg = sr?.page;
      page += 1;
      if (!pg || page >= (pg.totalPages ?? 1)) {
        break;
      }
    }
    return counts;
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
              count: 0,
              collections: cols.map((col: { uuid: string; name: string }) => ({
                uuid: col.uuid,
                name: cleanSectionName(col.name),
                count: 0,
              })),
            };
          }),
        );
        const name = cleanSectionName(c.name);
        return { uuid: c.uuid, name, anchor: this.anchorFor(name), subsections, count: 0 };
      }),
    );
  }

  async ngOnInit() {
    try {
      // structure + counts are independent → fetch in parallel
      const [sections, counts] = await Promise.all([this.buildTree(), this.fetchOwningCounts()]);
      for (const s of sections) {
        let sectionTotal = 0;
        for (const sub of s.subsections) {
          let subTotal = 0;
          for (const col of sub.collections) {
            col.count = counts[col.uuid] ?? 0;
            subTotal += col.count;
          }
          sub.count = subTotal;
          sectionTotal += subTotal;
        }
        s.count = sectionTotal;
      }
      this.sections.set(sections);
    } catch (e) {
      console.error('[bhbta-browse-sections] fetch failed', e);
    } finally {
      this.loading.set(false);
    }
  }
}
