import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';

const PREVIEW_PORT = Number(process.env.E2E_PREVIEW_PORT || 4174);
const CDP_PORT = Number(process.env.E2E_CDP_PORT || 9223);
const BASE_URL = `http://127.0.0.1:${PREVIEW_PORT}/`;

function findBrowserExecutable() {
  const candidates = [
    process.env.CHROME_PATH,
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  ].filter(Boolean);

  const found = candidates.find((p) => fs.existsSync(p));
  if (!found) {
    throw new Error(`No Chrome/Chromium/Edge binary found. Checked: ${candidates.join(', ')}`);
  }
  return found;
}

function httpGetText(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) resolve(body);
        else reject(new Error(`HTTP ${res.statusCode}`));
      });
    });
    req.on('error', reject);
    req.setTimeout(1500, () => req.destroy(new Error('timeout')));
  });
}

async function waitForHttp(url, timeoutMs = 15000) {
  const start = Date.now();
  let lastErr = '';
  while (Date.now() - start < timeoutMs) {
    try {
      const text = await httpGetText(url);
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    } catch (err) {
      lastErr = err.message;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Timed out waiting for ${url} (${lastErr})`);
}

class CdpClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.events = [];
  }

  async connect() {
    await new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });
    this.ws.addEventListener('message', (msg) => {
      const data = JSON.parse(msg.data);
      if (data.id && this.pending.has(data.id)) {
        const { resolve, reject } = this.pending.get(data.id);
        this.pending.delete(data.id);
        if (data.error) reject(new Error(data.error.message));
        else resolve(data.result);
      } else if (data.method) {
        this.events.push(data);
      }
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (res.exceptionDetails) {
      throw new Error(JSON.stringify(res.exceptionDetails));
    }
    return res.result?.value;
  }

  close() {
    this.ws.close();
  }
}

async function run() {
  if (!fs.existsSync(path.resolve('dist/index.html'))) {
    throw new Error('dist/index.html not found. Run "npm run build" before "npm run test:e2e".');
  }

  const browserBin = findBrowserExecutable();
  const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'wada-cdp-'));
  const preview = spawn(
    'node',
    ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(PREVIEW_PORT), '--strictPort'],
    {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    }
  );
  let previewLogs = '';
  preview.stdout.on('data', (d) => {
    previewLogs += d.toString();
  });
  preview.stderr.on('data', (d) => {
    previewLogs += d.toString();
  });

  let browser = null;
  let browserLogs = '';
  let client = null;

  try {
    try {
      await waitForHttp(BASE_URL);
    } catch (e) {
      throw new Error(`${e.message}\nPreview logs:\n${previewLogs}`);
    }

    const browserArgs = [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-background-networking',
      '--disable-extensions',
      '--disable-sync',
      '--disable-background-timer-throttling',
      '--remote-debugging-address=127.0.0.1',
      ...(process.platform === 'linux' || process.env.CI
        ? ['--no-sandbox', '--disable-dev-shm-usage']
        : []),
      `--user-data-dir=${tmpProfile}`,
      `--remote-debugging-port=${CDP_PORT}`,
      '--window-size=1280,900',
      BASE_URL,
    ];

    const browserEnv = { ...process.env };
    if (process.platform === 'linux') {
      delete browserEnv.DBUS_SESSION_BUS_ADDRESS;
    }

    browser = spawn(browserBin, browserArgs, {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      env: browserEnv,
    });
    browser.stderr.on('data', (d) => {
      browserLogs = (browserLogs + d.toString()).slice(-4000);
    });

    let targets;
    try {
      targets = await waitForHttp(`http://127.0.0.1:${CDP_PORT}/json`, 30000);
    } catch (e) {
      throw new Error(
        `${e.message} (exitCode=${browser.exitCode})\nBrowser (${browserBin}) stderr:\n${browserLogs}`
      );
    }
    const pageTarget = targets.find((t) => t.type === 'page');
    assert.ok(pageTarget, 'No CDP page target found');

    client = new CdpClient(pageTarget.webSocketDebuggerUrl);
    await client.connect();
    await client.send('Runtime.enable');
    await client.send('Page.enable');

    // Wait for initial React render + self-hosted fonts before measuring rects
    for (let i = 0; i < 40; i++) {
      const ready = await client.eval(
        `Boolean(document.body?.innerText?.includes('Showing 48 of 420 combinations'))`
      );
      if (ready) break;
      await new Promise((r) => setTimeout(r, 150));
    }
    await client.eval(`document.fonts.ready`);
    await new Promise((r) => setTimeout(r, 100));

    // Track runtime errors
    await client.eval(`
      window.__errors = [];
      window.addEventListener('error', e => window.__errors.push(e.message));
      window.addEventListener('unhandledrejection', e => window.__errors.push(String(e.reason)));
    `);

    // 0. Check semantic landmarks, icon-only accessible names, and self-hosted fonts
    await client.eval(`Promise.all([
      document.fonts.load('700 24px "Cinzel"'),
      document.fonts.load('400 14px "Plus Jakarta Sans"'),
      document.fonts.load('400 12px "JetBrains Mono"'),
      document.fonts.load('700 18px "Noto Serif JP"', '三造'),
    ])`);
    const baselineAudit = await client.eval(`(() => {
      const headerCount = document.querySelectorAll('header').length;
      const mainCount = document.querySelectorAll('main').length;
      const unlabelledIconBtns = Array.from(document.querySelectorAll('button')).filter(b => {
        if (b.offsetParent === null) return false;
        const txt = (b.textContent || '').replace(/\\s+/g, '').trim();
        if (txt.length > 0) return false;
        return !(b.getAttribute('aria-label') || b.getAttribute('title'));
      }).length;
      const externalGoogleFonts = document.querySelectorAll('link[href*="fonts.googleapis.com"]').length;
      const fontsLoaded = {
        cinzel: document.fonts.check('700 24px "Cinzel"'),
        jakarta: document.fonts.check('400 14px "Plus Jakarta Sans"'),
        mono: document.fonts.check('400 12px "JetBrains Mono"'),
        notoJp: document.fonts.check('700 18px "Noto Serif JP"', '三造'),
      };
      return { headerCount, mainCount, unlabelledIconBtns, externalGoogleFonts, fontsLoaded };
    })()`);
    assert.equal(baselineAudit.headerCount, 1);
    assert.equal(baselineAudit.mainCount, 1);
    assert.equal(baselineAudit.unlabelledIconBtns, 0);
    assert.equal(baselineAudit.externalGoogleFonts, 0);
    assert.equal(baselineAudit.fontsLoaded.cinzel, true);
    assert.equal(baselineAudit.fontsLoaded.jakarta, true);
    assert.equal(baselineAudit.fontsLoaded.mono, true);
    assert.equal(baselineAudit.fontsLoaded.notoJp, true);

    const assertMobileFits360 = async (viewLabel) => {
      await client.send('Emulation.setDeviceMetricsOverride', {
        width: 360,
        height: 780,
        deviceScaleFactor: 2,
        mobile: true,
      });
      await new Promise((r) => setTimeout(r, 140));
      const overflowCheck = await client.eval(`(() => {
        const cw = document.documentElement.clientWidth;
        const bad = Array.from(document.querySelectorAll('*'))
          .filter(el => {
            if (el.tagName === 'HTML' || el.tagName === 'BODY') return false;
            const r = el.getBoundingClientRect();
            const cs = getComputedStyle(el);
            if (r.width <= 0) return false;
            if (r.right > cw + 1 || r.left < -1) return true;
            if (cs.overflowX === 'visible' && cs.overflow === 'visible' && el.scrollWidth > el.clientWidth + 2) return true;
            return false;
          })
          .slice(0, 10)
          .map(el => ({
            tag: el.tagName,
            cls: typeof el.className === 'string' ? el.className.slice(0, 60) : '',
            left: Math.round(el.getBoundingClientRect().left),
            right: Math.round(el.getBoundingClientRect().right),
            sw: el.scrollWidth,
            cw: el.clientWidth,
          }));
        return { cw, sw: document.documentElement.scrollWidth, bad };
      })()`);
      await client.send('Emulation.clearDeviceMetricsOverride');
      await new Promise((r) => setTimeout(r, 100));
      assert.ok(
        overflowCheck.sw <= 360 && overflowCheck.bad.length === 0,
        `Mobile 360px overflow on ${viewLabel}: ${JSON.stringify(overflowCheck)}`
      );
    };

    await assertMobileFits360('combinations');

    const getRects = async () =>
      client.eval(`(() => {
        const findBtn = (txt) => Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim().includes(txt));
        const keys = {
          allVol: findBtn('All Volumes'),
          vol1: findBtn('Vol. 1: Harmony'),
          vol2: findBtn('Vol. 2: Seasonal'),
          spring: findBtn('Spring'),
          monthSelect: document.querySelector('select[aria-label="Filter by Japanese calendar month"]'),
          allSizes: findBtn('All Sizes'),
          twoColor: findBtn('2-Color'),
          warm: findBtn('warm'),
          cool: findBtn('cool'),
          neutral: findBtn('neutral'),
          sortSelect: document.querySelector('select[aria-label="Sort combinations"]'),
          resetBtn: findBtn('Reset'),
          themeDark: document.querySelector('button[aria-label="Dark Gallery Theme"]'),
          favorites: findBtn('Favorites'),
        };
        const out = {};
        for (const [k, el] of Object.entries(keys)) {
          if (!el) throw new Error('Missing element: ' + k);
          const r = el.getBoundingClientRect();
          out[k] = { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
        }
        return out;
      })()`);

    const assertZeroJump = (label, before, after) => {
      for (const key of Object.keys(before)) {
        const dx = Math.abs(before[key].x - after[key].x);
        const dy = Math.abs(before[key].y - after[key].y);
        assert.ok(
          dx <= 1 && dy <= 1,
          `${label}: ${key} jumped by dx=${dx}, dy=${dy} (${JSON.stringify(before[key])} -> ${JSON.stringify(after[key])})`
        );
      }
    };

    const waitForText = async (text, timeoutMs = 5000) => {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        const found = await client.eval(`document.body.innerText.includes(${JSON.stringify(text)})`);
        if (found) return true;
        await new Promise((r) => setTimeout(r, 80));
      }
      return false;
    };

    const r0 = await getRects();

    // 1. Click Vol. 1: Harmony -> assert zero layout jump across toolbar buttons
    await client.eval(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Vol. 1: Harmony')).click()`);
    await new Promise((r) => setTimeout(r, 80));
    assertZeroJump('After clicking Vol. 1', r0, await getRects());

    // 2. Click Vol. 2: Seasonal -> assert zero jump
    await client.eval(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Vol. 2: Seasonal')).click()`);
    await new Promise((r) => setTimeout(r, 80));
    assertZeroJump('After clicking Vol. 2', r0, await getRects());

    // 3. Select September in Month dropdown -> assert zero jump
    await client.eval(`(() => {
      const sel = document.querySelector('select[aria-label="Filter by Japanese calendar month"]');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
      setter.call(sel, '9');
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    })()`);
    await new Promise((r) => setTimeout(r, 80));
    assertZeroJump('After selecting September month', r0, await getRects());

    // 4. Click warm, cool, neutral tone filters -> assert zero jump
    for (const tone of ['warm', 'cool', 'neutral']) {
      await client.eval(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === '${tone}').click()`);
      await new Promise((r) => setTimeout(r, 60));
      assertZeroJump(`After clicking tone ${tone}`, r0, await getRects());
    }

    // 5. Click Reset, then toggle Favorite heart on a card -> assert zero header jump
    await client.eval(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Reset').click()`);
    await new Promise((r) => setTimeout(r, 80));
    assertZeroJump('After clicking Reset', r0, await getRects());

    await client.eval(`document.querySelector('button[aria-label*="to favorites"]').click()`);
    await new Promise((r) => setTimeout(r, 80));
    assertZeroJump('After starring first favorite', r0, await getRects());

    // 6. Toggle Dark Gallery theme -> verify .dark class and obsidian background
    await client.eval(`document.querySelector('button[aria-label="Dark Gallery Theme"]').click()`);
    await new Promise((r) => setTimeout(r, 80));
    const darkState = await client.eval(`({
      hasDark: document.documentElement.classList.contains('dark'),
      bg: getComputedStyle(document.documentElement).backgroundColor
    })`);
    assert.equal(darkState.hasDark, true);
    assert.equal(darkState.bg, 'rgb(18, 18, 20)');

    // 7. Open Color Match panel (HEX Match + From Image preset + thumbnail preview)
    await client.eval(`Array.from(document.querySelectorAll('header button')).find(b => b.textContent.includes('Color Match')).click()`);
    assert.equal(await waitForText('CIEDE2000'), true);
    await client.eval(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'From Image').click()`);
    assert.equal(await waitForText('Image-to-Sanzo-Wada Palette Extractor'), true);

    await client.eval(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Ukiyo-e Sunset')).click()`);
    assert.equal(await waitForText('Analyzed: Sample: Ukiyo-e Sunset'), true);
    assert.equal(await waitForText('Open Wada Mix ('), true);
    const previewImgCheck = await client.eval(`(() => {
      const img = document.querySelector('section[aria-label*="Image Extractor"] img');
      return img ? { complete: img.complete, naturalWidth: img.naturalWidth, alt: img.alt } : null;
    })()`);
    assert.ok(previewImgCheck && previewImgCheck.complete && previewImgCheck.naturalWidth > 0 && previewImgCheck.alt.includes('Ukiyo-e Sunset'));
    await client.eval(`document.querySelector('button[aria-label="Close color matcher"]')?.click()`);

    // 7b. Open Custom Mix composer, save a named mix to localStorage, launch in Studio, test weighted reorder
    await client.eval(`document.querySelector('header button[title*="Compose a custom palette"]').click()`);
    assert.equal(await waitForText('Custom Wada Palette Composer'), true);
    await client.eval(`Array.from(document.querySelectorAll('[role="dialog"] button')).find(b => b.textContent.includes('Random 3-Color Mix')).click()`);
    await new Promise((r) => setTimeout(r, 80));

    await client.eval(`(() => {
      const input = document.querySelector('input[aria-label="Custom palette name"]');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, 'Hero Sunset');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    await new Promise((r) => setTimeout(r, 40));
    await client.eval(`Array.from(document.querySelectorAll('[role="dialog"] button')).find(b => b.textContent.trim() === 'Save').click()`);
    assert.equal(await waitForText('Hero Sunset'), true);
    const savedRaw = await client.eval(`localStorage.getItem('sanzo-wada-saved-mixes-v1')`);
    assert.ok(savedRaw && savedRaw.includes('Hero Sunset'));

    await client.eval(`Array.from(document.querySelectorAll('[role="dialog"] button')).find(b => b.textContent.includes('Open in Studio')).click()`);
    assert.equal(await waitForText('Custom Studio Palette'), true);
    assert.equal(await client.eval(`document.querySelector('[role="dialog"]')?.getAttribute('aria-modal')`), 'true');
    assert.equal(await client.eval(`document.body.innerText.includes('№ 000')`), false);

    // Switch poster proportions to 60 / 30 / 10 Balance and test ↑ Dominant reordering
    await client.eval(`Array.from(document.querySelectorAll('[role="dialog"] button')).find(b => b.textContent.includes('60 / 30 / 10 Balance')).click()`);
    await new Promise((r) => setTimeout(r, 60));
    const dominantBefore = await client.eval(`document.querySelector('[role="dialog"] .group\\\\/bar button')?.textContent`);
    await client.eval(`document.querySelector('[role="dialog"] button[aria-label*="to primary dominant slot"]')?.click()`);
    await new Promise((r) => setTimeout(r, 60));
    const dominantAfter = await client.eval(`document.querySelector('[role="dialog"] .group\\\\/bar button')?.textContent`);
    assert.ok(dominantBefore && dominantAfter && dominantBefore !== dominantAfter, `Expected primary swatch to change after ↑ Dominant (${dominantBefore} -> ${dominantAfter})`);

    await client.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
    await new Promise((r) => setTimeout(r, 80));
    assert.equal(await client.eval(`document.getElementById('studio-modal-title')`), null);

    // 7c. Press '?' shortcut to open Guide & Backup Modal, then close with Escape
    await client.send('Input.dispatchKeyEvent', { type: 'keyDown', key: '?', text: '?' });
    assert.equal(await waitForText('Archive Guide, Shortcuts & Backup'), true);
    await client.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
    await new Promise((r) => setTimeout(r, 80));
    assert.equal(await client.eval(`document.getElementById('guide-modal-title')`), null);

    // 8. Pin 2 palettes and open Compare Modal
    await client.eval(`(() => {
      const btns = document.querySelectorAll('button[aria-label*="to compare"]');
      btns[0].click();
      btns[1].click();
    })()`);
    await new Promise((r) => setTimeout(r, 100));
    await client.eval(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Compare (2/3)')).click()`);
    await waitForText('Palette Comparison (2 / 3)');
    const compareOpen = await client.eval(`({
      title: document.getElementById('compare-modal-title')?.textContent,
      overflow: document.body.style.overflow
    })`);
    assert.equal(compareOpen.title, 'Palette Comparison (2 / 3)');
    assert.equal(compareOpen.overflow, 'hidden');

    await client.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
    await new Promise((r) => setTimeout(r, 80));
    assert.equal(await client.eval(`document.body.style.overflow`), '');

    // 9. Open ModalStudio, verify ALL 5 tabs fit without overflow on desktop AND collapse cleanly to icons on narrow viewport
    await client.eval(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Inspect').click()`);
    await waitForText('Showa Art Print');
    assert.equal(await client.eval(`Boolean(document.getElementById('studio-modal-title'))`), true);
    assert.equal(await client.eval(`document.body.style.overflow`), 'hidden');

    const desktopTabs = await client.eval(`(() => {
      const list = document.querySelector('[role="tablist"][aria-label="Studio tools"]');
      const tabs = Array.from(list.querySelectorAll('button[role="tab"]'));
      const listRect = list.getBoundingClientRect();
      return {
        count: tabs.length,
        overflows: list.scrollWidth > list.clientWidth + 1,
        allVisible: tabs.every(t => { const r = t.getBoundingClientRect(); return r.left >= listRect.left - 1 && r.right <= listRect.right + 1; }),
        labelsVisible: tabs.every(t => !t.querySelector('span')?.className.includes('sr-only')),
      };
    })()`);
    assert.equal(desktopTabs.count, 5);
    assert.equal(desktopTabs.overflows, false);
    assert.equal(desktopTabs.allVisible, true);
    assert.equal(desktopTabs.labelsVisible, true);

    // Emulate narrow mobile screen (360px) and assert Studio header doesn't collide & all 5 icon-only tabs remain visible with zero clipping
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 360,
      height: 850,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await new Promise((r) => setTimeout(r, 140));
    const mobileHeaderCheck = await client.eval(`(() => {
      const title = document.getElementById('studio-modal-title')?.getBoundingClientRect();
      const prevBtn = document.querySelector('button[aria-label="Previous combination (Left Arrow)"]')?.getBoundingClientRect();
      const closeBtn = document.querySelector('button[aria-label="Close studio modal"]')?.getBoundingClientRect();
      const overlap = (a, b) => a && b && !(a.right <= b.left + 1 || b.right <= a.left + 1 || a.bottom <= b.top + 1 || b.bottom <= a.top + 1);
      return {
        titleWidth: title?.width || 0,
        overlapsPrev: overlap(title, prevBtn),
        overlapsClose: overlap(title, closeBtn),
        overflowsViewport: document.documentElement.scrollWidth > window.innerWidth,
      };
    })()`);
    assert.ok(mobileHeaderCheck.titleWidth >= 160, `Expected readable Studio title width on 360px, got ${JSON.stringify(mobileHeaderCheck)}`);
    assert.equal(mobileHeaderCheck.overlapsPrev, false, 'Studio title overlaps prev/next buttons on 360px');
    assert.equal(mobileHeaderCheck.overlapsClose, false, 'Studio title overlaps close button on 360px');
    assert.equal(mobileHeaderCheck.overflowsViewport, false);
    const narrowTabs = await client.eval(`(() => {
      const list = document.querySelector('[role="tablist"][aria-label="Studio tools"]');
      const tabs = Array.from(list.querySelectorAll('button[role="tab"]'));
      const listRect = list.getBoundingClientRect();
      return {
        count: tabs.length,
        overflows: list.scrollWidth > list.clientWidth + 1,
        allVisible: tabs.every(t => { const r = t.getBoundingClientRect(); return r.left >= listRect.left - 1 && r.right <= listRect.right + 1 && r.width > 20; }),
        iconsOnly: tabs.every(t => t.querySelector('span')?.className.includes('sr-only')),
      };
    })()`);
    assert.equal(narrowTabs.count, 5);
    assert.equal(narrowTabs.overflows, false);
    assert.equal(narrowTabs.allVisible, true);
    assert.equal(narrowTabs.iconsOnly, true);

    await client.send('Emulation.clearDeviceMetricsOverride');
    await new Promise((r) => setTimeout(r, 100));

    await client.eval(`(() => {
      const sel = document.querySelector('select[aria-label="Simulate color vision deficiency"]');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
      setter.call(sel, 'protanopia');
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    })()`);
    await new Promise((r) => setTimeout(r, 80));
    assert.equal(await client.eval(`document.body.innerText.includes('Simulating Protanopia')`), true);

    await client.eval(`document.querySelector('[role="dialog"] button[role="tab"][aria-label="Interactive UI Mockup"]').click()`);
    await new Promise((r) => setTimeout(r, 80));
    assert.equal(await client.eval(`document.body.innerText.includes('Text / Ink')`), true);
    assert.equal(await client.eval(`document.body.innerText.includes('Copy Role CSS')`), true);

    await client.eval(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Analytics Dashboard').click()`);
    assert.equal(await client.eval(`document.body.innerText.includes('Quarterly Pigment Usage')`), true);
    await client.eval(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Editorial Article').click()`);
    assert.equal(await client.eval(`document.body.innerText.includes('On Seasonal Harmony')`), true);
    await client.eval(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Mobile App Card').click()`);
    assert.equal(await client.eval(`document.body.innerText.includes('Save Palette to Project')`), true);

    for (let i = 0; i < 15; i++) {
      await client.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab' });
    }
    const focusInsideDialog = await client.eval(`Boolean(document.querySelector('[role="dialog"]')?.contains(document.activeElement))`);
    assert.equal(focusInsideDialog, true);

    await client.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
    await new Promise((r) => setTimeout(r, 80));
    assert.equal(await client.eval(`document.getElementById('studio-modal-title')`), null);
    assert.equal(await client.eval(`document.body.style.overflow`), '');

    // 9b. Verify 2-color palette UI Mockup uses distinct Surface (Auto Tint) != Accent and Shuffle never collides
    await client.eval(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === '2-Color').click()`);
    await new Promise((r) => setTimeout(r, 100));
    await client.eval(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Inspect').click()`);
    await waitForText('UI Mockup');
    await client.eval(`document.querySelector('[role="dialog"] button[role="tab"][aria-label="Interactive UI Mockup"]').click()`);
    await new Promise((r) => setTimeout(r, 80));
    const twoColorCheck = await client.eval(`(() => {
      const selects = Array.from(document.querySelectorAll('[role="dialog"] select'));
      const bgVal = selects[1]?.value;
      const surfaceVal = selects[2]?.value;
      const accentVal = selects[3]?.value;
      const cta = Array.from(document.querySelectorAll('[role="dialog"] button')).find(b => b.textContent.includes('Apply Color System'));
      const sec = Array.from(document.querySelectorAll('[role="dialog"] button')).find(b => b.textContent.includes('View Palette Specs'));
      return {
        bgVal,
        surfaceVal,
        accentVal,
        ctaBg: cta ? getComputedStyle(cta).backgroundColor : '',
        secBg: sec ? getComputedStyle(sec).backgroundColor : '',
      };
    })()`);
    assert.equal(twoColorCheck.surfaceVal, '-1');
    assert.notEqual(twoColorCheck.bgVal, twoColorCheck.accentVal);
    assert.notEqual(twoColorCheck.ctaBg, twoColorCheck.secBg);

    for (let s = 0; s < 4; s++) {
      await client.eval(`Array.from(document.querySelectorAll('[role="dialog"] button')).find(b => b.textContent.includes('Shuffle Roles')).click()`);
      await new Promise((r) => setTimeout(r, 360));
      const diag = await client.eval(`(() => {
        const selects = Array.from(document.querySelectorAll('[role="dialog"] select'));
        const cta = Array.from(document.querySelectorAll('[role="dialog"] button')).find(b => b.textContent.includes('Apply Color System'));
        const hero = cta?.closest('.rounded-2xl');
        const sec = Array.from(document.querySelectorAll('[role="dialog"] button')).find(b => b.textContent.includes('View Palette Specs'));
        return {
          sels: selects.map(x => x.value),
          ctaBg: cta ? getComputedStyle(cta).backgroundColor : null,
          heroBg: hero ? getComputedStyle(hero).backgroundColor : null,
          secBg: sec ? getComputedStyle(sec).backgroundColor : null,
        };
      })()`);
      assert.ok(diag.ctaBg && diag.heroBg && diag.secBg && diag.ctaBg !== diag.heroBg && diag.ctaBg !== diag.secBg, '2-color shuffle collision at ' + s + ': ' + JSON.stringify(diag));
    }
    await client.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
    await new Promise((r) => setTimeout(r, 80));
    await client.eval(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Reset').click()`);
    await new Promise((r) => setTimeout(r, 80));

    // 10. Switch to Master Colors, test Kanji (160) filter, 2D Spectrum Map, Show #IDs, and URL sync
    await client.eval(`Array.from(document.querySelectorAll('button[role="tab"]')).find(b => b.textContent.includes('Master Colors')).click()`);
    await new Promise((r) => setTimeout(r, 100));
    await client.eval(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Kanji (160)')).click()`);
    await new Promise((r) => setTimeout(r, 80));
    assert.equal(await client.eval(`document.body.innerText.includes('(Showing 160)')`), true);

    await client.eval(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Spectrum').click()`);
    assert.equal(await waitForText('2D Hue × Lightness Spectrum (160 Swatches)'), true);

    const mapUrl = await client.eval(`window.location.search`);
    assert.ok(mapUrl.includes('view=colors') && mapUrl.includes('layout=map') && mapUrl.includes('kanji=1'), `Expected map/kanji params in ${mapUrl}`);

    await client.eval(`Array.from(document.querySelectorAll('label')).find(l => l.textContent.includes('Show #IDs'))?.querySelector('input')?.click()`);
    await new Promise((r) => setTimeout(r, 60));
    const node5Label = await client.eval(`document.querySelector('button[aria-label^="#5 "]')?.textContent?.trim()`);
    assert.equal(node5Label, '5');

    // 10b. Navigate to the separate Color Wheel page (?view=wheel) — verify geometric chords & Harmony Finder
    await client.eval(`Array.from(document.querySelectorAll('header button[role="tab"]')).find(b => b.textContent.includes('Color Wheel')).click()`);
    assert.equal(await waitForText('360° Color Wheel Chooser (160 / 171 Pigments)'), true);
    const wheelPageUrl = await client.eval(`window.location.search`);
    assert.ok(wheelPageUrl.includes('view=wheel'), `Expected view=wheel in ${wheelPageUrl}`);
    assert.equal(await client.eval(`document.querySelector('section[aria-label="Menswear Garment Color Studio"]')`), null);

    await client.eval(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Kanji (160)')).click()`);
    assert.equal(await waitForText('360° Color Wheel Chooser (171 / 171 Pigments)'), true);
    await client.eval(`document.querySelector('section[aria-label="Sanzo Wada 360° Color Wheel Page"] button[aria-label^="#29 "]')?.click()`);
    assert.equal(await waitForText('Carmine Red'), true);
    assert.equal(await client.eval(`Boolean(document.querySelector('[data-testid="wheel-chord-shape"]'))`), true);

    await client.eval(`Array.from(document.querySelectorAll('[aria-label="Geometric harmony rule"] button')).find(b => b.textContent.trim() === 'Triadic')?.click()`);
    assert.equal(await waitForText('Triadic Archival Matches:'), true);
    assert.equal(await client.eval(`document.querySelectorAll('[data-testid="wheel-harmony-spoke"]').length >= 2`), true);

    // 10b-cont. Test continuity: Color Sheet -> Combination -> Step to Next Combo for that Color -> Back to Color Sheet
    await client.eval(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Open Pigment Sheet'))?.click()`);
    assert.equal(await waitForText('Harmony Combinations:'), true);
    assert.equal(await client.eval(`document.getElementById('color-modal-title')?.textContent?.trim()`), 'Carmine Red');

    await client.eval(`document.querySelector('[role="dialog"] .grid button')?.click()`);
    assert.equal(await waitForText('Back to #29 Carmine Red'), true);
    assert.equal(await waitForText('1 / '), true);
    const firstComboTitle = await client.eval(`document.getElementById('studio-modal-title')?.textContent`);

    await client.eval(`document.querySelector('[role="dialog"] button[aria-label="Next combination (Right Arrow)"]')?.click()`);
    assert.equal(await waitForText('2 / '), true);
    assert.equal(await waitForText('for #29 Carmine Red'), true);
    const secondComboTitle = await client.eval(`document.getElementById('studio-modal-title')?.textContent`);
    assert.notEqual(firstComboTitle, secondComboTitle);
    assert.equal(await client.eval(`document.querySelector('[role="dialog"]')?.innerText.includes('Carmine Red')`), true);

    await client.eval(`document.querySelector('[role="dialog"] button[aria-label="Back to #29 Carmine Red"]')?.click()`);
    assert.equal(await waitForText('Harmony Combinations:'), true);
    assert.equal(await client.eval(`document.getElementById('color-modal-title')?.textContent?.trim()`), 'Carmine Red');
    await client.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
    await new Promise((r) => setTimeout(r, 80));
    assert.equal(await client.eval(`document.getElementById('color-modal-title')`), null);

    // 10c. Navigate to the separate Menswear page (?view=menswear) — verify personalization, patterns, URL sync & exports
    await client.eval(`Array.from(document.querySelectorAll('header button[role="tab"]')).find(b => b.textContent.includes('Menswear')).click()`);
    assert.equal(await waitForText('Menswear Garment Color Chooser'), true);
    assert.equal(await waitForText('All Wada Swatches (171)'), true);
    const menswearUrl = await client.eval(`window.location.search`);
    assert.ok(menswearUrl.includes('view=menswear'), `Expected view=menswear in ${menswearUrl}`);
    assert.equal(await client.eval(`document.querySelector('section[aria-label="Sanzo Wada 360° Color Wheel Page"]')`), null);
    assert.equal(await client.eval(`document.querySelector('[aria-label*="360 degree Wada Color Wheel"]')`), null);

    await client.eval(`Array.from(document.querySelectorAll('section[aria-label="Menswear Garment Color Studio"] button')).find(b => b.textContent.includes('Tailored Trousers'))?.click()`);
    await new Promise((r) => setTimeout(r, 50));
    await client.eval(`Array.from(document.querySelectorAll('section[aria-label="Menswear Garment Color Studio"] button')).find(b => b.textContent.includes('#14') && b.textContent.includes('Raw Sienna'))?.click()`);
    assert.equal(await waitForText('Editing') && await waitForText('#14 Raw Sienna'), true);

    // Switch skin complexion, studio lighting, outerwear texture & two-tone pinstripe pattern
    await client.eval(`document.querySelector('button[aria-label="Skin tone Warm Olive"]')?.click()`);
    await client.eval(`document.querySelector('button[aria-label="Lighting Evening Gallery"]')?.click()`);
    await client.eval(`(() => {
      const sel = document.querySelector('select[aria-label="Material texture for outerwear"]');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
      setter.call(sel, 'corduroy');
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    })()`);
    await client.eval(`(() => {
      const sel = document.querySelector('select[aria-label="Pattern weave for outerwear"]');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
      setter.call(sel, 'pinstripe');
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    })()`);
    await new Promise((r) => setTimeout(r, 80));
    const hasTextureAndPatternDefs = await client.eval(`document.querySelectorAll('svg[aria-label*="Menswear lookbook"] defs pattern').length >= 6`);
    assert.equal(hasTextureAndPatternDefs, true);
    const enrichedMenswearUrl = await client.eval(`window.location.search`);
    assert.ok(
      enrichedMenswearUrl.includes('mskin=olive') &&
        enrichedMenswearUrl.includes('mlight=evening-gallery') &&
        enrichedMenswearUrl.includes('mpats=pinstripe'),
      `Expected enriched menswear URL params in ${enrichedMenswearUrl}`
    );

    // Trigger SVG Lookbook export & Pin Menswear palette into Compare (3/3) alongside Vol. 1 palettes
    await client.eval(`document.querySelector('button[aria-label="Export menswear SVG lookbook"]')?.click()`);
    await client.eval(`document.querySelector('button[aria-label="Pin menswear palette to compare"]')?.click()`);
    assert.equal(await waitForText('Compare (3/3)'), true);
    await assertMobileFits360('menswear + pinstripe + compare tray');
    await client.eval(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Compare (3/3)')).click()`);
    assert.equal(await waitForText('Palette Comparison (3 / 3)'), true);
    assert.equal(await waitForText('Custom Mix •'), true);
    await client.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
    await new Promise((r) => setTimeout(r, 80));

    // Switch through diverse male wardrobe silhouettes (Streetwear hoodie/bomber/denim/sneakers, Summer Shorts, Haori)
    await client.eval(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Streetwear Look').click()`);
    assert.equal(await waitForText('Pullover Hoodie'), true);
    assert.equal(await waitForText('Low-Top Sneakers'), true);
    await client.eval(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Summer & Shorts').click()`);
    assert.equal(await waitForText('Tailored Shorts'), true);
    await client.eval(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Haori & Kimono').click()`);
    assert.equal(await waitForText('Haori Mantle (羽織)'), true);

    // Save custom menswear outfit look
    await client.eval(`(() => {
      const input = document.querySelector('input[aria-label="Saved menswear outfit name"]');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, 'Atelier Autumn');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    await client.eval(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Save Look')).click()`);
    assert.equal(await waitForText('Atelier Autumn'), true);
    const savedLooksRaw = await client.eval(`localStorage.getItem('sanzo-wada-menswear-outfits-v1')`);
    assert.ok(savedLooksRaw && savedLooksRaw.includes('Atelier Autumn'));

    const errorsBeforeDeepLink = await client.eval(`window.__errors`);
    assert.deepEqual(errorsBeforeDeepLink, [], `Unexpected page errors: ${JSON.stringify(errorsBeforeDeepLink)}`);

    // 11. Navigate to shareable custom mix URL (?mix=1,74,134) and verify Custom Studio opens with Compare pin & Menswear tab
    await client.send('Page.navigate', { url: `${BASE_URL}?mix=1,74,134` });
    assert.equal(await waitForText('Custom Studio Palette', 8000), true);
    assert.equal(await waitForText('3-Color Custom Mix', 3000), true);
    assert.equal(await client.eval(`document.querySelector('[role="dialog"]')?.getAttribute('aria-modal')`), 'true');
    assert.equal(await client.eval(`Boolean(document.querySelector('[role="dialog"] button[aria-label*="to compare"]'))`), true);

    await client.eval(`document.querySelector('[role="dialog"] button[role="tab"][aria-label="Menswear Look"]').click()`);
    assert.equal(await waitForText('Palette Mapped to Male Garments'), true);

    console.log('CDP_E2E_ALL_PASSED');
  } finally {
    client?.close();
    if (browser && browser.exitCode === null) browser.kill('SIGKILL');
    if (preview && preview.exitCode === null) preview.kill('SIGKILL');
    try {
      fs.rmSync(tmpProfile, { recursive: true, force: true });
    } catch {
      // Browser may hold lock briefly on Windows
    }
  }
}

run().catch((err) => {
  console.error('CDP_E2E_FAILED:', err);
  process.exit(1);
});
