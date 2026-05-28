import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { HomePageComponent as BaseComponent } from '../../../../app/home-page/home-page.component';
import { SuggestionsPopupComponent } from '../../../../app/notifications/suggestions/popup/suggestions-popup.component';
import { ThemedSearchFormComponent } from '../../../../app/shared/search-form/themed-search-form.component';
import { BhbtaSectionsListComponent } from '../shared/sections-list/sections-list.component';

@Component({
  selector: 'ds-themed-home-page',
  styleUrls: ['./home-page.component.scss'],
  templateUrl: './home-page.component.html',
  imports: [
    BhbtaSectionsListComponent,
    SuggestionsPopupComponent,
    ThemedSearchFormComponent,
    TranslateModule,
  ],
})
export class HomePageComponent extends BaseComponent {
}
