import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { HeaderComponent as BaseComponent } from '../../../../app/header/header.component';
import { ThemedAuthNavMenuComponent } from '../../../../app/shared/auth-nav-menu/themed-auth-nav-menu.component';
import { BhbtaNavSearchComponent } from '../shared/nav-search/nav-search.component';

@Component({
  selector: 'ds-themed-header',
  styleUrls: ['./header.component.scss'],
  templateUrl: './header.component.html',
  imports: [
    BhbtaNavSearchComponent,
    RouterLink,
    ThemedAuthNavMenuComponent,
  ],
})
export class HeaderComponent extends BaseComponent {
}
