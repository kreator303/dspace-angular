import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

/**
 * Nav-bar search affordance: collapsed = bare "SEARCH" word styled to match
 * the other Cinzel nav items. Click expands an input field to the right with
 * a maroon submit button (icon on its right edge). Click-outside or scroll
 * collapses; pressing Enter or clicking the maroon button submits to /search.
 */
@Component({
  selector: 'bhbta-nav-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nav-search.component.html',
  styleUrls: ['./nav-search.component.scss'],
})
export class BhbtaNavSearchComponent {

  expanded = signal(false);
  query = '';

  @ViewChild('input') inputRef?: ElementRef<HTMLInputElement>;

  constructor(private router: Router, private host: ElementRef<HTMLElement>) {}

  open() {
    if (this.expanded()) return;
    this.expanded.set(true);
    // Defer focus until the input is in the DOM
    setTimeout(() => this.inputRef?.nativeElement?.focus(), 50);
  }

  close() {
    if (this.expanded()) {
      this.expanded.set(false);
      this.query = '';
    }
  }

  submit() {
    const q = (this.query || '').trim();
    if (!q) return;
    this.router.navigate(['/search'], { queryParams: { query: q } });
    this.close();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent) {
    if (!this.expanded()) return;
    if (!this.host.nativeElement.contains(e.target as Node)) {
      this.close();
    }
  }

  @HostListener('window:scroll')
  onScroll() {
    if (this.expanded()) this.close();
  }
}
