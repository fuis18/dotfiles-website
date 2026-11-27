import { test, expect } from '@playwright/test';

// Situación 2: touch/small viewport — the header field is hidden and only the
// icon button triggers the modal, which reveals itself with a clip-path.
test.use({ viewport: { width: 390, height: 844 } });

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

test('el campo del header está oculto y el botón visible', async ({ page }) => {
  await expect(page.locator(HEADER_BAR)).toBeHidden();
  await expect(page.locator(FIELD)).toBeHidden();
  await expect(page.locator(TRIGGER)).toBeVisible();
  await expect(page.locator(OVERLAY)).toBeHidden();
});

test('el botón abre el modal con foco en el campo', async ({ page }) => {
  await page.locator(TRIGGER).click();

  await expect(page.locator(OVERLAY)).toBeVisible();
  await expect(page.locator(OVERLAY)).toHaveAttribute('aria-modal', 'true');
  await expect(page.locator(MODAL_INPUT)).toBeFocused();
  await expect(page.locator(TRIGGER)).toHaveAttribute('aria-expanded', 'true');
});

test('la apertura se anima con clip-path (revelado)', async ({ page }) => {
  // Arm the probe before opening so a fast animation cannot be missed.
  const seen = await page.evaluate(
    () =>
      new Promise<boolean>((resolve) => {
        let seen = false;
        const start = performance.now();
        const tick = () => {
          const panel = document.querySelector('#search-modal .search-modal');
          const clip = panel ? getComputedStyle(panel).clipPath : 'none';
          const animating = clip !== 'none' || (panel?.getAnimations().length ?? 0) > 0;
          if (animating) seen = true;
          if (seen || performance.now() - start > 2000) resolve(seen);
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        (document.querySelector('.search-modal-trigger') as HTMLButtonElement).click();
      })
  );
  expect(seen).toBe(true);

  // …and it settles back to no clip-path.
  await expect
    .poll(async () => page.locator(PANEL).evaluate((el) => el.getAnimations().length))
    .toBe(0);
  await expect(page.locator(PANEL)).toHaveCSS('clip-path', 'none');
});

test('Escape cierra y devuelve el foco al botón', async ({ page }) => {
  await page.locator(TRIGGER).click();
  await expect(page.locator(OVERLAY)).toBeVisible();

  await page.keyboard.press('Escape');

  await expect(page.locator(OVERLAY)).toBeHidden();
  await expect(page.locator(TRIGGER)).toBeFocused();
  await expect(page.locator(TRIGGER)).toHaveAttribute('aria-expanded', 'false');
});

test('la barra diagonal abre el modal', async ({ page }) => {
  await page.keyboard.press('/');

  await expect(page.locator(OVERLAY)).toBeVisible();
  await expect(page.locator(MODAL_INPUT)).toBeFocused();
});

test('el clic en el fondo cierra el modal', async ({ page }) => {
  await page.locator(TRIGGER).click();
  await expect(page.locator(OVERLAY)).toBeVisible();

  await page.mouse.click(8, 8);

  await expect(page.locator(OVERLAY)).toBeHidden();
});

test('busca desde el modal', async ({ page }) => {
  await page.locator(TRIGGER).click();
  await page.locator(MODAL_INPUT).fill('terminal');

  await expect(page.locator(RESULT_LINKS).first()).toBeVisible({ timeout: 15000 });
  await expect(page.locator(STATUS)).toContainText('matches');
});

test('con prefers-reduced-motion no se anima nada', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(HOME);

  await page.locator(TRIGGER).click();

  await expect(page.locator(OVERLAY)).toBeVisible();
  const animations = await page.evaluate(() => {
    const nodes = [
      document.querySelector('.search-modal-overlay'),
      document.querySelector('#search-modal .search-modal'),
      document.querySelector('#search-modal .search-bar--modal'),
    ];
    return nodes.reduce((total, node) => total + (node?.getAnimations().length ?? 0), 0);
  });
  expect(animations).toBe(0);
});
