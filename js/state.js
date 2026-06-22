export const STORAGE_KEY = "necs_hub_links_v1";
export const COLLAPSE_KEY = "necs_hub_collapsed_v1";

export const STATE = {
  links: [],
  activeCategory: 'All',
  searchQuery: '',
  isDarkMode: localStorage.getItem('hub_theme') === 'dark',
  accentColor: localStorage.getItem('hub_accent') || 'indigo',
  collapsedCategories: new Set(JSON.parse(localStorage.getItem(COLLAPSE_KEY) || '[]')),
  isDropdownOpen: false
};

export const CAT_ICONS = {
  "All": "home",
};
