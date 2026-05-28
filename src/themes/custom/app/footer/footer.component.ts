import { Component, signal } from '@angular/core';

import { FooterComponent as BaseComponent } from '../../../../app/footer/footer.component';

const MCP_URL = 'https://mcp.babaharidassteachingsarchive.org';

@Component({
  selector: 'ds-themed-footer',
  styleUrls: ['./footer.component.scss'],
  templateUrl: './footer.component.html',
  imports: [],
})
export class FooterComponent extends BaseComponent {
  copied = signal(false);

  async copyMcpUrl() {
    try {
      await navigator.clipboard.writeText(MCP_URL);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1500);
    } catch {
      // noqa-fail-loud: clipboard API unavailable; user can still select+copy
    }
  }
}
