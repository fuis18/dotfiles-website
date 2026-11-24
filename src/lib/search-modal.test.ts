import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  initSearchModal,
  withBase,
  type PagefindApi,
  type PagefindResultData,
} from './search-modal';

/** Mirrors the markup SearchModal.astro + SearchBar.astro render. */
function fixture(): string {
  return `
    <button class="icon-container search-modal-trigger" type="button" data-search-open
      aria-haspopup="dialog" aria-controls="search-modal" aria-expanded="false">search</button>

    <div class="search-bar search-bar--header">
      <label class="search-sr-only" for="search-bar-input">Search</label>
      <input type="search" id="search-bar-input" class="search-bar-input"
        placeholder="search content..." data-search-open data-search-trigger
        aria-haspopup="dialog" aria-expanded="false" />
      <span class="search-kbd search-bar-kbd" aria-hidden="true">/</span>
    </div>

    <div class="search-modal-overlay" id="search-modal" hidden role="dialog" aria-modal="true"
      aria-label="Search" data-no-results="No results found" data-count-label="results"
      data-dev-notice="Search only works in a production build">
      <div class="search-modal">
        <div class="search-modal-inner">
          <div class="search-bar search-bar--modal">
            <label class="search-sr-only" for="search-modal-input">Search</label>
            <input type="search" id="search-modal-input" class="search-bar-input" data-search-input
              role="combobox" aria-expanded="false" aria-autocomplete="list"
              aria-controls="pagefind-output" />
            <span class="search-kbd search-bar-kbd" aria-hidden="true">esc</span>
          </div>
          <div id="pagefind-output" class="search-modal-output">
            <p class="search-modal-status" id="pagefind-status" role="status" aria-live="polite"></p>
            <ul id="pagefind-results" class="search-modal-results"></ul>
          </div>
        </div>
      </div>
    </div>
  `;
}

const RESULTS: PagefindResultData[] = [
  {
    url: '/en/apps/audio/',
    meta: { title: 'Audio' },
    excerpt: 'PipeWire <mark>mixer</mark> setup',
    sub_results: [{ url: '/en/apps/audio/#mixer', title: 'Mixer', excerpt: 'the <mark>mixer</mark>' }],
  },
  { url: '/en/iso/kernel/', meta: { title: 'Kernel' }, excerpt: 'no match here' },
];

function makeApi(results: PagefindResultData[]): PagefindApi {
  return {
    init: async () => {},
    preload: vi.fn(),
    search: async () => ({ results: [] }),
    debouncedSearch: async () => ({
      results: results.map((data, i) => ({ id: `r${i}`, data: async () => data })),
    }),
  };
}

const overlay = (): HTMLElement => document.getElementById('search-modal')!;
const modalInput = (): HTMLInputElement =>
  document.querySelector('#search-modal [data-search-input]')!;
const headerField = (): HTMLInputElement => document.querySelector('.search-bar--header input')!;
const triggerButton = (): HTMLButtonElement =>
  document.querySelector('.search-modal-trigger')!;
const status = (): string => document.getElementById('pagefind-status')?.textContent ?? '';
const resultsList = (): HTMLElement => document.getElementById('pagefind-results')!;
const resultLinks = (): HTMLAnchorElement[] =>
  Array.from(resultsList().querySelectorAll('a'));

function typeInModal(value: string): void {
  const input = modalInput();
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function press(target: Element, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

let api: PagefindApi;

beforeEach(() => {
  document.body.className = '';
  document.body.innerHTML = fixture();
  // jsdom does not implement it; setActive() scrolls the highlighted result.
  Element.prototype.scrollIntoView = vi.fn();
  api = makeApi(RESULTS);
  initSearchModal({ loadPagefind: async () => api, animate: false });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('withBase', () => {
  it('deja pasar las rutas cuando no hay base', () => {
    expect(withBase('/en/apps/', '/')).toBe('/en/apps/');
    expect(withBase('/en/apps/', '')).toBe('/en/apps/');
  });

  it('prefija la base una sola vez', () => {
    expect(withBase('/en/apps/', '/dotfiles-website/')).toBe('/dotfiles-website/en/apps/');
    expect(withBase('/dotfiles-website/en/apps/', '/dotfiles-website/')).toBe(
      '/dotfiles-website/en/apps/'
    );
    expect(withBase('/en/apps/', '/base')).toBe('/base/en/apps/');
  });
});

describe('apertura', () => {
  it('los dos disparadores activan la misma instancia', () => {
    const button = triggerButton();
    const field = headerField();

    button.click();
    expect(overlay().hidden).toBe(false);
    expect(document.activeElement).toBe(modalInput());
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(field.getAttribute('aria-expanded')).toBe('true');

    press(modalInput(), 'Escape');
    expect(overlay().hidden).toBe(true);

    field.click();
    expect(overlay().hidden).toBe(false);
    expect(document.activeElement).toBe(modalInput());
  });

  it('arranca con el valor que tenía el campo del header', () => {
    const field = headerField();
    field.value = 'termin';

    const event = new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      data: 'al',
      inputType: 'insertText',
    });
    field.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(overlay().hidden).toBe(false);
    expect(modalInput().value).toBe('terminal');
    expect(field.value).toBe('');
  });

  it('la barra diagonal abre y, ya abierto, reenfoca el campo', () => {
    const openEvent = press(document.body, '/');
    expect(openEvent.defaultPrevented).toBe(true);
    expect(overlay().hidden).toBe(false);
    expect(document.activeElement).toBe(modalInput());

    modalInput().blur();
    press(document.body, '/');
    expect(overlay().hidden).toBe(false);
    expect(document.activeElement).toBe(modalInput());
  });

  it('el clic en el fondo cierra, el clic dentro no', () => {
    triggerButton().click();
    overlay().click();
    expect(overlay().hidden).toBe(true);

    triggerButton().click();
    (overlay().querySelector('.search-modal') as HTMLElement).click();
    expect(overlay().hidden).toBe(false);
  });

  it('Escape cierra y devuelve el foco al disparador', () => {
    const button = triggerButton();
    button.click();

    press(modalInput(), 'Escape');

    expect(overlay().hidden).toBe(true);
    expect(document.activeElement).toBe(button);
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(headerField().getAttribute('aria-expanded')).toBe('false');
  });
});

describe('resultados', () => {
  it('pinta los resultados, los subapartados y el conteo', async () => {
    triggerButton().click();
    typeInModal('mixer');

    await vi.waitFor(() => expect(status()).toBe('2 results'));
    expect(resultsList().querySelectorAll('li.search-result')).toHaveLength(2);
    expect(resultsList().querySelectorAll('mark')).toHaveLength(2);
    // Página + apartado de la primera página + segunda página.
    expect(resultLinks()).toHaveLength(3);
    expect(resultLinks().map((link) => link.id)).toEqual([
      'search-link-0',
      'search-link-1',
      'search-link-2',
    ]);
    expect(resultLinks()[0]!.getAttribute('href')).toBe('/en/apps/audio/');
    expect(resultLinks()[1]!.getAttribute('href')).toBe('/en/apps/audio/#mixer');
    expect(modalInput().getAttribute('aria-expanded')).toBe('true');
    expect(modalInput().getAttribute('aria-activedescendant')).toBeNull();
  });

  it('limpia la lista sin borrar el nodo cuando la consulta se vacía', async () => {
    triggerButton().click();
    typeInModal('mixer');
    await vi.waitFor(() => expect(resultLinks().length).toBeGreaterThan(0));

    typeInModal('');

    expect(status()).toBe('');
    expect(resultLinks()).toHaveLength(0);
    expect(document.getElementById('pagefind-results')).not.toBeNull();
    expect(modalInput().getAttribute('aria-expanded')).toBe('false');
  });

  it('muestra el aviso cuando no hay índice de Pagefind', async () => {
    initSearchModal({ loadPagefind: async () => null, animate: false });
    triggerButton().click();
    typeInModal('mixer');

    await vi.waitFor(() => expect(status()).toBe('Search only works in a production build'));
    expect(resultLinks()).toHaveLength(0);
  });

  it('muestra el mensaje de sin resultados', async () => {
    initSearchModal({ loadPagefind: async () => makeApi([]), animate: false });
    triggerButton().click();
    typeInModal('zzzz');

    await vi.waitFor(() => expect(status()).toBe('No results found'));
    expect(resultLinks()).toHaveLength(0);
  });
});

describe('navegación con teclado', () => {
  async function searchAndRender(): Promise<void> {
    triggerButton().click();
    typeInModal('mixer');
    await vi.waitFor(() => expect(resultLinks().length).toBe(3));
  }

  it('las flechas recorren los resultados y actualizan aria-activedescendant', async () => {
    await searchAndRender();

    press(modalInput(), 'ArrowDown');
    expect(resultLinks()[0]!.classList.contains('is-active')).toBe(true);
    expect(modalInput().getAttribute('aria-activedescendant')).toBe('search-link-0');

    press(modalInput(), 'ArrowDown');
    expect(resultLinks()[1]!.classList.contains('is-active')).toBe(true);
    expect(modalInput().getAttribute('aria-activedescendant')).toBe('search-link-1');

    press(modalInput(), 'ArrowUp');
    expect(resultLinks()[0]!.classList.contains('is-active')).toBe(true);
  });

  it('Enter abre el resultado activo', async () => {
    await searchAndRender();
    const clicked: string[] = [];
    resultLinks().forEach((link) =>
      link.addEventListener('click', (event) => {
        // Stop jsdom from trying to follow the link.
        event.preventDefault();
        clicked.push(link.id);
      })
    );

    press(modalInput(), 'ArrowDown');
    expect(resultLinks()[0]!.classList.contains('is-active')).toBe(true);
    press(modalInput(), 'Enter');

    expect(clicked).toEqual(['search-link-0']);
  });

  it('Tab queda dentro del modal y da la vuelta', async () => {
    await searchAndRender();
    const input = modalInput();
    const links = resultLinks();
    const last = links[links.length - 1]!;

    // Campo (primero) -> el navegador avanza solo; no lo interceptamos.
    input.focus();
    expect(press(input, 'Tab').defaultPrevented).toBe(false);

    // Último resultado -> vuelve al campo.
    last.focus();
    expect(press(last, 'Tab').defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(input);

    // Campo con Shift -> va al último resultado.
    expect(press(input, 'Tab', { shiftKey: true }).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(last);

    // Con el foco fuera del modal se recupera dentro.
    triggerButton().focus();
    expect(press(document.body, 'Tab').defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(input);
  });
});

describe('initSearchModal', () => {
  it('es idempotente: no vuelve a registrar los listeners', () => {
    const addEventListener = vi.spyOn(document, 'addEventListener');

    initSearchModal({ animate: false });
    initSearchModal({ animate: false });

    const clicks = addEventListener.mock.calls.filter(([type]) => type === 'click');
    expect(clicks).toHaveLength(0);
  });

  it('reinicia el estado entre ejecuciones', async () => {
    triggerButton().click();
    typeInModal('mixer');
    await vi.waitFor(() => expect(resultLinks().length).toBe(3));

    initSearchModal({ loadPagefind: async () => api, animate: false });
    document.body.innerHTML = fixture();

    expect(overlay().hidden).toBe(true);
    expect(status()).toBe('');
    expect(resultLinks()).toHaveLength(0);
  });
});
