import React, { useState, useEffect } from 'react';

const Sidebar = ({
  appName,
  currentTab,
  setTab,
  onAddClick,
  onSettingsClick,
  searchQuery,
  setSearchQuery,
  searchActive,
  setSearchActive,
  theme,
  setTheme
}) => {
  const [placeholder, setPlaceholder] = useState('Search bookmarks...');
  const tips = [
    "Search bookmarks...",
    "Try 'cat:dev' for dev items",
    "Filter by category...",
    "Press Alt+1 for Bookmarks"
  ];

  useEffect(() => {
    let i = 0;
    const it = setInterval(() => {
      setPlaceholder(tips[i % tips.length]);
      i++;
    }, 4000);
    return () => clearInterval(it);
  }, []);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value) {
      setSearchActive(true);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchActive(false);
  };

  return (
    <aside className="sidebar desktop-only">
      {/* Branding Section */}
      <div className="sidebar-brand" onClick={() => setTab('bookmarks')}>
        <div className="sidebar-logo-wrapper">
          <img src="/assets/favicon.svg" alt="App Logo" className="sidebar-logo-img" />
        </div>
        <h1 className="sidebar-title">{appName || 'NECS Bookmarks'}</h1>
      </div>

      {/* Action Button: Create Bookmark */}
      <div className="sidebar-actions">
        <button className="btn-primary sidebar-add-btn" onClick={onAddClick} title="Create Bookmark">
          <span className="material-icons">add_circle</span>
          <span>Create Bookmark</span>
        </button>
      </div>

      {/* Live Search Routing */}
      <div className="sidebar-search-container">
        <span className="material-icons-outlined sidebar-search-icon">search</span>
        <input
          type="search"
          className="sidebar-search-input"
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={() => setSearchActive(true)}
        />
        {searchQuery && (
          <button className="sidebar-search-clear" onClick={handleClearSearch} title="Clear Search">
            <span className="material-icons">close</span>
          </button>
        )}
      </div>

      {/* Active Navigation */}
      <nav className="sidebar-nav">
        <button
          className={`sidebar-nav-item ${currentTab === 'bookmarks' ? 'active' : ''}`}
          onClick={() => setTab('bookmarks')}
        >
          <span className="material-icons-outlined">bookmarks</span>
          <span className="sidebar-nav-label">Bookmarks</span>
        </button>

        <button
          className={`sidebar-nav-item ${currentTab === 'manual_stats' ? 'active' : ''}`}
          onClick={() => setTab('manual_stats')}
        >
          <span className="material-icons-outlined">insights</span>
          <span className="sidebar-nav-label">Analytics</span>
        </button>

        <button
          className="sidebar-nav-item"
          onClick={onSettingsClick}
        >
          <span className="material-icons-outlined">settings</span>
          <span className="sidebar-nav-label">Settings</span>
        </button>
      </nav>

      {/* Theme Switching (Inline) */}
      <div className="sidebar-theme-switcher">
        <div className="sidebar-section-header">
          <span className="material-icons-outlined">palette</span>
          <span className="sidebar-section-title">Theme Mode</span>
        </div>
        <div className="sidebar-theme-buttons">
          {[
            { mode: 'light', icon: 'light_mode', label: 'Light' },
            { mode: 'dark', icon: 'dark_mode', label: 'Dark' },
            { mode: 'nature', icon: 'eco', label: 'Nature' },
            { mode: 'system', icon: 'settings_brightness', label: 'System' }
          ].map(({ mode, icon, label }) => (
            <button
              key={mode}
              className={`sidebar-theme-btn ${theme === mode ? 'active' : ''}`}
              onClick={() => setTheme(mode)}
              title={label}
            >
              <span className="material-icons">{icon}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Profile Section */}
      <div className="sidebar-profile">
        <div className="profile-avatar">
          <span>NU</span>
        </div>
        <div className="profile-info">
          <span className="profile-name">NECS User</span>
          <span className="profile-email">user@necs.org</span>
          <span className="profile-badge">Administrator</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
