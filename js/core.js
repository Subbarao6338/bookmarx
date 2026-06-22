import { STATE, CAT_ICONS, STORAGE_KEY } from './state.js';
import { UI } from './ui.js';
import { PageTools } from './tools.js';

export const Core = {
  async init() {
    await this.loadCategories();
    await this.loadData();
    UI.init();
    PageTools.init();
  },

  async loadCategories() {
    try {
      const res = await fetch(`necs_cat.json?t=${new Date().getTime()}`);
      if (res.ok) {
        const cats = await res.json();
        Object.assign(CAT_ICONS, cats);
      }
    } catch (e) {
      console.warn("Could not load necs_cat.json", e);
    }
  },

  async loadData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        STATE.links = JSON.parse(saved);
        let changed = false;
        STATE.links.forEach(l => {
          if (!l.id) { l.id = Date.now() + Math.random().toString(36).substr(2, 9); changed = true; }
          if (l.pinned === undefined) { l.pinned = false; changed = true; }
        });
        if (changed) this.saveData();
      } catch (e) {
        STATE.links = [];
      }
    } else {
      await this.migrateFromJSON();
    }
  },

  saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE.links));
    UI.render();
  },

  async migrateFromJSON() {
    try {
      const res = await fetch(`necs_links.json?t=${new Date().getTime()}`);
      let raw = [];
      if (res.ok) raw = await res.json();

      if (!Array.isArray(raw) || raw.length === 0) return;

      STATE.links = raw.map(item => ({
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
        title: item.title,
        url: item.url,
        urls: item.urls || [item.url],
        icon: item.icon || "",
        category: item.category || "Others",
        pinned: item.pinned || false
      }));
      this.saveData();
    } catch (e) {
      console.error("Migration failed", e);
    }
  },

  addLink(link) {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    STATE.links.unshift({ ...link, id, pinned: false });
    this.saveData();
  },

  togglePin(id) {
    const idx = STATE.links.findIndex(l => l.id === id);
    if (idx !== -1) {
      STATE.links[idx].pinned = !STATE.links[idx].pinned;
      this.saveData();
    }
  },

  updateLink(id, updates) {
    const idx = STATE.links.findIndex(l => l.id === id);
    if (idx !== -1) {
      STATE.links[idx] = { ...STATE.links[idx], ...updates };
      this.saveData();
    }
  },

  deleteLink(id) {
    if (confirm("Are you sure you want to delete this tool?")) {
      STATE.links = STATE.links.filter(l => l.id !== id);
      this.saveData();
    }
  },

  getStats() {
    const stats = {};
    STATE.links.forEach(l => {
      stats[l.category] = (stats[l.category] || 0) + 1;
    });
    return stats;
  }
};
