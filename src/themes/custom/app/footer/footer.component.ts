import { Component, signal } from '@angular/core';

import { FooterComponent as BaseComponent } from '../../../../app/footer/footer.component';

@Component({
  selector: 'ds-themed-footer',
  styleUrls: ['./footer.component.scss'],
  templateUrl: './footer.component.html',
  imports: [],
})
export class FooterComponent extends BaseComponent {
  copied = signal(false);

  // MCP endpoint, derived from THIS env's own public host so dev/stage/prod each
  // show their own correct URL (and clones too). Source is rest.{ssl,host} — the
  // public API config that render-env-config keeps env-accurate (#179); NOT
  // ui.baseUrl, which is the un-rewritten 'http://localhost:4000' on prod (s123).
  // ssl/host are required ServerConfig fields (baseUrl is optional-typed); no
  // port since the public envs use defaults. Path-based /mcp matches the MCP
  // spec. appConfig is injected by the base FooterComponent; getters are SSR-safe.
  get mcpUrl(): string {
    const r = this.appConfig.rest;
    return `${r.ssl ? 'https' : 'http'}://${r.host}/mcp`;
  }

  // Host + path without the scheme, for display (e.g. example.org/mcp).
  get mcpDisplay(): string {
    return `${this.appConfig.rest.host}/mcp`;
  }

  async copyMcpUrl() {
    try {
      await navigator.clipboard.writeText(this.mcpUrl);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1500);
    } catch {
      // noqa-fail-loud: clipboard API unavailable; user can still select+copy
    }
  }
}
