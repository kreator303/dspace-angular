import { CommonModule } from '@angular/common';
import {
  Component,
  Inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { APP_CONFIG, AppConfig } from '../../../../../config/app-config.interface';
import { cleanSectionName, compareSections, itemCount } from '../section-order';

interface Section {
  uuid: string;
  handle: string;
  name: string;
  description: string;
  count: number | null;
}

@Component({
  selector: 'bhbta-sections-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './sections-list.component.html',
  styleUrls: ['./sections-list.component.scss'],
})
export class BhbtaSectionsListComponent implements OnInit {

  sections = signal<Section[]>([]);
  loading = signal(true);

  private restBase: string;

  constructor(@Inject(APP_CONFIG) private appConfig: AppConfig) {
    const r = this.appConfig.rest;
    this.restBase = `${r.ssl ? 'https' : 'http'}://${r.host}:${r.port}${r.nameSpace}/api`;
  }

  async ngOnInit() {
    try {
      const commResp = await fetch(`${this.restBase}/core/communities/search/top?size=50`);
      const commJson = await commResp.json();
      const comms = commJson._embedded?.communities ?? [];

      // Order + display-name cleaning come from the shared section-order module
      // (single source of truth, also used by the browse-page override).
      comms.sort(compareSections);

      // Count comes from the native archivedItemsCount on each community object
      // (webui.strengths.show enabled backend-side, s121) — same value the DSpace
      // REST/UI uses. Replaced the old per-section Discover scope-count fetch.
      const withCounts: Section[] = comms.map((c: { uuid: string; handle: string; name: string; archivedItemsCount?: number; metadata?: Record<string, Array<{value: string}>> }) => ({
        uuid: c.uuid,
        handle: c.handle,
        name: cleanSectionName(c.name),
        description: c.metadata?.['dc.description.abstract']?.[0]?.value ?? '',
        count: itemCount(c),
      }));
      this.sections.set(withCounts);
    } catch (e) {
      console.error('[bhbta-sections-list] fetch failed', e);
    } finally {
      this.loading.set(false);
    }
  }
}
