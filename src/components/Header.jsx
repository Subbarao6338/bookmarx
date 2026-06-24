import React, { memo } from 'react';

const Header = memo(({ appName, setView, currentTab, children }) => {
  return (
    <header className="top-bar glass-card">
      <div
        className="logo-container"
        onClick={() => setView('bookmarks')}
      >
        <div className="logo-icon-wrapper">
            <img src="/assets/favicon.svg" className="app-logo-img" alt="Logo" style={{ width: '28px', height: '28px' }} />
        </div>
        <h1 className="page-title">
          {appName || 'NECS Bookmarks'}
        </h1>
      </div>
      <div className="top-actions">
        {children}
      </div>
    </header>
  );
});

export default Header;
