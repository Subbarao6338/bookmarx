import React, { memo } from 'react';

const TabBar = memo(({ currentTab, setTab, onAddClick, onSettingsClick, onSearchClick, searchActive }) => {
  const handleTabClick = (tab) => {
    if ('vibrate' in navigator) navigator.vibrate([10, 5, 10]);
    setTab(tab);
  };

  return (
    <nav className="tab-bar" aria-label="Main Navigation">
      <div className="tab-group glass-card" role="tablist">
        <button
          id="tab-bookmarks"
          className={`tab-item ${currentTab === 'bookmarks' ? 'active' : ''}`}
          onClick={() => handleTabClick('bookmarks')}
          title="Bookmarks"
          role="tab"
          aria-selected={currentTab === 'bookmarks'}
          aria-controls="content"
        >
          <span className="material-icons-outlined" aria-hidden="true">bookmarks</span>
          <span className="tab-name">Bookmarks</span>
        </button>

        <button
          id="tab-search"
          className={`tab-item ${searchActive ? 'active' : ''}`}
          onClick={onSearchClick}
          title="Search"
          aria-label="Toggle search"
          aria-expanded={searchActive}
        >
          <span className="material-icons-outlined" aria-hidden="true">search</span>
          <span className="tab-name">Search</span>
        </button>

        <button
          className="tab-item"
          onClick={onSettingsClick}
          title="Settings"
          aria-label="Open settings"
        >
          <span className="material-icons-outlined" aria-hidden="true">settings</span>
          <span className="tab-name">Settings</span>
        </button>

        <button
          id="tab-manual-stats"
          className={`tab-item ${currentTab === 'manual_stats' ? 'active' : ''}`}
          onClick={() => handleTabClick('manual_stats')}
          title="Analytics"
          role="tab"
          aria-selected={currentTab === 'manual_stats'}
          aria-controls="content"
        >
          <span className="material-icons-outlined" aria-hidden="true">insights</span>
          <span className="tab-name">Analytics</span>
        </button>
      </div>
    </nav>
  );
});

export default TabBar;
