import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { HeaderComponent as BaseComponent } from '../../../../app/header/header.component';
import { ThemedAuthNavMenuComponent } from '../../../../app/shared/auth-nav-menu/themed-auth-nav-menu.component';
import { BhbtaNavSearchComponent } from '../shared/nav-search/nav-search.component';
// NOTE (s121): the SEARCH nav item is the expand-on-click BhbtaNavSearchComponent
// (<bhbta-nav-search>), restored from the s112 stash. Collapsed it shows the word
// "Search" styled as a nav item; click expands an input that submits to /search.
// (s112 had swapped it for a plain link to /search; reverted s121.)

@Component({
  selector: 'ds-themed-header',
  styleUrls: ['./header.component.scss'],
  templateUrl: './header.component.html',
  imports: [
    RouterLink,
    ThemedAuthNavMenuComponent,
    BhbtaNavSearchComponent,
  ],
})
export class HeaderComponent extends BaseComponent {
}
