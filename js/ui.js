import { STATE, CAT_ICONS, COLLAPSE_KEY } from './state.js';
import { Utils } from './utils.js';
import { Core } from './core.js';

export const UI = {
  init() {
    this.renderBreadcrumb();
    this.render();

    document.getElementById('search-toggle').addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('search-container').classList.toggle('active');
      const input = document.getElementById('search');
      if (document.getElementById('search-container').classList.contains('active')) {
        input.focus();
      }
    });

    document.getElementById('search').addEventListener('input', (e) => {
      STATE.searchQuery = e.target.value.toLowerCase();
      this.render();
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.breadcrumb-nav')) {
        STATE.isDropdownOpen = false;
        this.renderBreadcrumb();
      }
    });
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

  renderBreadcrumb() {
    const nav = document.getElementById('breadcrumb-nav');
    if (!nav) return;
    const stats = Core.getStats();
    const definedCats = Object.keys(CAT_ICONS).filter(c => c !== 'All');
    const existingCats = Object.keys(stats);
    const allCats = [...new Set([...definedCats, ...existingCats])].sort();

    nav.innerHTML = `
      <div style="display:flex; align-items:center; gap:12px;">
        <div style="position:relative">
           <span class="breadcrumb-item" onclick="UI.toggleDropdown(event)">
              ${this.getIconHtml(STATE.activeCategory)} ${STATE.activeCategory} <span style="font-size:0.8em;opacity:0.6">▼</span>
           </span>
           <div class="category-dropdown ${STATE.isDropdownOpen ? 'active' : ''}">
               <div class="dropdown-item" onclick="UI.setCategory('All')">
                  <span>${this.getIconHtml('All')} All Tools</span>
                  <span class="count">${STATE.links.length}</span>
               </div>
               ${allCats.map(cat => `
                   <div class="dropdown-item" onclick="UI.setCategory('${cat}')">
                      <span>${this.getIconHtml(cat)} ${cat}</span>
                      <span class="count">${stats[cat] || 0}</span>
                   </div>`).join('')}
           </div>
        </div>
        <div class="global-actions">
           <button class="btn-small-theme" onclick="UI.collapseAll()" title="Collapse All"><span class="material-icons" style="font-size:18px;">unfold_less</span></button>
           <button class="btn-small-theme" onclick="UI.expandAll()" title="Expand All"><span class="material-icons" style="font-size:18px;">unfold_more</span></button>
        </div>
      </div>
    `;
  },

  toggleDropdown(e) {
    e.stopPropagation();
    STATE.isDropdownOpen = !STATE.isDropdownOpen;
    this.renderBreadcrumb();
  },

  setCategory(cat) {
    STATE.activeCategory = cat;
    STATE.isDropdownOpen = false;
    this.renderBreadcrumb();
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

  render() {
    const container = document.getElementById('content');
    if (!container) return;
    container.innerHTML = '';

    let filtered = STATE.links.filter(l => {
      const matchesSearch = !STATE.searchQuery || l.title.toLowerCase().includes(STATE.searchQuery) || l.url.toLowerCase().includes(STATE.searchQuery);
      const matchesCat = STATE.activeCategory === 'All' || l.category === STATE.activeCategory;
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
            ${this.getIconHtml(cat, '24px')} ${cat}
            <span style="font-size:0.8em;opacity:0.5;margin-left:8px">${grouped[cat].length}</span>
          </div>
          <span class="material-icons chevron">${isCollapsed ? 'expand_more' : 'expand_less'}</span>
        </div>`;

      const grid = document.createElement('div');
      grid.className = 'category-grid';

      if (!isCollapsed) {
        grouped[cat].forEach((link, index) => {
          const card = document.createElement('div');
          card.className = 'card';
          card.style.setProperty('--delay', index);
          card.onclick = (e) => {
            if (e.target.closest('.card-footer-new')) return;
            Utils.tryUrlWithFallback(link.urls || [link.url], link.title);
          };

          const userIcon = link.icon || "";
          const isEmoji = userIcon && !userIcon.includes('/') && userIcon.length < 5;
          let imgHtml = isEmoji ? `<div class="card-icon" style="display:grid;place-items:center;font-size:24px;">${userIcon}</div>` :
            `<img src="${userIcon || `https://www.google.com/s2/favicons?domain=${Utils.getHostname(link.url)}&sz=64`}" class="card-icon" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2280%22>🔗</text></svg>'">`;

          const urls = link.urls || [link.url];
          card.innerHTML = `
            <div class="card-header-new"><div class="card-url-full">${link.url}</div></div>
            <div class="card-content-new"><div class="card-icon-container">${imgHtml}</div><div class="card-title-new">${link.title}</div></div>
            <div class="card-footer-new">
              <span class="url-count-badge">${urls.length} URL${urls.length > 1 ? 's' : ''}</span>
              <div class="card-footer-actions">
                <button class="pin-btn ${link.pinned ? 'active' : ''}" onclick="event.stopPropagation(); Core.togglePin('${link.id}')" title="Pin"><span class="material-icons" style="font-size:18px;">push_pin</span></button>
                <div class="card-actions-new">
                  <button onclick="event.stopPropagation(); UI.openEdit('${link.id}')" title="Edit"><span class="material-icons" style="font-size:18px;">edit</span></button>
                  <button class="btn-delete" onclick="event.stopPropagation(); Core.deleteLink('${link.id}')" title="Delete"><span class="material-icons" style="font-size:18px;">delete</span></button>
                </div>
              </div>
            </div>`;
          grid.appendChild(card);
        });
      }

      section.appendChild(grid);
      container.appendChild(section);
    });
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
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');
    html = html.split('\n\n').map(para => `<p>${para}</p>`).join('');
    return html;
  }
};
