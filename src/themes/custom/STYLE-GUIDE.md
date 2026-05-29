# Baba Hari Dass Teachings Archive — Theme Style Guide & Accessibility Spec

The source-of-truth design spec for the `custom` DSpace 9.2 theme. Written so a
future developer (or a future session) can apply the system without re-deriving
it. Tokens are single-sourced in SCSS; this doc explains the *intent* + the
*rules* + *why* (with sourced rationale for the load-bearing accessibility
decisions).

**Status (2026-05-28):** brand tokens + fonts + internal-page restyle + browse
page are implemented (commit `c6be016ef`). The **link rules** and the
**accessibility pass** below are the next codify steps.

Visual audit tooling: `mockups/style-audit.py` (in the wisdom-library repo)
renders every type role in its real computed style + color swatches — re-run it
after changes to confirm the system stays consistent.

---

## 1. Fonts — two faces, strict roles

Two typefaces, matching the parent organization site (mountmadonna.org), loaded
via Google Fonts in `styles/_global-styles.scss`.

| Face | Role | Notes |
|---|---|---|
| **Marcellus** (serif) | Display only — page titles, section/collection titles, hero wordmark, and the copper UPPERCASE kicker labels | **Single weight (400) only.** It has no bold; 500/600/700 render as ugly browser *faux-bold*. Build hierarchy with **size + letter-spacing + color**, never weight. |
| **Montserrat** (sans) | Everything else — body text, navigation, tabs, facet names, counts, badges, buttons, breadcrumb | Has real weights; use 400 body, 500/600 for genuine emphasis. |

**Rule:** Marcellus never gets a weight other than 400. Pull Marcellus *out* of
functional UI chrome (facet names, tabs, counts) — those are Montserrat.

---

## 2. Color tokens

**Two layers (s112).** Primitives are the raw palette; **semantic role tokens**
map a *job* to a primitive. Components consume **roles**, never primitives or
raw hex — so restyling is a one-line edit to a role, and a global change can't
fail to reach the (view-encapsulated) custom components. Both layers are
single-sourced: primitives in `styles/_theme_sass_variable_overrides.scss`,
roles + exposure in `styles/_theme_css_variable_overrides.scss`.

### Primitives (the raw palette — don't consume directly in components)

| Token | Hex | Notes |
|---|---|---|
| `--bhbta-maroon` | `#4E2222` | Warm brand hue |
| `--bhbta-maroon-dark` / `--bhbta-maroon-hover` | `#3A1A1A` / `#944444` | Brand pressed / hover tints |
| `--bhbta-copper` | `#B1713C` | Warm accent |
| `--bhbta-sand` | `#E3D2C8` | Soft warm accent (= ramp `n200`) |
| `--bhbta-cool` / `--bhbta-cool-dark` | `#2C6E8F` / `#1F5266` | Cool accent — link underlines; relieves the analogous-warm monotone |
| `--bhbta-ink` | `#1A1A1A` | Near-black |
| `--bhbta-n50…n700` | `#FFFDF4 … #2B2622` | **Warm-neutral ramp** (cream→ink): surfaces, borders, muted text |

### Semantic roles (consume THESE)

| Role | Resolves to | Job |
|---|---|---|
| `--bhbta-text` | ink | Body + running + **link text** (links are near-black, not colored) |
| `--bhbta-text-muted` / `--bhbta-text-faint` | n500 / n400 | Secondary / faint text (warm-neutral) |
| `--bhbta-heading` | maroon | Display headings/titles (h1, section titles, SECTIONS) |
| `--bhbta-link-underline` | **cool** | Link underline at rest (steel-blue) |
| `--bhbta-link-hover` | copper | Link text + underline on hover (warm pop) |
| `--bhbta-accent` / `--bhbta-accent-soft` | copper / sand | Kicker labels, accent rules / badges, breadcrumb text |
| `--bhbta-brand` / `--bhbta-brand-hover` | maroon / maroon-hover | Masthead wordmark + nav + search chrome |
| `--bhbta-band-bg` / `--bhbta-on-brand` | maroon / cream | Maroon band backgrounds / text on them |
| `--bhbta-stat` | maroon | Numeric accents (section counts) |
| `--bhbta-border` / `--bhbta-border-subtle` / `--bhbta-border-strong` | n300 / n200 / n400 | Hairlines, dividers, input borders (off maroon-tint) |
| `--bhbta-surface` | cream | Page background |

**The color model (s112, research-grounded — see session log):** the reading
surface is calm-neutral (cream + near-black body + a warm-neutral ramp for
borders/dividers/muted text); the **warm brand (maroon)** is reserved for
identity — display headings, the masthead, and bands — *not* running text and
*not* link text; **links are near-black text with a cool steel-blue underline**
(copper on hover). This breaks the analogous-warm monotone by (a) moving
surfaces/borders/secondary-text onto the neutral ramp and (b) introducing one
cool counter-color. Validated against The National Archives UK, GOV.UK, and
NYPL (neutral reading surface + sparse brand accent + blue underlined links).
The steel-blue `#2C6E8F` clears WCAG AA on cream (5.5:1) and 3:1 vs the body
text. Earlier warm-maroon-body + maroon-link-text was reverted — it read wrong
on text-dense pages.

---

## 3. Type roles & scale

Marcellus display + Montserrat body. **Heading *rank* follows content hierarchy,
not visual size** (see §5 accessibility) — size is a pure CSS concern decoupled
from `<h1>…<h6>`.

| Role | Face | ~Size | Case / tracking | Color |
|---|---|---|---|---|
| Page title (`h1`) | Marcellus 400 | ~2.4rem | mixed case (preserves Sanskrit/IAST), slight tracking | maroon |
| Section title (browse) | Marcellus 400 | ~1.7rem | mixed case | maroon |
| Kicker label (copper uppercase) — subsection labels, "Filters", "On this page", "Browse"-tabs label | Marcellus 400 | ~0.95rem | UPPERCASE, tracking ~0.16em | copper |
| Body | Montserrat 400 | 1rem (16px) | normal | `#1A1A1A` (ink) |
| Result/item title (a link) | Marcellus **400** (not 300) | ~1.18rem | mixed case | ink text, steel-blue underline |
| Facet name, tabs, counts, nav | Montserrat | ~0.9–1rem | per context | maroon |
| Small / meta | Montserrat 400 | ~0.85rem | normal | muted |

**Long-form reading (transcripts):** cap the measure to **~65–75 characters/line**
(`max-width: ~70ch`), **line-height ~1.6** (1.5 minimum per WCAG 1.4.8),
generous paragraph spacing. Never let transcript body run full-viewport-width.
[Baymard line-length, L3 · WCAG 1.4.8]

---

## 4. Links — underline on hover only (revised s112; was underline-at-rest)

**Decision (s112):** content/list link text is near-black ink with **no underline
at rest**; the underline (steel-blue, → copper on hover) appears on hover/focus.
Superseded the 2026-05-28 underline-everywhere trial — the at-rest underlines read
as noise on the dense 100+-link browse index. Matches the home section-list
pattern (ink text, hover affordance).

**Known tradeoff (flag, not resolved):** an in-prose link inside body text
(`ds-comcol-page-content a`) now has neither color nor a rest-underline, so it is
not visually distinguishable from surrounding text until hover — a WCAG 1.4.1
(use-of-color) concern for *in-prose* links specifically. List/title links are
contextually obvious (whole-row / heading links). If in-prose distinction is
wanted, the cheapest fix is to color in-prose link text steel (it clears 3:1 vs
body text) or keep a rest-underline for `ds-comcol-page-content a` only.

**CSS recipe** (steel underline on hover; relative `ex` units scale with font size):

```css
a {
  color: currentColor;                      /* link text = body color (ink) */
  text-decoration-line: none;               /* no underline at rest */
  text-decoration-color: var(--bhbta-link-underline);  /* steel-blue (s112) */
  text-decoration-thickness: 0.3ex;
  text-underline-offset: 0.3ex;
}
a:hover {
  text-decoration-line: underline;          /* underline appears on hover */
  text-decoration-color: var(--bhbta-link-hover);
  color: var(--bhbta-link-hover);
}
a:focus-visible { /* visible focus ring, ≥3:1 contrast — see §5 */ }
```

Notes:
- Underline carries the affordance, so link text can share the body color
  without failing "don't rely on color alone" (WCAG 1.4.1).
- Link text must meet **4.5:1 vs the cream background** (WCAG 1.4.3).
- If a future spot ever drops the rest-underline, the bar is **3:1 contrast vs
  surrounding text** + underline on hover/focus (USWDS + Primer, cross-source).
- **Never** hover-only-with-no-rest-cue (fails touch + scannability).

---

## 5. Accessibility — non-negotiable, and it *collapses* design decisions

A serious accessibility commitment is a constraint generator: it converts open
design questions into determined ones, and the determined answer is usually the
simplest + most crawler-friendly. Tiers: **[WAI]** = W3C normative; **[MDN/WebAIM]**
= practitioner-authoritative; **[DS]** = design-system codified.

### Structure
- **Landmarks:** exactly one `<header>` (banner), `<main>`, `<footer>`
  (contentinfo); `<nav>` for navigation. **Multiple navs must each be labelled.**
  The sticky "On this page" ToC = `<nav aria-labelledby="…">` pointing at its
  visible heading; use `aria-labelledby` when a visible heading exists, else
  `aria-label`. [WAI: w3.org/WAI/tutorials/page-structure/regions]
- **Heading hierarchy:** one `<h1>` per page, ranks nested, **no skipped levels**.
  Rank is dictated by content; visual size is CSS (§3). [WAI L3-verbatim:
  …/page-structure/headings]
- **Source order = reading order** before any CSS repositioning. [MDN]
- **Item pages** (a transcript = self-contained) → `<article>`. [MDN]

### Lists
- Directories of links/items are real `<ul>/<ol>/<li>`; hierarchical directories
  are **nested lists** — screen readers announce item count + position and the
  nesting conveys hierarchy. The browse Section→Subsection→Collection tree should
  be nested lists (headings-per-section + lists is also acceptable for
  heading-jump navigation; we currently use h2/h3 + a collection `<ul>`).
  [WAI: …/page-structure/content]

### Links
- **Text meaningful out of context** — no "click here" / "read more"; put the
  distinguishing words first; real non-empty `href`. [WebAIM L3]
- **Link vs button by intent:** navigate → `<a href>`; perform an action →
  `<button>`. [MDN / cross-source]

### ARIA discipline
- **First Rule of ARIA:** if a native HTML element/attribute already has the
  semantics + behavior, use it instead of re-purposing + adding ARIA.
  "No ARIA is better than Bad ARIA." [WAI L3-verbatim: w3.org/TR/using-aria +
  APG read-me-first]
- **nav-search = Disclosure pattern:** a `<button>` with `aria-expanded`
  (true/false), toggled **on click**; Enter + Space activate; move focus into
  the input on open; do not trap Tab. It is NOT an ARIA menu. [WAI APG Disclosure
  L3; Pickering inclusive-components — single-source, APG-corroborated]
- **Facets:** native `<input type=checkbox/radio>` + `<label>`, grouped in
  `<fieldset><legend>` — keyboard + group semantics for free. (Avoid a custom
  combobox; if unavoidable, follow APG Combobox.) [derived from First Rule]

### Focus & keyboard
- **`:focus-visible` on every interactive element**; never `outline: none`
  without a replacement indicator; focus indicator ≥3:1 contrast (WCAG 1.4.11).
  [MDN L3]
- **Skip-to-content link** as the first focusable element — high value given the
  100+-link browse index. [WebAIM]

### Content in the DOM (the double win)
- Render structure as semantic HTML **server-side** (SSR), not interaction-gated
  JS. Screen readers and search crawlers need the same thing: links present in
  the HTML. [MDN: semantic HTML aids both AT and SEO] The always-expanded browse
  index is correct on this axis; its links should be SSR'd (current
  implementation fetches client-side — a TransferState/HttpClient follow-up
  finishes this).

### Testing baseline
- Manual pass with **NVDA + Windows** and **VoiceOver + Safari (macOS/iOS)** —
  the dominant free/built-in readers. Verify: heading-to-heading navigation +
  sensible hierarchy; landmark jumps; links-list comprehension out of context;
  skip link works; nav-search + facets operable by keyboard with announced state.
  [WebAIM; browser pairing is practitioner convention]

---

## 6. Source provenance & tiers

Researched 2026-05-28 via dispatched agents under the orchestrator-rigor
discipline. Full per-claim citations + "known gaps" live in those agent reports
(session transcript). Load-bearing sources, by tier:

- **W3C normative [WAI]:** WCAG 2.1 (SC 1.4.1 Use of Color, 1.4.3 Contrast,
  1.4.8 Visual Presentation, 1.4.11 Non-text Contrast, 2.4.7 Focus Visible),
  Technique G183; WAI Tutorials (page structure: regions / headings / content);
  WAI-ARIA APG (Disclosure pattern, read-me-first); "First Rule of ARIA."
- **Practitioner-authoritative [MDN/WebAIM]:** MDN HTML accessibility; WebAIM
  (links & hypertext, screen-reader testing).
- **Named-expert opinion:** Adrian Roselli (underline body links), Andy Bell
  (underline CSS recipe), NN/g (link visualization, scanning patterns, ToC),
  Heydon Pickering (disclosure vs menu — single-source).
- **Design-system codified [DS]:** GOV.UK, U.S. Web Design System, GitHub
  Primer (all: underline body links by default; 3:1-vs-surrounding-text if
  dropped). Shopify Polaris (via search synthesis — not directly opened).

**Known gaps carried forward:** no current GLAM/archive-specific UX authority
(the literature is 2010–2015 academic; its one transferable finding: *complex/
multi-type search is the documented failure point* — keep simple search
frictionless); no source explicitly covers 100+-link index affordance (we chose
underline-everywhere, which sidesteps the question); faceted-filter stats were
Baymard-snippet (paywalled), treated as directional.
