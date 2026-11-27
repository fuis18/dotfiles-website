import { test, expect } from '@playwright/test';

const HOME = '/dotfiles-website/en/';
const FIELD = '.search-bar--header .search-bar-input';
const HEADER_BAR = '.search-bar--header';
const TRIGGER = '.search-modal-trigger';
const OVERLAY = '#search-modal';
const PANEL = '#search-modal .search-modal';
const MODAL_INPUT = '#search-modal [data-search-input]';
const STATUS = '#pagefind-status';
const RESULT_LINKS = '#pagefind-results a';

test.beforeEach(async ({ page }) => {
  await page.goto(HOME);
});

test.describe('header', () => {
  test('en escritorio se ve el campo centrado y no el botón', async ({ page }) => {
    await expect(page.locator(HEADER_BAR)).toBeVisible();
    await expect(page.locator(FIELD)).toBeVisible();
    await expect(page.locator(TRIGGER)).toBeHidden();
    await expect(page.locator(OVERLAY)).toBeHidden();
  });

  test('el campo se aparta mientras el modal está abierto', async ({ page }) => {
    await page.locator(FIELD).click();
    await expect(page.locator(OVERLAY)).toBeVisible();
    await expect(page.locator(HEADER_BAR)).toBeHidden();

    await page.keyboard.press('Escape');
    await expect(page.locator(OVERLAY)).toBeHidden();
    await expect(page.locator(HEADER_BAR)).toBeVisible();
  });
});

test.describe('apertura y cierre', () => {
  test('el campo abre el modal como diálogo y le da el foco', async ({ page }) => {
    await page.locator(FIELD).click();

    const overlay = page.locator(OVERLAY);
    await expect(overlay).toBeVisible();
    await expect(overlay).toHaveAttribute('role', 'dialog');
    await expect(overlay).toHaveAttribute('aria-modal', 'true');
    await expect(page.locator(MODAL_INPUT)).toBeFocused();
    await expect(page.locator(FIELD)).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator(TRIGGER)).toHaveAttribute('aria-expanded', 'true');
  });

  test('lo escrito en el campo se arrastra al modal y busca', async ({ page }) => {
    await page.locator(FIELD).click();
    await page.keyboard.type('terminal');

    await expect(page.locator(MODAL_INPUT)).toHaveValue('terminal');
    await expect(page.locator(FIELD)).toHaveValue('');
    await expect(page.locator(RESULT_LINKS).first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator(STATUS)).toContainText('matches');
    await expect(page.locator('#pagefind-results mark').first()).toBeVisible();
  });

  test('la barra diagonal abre y, ya abierto, reenfoca el campo', async ({ page }) => {
    await page.keyboard.press('/');
    await expect(page.locator(OVERLAY)).toBeVisible();
    await expect(page.locator(MODAL_INPUT)).toBeFocused();

    await page.locator(MODAL_INPUT).blur();
    await page.keyboard.press('/');
    await expect(page.locator(OVERLAY)).toBeVisible();
    await expect(page.locator(MODAL_INPUT)).toBeFocused();
  });

  test('Escape cierra y devuelve el foco al campo', async ({ page }) => {
    await page.locator(FIELD).click();
    await expect(page.locator(OVERLAY)).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.locator(OVERLAY)).toBeHidden();
    await expect(page.locator(FIELD)).toBeFocused();
    await expect(page.locator(FIELD)).toHaveAttribute('aria-expanded', 'false');
  });

  test('el clic en el fondo cierra el modal', async ({ page }) => {
    await page.locator(FIELD).click();
    await expect(page.locator(OVERLAY)).toBeVisible();

    // Fuera del panel, sobre la capa de fondo.
    await page.mouse.click(8, 8);

    await expect(page.locator(OVERLAY)).toBeHidden();
  });
});

test.describe('búsqueda', () => {
  test('las flechas marcan resultados y Enter navega', async ({ page }) => {
    await page.locator(FIELD).click();
    await page.locator(MODAL_INPUT).fill('terminal');
    await expect(page.locator(RESULT_LINKS).first()).toBeVisible({ timeout: 15000 });

    const href = await page.locator(RESULT_LINKS).first().getAttribute('href');
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#pagefind-results .is-active')).toHaveCount(1);
    await expect(page.locator(MODAL_INPUT)).toHaveAttribute('aria-activedescendant', 'search-link-0');

    await page.keyboard.press('Enter');
    await page.waitForURL(`**${href}`);
  });

  test('vaciar la consulta limpia la lista sin borrar el nodo', async ({ page }) => {
    await page.locator(FIELD).click();
    const input = page.locator(MODAL_INPUT);
    await input.fill('terminal');
    await expect(page.locator(RESULT_LINKS).first()).toBeVisible({ timeout: 15000 });

    await input.fill('');

    await expect(page.locator(STATUS)).toHaveText('');
    await expect(page.locator('#pagefind-results')).toBeHidden();
    await expect(page.locator(MODAL_INPUT)).toHaveAttribute('aria-expanded', 'false');
  });

  test('una consulta sin coincidencias muestra el aviso', async ({ page }) => {
    await page.locator(FIELD).click();
    await page.locator(MODAL_INPUT).fill('qwertyuiopasdfghjklzxcvbnm');

    await expect(page.locator(STATUS)).toHaveText('no results', { timeout: 15000 });
    await expect(page.locator(RESULT_LINKS)).toHaveCount(0);
  });
});

test.describe('animación', () => {
  test('el campo del header vuela hasta su posición en el modal', async ({ page }) => {
    // Arming a rAF probe before opening, so a fast animation cannot be missed.
    const seen = await page.evaluate(
      () =>
        new Promise<boolean>((resolve) => {
          let seen = false;
          const start = performance.now();
          const tick = () => {
            const row = document.querySelector('.search-modal .search-bar--modal');
            const panel = document.querySelector('.search-modal');
            const animating =
              (row?.getAnimations().length ?? 0) > 0 || (panel?.getAnimations().length ?? 0) > 0;
            if (animating) seen = true;
            if (seen || performance.now() - start > 2000) resolve(seen);
            else requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          (document.querySelector('.search-bar--header input') as HTMLInputElement).click();
        })
    );
    expect(seen).toBe(true);

    // …y la animación termina en el estado final.
    await expect
      .poll(async () => page.locator(PANEL).evaluate((el) => el.getAnimations().length))
      .toBe(0);
    await expect(page.locator('.search-modal .search-bar--modal')).toHaveCSS('transform', 'none');
    await expect(page.locator(MODAL_INPUT)).toBeFocused();
  });

  test('con prefers-reduced-motion no se anima nada', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(HOME);

    await page.locator(FIELD).click();

    await expect(page.locator(OVERLAY)).toBeVisible();
    await expect(page.locator(MODAL_INPUT)).toBeFocused();
    const animations = await page.evaluate(() => {
      const nodes = [
        document.querySelector('.search-modal-overlay'),
        document.querySelector('.search-modal'),
        document.querySelector('.search-modal .search-bar--modal'),
      ];
      return nodes.reduce((total, node) => total + (node?.getAnimations().length ?? 0), 0);
    });
    expect(animations).toBe(0);
  });
});
