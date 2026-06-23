import { STATE, CAT_ICONS, COLLAPSE_KEY } from './state.js';
import { Utils } from './utils.js';
import { Core } from './core.js';

export const UI = {
  init() {
    this.renderCategoryChips();
    this.render();

    this.longPressTimer = null;
  },

  switchTab(tab) {
    STATE.activeTab = tab;
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`nav-${tab}`).classList.add('active');

    const hero = document.getElementById('hero-section');
    const chips = document.getElementById('category-chips');

    if (tab === 'bookmarks') {
      hero.style.display = 'block';
      chips.style.display = 'flex';
      document.getElementById('hero-title').textContent = 'Nex Bookmarks';
      document.getElementById('hero-subtitle').textContent = 'Access your favorite links and resources.';
    } else {
      hero.style.display = 'none';
      chips.style.display = 'none';
    }

    this.render();
  },

  handleLongPress(e, link) {
    e.preventDefault();
    this.openToolActions(link);
  },

  getIconHtml(cat, size = '18px') {
    const icon = CAT_ICONS[cat];
    if (!icon) return `<span class="material-icons" style="font-size:${size};vertical-align:middle;margin-right:8px;">folder</span>`;
    if (icon.length > 20 || icon.includes('.') || icon.includes('/')) {
      return `<img src="${icon}" style="width:${size};height:${size};vertical-align:middle;margin-right:8px;">`;
    }
    if (/\p{Emoji}/u.test(icon)) return `<span style="margin-right:8px;">${icon}</span>`;
    return `<span class="material-icons" style="font-size:${size};vertical-align:middle;margin-right:8px;">${icon}</span>`;
  },

  renderCategoryChips() {
    const nav = document.getElementById('category-chips');
    if (!nav) return;
    const stats = Core.getStats();
    const definedCats = Object.keys(CAT_ICONS).filter(c => c !== 'All');
    const existingCats = Object.keys(stats);
    const allCats = [...new Set([...definedCats, ...existingCats])].sort();

    nav.innerHTML = `
      <div class="chip ${STATE.activeCategory === 'All' ? 'active' : ''}" onclick="UI.setCategory('All')">
        ${this.getIconHtml('All')} <span>All</span> <span class="count">${STATE.links.length}</span>
      </div>
      <div class="chip ${STATE.activeCategory === 'Pinned' ? 'active' : ''}" onclick="UI.setCategory('Pinned')">
        <span class="material-icons" style="font-size:18px;margin-right:8px;">push_pin</span> <span>Pinned</span> <span class="count">${STATE.links.filter(l => l.pinned).length}</span>
      </div>
      ${allCats.map(cat => `
        <div class="chip ${STATE.activeCategory === cat ? 'active' : ''}" onclick="UI.setCategory('${cat}')">
          ${this.getIconHtml(cat)} <span>${cat}</span> <span class="count">${stats[cat] || 0}</span>
        </div>`).join('')}
    `;
  },

  setCategory(cat) {
    STATE.activeCategory = cat;
    this.renderCategoryChips();
    this.render();
  },

  toggleCategory(cat) {
    if (STATE.collapsedCategories.has(cat)) {
      STATE.collapsedCategories.delete(cat);
    } else {
      STATE.collapsedCategories.add(cat);
    }
    this.saveCollapsed();
    this.render();
  },

  expandAll() {
    STATE.collapsedCategories.clear();
    this.saveCollapsed();
    this.render();
  },

  collapseAll() {
    const stats = Core.getStats();
    Object.keys(stats).forEach(cat => STATE.collapsedCategories.add(cat));
    this.saveCollapsed();
    this.render();
  },

  saveCollapsed() {
    localStorage.setItem(COLLAPSE_KEY, JSON.stringify([...STATE.collapsedCategories]));
  },

  renderToolCard(link) {
    const card = document.createElement('div');
    card.className = 'card';

    card.onclick = (e) => {
      if (e.target.closest('.card-footer-new')) return;
      Utils.tryUrlWithFallback(link.urls || [link.url], link.title);
    };

    const start = (e) => {
      this.longPressTimer = setTimeout(() => this.handleLongPress(e, link), 600);
    };
    const cancel = () => clearTimeout(this.longPressTimer);

    card.addEventListener('mousedown', start);
    card.addEventListener('touchstart', start, { passive: false });
    card.addEventListener('mouseup', cancel);
    card.addEventListener('mouseleave', cancel);
    card.addEventListener('touchend', cancel);
    card.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.handleLongPress(e, link);
    });

    const userIcon = link.icon || "";
    const isEmoji = userIcon && !userIcon.includes('/') && userIcon.length < 5;
    const imgHtml = isEmoji ? `<div class="card-icon" style="display:grid;place-items:center;font-size:24px;">${userIcon}</div>` :
      `<img src="${userIcon || `https://www.google.com/s2/favicons?domain=${Utils.getHostname(link.url)}&sz=64`}" class="card-icon" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2280%22>🔗</text></svg>'">`;

    const urls = link.urls || [link.url];
    card.innerHTML = `
      <div class="card-main">
        <div class="card-icon-container">${imgHtml}</div>
        <div class="card-title-new">${link.title}</div>
      </div>
      <div class="card-footer-new">
        <span class="url-badge"><span class="material-icons" style="font-size:14px;">expand_more</span> ${urls.length}</span>
        <button class="pin-icon ${link.pinned ? 'active' : ''}" onclick="event.stopPropagation(); Core.togglePin('${link.id}')"><span class="material-icons" style="font-size:18px;">push_pin</span></button>
      </div>`;
    return card;
  },

  render() {
    const container = document.getElementById('content');
    if (!container) return;

    if (STATE.activeTab === 'search') {
      if (!container.querySelector('.search-view')) {
        container.innerHTML = '';
        this.renderSearchView(container);
      } else {
        this.renderSearchContent();
      }
      return;
    }

    if (STATE.activeTab === 'settings') {
      if (!container.querySelector('.settings-view')) {
        container.innerHTML = '';
        this.renderSettingsView(container);
      }
      return;
    }

    container.innerHTML = '';

    let filtered = STATE.links.filter(l => {
      const matchesSearch = !STATE.searchQuery || l.title.toLowerCase().includes(STATE.searchQuery) || l.url.toLowerCase().includes(STATE.searchQuery);
      const matchesCat = STATE.activeCategory === 'All' || (STATE.activeCategory === 'Pinned' ? l.pinned : l.category === STATE.activeCategory);
      return matchesSearch && matchesCat;
    });

    const grouped = {};
    filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
    }).forEach(l => {
      (grouped[l.category] ||= []).push(l);
    });

    const cats = Object.keys(grouped).sort();

    if (cats.length === 0) {
      container.innerHTML = `<div style="text-align:center; color:#888; margin-top:3rem;">No tools found</div>`;
      return;
    }

    cats.forEach(cat => {
      const isCollapsed = STATE.collapsedCategories.has(cat);
      const section = document.createElement('div');
      section.className = `category-section ${isCollapsed ? 'collapsed' : ''}`;

      section.innerHTML = `
        <div class="category-header" onclick="UI.toggleCategory('${cat}')" style="cursor:pointer;">
          <div class="category-title">
            ${this.getIconHtml(cat, '20px')} <span>${cat}</span>
            <span class="count-pill">${grouped[cat].length}</span>
          </div>
          <span class="material-icons chevron">${isCollapsed ? 'expand_more' : 'expand_less'}</span>
        </div>`;

      const grid = document.createElement('div');
      grid.className = 'category-grid';

      if (!isCollapsed) {
        grouped[cat].forEach(link => {
          grid.appendChild(this.renderToolCard(link));
        });
      }

      section.appendChild(grid);
      container.appendChild(section);
    });
  },

  renderSearchView(container) {
    container.innerHTML = `
      <div class="search-view">
        <div class="search-input-wrapper">
          <span class="material-icons">search</span>
          <input type="text" id="global-search" placeholder="Search tools..." value="${STATE.searchQuery}">
        </div>
        <div id="search-results" class="category-grid"></div>
      </div>
    `;

    const input = document.getElementById('global-search');
    input.focus();
    input.addEventListener('input', (e) => {
      STATE.searchQuery = e.target.value.toLowerCase();
      this.renderSearchContent();
    });

    this.renderSearchContent();
  },

  renderSearchContent() {
    const resultsContainer = document.getElementById('search-results');
    if (!resultsContainer) return;

    let filtered = STATE.links.filter(l => {
      return !STATE.searchQuery || l.title.toLowerCase().includes(STATE.searchQuery) || l.url.toLowerCase().includes(STATE.searchQuery);
    });

    resultsContainer.innerHTML = '';
    if (filtered.length === 0) {
      resultsContainer.innerHTML = `<div style="text-align:center; color:#888; width:100%; margin-top:2rem;">No results found</div>`;
      return;
    }

    filtered.forEach(link => {
       resultsContainer.appendChild(this.renderToolCard(link));
    });
  },

  renderSettingsView(container) {
    const settingsView = document.createElement('div');
    settingsView.className = 'settings-view';

    const stats = Core.getStats();
    const categories = Object.keys(stats);

    settingsView.innerHTML = `
      <section class="settings-section">
        <h3 class="settings-section-title"><span class="material-icons">palette</span> Appearance</h3>
        <div class="setting-group">
          <label>Theme</label>
          <div class="theme-options">
            <button class="btn-theme" onclick="PageTools.setTheme('light')">Light</button>
            <button class="btn-theme" onclick="PageTools.setTheme('dark')">Dark</button>
          </div>
        </div>
        <div class="setting-group">
          <label>Accent Color</label>
          <div class="accent-options">
            ${['indigo', 'green', 'red', 'purple', 'orange', 'teal', 'pink', 'amber', 'cyan', 'forest', 'earth', 'sky', 'leaf'].map(color => `
              <div class="accent-pill ${color}" onclick="PageTools.setAccent('${color}')" title="${color.charAt(0).toUpperCase() + color.slice(1)}"></div>
            `).join('')}
          </div>
        </div>
      </section>

      <section class="settings-section">
        <h3 class="settings-section-title"><span class="material-icons">storage</span> Data Management</h3>
        <div class="data-actions">
          <button class="btn-data" onclick="Tools.exportData()"><span class="material-icons">download</span> Export Data</button>
          <label class="btn-data">
            <span class="material-icons">upload</span> Import Data
            <input type="file" accept="application/json" onchange="Tools.importData(this)" style="display:none;" />
          </label>
          <button class="btn-data danger" onclick="Tools.resetData()"><span class="material-icons">restart_alt</span> Reset Dashboard</button>
        </div>
      </section>

      <section class="settings-section">
        <h3 class="settings-section-title"><span class="material-icons">bolt</span> Quick Actions</h3>
        <div class="data-actions">
          <button class="btn-data" onclick="UI.openModal('modal-add')"><span class="material-icons">add_box</span> Add Tool</button>
          <button class="btn-data" onclick="UI.openAboutModal()"><span class="material-icons">info</span> About</button>
        </div>
      </section>
    `;
    container.appendChild(settingsView);
  },

  openModal(id) {
    document.getElementById(id).style.display = 'block';
    document.getElementById('modal-overlay').style.display = 'block';
    if (id === 'modal-add') {
      const dl = document.getElementById('category-list');
      if (dl) dl.innerHTML = Object.keys(Core.getStats()).map(c => `<option value="${c}">`).join('');
    }
  },

  closeModal() {
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    document.getElementById('modal-overlay').style.display = 'none';
    if (document.getElementById('tool-form')) document.getElementById('tool-form').reset();
    document.getElementById('edit-id').value = '';
    const container = document.getElementById('alternative-urls-container');
    if (container) container.innerHTML = '';
  },

  openEdit(id) {
    const link = STATE.links.find(l => l.id === id);
    if (!link) return;
    document.getElementById('edit-id').value = link.id;
    document.getElementById('tool-title').value = link.title;
    document.getElementById('tool-url').value = link.url;
    document.getElementById('tool-icon').value = link.icon || '';
    document.getElementById('tool-category').value = link.category;
    document.getElementById('alternative-urls-container').innerHTML = '';
    const urls = link.urls || [link.url];
    for (let i = 1; i < urls.length; i++) this.addUrlField(urls[i]);
    this.openModal('modal-add');
  },

  addUrlField(value = '') {
    const container = document.getElementById('alternative-urls-container');
    const wrapper = document.createElement('div');
    wrapper.className = 'url-field-wrapper';
    wrapper.style.display = 'flex';
    wrapper.style.gap = '8px';
    wrapper.style.marginBottom = '8px';
    wrapper.innerHTML = `<input type="url" class="alt-url-input" value="${value}" style="flex:1;"><button type="button" class="btn-remove" onclick="this.parentElement.remove()" style="padding:4px 8px;">✕</button>`;
    container.appendChild(wrapper);
  },

  openToolActions(link) {
    document.getElementById('tool-actions-title').textContent = link.title;
    const urlContainer = document.getElementById('tool-actions-urls');
    urlContainer.innerHTML = '';

    const urls = link.urls || [link.url];
    urls.forEach(url => {
      const item = document.createElement('div');
      item.className = 'url-action-item';
      item.innerHTML = `
        <span class="url-text" title="${url}">${url}</span>
        <div class="url-btns">
          <button onclick="window.open('${url}', '_blank')" title="Open"><span class="material-icons" style="font-size:18px;">open_in_new</span></button>
          <button onclick="UI.copyToClipboard('${url}')" title="Copy"><span class="material-icons" style="font-size:18px;">content_copy</span></button>
        </div>
      `;
      urlContainer.appendChild(item);
    });

    document.getElementById('btn-copy-all').onclick = () => {
      this.copyToClipboard(urls.join('\n'));
      this.showToast('All URLs copied to clipboard');
    };

    document.getElementById('btn-edit-tool').onclick = () => {
      this.closeModal();
      this.openEdit(link.id);
    };

    document.getElementById('btn-delete-tool').onclick = () => {
      this.closeModal();
      Core.deleteLink(link.id);
    };

    this.openModal('modal-tool-actions');
  },

  copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      this.showToast('Copied to clipboard');
    });
  },

  showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('active');
    setTimeout(() => {
      toast.classList.remove('active');
    }, 2000);
  },

  handleFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    const primaryUrl = document.getElementById('tool-url').value.trim();
    const urls = [primaryUrl, ...Array.from(document.querySelectorAll('.alt-url-input')).map(i => i.value.trim()).filter(v => v && v !== primaryUrl)];
    const data = { title: document.getElementById('tool-title').value.trim(), url: primaryUrl, urls, icon: document.getElementById('tool-icon').value.trim(), category: document.getElementById('tool-category').value.trim() || 'Others' };
    id ? Core.updateLink(id, data) : Core.addLink(data);
    this.closeModal();
  },

  async openAboutModal() {
    const content = document.getElementById('about-content');
    try {
      const res = await fetch('README.md');
      if (res.ok) {
        const text = await res.text();
        content.innerHTML = this.markdownToHTML(text);
      } else {
        content.innerHTML = 'Failed to load README';
      }
    } catch (e) {
      content.innerHTML = 'Error loading README';
    }
    this.openModal('modal-about');
  },

  markdownToHTML(markdown) {
    let html = markdown;
    html = html.replace(/!\[(.*?)\]\((.*?)\)/gim, '<img src="$2" alt="$1" style="max-width:100%;border-radius:12px;">');
    html = html.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank">$1</a>');
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');
    html = html.split('\n\n').map(para => `<p>${para}</p>`).join('');
    return html;
  }
};
