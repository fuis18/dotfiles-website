# Styles — Global CSS Variables

This document describes the global (root-level) CSS custom properties that make up
the design system. It covers the three layers of the color architecture:

1. **Font variables** — defined in `:root` of `src/styles/global.css`.
2. **Theme tokens (`--color-*`)** — semantic variables defined in the `.dark` and
   `.light` blocks of `src/styles/global.css`. Because the theme class lives on the
   `<html>` element (the document root), these resolve at the root and are inherited
   everywhere.
3. **Palette variables (`--ctp-*`)** — the raw Catppuccin colors defined in `:root`
   of `src/styles/catppuccin.css`.

> **Rule of thumb:** components and global rules should only use `--color-*` (and
> `--font-*`) tokens. The `--ctp-*` palette is an implementation detail consumed
> exclusively by the token layer in `global.css`.

---

## 1. Font variables

Defined in `:root` in `src/styles/global.css`.

| Variable | Meaning |
| --- | --- |
| `--font-infra` | Primary/technical font stack (Fira Code). Used as the default font for the whole page (`*`) and for keyboard-key elements. |
| `--font-body` | Body font stack (Sarasa Gothic SC, with Inter/Noto Sans fallbacks). Used for longer text such as card tags. |
| `--font-title` | Alias of `--font-body`. Used for headings and small UI labels (chips, language switcher, table headers). |
| `--font-mono` | Alias of `--font-infra`. Used for inline code and code blocks in prose. |

---

## 2. Theme tokens (`--color-*`)

Semantic tokens that describe a **role**, not a specific color. Each theme block
(`.dark` → Catppuccin Mocha, `.light` → Catppuccin Latte) maps every token to a
palette color. Components use these tokens so they adapt automatically to the
active theme.

Each theme block also sets `color-scheme`, so native UI (form controls, scrollbars)
matches the theme.

### Surfaces & backgrounds

| Variable | Meaning | Dark (Mocha) | Light (Latte) |
| --- | --- | --- | --- |
| `--color-bg` | Main page background. | `--ctp-mocha-base` (`#1e1e2e`) | `--ctp-latte-base` (`#eff1f5`) |
| `--color-bg-alt` | Alternate/elevated background: header, footer, cards, inputs, dropdowns, code blocks, blockquotes. | `--ctp-mocha-mantle` (`#181825`) | `--ctp-latte-mantle` (`#e6e9ef`) |
| `--color-surface` | Small elevated surfaces: tags, keyboard keys, hover fills. | `--ctp-mocha-surface0` (`#313244`) | `--ctp-latte-surface0` (`#ccd0da`) |

### Text

| Variable | Meaning | Dark (Mocha) | Light (Latte) |
| --- | --- | --- | --- |
| `--color-text` | Primary text: headings, main content, card titles. | `--ctp-mocha-text` (`#cdd6f4`) | `--ctp-latte-text` (`#4c4f69`) |
| `--color-text-dim` | Secondary/dimmed text: descriptions, footer, chips, dropdown options, blockquotes. | `--ctp-mocha-subtext0` (`#a6adc8`) | `--ctp-latte-subtext0` (`#6c6f85`) |
| `--color-text-muted` | Muted body text: prose paragraphs, lists, category descriptions, keyboard keys. | `--ctp-mocha-subtext1` (`#bac2de`) | `--ctp-latte-subtext1` (`#5c5f77`) |
| `--color-text-faint` | Faintest text/decoration: icons, input placeholders, list markers, brand separator, status text. | `--ctp-mocha-overlay0` (`#6c7086`) | `--ctp-latte-overlay0` (`#9ca0b0`) |

### Borders

| Variable | Meaning | Dark (Mocha) | Light (Latte) |
| --- | --- | --- | --- |
| `--color-border` | Subtle borders: cards, images, tables, prose headings, inputs inside prose. | `--ctp-mocha-surface0` (`#313244`) | `--ctp-latte-surface0` (`#ccd0da`) |
| `--color-border-strong` | Prominent borders: buttons, inputs, chips, tags on hover, blockquote accent. | `--ctp-mocha-surface1` (`#45475a`) | `--ctp-latte-surface1` (`#bcc0cc`) |

### Accent & interaction

| Variable | Meaning | Dark (Mocha) | Light (Latte) |
| --- | --- | --- | --- |
| `--color-accent` | Primary accent: links, hover states, active chips, brand prompt, category labels. | `--ctp-mocha-blue` (`#89b4fa`) | `--ctp-latte-blue` (`#1e66f5`) |
| `--color-focus` | Focus ring color for keyboard navigation (`:focus-visible`). | `--ctp-mocha-blue` (`#89b4fa`) | `--ctp-latte-blue` (`#1e66f5`) |
| `--color-accent-dim` | Translucent accent for soft highlights: focus glow, hover backgrounds, active badges. | `rgba(137, 180, 250, 0.14)` | `rgba(30, 102, 245, 0.14)` |
| `--color-heading-accent` | Accent color for special headings in prose (h3, table headers). | `--ctp-mocha-lavender` (`#b4befe`) | `--ctp-latte-lavender` (`#7287fd`) |
| `--color-code` | Foreground color for inline code text. | `--ctp-mocha-peach` (`#fab387`) | `--ctp-latte-peach` (`#fe640b`) |
| `--color-on-accent` | Text/icon color rendered **on top of** an accent-filled background (e.g. active chip). | `--ctp-mocha-base` (`#1e1e2e`) | `--ctp-latte-base` (`#eff1f5`) |

---

## 3. Palette variables (`--ctp-*`)

Raw Catppuccin colors defined in `:root` in `src/styles/catppuccin.css`. Two
complete palettes are always available: `--ctp-mocha-*` (used by `.dark`) and
`--ctp-latte-*` (used by `.light`). Both palettes share the same color names, only
the prefix differs.

### Accent colors

| Variable suffix | Meaning |
| --- | --- |
| `rosewater` | Lightest accent; alternate cursor/highlight color. |
| `flamingo` | Muted pink accent. |
| `pink` | Accent used for sparing highlights (e.g. unsaved state). |
| `mauve` | Secondary accent; borders, secondary highlights. |
| `red` | Errors, deletions, destructive actions. |
| `maroon` | Soft red; secondary errors. |
| `peach` | Warnings, modifications, inline code. |
| `yellow` | Warnings, array indices, types. |
| `green` | Success, additions, confirmations. |
| `teal` | Soft green accent; secondary success. |
| `sky` | Info, parameters, links in some contexts. |
| `sapphire` | Soft blue accent; secondary info. |
| `blue` | Primary accent: links, focus, search matches. |
| `lavender` | Accent for special headings and cursor/guides. |

### Neutral scale (text → surfaces)

| Variable suffix | Meaning |
| --- | --- |
| `text` | Default foreground text. |
| `subtext1` | Alternate/secondary text. |
| `subtext0` | Dimmed/commented text. |
| `overlay2` | Inactive UI elements. |
| `overlay1` | Line numbers, disabled text. |
| `overlay0` | Faint decoration, placeholders, icons. |
| `surface2` | Inactive selections. |
| `surface1` | Strong borders, gutters, tabs. |
| `surface0` | Subtle borders, status lines. |
| `base` | Main background. |
| `mantle` | Elevated background (popups, cards). |
| `crust` | Deepest background (panels, terminal). |

---

## 4. Theme switching

The active theme is controlled by a class on the root `<html>` element:

- `.dark` — tokens map to the Catppuccin Mocha palette.
- `.light` — tokens map to the Catppuccin Latte palette.

Behavior:

- **Toggle**: a sun/moon button in the header (`ThemeToggle.astro`) swaps the class
  on `<html>` and persists the choice in `localStorage["theme"]`
  (`"dark"` | `"light"`). The sun is shown in dark mode (switch to light), the moon
  in light mode (switch to dark).
- **Anti-flash**: an inline script in the `<head>` (`Head.astro`) resolves the theme
  before first paint: stored preference → `prefers-color-scheme` system preference →
  server-rendered `dark` fallback.
- **System preference**: while the user has not chosen a theme manually (no value in
  `localStorage["theme"]`), the site reacts live to system
  `prefers-color-scheme` changes.
- **View Transitions**: the theme class lives on `<html>`, which persists across
  soft navigations (Astro `ClientRouter`), so the theme is kept between pages.
