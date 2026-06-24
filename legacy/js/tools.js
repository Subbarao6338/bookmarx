import { STATE, STORAGE_KEY } from './state.js';
import { Core } from './core.js';

export const Tools = {
  exportData() {
    const blob = new Blob([JSON.stringify(STATE.links, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `nex_bookmarks_backup.json`;
    a.click();
  },
  importData(input) {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const json = JSON.parse(e.target.result);
        if (Array.isArray(json) && confirm(`Import ${json.length} items?`)) {
          STATE.links = json;
          Core.saveData();
        }
      } catch (err) { alert("Invalid JSON"); }
    };
    reader.readAsText(file);
  },
  resetData() {
    if (confirm("Reset to defaults?")) { localStorage.removeItem(STORAGE_KEY); location.reload(); }
  }
};

export const PageTools = {
  init() {
    this.applyTheme();
    this.applyAccent();
  },
  setTheme(theme) {
    STATE.isDarkMode = theme === 'dark';
    localStorage.setItem('nex_bookmarks_theme', theme);
    this.applyTheme();
  },
  applyTheme() {
    document.documentElement.setAttribute('data-theme', STATE.isDarkMode ? 'dark' : 'light');
  },
  setAccent(accent) {
    STATE.accentColor = accent;
    localStorage.setItem('nex_bookmarks_accent', accent);
    this.applyAccent();
  },
  applyAccent() {
    document.documentElement.setAttribute('data-accent', STATE.accentColor);
  }
};
