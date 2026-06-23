export const STORAGE_KEY = "nex_bookmarks_links_v1";
export const COLLAPSE_KEY = "nex_bookmarks_collapsed_v1";

export const STATE = {
  links: [],
  activeCategory: 'All',
  activeTab: 'bookmarks',
  searchQuery: '',
  isDarkMode: localStorage.getItem('nex_bookmarks_theme') === 'dark',
  accentColor: localStorage.getItem('nex_bookmarks_accent') || 'indigo',
  collapsedCategories: new Set(JSON.parse(localStorage.getItem(COLLAPSE_KEY) || '[]')),
  isDropdownOpen: false
};

export const CAT_ICONS = {
  "All": "home",
};
