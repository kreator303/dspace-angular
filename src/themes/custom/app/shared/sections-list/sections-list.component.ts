import { CommonModule } from '@angular/common';
import {
  Component,
  Inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { APP_CONFIG, AppConfig } from '../../../../../config/app-config.interface';

interface Section {
  uuid: string;
  handle: string;
  name: string;
  description: string;
  count: number;
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

      // Sort by name first (so the numeric prefix on each name controls order),
      // then strip the "N. " prefix from the display name.
      comms.sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name));

      const withCounts: Section[] = await Promise.all(comms.map(async (c: { uuid: string; handle: string; name: string; metadata?: Record<string, Array<{value: string}>> }) => {
        const displayName = c.name.replace(/^\s*\d+\.\s*/, '');
        const description = c.metadata?.['dc.description.abstract']?.[0]?.value ?? '';
        try {
          const r = await fetch(`${this.restBase}/discover/search/objects?dsoType=item&scope=${c.uuid}&size=1`);
          const j = await r.json();
          return {
            uuid: c.uuid,
            handle: c.handle,
            name: displayName,
            description,
            count: j._embedded?.searchResult?.page?.totalElements ?? 0,
          };
        } catch {
          return { uuid: c.uuid, handle: c.handle, name: displayName, description, count: 0 };
        }
      }));
      this.sections.set(withCounts);
    } catch (e) {
      console.error('[bhbta-sections-list] fetch failed', e);
    } finally {
      this.loading.set(false);
    }
  }
}
