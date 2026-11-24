/**
 * Search modal controller.
 *
 * Lives outside the .astro component so it can be unit tested: `SearchModal.astro`
 * only imports `initSearchModal()`. Document-level listeners are attached once
 * (they survive the ClientRouter, which swaps the body on navigation) and every
 * lookup goes back to the DOM, so re-initialising is safe.
 */

export interface PagefindSubResult {
  title?: string;
  url: string;
  excerpt?: string;
}

export interface PagefindResultData {
  url: string;
  excerpt?: string;
  meta?: { title?: string };
  sub_results?: PagefindSubResult[];
}

export interface PagefindResultStub {
  id: string;
  data(): Promise<PagefindResultData>;
}

export interface PagefindSearchResponse {
  results: PagefindResultStub[];
}

export interface PagefindApi {
  init(): Promise<void>;
  destroy?(): Promise<void>;
  preload(query: string): void;
  search(
    query: string,
    options?: Record<string, unknown>,
  ): Promise<PagefindSearchResponse>;
  debouncedSearch(
    query: string,
    options?: Record<string, unknown>,
    timeout?: number,
  ): Promise<PagefindSearchResponse | null>;
}

export interface SearchModalOptions {
  loadPagefind?: () => Promise<PagefindApi | null>;
  animate?: boolean;
}

const OPEN_MS = 320;
const CLOSE_MS = 220;
const FADE_MS = 200;
const OUTPUT_DELAY_MS = 120;
const EASE_OPEN = "cubic-bezier(0.22, 1, 0.36, 1)";
const EASE_CLOSE = "cubic-bezier(0.4, 0, 1, 1)";
const REVEAL_FROM = "inset(0 35% 100% 35% round 0.75rem)";
const REVEAL_TO = "inset(0 0 0 0 round 0.75rem)";

let options: SearchModalOptions = {};
let listenersAttached = false;
let transitionId = 0;
let lastTrigger: HTMLElement | null = null;

let pagefindPromise: Promise<PagefindApi | null> | null = null;
let pagefindLang = "";
let searchSeq = 0;
let activeIndex = -1;

/* --- DOM access ----------------------------------------------------------- */

const getModal = (): HTMLElement | null =>
  document.getElementById("search-modal");
const getPanel = (): HTMLElement | null =>
  getModal()?.querySelector<HTMLElement>(".search-modal") ?? null;
const getRow = (): HTMLElement | null =>
  getModal()?.querySelector<HTMLElement>(".search-bar--modal") ?? null;
const getOutput = (): HTMLElement | null =>
  document.getElementById("pagefind-output");
const getStatus = (): HTMLElement | null =>
  document.getElementById("pagefind-status");
const getResults = (): HTMLElement | null =>
  document.getElementById("pagefind-results");
// The field is owned by <SearchBar variant="modal">: no hardcoded id.
const getInput = (): HTMLInputElement | null =>
  document.querySelector<HTMLInputElement>("#search-modal [data-search-input]");

const isOpen = (): boolean => {
  const modal = getModal();
  return !!modal && !modal.hidden;
};

/* --- Result rendering ----------------------------------------------------- */

function resultLinks(): HTMLAnchorElement[] {
  const container = getResults();
  return container ? Array.from(container.querySelectorAll("a")) : [];
}

function showStatus(text: string): void {
  const status = getStatus();
  if (status) status.textContent = text;
}

function setExpanded(expanded: boolean): void {
  getInput()?.setAttribute("aria-expanded", String(expanded));
}

function setTriggersExpanded(expanded: boolean): void {
  document.querySelectorAll<HTMLElement>("[data-search-open]").forEach((el) => {
    el.setAttribute("aria-expanded", String(expanded));
  });
}

function clearOutput(): void {
  // Drop aria-activedescendant before the nodes it points at disappear.
  setActive(-1);
  const results = getResults();
  if (results) results.innerHTML = "";
  showStatus("");
  setExpanded(false);
}

/** Pagefind URLs are root-relative to dist/; the site may be served under a base path. */
export function withBase(
  url: string,
  base: string = import.meta.env.BASE_URL,
): string {
  if (!base || base === "/") return url;
  return url.startsWith(base) ? url : `${base.replace(/\/$/, "")}${url}`;
}

async function defaultLoadPagefind(): Promise<PagefindApi | null> {
  const lang = document.documentElement.lang;
  // The index is per-language; re-init when a client-side navigation changes it.
  if (pagefindPromise && lang !== pagefindLang) {
    const previous = await pagefindPromise;
    if (previous?.destroy) await previous.destroy();
    pagefindPromise = null;
  }
  if (!pagefindPromise) {
    pagefindLang = lang;
    const base = import.meta.env.BASE_URL;
    const prefix = base.endsWith("/") ? base : `${base}/`;
    pagefindPromise = import(/* @vite-ignore */ `${prefix}pagefind/pagefind.js`)
      .then(async (mod) => {
        const api = mod as PagefindApi;
        await api.init();
        return api;
      })
      // No bundle in `astro dev` (or a failed build): fall back to the notice.
      .catch(() => null);
  }
  return pagefindPromise;
}

function loadPagefind(): Promise<PagefindApi | null> {
  return (options.loadPagefind ?? defaultLoadPagefind)();
}

function buildTitle(text: string): HTMLSpanElement {
  const span = document.createElement("span");
  span.className = "search-result-title";
  span.textContent = text;
  return span;
}

function buildExcerpt(html?: string): HTMLSpanElement {
  const span = document.createElement("span");
  span.className = "search-result-excerpt";
  // Pagefind entity-encodes excerpts before adding <mark>: safe as innerHTML.
  span.innerHTML = html ?? "";
  return span;
}

function renderResults(items: PagefindResultData[]): void {
  const container = getResults();
  if (!container) return;
  setActive(-1);
  container.innerHTML = "";

  for (const item of items) {
    const li = document.createElement("li");
    li.className = "search-result";

    const pageLink = document.createElement("a");
    pageLink.className = "search-result-page";
    pageLink.href = withBase(item.url);
    pageLink.append(
      buildTitle(item.meta?.title ?? item.url),
      buildExcerpt(item.excerpt),
    );
    li.append(pageLink);

    // Only sections whose excerpt actually contains the match: the exact fragment.
    const anchors = (item.sub_results ?? []).filter(
      (sub) => sub.url !== item.url && (sub.excerpt ?? "").includes("<mark>"),
    );
    if (anchors.length > 0) {
      const subList = document.createElement("ul");
      subList.className = "search-result-anchors";
      for (const sub of anchors.slice(0, 6)) {
        const subLi = document.createElement("li");
        const subLink = document.createElement("a");
        subLink.className = "search-result-anchor";
        subLink.href = withBase(sub.url);
        subLink.append(
          buildTitle(sub.title ?? sub.url),
          buildExcerpt(sub.excerpt),
        );
        subLi.append(subLink);
        subList.append(subLi);
      }
      li.append(subList);
    }

    container.append(li);
  }

  // aria-activedescendant needs a stable id per link.
  resultLinks().forEach((link, i) => {
    link.id = `search-link-${i}`;
  });
  setActive(-1);
}

function setActive(index: number): void {
  const links = resultLinks();
  const input = getInput();

  links.forEach((link) => {
    link.classList.remove("is-active");
    link.removeAttribute("aria-current");
  });

  if (links.length === 0 || index < 0) {
    activeIndex = -1;
    input?.removeAttribute("aria-activedescendant");
    return;
  }

  activeIndex = Math.min(index, links.length - 1);
  const active = links[activeIndex];
  active.classList.add("is-active");
  active.setAttribute("aria-current", "true");
  input?.setAttribute("aria-activedescendant", active.id);
  active.scrollIntoView({ block: "nearest" });
}

async function runSearch(query: string): Promise<void> {
  const seq = ++searchSeq;
  const modal = getModal();
  if (!modal) return;

  if (query === "") {
    clearOutput();
    return;
  }

  try {
    const api = await loadPagefind();
    if (seq !== searchSeq) return;
    if (!api) {
      clearOutput();
      showStatus(modal.dataset.devNotice ?? "");
      return;
    }

    api.preload(query);
    const search = await api.debouncedSearch(query, {}, 150);
    if (!search || seq !== searchSeq) return;

    if (search.results.length === 0) {
      clearOutput();
      showStatus(modal.dataset.noResults ?? "");
      return;
    }

    const items = await Promise.all(
      search.results.slice(0, 10).map((r) => r.data()),
    );
    if (seq !== searchSeq) return;

    renderResults(items);
    showStatus(`${search.results.length} ${modal.dataset.countLabel ?? ""}`);
    setExpanded(true);
  } catch {
    if (seq === searchSeq) {
      clearOutput();
      showStatus(modal.dataset.devNotice ?? "");
    }
  }
}

/* --- Animation ------------------------------------------------------------ */

function animationsEnabled(): boolean {
  if (options.animate === false) return false;
  if (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return false;
  }
  return (
    typeof Element !== "undefined" &&
    typeof Element.prototype.animate === "function"
  );
}

/**
 * The visible header field the modal input is born from. Returns null when it
 * is not rendered (`display: none` on mobile), which selects the reveal mode.
 */
function getFlipSource(): DOMRect | null {
  for (const el of document.querySelectorAll<HTMLElement>(
    "[data-search-trigger]",
  )) {
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return rect;
  }
  return null;
}

function flipTransform(source: DOMRect, target: DOMRect): string {
  const dx = source.left - target.left;
  const dy = source.top - target.top;
  const sx = source.width / target.width;
  const sy = source.height / target.height;
  return `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
}

function cancelRunning(): void {
  const nodes = [getModal(), getPanel(), getRow(), getOutput()];
  for (const node of nodes) {
    node?.getAnimations?.().forEach((animation) => animation.cancel());
  }
}

function startOpenAnimation(source: DOMRect | null): void {
  const overlay = getModal();
  const panel = getPanel();
  const row = getRow();
  const output = getOutput();
  if (!overlay || !panel || !row) return;

  // The backdrop is painted at full strength from frame 0: fading it up from
  // transparent flashed the white page behind it (and animating its
  // backdrop-filter made iOS Safari flicker). Only the sheet fades in.
  const panelStyle = getComputedStyle(panel);

  panel.animate(
    [
      { backgroundColor: "rgba(0, 0, 0, 0)", borderColor: "rgba(0, 0, 0, 0)" },
      {
        backgroundColor: panelStyle.backgroundColor,
        borderColor: panelStyle.borderColor,
      },
    ],
    { duration: FADE_MS, easing: "ease" },
  );
  output?.animate([{ opacity: 0 }, { opacity: 1 }], {
    duration: FADE_MS,
    easing: "ease",
    delay: OUTPUT_DELAY_MS,
  });

  const target = row.getBoundingClientRect();
  if (source && target.width > 0 && target.height > 0) {
    // Situation 1 (desktop): the input drops down and grows out of the header field.
    row.animate(
      [{ transform: flipTransform(source, target) }, { transform: "none" }],
      { duration: OPEN_MS, easing: EASE_OPEN },
    );
  } else {
    // Situation 2 (mobile): the sheet grows from the input line to the bottom corners.
    panel.animate([{ clipPath: REVEAL_FROM }, { clipPath: REVEAL_TO }], {
      duration: OPEN_MS,
      easing: EASE_OPEN,
    });
  }
}

function startCloseAnimation(source: DOMRect | null): Animation | null {
  const overlay = getModal();
  const panel = getPanel();
  const row = getRow();
  if (!overlay || !panel || !row) return null;

  // The whole layer dissolves. The backdrop's colour and filter never animate
  // in either direction: that interpolation was the white flash on entry and
  // a source of flicker for backdrop-filter on iOS.
  const primary = overlay.animate([{ opacity: 1 }, { opacity: 0 }], {
    duration: CLOSE_MS,
    easing: EASE_CLOSE,
  });

  const target = row.getBoundingClientRect();
  if (source && target.width > 0 && target.height > 0) {
    row.animate(
      [{ transform: "none" }, { transform: flipTransform(source, target) }],
      {
        duration: CLOSE_MS,
        easing: EASE_CLOSE,
      },
    );
  } else {
    panel.animate([{ clipPath: REVEAL_TO }, { clipPath: REVEAL_FROM }], {
      duration: CLOSE_MS,
      easing: EASE_CLOSE,
    });
  }

  return primary;
}

/* --- Open / close --------------------------------------------------------- */

/** Classic-scrollbar width; 0 where scrollbars are overlays (real phones). */
function scrollbarGap(): number {
  return window.innerWidth - document.documentElement.clientWidth;
}

/**
 * Freeze the page behind the sheet. Hiding the scrollbar would widen the
 * layout and shift the centred content, so its width is compensated with a
 * matching padding — a no-op with overlay scrollbars.
 */
function lockScroll(): void {
  const body = document.body;
  if (!body) return;
  // Measure while the scrollbar is still there: adding the class removes it.
  const gap = scrollbarGap();
  body.classList.add("search-modal-open");
  if (gap > 0) body.style.paddingRight = `${gap}px`;
}

function unlockScroll(): void {
  const body = document.body;
  if (!body) return;
  body.classList.remove("search-modal-open");
  body.style.paddingRight = "";
}

/** Value left in a launcher field, carried over to the modal and cleared. */
function readSeed(trigger: HTMLElement): string | undefined {
  const field: HTMLInputElement | null = trigger.matches(
    "[data-search-trigger]",
  )
    ? (trigger as HTMLInputElement)
    : trigger.querySelector<HTMLInputElement>("[data-search-trigger]");
  if (!field) return undefined;
  const value = field.value;
  field.value = "";
  return value || undefined;
}

function openModal({
  trigger = null,
  seed,
}: { trigger?: HTMLElement | null; seed?: string } = {}): void {
  const overlay = getModal();
  if (!overlay) return;

  if (isOpen()) {
    getInput()?.focus({ preventScroll: true });
    return;
  }

  transitionId++;
  cancelRunning();
  lastTrigger = trigger ?? (document.activeElement as HTMLElement | null);

  const input = getInput();
  if (input) input.value = seed ?? "";
  clearOutput();

  // Lock first: the FLIP has to measure the launcher in the layout the lock
  // leaves behind, or the field lands offset by the scrollbar.
  lockScroll();
  const source = getFlipSource();
  overlay.hidden = false;
  setTriggersExpanded(true);
  if (animationsEnabled()) startOpenAnimation(source);

  input?.focus({ preventScroll: true });
  // Warm up the index while the user types.
  void loadPagefind();
  if (seed) void runSearch(seed);
}

function closeModal(): void {
  const overlay = getModal();
  if (!overlay || overlay.hidden) return;

  const id = ++transitionId;
  setTriggersExpanded(false);
  // Show the launcher again: focus has to return to it, and the flying input
  // lands exactly on top of it anyway. Unlocking restores the same content
  // width the lock produced, so the background does not jump.
  unlockScroll();
  const source = getFlipSource();

  const finish = (): void => {
    if (id !== transitionId) return;
    cancelRunning();
    overlay.hidden = true;
  };

  const animation = animationsEnabled() ? startCloseAnimation(source) : null;
  if (animation) animation.finished.then(finish, finish);
  else finish();

  const trigger = lastTrigger;
  lastTrigger = null;
  trigger?.focus?.({ preventScroll: true });
}

function trapFocus(event: KeyboardEvent, overlay: HTMLElement): void {
  const focusables = Array.from(
    overlay.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hidden && !el.closest("[hidden]"));
  if (focusables.length === 0) return;

  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const active = document.activeElement as HTMLElement | null;
  const inside = active ? overlay.contains(active) : false;

  if (!inside) {
    event.preventDefault();
    first?.focus();
    return;
  }
  if (event.shiftKey && active === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first?.focus();
  }
}

/* --- Listeners ------------------------------------------------------------ */

function attachListeners(): void {
  if (listenersAttached) return;
  listenersAttached = true;

  // Delegated on document: the ClientRouter swaps the body on navigation, while
  // this bundled module and its document-level listeners survive.
  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const opener = target.closest<HTMLElement>("[data-search-open]");
    if (opener) {
      event.preventDefault();
      openModal({ trigger: opener, seed: readSeed(opener) });
      return;
    }
    if (target.closest("[data-search-close]") || target === getModal())
      closeModal();
  });

  // A launcher field hands its text over to the modal instead of accepting it.
  document.addEventListener("beforeinput", (event) => {
    const target = event.target as HTMLElement | null;
    if (!target?.matches("[data-search-trigger]")) return;
    const input = event as InputEvent;
    event.preventDefault();
    const field = target as HTMLInputElement;
    const seed = field.value + (input.data ?? "");
    field.value = "";
    openModal({ trigger: field, seed });
  });

  document.addEventListener("input", (event) => {
    const target = event.target as HTMLElement | null;
    if (!target?.closest("#search-modal")) return;
    if (!target.matches("[data-search-input]")) return;
    void runSearch((target as HTMLInputElement).value.trim());
  });

  document.addEventListener("keydown", (event) => {
    const target = event.target as HTMLElement | null;
    const modal = getModal();
    const isTyping =
      target?.tagName === "INPUT" ||
      target?.tagName === "TEXTAREA" ||
      target?.isContentEditable === true;

    if (event.key === "/" && !isTyping) {
      if (!isOpen()) {
        event.preventDefault();
        openModal();
      } else {
        event.preventDefault();
        getInput()?.focus();
      }
      return;
    }

    if (!modal || modal.hidden) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
      return;
    }

    if (event.key === "Tab") {
      trapFocus(event, modal);
      return;
    }

    if (target !== getInput()) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const links = resultLinks();
      if (links.length === 0) return;
      const delta = event.key === "ArrowDown" ? 1 : -1;
      const next =
        activeIndex === -1
          ? delta > 0
            ? 0
            : links.length - 1
          : activeIndex + delta;
      setActive(next);
      return;
    }

    if (event.key === "Enter") {
      const links = resultLinks();
      const link = links[activeIndex >= 0 ? activeIndex : 0];
      if (link) {
        event.preventDefault();
        link.click();
      }
    }
  });
}

/**
 * Wire the modal up. Safe to call again (tests do it on every `beforeEach`):
 * state is reset and listeners are only ever attached once.
 */
export function initSearchModal(next: SearchModalOptions = {}): void {
  options = { ...next };
  transitionId++;
  lastTrigger = null;
  pagefindPromise = null;
  pagefindLang = "";
  searchSeq = 0;
  activeIndex = -1;
  attachListeners();
}
