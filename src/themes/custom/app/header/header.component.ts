import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { HeaderComponent as BaseComponent } from '../../../../app/header/header.component';
import { ThemedAuthNavMenuComponent } from '../../../../app/shared/auth-nav-menu/themed-auth-nav-menu.component';
// NOTE (s112): BhbtaNavSearchComponent (the expand-on-click header search field)
// is stashed — kept on disk at ../shared/nav-search/ but no longer used. The
// SEARCH nav item is now a plain link to /search, matching New/Browse. To
// restore the expandable field, re-import it here + put <bhbta-nav-search> back
// in header.component.html.

@Component({
  selector: 'ds-themed-header',
  styleUrls: ['./header.component.scss'],
  templateUrl: './header.component.html',
  imports: [
    RouterLink,
    ThemedAuthNavMenuComponent,
  ],
})
export class HeaderComponent extends BaseComponent {
}
