import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { CommunityListPageComponent as BaseComponent } from '../../../../app/community-list-page/community-list-page.component';
import { BhbtaBrowseSectionsComponent } from './browse-sections/browse-sections.component';

@Component({
  selector: 'ds-themed-community-list-page',
  // Theme-local template: keep the page heading, render our always-expanded
  // Section → Subsection → Collection index (bhbta-browse-sections) instead of
  // the stock community tree. Template-only override (Tier 2).
  templateUrl: './community-list-page.component.html',
  imports: [
    BhbtaBrowseSectionsComponent,
    TranslateModule,
  ],
})
export class CommunityListPageComponent extends BaseComponent {
}
