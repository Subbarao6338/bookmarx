const CACHE_NAME = 'epic-toolbox-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/src/main.jsx',
  '/manifest.json'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        ASSETS.map((asset) =>
          cache.add(asset).catch((err) => {
            console.warn(`Failed to cache asset: ${asset}`, err);
          })
        )
      );
    })
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Intercept API routes for HTMX integration
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(handleApiRequest(e.request, url));
    return;
  }

  e.respondWith(caches.match(e.request).then((res) => res || fetch(e.request)));
});

self.addEventListener('activate', (e) => {
  self.clients.claim();
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))));
});

// API Request Router
async function handleApiRequest(request, url) {
  if (url.pathname === '/api/manual') {
    const section = url.searchParams.get('section') || 'overview';
    return handleManualRequest(section);
  } else if (url.pathname === '/api/stats') {
    try {
      let links = [];
      if (request.method === 'POST') {
        const formData = await request.formData();
        const linksJson = formData.get('links') || '[]';
        links = JSON.parse(linksJson);
      }
      return handleStatsRequest(links);
    } catch (e) {
      console.error("Error processing API stats request:", e);
      return new Response(
        `<div class="card" style="border: 1px solid var(--danger); background: rgba(255, 0, 0, 0.05); padding: 1.5rem; text-align: center;">
          <span class="material-icons" style="color: var(--danger); font-size: 2.5rem; margin-bottom: 0.5rem;">error_outline</span>
          <h3 style="margin-top: 0; color: var(--danger);">Failed to load stats</h3>
          <p class="smallest opacity-8">Error parsing your bookmark data. Ensure localStorage is not corrupted or contains too many bookmarks.</p>
        </div>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }
  } else if (url.pathname === '/api/diagnostics') {
    if (request.method === 'POST') {
      try {
        const formData = await request.formData();
        const browser = formData.get('browser') || 'Unknown';
        const connectionSpeed = formData.get('connectionSpeed') || 'Unknown';
        const issueType = formData.get('issueType') || 'None';
        const description = formData.get('description') || '';
        return handleDiagnosticsResponse({ browser, connectionSpeed, issueType, description });
      } catch (e) {
        console.error("Error processing API diagnostics request:", e);
        return new Response(
          `<div class="card" style="border: 1px solid var(--danger); background: rgba(255, 0, 0, 0.05); padding: 1rem; text-align: center;">
            <p class="smallest">Error running system diagnostics.</p>
          </div>`,
          { headers: { 'Content-Type': 'text/html' } }
        );
      }
    }
    return new Response("Method Not Allowed", { status: 405 });
  }

  return new Response("API Endpoint Not Found", { status: 404 });
}

// User Manual HTML Responses
function handleManualRequest(section) {
  let content = '';

  const getSubNav = (activeSec) => `
    <div class="pill-group" style="justify-content: center; gap: 10px; margin-bottom: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem; width: 100%;">
      <button class="pill ${activeSec === 'overview' ? 'active' : ''}"
              hx-get="/api/manual?section=overview"
              hx-target="#manual-stats-content"
              hx-swap="innerHTML">
        <span class="material-icons mr-10" style="font-size: 1.1rem">explore</span> Overview
      </button>
      <button class="pill ${activeSec === 'usage' ? 'active' : ''}"
              hx-get="/api/manual?section=usage"
              hx-target="#manual-stats-content"
              hx-swap="innerHTML">
        <span class="material-icons mr-10" style="font-size: 1.1rem">build</span> Using the App
      </button>
      <button class="pill ${activeSec === 'faq' ? 'active' : ''}"
              hx-get="/api/manual?section=faq"
              hx-target="#manual-stats-content"
              hx-swap="innerHTML">
        <span class="material-icons mr-10" style="font-size: 1.1rem">help_outline</span> FAQ
      </button>
    </div>
  `;

  if (section === 'overview') {
    content = `
      ${getSubNav('overview')}
      <div class="manual-section fade-in" style="text-align: left;">
        <div class="glass-card" style="padding: 2rem; border-radius: var(--radius-lg); margin-bottom: 1.5rem; border: 1px solid var(--border);">
          <h3 style="margin-top: 0; display: flex; align-items: center; gap: 8px;">
            <span class="material-icons" style="color: var(--primary);">bookmark</span>
            Welcome to NECS Bookmarks
          </h3>
          <p style="line-height: 1.6; opacity: 0.9;">
            NECS Bookmarks is your professional, unified link and productivity dashboard.
            All of your links, preferences, and workspace configuration are handled locally on your device,
            guaranteeing perfect privacy and blazing-fast response times.
          </p>
        </div>

        <h4 style="margin: 1.5rem 0 1rem 0; opacity: 0.8; font-size: 1.1rem; text-transform: uppercase; letter-spacing: 0.05em;">Key Architecture & Principles</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;">
          <div class="card" style="padding: 1.25rem; border: 1px solid var(--border); background: var(--bg-surface); border-radius: var(--radius-md);">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 0.5rem;">
              <span class="material-icons" style="color: var(--primary);">security</span>
              <strong style="font-size: 1rem;">Privacy-First</strong>
            </div>
            <p class="smallest opacity-7" style="line-height: 1.5; margin: 0;">Your data never leaves your device. No analytics scripts tracking your custom bookmarks, and no cloud-based profile sharing. All operations stay safe in secure Local Storage.</p>
          </div>

          <div class="card" style="padding: 1.25rem; border: 1px solid var(--border); background: var(--bg-surface); border-radius: var(--radius-md);">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 0.5rem;">
              <span class="material-icons" style="color: var(--primary);">offline_bolt</span>
              <strong style="font-size: 1rem;">Offline Ready</strong>
            </div>
            <p class="smallest opacity-7" style="line-height: 1.5; margin: 0;">Full Progressive Web App (PWA) specifications. Assets are cached locally via this Service Worker, letting you open and access your stored URLs even in high-isolation or offline environments.</p>
          </div>

          <div class="card" style="padding: 1.25rem; border: 1px solid var(--border); background: var(--bg-surface); border-radius: var(--radius-md);">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 0.5rem;">
              <span class="material-icons" style="color: var(--primary);">flash_on</span>
              <strong style="font-size: 1rem;">Lightning Speeds</strong>
            </div>
            <p class="smallest opacity-7" style="line-height: 1.5; margin: 0;">Vite-powered modular bundling and optimized React render cycles ensure immediate startups and real-time keyboard shortcut integrations.</p>
          </div>
        </div>
      </div>
    `;
  } else if (section === 'usage') {
    content = `
      ${getSubNav('usage')}
      <div class="manual-section fade-in" style="text-align: left;">
        <div class="glass-card" style="padding: 2rem; border-radius: var(--radius-lg); margin-bottom: 1.5rem; border: 1px solid var(--border);">
          <h3 style="margin-top: 0; display: flex; align-items: center; gap: 8px;">
            <span class="material-icons" style="color: var(--primary);">settings_accessibility</span>
            How to Use the App
          </h3>
          <p style="line-height: 1.6; opacity: 0.9;">
            Unlock the full potential of NECS Bookmarks with keyboard navigation, dynamic profile configurations, and long-press contextual menus.
          </p>
        </div>

        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          <div style="border-left: 3px solid var(--primary); padding-left: 1rem;">
            <h4 style="margin: 0 0 0.5rem 0;">1. Organizing and Categorizing</h4>
            <p class="smallest opacity-8" style="line-height: 1.5; margin: 0;">
              Bookmarks are grouped dynamically by categories. Use the navigation panel beneath the page headers to quickly filter bookmarks.
              You can easily pin your most frequently accessed links. Pinned links are elevated to a special global category shown at the top of your dashboard.
            </p>
          </div>

          <div style="border-left: 3px solid var(--primary); padding-left: 1rem;">
            <h4 style="margin: 0 0 0.5rem 0;">2. Interactive Actions Modal</h4>
            <p class="smallest opacity-8" style="line-height: 1.5; margin: 0;">
              Instead of cluttering the bookmark cards with standard buttons, we've unified actions under an **Interactive Actions Modal**.
              Just **long-press (on mobile)** or **right-click/click settings (on desktop)** on any bookmark card to bring up options to edit, delete, share, or open alternative profile URLs instantly.
            </p>
          </div>

          <div style="border-left: 3px solid var(--primary); padding-left: 1rem;">
            <h4 style="margin: 0 0 0.5rem 0;">3. Smart Search Prefix Filter</h4>
            <p class="smallest opacity-8" style="line-height: 1.5; margin: 0;">
              Our search bar features real-time search across title, URL, categories, and alias profiles.
              Use the special query prefix <code>cat:</code> to immediately search inside a specific category (e.g., <code>cat:Productivity</code> to search only productivity links).
            </p>
          </div>

          <div style="border-left: 3px solid var(--primary); padding-left: 1rem;">
            <h4 style="margin: 0 0 0.5rem 0;">4. Keyboard Shortcuts</h4>
            <ul class="smallest opacity-8" style="padding-left: 1.25rem; margin: 0; line-height: 1.6;">
              <li>Press <kbd style="background: var(--border); padding: 2px 6px; border-radius: 4px;">/</kbd> anywhere outside inputs to quickly focus the Search bar.</li>
              <li>Press <kbd style="background: var(--border); padding: 2px 6px; border-radius: 4px;">Alt + 1</kbd> to return to the principal Bookmarks View.</li>
              <li>Press <kbd style="background: var(--border); padding: 2px 6px; border-radius: 4px;">Alt + 4</kbd> to open the main Settings Modal.</li>
              <li>Press <kbd style="background: var(--border); padding: 2px 6px; border-radius: 4px;">Escape</kbd> to close any open modal or search overlays instantly.</li>
            </ul>
          </div>
        </div>

        <!-- Alpine.js Onboarding checklist -->
        <div class="card" x-data="{
          checklist: [
            { id: 'search', text: 'Used Search bar / Shortcut (/)', done: false },
            { id: 'pin', text: 'Pinned a bookmark', done: false },
            { id: 'pb', text: 'Configured PocketBase Sync', done: false },
            { id: 'theme', text: 'Changed Accent Color or Theme', done: false }
          ],
          toggle(id) {
            const item = this.checklist.find(i => i.id === id);
            if (item) item.done = !item.done;
          }
        }" style="padding: 1.5rem; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--bg-surface); margin-top: 1.5rem;">
          <h4 style="margin: 0 0 1rem 0; display: flex; align-items: center; gap: 8px;">
            <span class="material-icons" style="color: var(--primary);">checklist</span>
            Onboarding Interactive Checklist (Powered by Alpine.js)
          </h4>
          <p class="smallest opacity-7" style="margin-bottom: 1rem;">Explore the codebase and try checking off these key dashboard actions:</p>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <template x-for="item in checklist" :key="item.id">
              <div @click="toggle(item.id)" style="display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 6px 10px; border-radius: var(--radius-sm); background: var(--primary-glow); border: 1px solid var(--border);">
                <span class="material-icons" style="font-size: 1.2rem; color: var(--primary);" x-text="item.done ? 'check_box' : 'check_box_outline_blank'"></span>
                <span class="smallest" :style="item.done ? 'text-decoration: line-through; opacity: 0.6;' : ''" x-text="item.text"></span>
              </div>
            </template>
          </div>
        </div>

      </div>
    `;
  } else if (section === 'faq') {
    content = `
      ${getSubNav('faq')}
      <div class="manual-section fade-in" style="text-align: left;">
        <div class="glass-card" style="padding: 2rem; border-radius: var(--radius-lg); margin-bottom: 1.5rem; border: 1px solid var(--border);">
          <h3 style="margin-top: 0; display: flex; align-items: center; gap: 8px;">
            <span class="material-icons" style="color: var(--primary);">question_answer</span>
            Frequently Asked Questions
          </h3>
          <p style="line-height: 1.6; opacity: 0.9;">
            Find quick answers to common technical and functional questions about the dashboard. Click each card to expand!
          </p>
        </div>

        <div style="display: flex; flex-direction: column; gap: 1.25rem;">

          <!-- Accordion 1 with Alpine.js -->
          <div class="card" x-data="{ open: false }" style="padding: 1.25rem; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--bg-surface); cursor: pointer;" @click="open = !open">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <strong style="font-size: 1rem; margin: 0;">Q: Where is my data saved and is it secure?</strong>
              <span class="material-icons" style="font-size: 1.2rem; transition: transform 0.2s;" :style="open ? 'transform: rotate(180deg)' : ''">expand_more</span>
            </div>
            <div x-show="open" style="margin-top: 0.75rem; border-top: 1px solid var(--border); padding-top: 0.75rem;" @click.stop>
              <p class="smallest opacity-8" style="line-height: 1.5; margin: 0;">
                All data is saved completely in your browser's Secure Local Storage. There are no server-side databases or third-party cloud synchronizations unless you explicitly connect a PocketBase instance.
                This means your link catalog, profile list, and personalized UI themes are completely confidential and owned entirely by you.
              </p>
            </div>
          </div>

          <!-- Accordion 2 with Alpine.js -->
          <div class="card" x-data="{ open: false }" style="padding: 1.25rem; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--bg-surface); cursor: pointer;" @click="open = !open">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <strong style="font-size: 1rem; margin: 0;">Q: Can I backup, move, or share my bookmark collection?</strong>
              <span class="material-icons" style="font-size: 1.2rem; transition: transform 0.2s;" :style="open ? 'transform: rotate(180deg)' : ''">expand_more</span>
            </div>
            <div x-show="open" style="margin-top: 0.75rem; border-top: 1px solid var(--border); padding-top: 0.75rem;" @click.stop>
              <p class="smallest opacity-8" style="line-height: 1.5; margin: 0;">
                Absolutely! Open <strong>Settings</strong> and navigate to the <strong>Maintenance & Data</strong> section.
                Click <strong>Export Data</strong> to download a complete, structured JSON file backup.
                You can easily import this file on any other device or browser to restore your entire workspace instantly.
              </p>
            </div>
          </div>

          <!-- Accordion 3 with Alpine.js -->
          <div class="card" x-data="{ open: false }" style="padding: 1.25rem; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--bg-surface); cursor: pointer;" @click="open = !open">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <strong style="font-size: 1rem; margin: 0;">Q: What is the purpose of "Multiple URLs" on bookmarks?</strong>
              <span class="material-icons" style="font-size: 1.2rem; transition: transform 0.2s;" :style="open ? 'transform: rotate(180deg)' : ''">expand_more</span>
            </div>
            <div x-show="open" style="margin-top: 0.75rem; border-top: 1px solid var(--border); padding-top: 0.75rem;" @click.stop>
              <p class="smallest opacity-8" style="line-height: 1.5; margin: 0;">
                Many platforms have multiple portals or mirrors (e.g. Proton Mail, Notion, Gmail).
                Our schema supports defining an array of fallback URLs (<code>urls</code>) for a single bookmark card.
                Long-pressing the card allows you to view and select which precise URL you would like to open,
                keeping your grid neat and clean while supporting highly redundant workflows.
              </p>
            </div>
          </div>

        </div>
      </div>
    `;
  }

  return new Response(content, { headers: { 'Content-Type': 'text/html' } });
}

// Live Storage Statistics HTML Response
function handleStatsRequest(links) {
  const total = links.length;
  const pinned = links.filter(l => l.is_pinned).length;

  // Category counts
  const categoriesMap = {};
  links.forEach(l => {
    const cat = l.category || 'Uncategorized';
    categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;
  });
  const categoriesCount = Object.keys(categoriesMap).length;

  // Domains counting
  const domainMap = {};
  let secureProtocols = 0;
  links.forEach(l => {
    try {
      const url = new URL(l.url);
      domainMap[url.hostname] = (domainMap[url.hostname] || 0) + 1;
      if (url.protocol === 'https:') secureProtocols++;
    } catch(e) {}
  });

  const domainsSorted = Object.entries(domainMap).sort((a,b) => b[1] - a[1]);
  const topDomain = domainsSorted[0]?.[0] || 'N/A';
  const topDomainCount = domainsSorted[0]?.[1] || 0;

  // Estimated size in bytes
  const serializedLength = JSON.stringify(links).length;
  const storageKb = (serializedLength / 1024).toFixed(2);
  const percentOfLimit = ((serializedLength / (5 * 1024 * 1024)) * 100).toFixed(4); // 5MB standard limit

  // Categories list HTML with progress bar
  let categoriesListHtml = '';
  Object.entries(categoriesMap)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      const percentage = total > 0 ? ((count / total) * 100).toFixed(0) : 0;
      categoriesListHtml += `
        <div style="margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 4px;">
            <span style="font-weight: 700; display: flex; align-items: center; gap: 6px;">
              <span class="material-icons" style="font-size: 1rem; color: var(--primary);">folder_open</span>
              ${cat}
            </span>
            <span class="opacity-8">${count} link${count > 1 ? 's' : ''} (${percentage}%)</span>
          </div>
          <div style="width: 100%; height: 6px; background: var(--border); border-radius: 3px; overflow: hidden;">
            <div style="width: ${percentage}%; height: 100%; background: var(--primary); border-radius: 3px;"></div>
          </div>
        </div>
      `;
    });

  // Calculate Health Check Grade
  let score = 100;
  let deductMsgs = [];
  if (total === 0) {
    score = 0;
    deductMsgs.push("No bookmarks loaded");
  } else {
    // Protocol deduction
    const secureRatio = secureProtocols / total;
    if (secureRatio < 0.9) {
      const deduction = Math.round((1 - secureRatio) * 30);
      score -= deduction;
      deductMsgs.push(`${Math.round((1-secureRatio)*100)}% non-HTTPS secure links (-${deduction}pts)`);
    }

    // Unpinned links deduction (good practice to pin some, but over-pinning is bad too)
    if (pinned === 0) {
      score -= 10;
      deductMsgs.push("Zero pinned links for quick access (-10pts)");
    } else if (pinned > total * 0.5) {
      score -= 15;
      deductMsgs.push("More than 50% of your links are pinned (-15pts, reduces effectiveness)");
    }

    // Uncategorized deduction
    const uncategorizedCount = categoriesMap['Uncategorized'] || 0;
    if (uncategorizedCount > 0) {
      const deduction = Math.round((uncategorizedCount / total) * 20);
      score -= deduction;
      deductMsgs.push(`${uncategorizedCount} links in 'Uncategorized' (-${deduction}pts)`);
    }
  }

  score = Math.max(0, Math.min(100, score));
  let grade = 'F';
  let gradeColor = 'var(--danger)';
  if (score >= 95) { grade = 'A+'; gradeColor = '#4CAF50'; }
  else if (score >= 90) { grade = 'A'; gradeColor = '#4CAF50'; }
  else if (score >= 80) { grade = 'B'; gradeColor = 'var(--primary)'; }
  else if (score >= 70) { grade = 'C'; gradeColor = '#FF9800'; }
  else if (score >= 60) { grade = 'D'; gradeColor = '#FF9800'; }

  const subNav = `
    <div class="pill-group" style="justify-content: center; gap: 10px; margin-bottom: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem; width: 100%;">
      <button class="pill"
              hx-get="/api/manual?section=overview"
              hx-target="#manual-stats-content"
              hx-swap="innerHTML">
        <span class="material-icons mr-10" style="font-size: 1.1rem">explore</span> Overview
      </button>
      <button class="pill active"
              hx-post="/api/stats"
              hx-vals="js:{links: localStorage.getItem('hub_links_necs') || '[]'}"
              hx-target="#manual-stats-content"
              hx-swap="innerHTML">
        <span class="material-icons mr-10" style="font-size: 1.1rem">bar_chart</span> Storage Stats
      </button>
    </div>
  `;

  // Dynamic suggestion list with Alpine.js filtering/dismiss behavior
  const suggestionsArrayJson = JSON.stringify(deductMsgs.map((m, idx) => ({ id: idx, text: m, hidden: false })));

  const html = `
    ${subNav}
    <div class="stats-section fade-in" style="text-align: left;">
      <div class="glass-card" style="padding: 2rem; border-radius: var(--radius-lg); margin-bottom: 1.5rem; border: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h3 style="margin-top: 0; display: flex; align-items: center; gap: 8px;">
            <span class="material-icons" style="color: var(--primary);">equalizer</span>
            Live Local Storage Metrics
          </h3>
          <p style="line-height: 1.5; margin: 0; opacity: 0.9; max-width: 450px;" class="smallest">
            Real-time parsing and analysis of the active browser database. Custom modifications to bookmarks automatically reflect in these statistics.
          </p>
        </div>
        <div style="background: var(--primary-glow); padding: 0.75rem 1.5rem; border-radius: var(--radius-md); border: 1px solid var(--border); text-align: center;">
          <div style="font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: var(--primary);">Browser Limit Used</div>
          <div style="font-size: 1.5rem; font-weight: 900; color: var(--primary);">${percentOfLimit}%</div>
        </div>
      </div>

      <!-- Quick Metrics Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
        <div class="card" style="padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius-md); text-align: center; background: var(--bg-surface);">
          <span class="material-icons" style="color: var(--primary); font-size: 1.8rem; margin-bottom: 4px;">bookmarks</span>
          <div style="font-size: 0.75rem; text-transform: uppercase; opacity: 0.6; font-weight: 700;">Total Links</div>
          <div style="font-size: 1.75rem; font-weight: 800; margin-top: 2px;">${total}</div>
        </div>

        <div class="card" style="padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius-md); text-align: center; background: var(--bg-surface);">
          <span class="material-icons" style="color: var(--primary); font-size: 1.8rem; margin-bottom: 4px;">push_pin</span>
          <div style="font-size: 0.75rem; text-transform: uppercase; opacity: 0.6; font-weight: 700;">Pinned Links</div>
          <div style="font-size: 1.75rem; font-weight: 800; margin-top: 2px;">${pinned}</div>
        </div>

        <div class="card" style="padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius-md); text-align: center; background: var(--bg-surface);">
          <span class="material-icons" style="color: var(--primary); font-size: 1.8rem; margin-bottom: 4px;">folder</span>
          <div style="font-size: 0.75rem; text-transform: uppercase; opacity: 0.6; font-weight: 700;">Categories</div>
          <div style="font-size: 1.75rem; font-weight: 800; margin-top: 2px;">${categoriesCount}</div>
        </div>

        <div class="card" style="padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius-md); text-align: center; background: var(--bg-surface);">
          <span class="material-icons" style="color: var(--primary); font-size: 1.8rem; margin-bottom: 4px;">sd_card</span>
          <div style="font-size: 0.75rem; text-transform: uppercase; opacity: 0.6; font-weight: 700;">Database Size</div>
          <div style="font-size: 1.75rem; font-weight: 800; margin-top: 2px;">${storageKb} <span style="font-size: 1rem;">KB</span></div>
        </div>
      </div>

      <!-- Detail Analysis Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;">

        <!-- Category Breakdown -->
        <div class="card" style="padding: 1.5rem; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--bg-surface);">
          <h4 style="margin-top: 0; margin-bottom: 1rem; font-size: 1.1rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; display: flex; align-items: center; gap: 8px;">
            <span class="material-icons" style="color: var(--primary);">pie_chart</span> Category Breakdown
          </h4>
          ${total > 0 ? categoriesListHtml : '<p class="smallest opacity-6">No bookmarks to group.</p>'}
        </div>

        <!-- Health and Integrity Analysis -->
        <div class="card" style="padding: 1.5rem; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--bg-surface);">
          <h4 style="margin-top: 0; margin-bottom: 1rem; font-size: 1.1rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; display: flex; align-items: center; gap: 8px;">
            <span class="material-icons" style="color: var(--primary);">health_and_safety</span> Health & Integrity
          </h4>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; padding: 0.75rem; background: var(--primary-glow); border-radius: var(--radius-md); border: 1px solid var(--border);">
            <div>
              <div style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; opacity: 0.8;">Dashboard Health Grade</div>
              <div class="smallest opacity-6" style="margin-top: 2px;">Calculated on protocol and pinning health</div>
            </div>
            <div style="font-size: 2rem; font-weight: 900; color: ${gradeColor};">${grade}</div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div class="flex-center" style="justify-content: space-between; font-size: 0.85rem;">
              <span>Secure HTTPs Protocols:</span>
              <strong style="color: #4CAF50;">${secureProtocols}/${total}</strong>
            </div>
            <div class="flex-center" style="justify-content: space-between; font-size: 0.85rem;">
              <span>Top Host Domain:</span>
              <strong style="font-family: monospace; font-size: 0.8rem; overflow: hidden; text-overflow: ellipsis; max-width: 150px; white-space: nowrap;" title="${topDomain}">${topDomain} (${topDomainCount}x)</strong>
            </div>
          </div>

          <!-- Interactive Alpine.js dynamic optimization suggestions checklist -->
          <div x-data='{
            suggestions: ${suggestionsArrayJson},
            dismiss(id) {
              const item = this.suggestions.find(i => i.id === id);
              if (item) item.hidden = true;
            },
            get visibleCount() {
              return this.suggestions.filter(i => !i.hidden).length;
            }
          }'>
            <div x-show="visibleCount > 0" style="margin-top: 1rem; border-top: 1px dashed var(--border); padding-top: 0.75rem;">
              <span style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; opacity: 0.5; display: block; margin-bottom: 6px;">Optimization Suggestions (Powered by Alpine.js):</span>
              <ul style="padding: 0; margin: 0; list-style: none;" class="smallest">
                <template x-for="s in suggestions" :key="s.id">
                  <li x-show="!s.hidden" style="margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between; gap: 10px; background: var(--primary-glow); padding: 4px 8px; border-radius: var(--radius-sm); border: 1px solid var(--border);">
                    <span x-text="s.text"></span>
                    <button @click="dismiss(s.id)" class="icon-btn" style="padding: 2px; min-width: auto; height: auto; border: none; background: transparent; cursor: pointer;" title="Dismiss suggestion">
                      <span class="material-icons" style="font-size: 1rem;">close</span>
                    </button>
                  </li>
                </template>
              </ul>
            </div>
            <div x-show="visibleCount === 0" style="margin-top: 1rem; color: #4CAF50; font-size: 0.8rem; display: flex; align-items: center; gap: 6px;">
              <span class="material-icons" style="font-size: 1.1rem;">check_circle</span> Perfect configuration or all suggestions completed!
            </div>
          </div>

        </div>
      </div>
    </div>
  `;

  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}

// Tailored Diagnostics Analysis Response (Powered by AlpineJS & HTMX post)
function handleDiagnosticsResponse({ browser, connectionSpeed, issueType, description }) {
  let healthScore = 100;
  let severity = "Optimal";
  let severityColor = "#4CAF50";

  const fixes = [];

  if (issueType === 'slow') {
    healthScore -= 30;
    severity = "Performance Issue";
    severityColor = "#FF9800";
    fixes.push("Disable heavy glassmorphism transitions in settings panel.");
    fixes.push("Try compact mode view to decrease rendering payload.");
    fixes.push("Ensure service worker cache is active (Reload page).");
  } else if (issueType === 'sync') {
    healthScore -= 40;
    severity = "Synchronicity Warning";
    severityColor = "var(--danger)";
    fixes.push("Verify PocketBase instance status URL in Settings > PocketBase Sync.");
    fixes.push("Check API Rules / collection permissions on your database.");
    fixes.push("Inspect browser network headers for CORS blockages.");
  } else if (issueType === 'ui') {
    healthScore -= 20;
    severity = "Display Warning";
    severityColor = "#FF9800";
    fixes.push("Toggle 'Enable Animations' to reset transition styles.");
    fixes.push("Change your browser theme mode (light/dark) or switch accent color.");
    fixes.push("Clear browser layout cache or reset settings to defaults.");
  } else {
    fixes.push("Your system is running optimal default bookmarks!");
    fixes.push("Perform a regular JSON backup of your current links.");
  }

  if (connectionSpeed === 'slow') {
    healthScore -= 15;
    fixes.push("Service Worker offline fallback is activated. PWA bookmarks will work offline!");
  }

  healthScore = Math.max(10, healthScore);

  const html = `
    <div class="card fade-in" style="padding: 1.5rem; border: 1px solid var(--border); background: var(--bg-surface); margin-top: 1.5rem; border-radius: var(--radius-md);">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; gap: 10px;">
        <h4 style="margin: 0; display: flex; align-items: center; gap: 8px;">
          <span class="material-icons" style="color: ${severityColor};">troubleshoot</span>
          Diagnostics Analysis Results
        </h4>
        <div style="display: flex; align-items: center; gap: 10px;">
          <span class="smallest font-bold uppercase" style="color: ${severityColor};">${severity}</span>
          <span class="badge" style="background: var(--primary-glow); border: 1px solid var(--border); color: var(--primary); font-weight: 800; padding: 4px 8px; border-radius: var(--radius-sm);">${healthScore}/100</span>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
        <div>
          <span class="smallest opacity-6 font-bold uppercase block">Environment Status</span>
          <div style="margin-top: 4px; font-size: 0.85rem;" class="smallest">
            <div>Browser: <strong>${browser}</strong></div>
            <div>Network: <strong>${connectionSpeed === 'slow' ? 'Slow / Offline (2G/3G)' : 'Fast / Broadband (4G/WiFi)'}</strong></div>
          </div>
        </div>
        <div>
          <span class="smallest opacity-6 font-bold uppercase block">Reported Category</span>
          <div style="margin-top: 4px; font-size: 0.85rem;" class="smallest">
            <div>Type: <strong>${issueType.toUpperCase()}</strong></div>
            <div>Desc: <em style="opacity: 0.8;">${description ? `"${description}"` : 'No custom description provided.'}</em></div>
          </div>
        </div>
      </div>

      <!-- Alpine Checklist for remedies -->
      <div x-data='{
        remedies: ${JSON.stringify(fixes.map((f, i) => ({ id: i, text: f, solved: false })))},
        get remaining() { return this.remedies.filter(r => !r.solved).length; }
      }' style="margin-top: 1rem; border-top: 1px dashed var(--border); padding-top: 1rem;">
        <span class="smallest font-bold uppercase" style="display: block; margin-bottom: 8px;">Recommended Fixes & Actions (Interactive):</span>

        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
          <template x-for="r in remedies" :key="r.id">
            <div @click="r.solved = !r.solved" style="display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 6px 10px; border-radius: var(--radius-sm); background: var(--primary-glow); border: 1px solid var(--border);">
              <span class="material-icons" style="font-size: 1.1rem; color: var(--primary);" x-text="r.solved ? 'check_box' : 'check_box_outline_blank'"></span>
              <span class="smallest" :style="r.solved ? 'text-decoration: line-through; opacity: 0.6;' : ''" x-text="r.text"></span>
            </div>
          </template>
        </div>

        <div x-show="remaining === 0" style="margin-top: 1rem; background: rgba(76, 175, 80, 0.15); border: 1px solid #4CAF50; color: #4CAF50; padding: 8px; border-radius: var(--radius-sm); text-align: center;" class="smallest font-bold">
          All fixes executed! Reload the application to apply modifications.
        </div>
      </div>
    </div>
  `;
  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}
