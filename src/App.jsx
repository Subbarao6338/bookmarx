import React, { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import Header from './components/Header';
import TabBar from './components/TabBar';
import BookmarksView from './components/BookmarksView';
import ManualStatsView from './components/ManualStatsView';
import SearchOverlay from './components/SearchOverlay';
import SettingsModal from './components/SettingsModal';
import BookmarkModal from './components/BookmarkModal';
import { storage } from './utils/storage';
import { useLocalStorageState } from './utils/hooks';
import necsLinks from '../data/necs_links.json';
import { pushToPocketBase } from './utils/pocketbase';

function App() {
  const [appName, setAppName] = useLocalStorageState('hub_app_name', 'NECS Bookmarks');
  const [currentTab, setCurrentTab] = useState('bookmarks');

  // Automatic background sync from JSON to Local Storage and PocketBase
  useEffect(() => {
    const syncJsonToStorageAndPB = async () => {
      try {
        let storedLinks = storage.getJSON('hub_links_necs');
        let localUpdated = false;

        if (!storedLinks) {
          // If no stored links, initialize with JSON links
          storedLinks = necsLinks.map((l, index) => ({
            id: l.id || `l-necs-${index}-${Date.now()}`,
            ...l,
            is_pinned: l.is_pinned || false
          }));
          storage.setJSON('hub_links_necs', storedLinks);
          localUpdated = true;
        } else {
          // Merge/update logic
          const updatedLinks = [...storedLinks];
          necsLinks.forEach((jsonLink) => {
            const existingIdx = updatedLinks.findIndex(l => l.id === jsonLink.id);
            if (existingIdx === -1) {
              // Add new link from JSON
              updatedLinks.push({
                ...jsonLink,
                is_pinned: jsonLink.is_pinned || false
              });
              localUpdated = true;
            } else {
              // Check if modified
              const existingLink = updatedLinks[existingIdx];
              const fieldsToCompare = ['title', 'url', 'category', 'icon'];
              let isModified = false;

              for (const field of fieldsToCompare) {
                if (existingLink[field] !== jsonLink[field]) {
                  isModified = true;
                  break;
                }
              }

              // Compare array of urls
              if (!isModified) {
                const existingUrls = existingLink.urls || [];
                const jsonUrls = jsonLink.urls || [];
                if (JSON.stringify(existingUrls) !== JSON.stringify(jsonUrls)) {
                  isModified = true;
                }
              }

              if (isModified) {
                updatedLinks[existingIdx] = {
                  ...existingLink,
                  ...jsonLink
                };
                localUpdated = true;
              }
            }
          });

          if (localUpdated) {
            storage.setJSON('hub_links_necs', updatedLinks);
            setRefreshTrigger(prev => prev + 1);
          }
        }

        // If local storage was updated (new or modified JSON bookmarks), and PocketBase is configured, sync to PocketBase in background!
        if (localUpdated) {
          const pbUrl = storage.get('hub_pb_url');
          if (pbUrl) {
            const config = {
              url: pbUrl,
              collection: storage.get('hub_pb_collection') || 'bookmarks',
              email: storage.get('hub_pb_email') || '',
              password: storage.get('hub_pb_password') || '',
              isAdmin: storage.getBoolean('hub_pb_is_admin', false)
            };
            const currentLinks = storage.getJSON('hub_links_necs') || [];
            await pushToPocketBase(config, currentLinks);
            console.log('Successfully auto-synchronized updated JSON bookmarks to PocketBase.');
          }
        }
      } catch (err) {
        console.error('Error in automated JSON to PocketBase background sync:', err);
      }
    };

    syncJsonToStorageAndPB();
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [theme, setTheme] = useLocalStorageState('hub_theme', 'light');
  const [accentColor, setAccentColor] = useLocalStorageState('hub_accent_color', 'indigo');

  const setTab = React.useCallback((tab, skipHistory = false) => {
    setCurrentTab(tab);
    if ('vibrate' in navigator) navigator.vibrate([10, 5, 10]);
    if (!skipHistory) {
      window.history.pushState({ tab: tab }, '', `?tab=${tab}`);
    }
  }, []);

  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.tab) {
        setCurrentTab(event.state.tab);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (searchActive) {
      document.body.classList.add('search-active');
      setTimeout(() => {
        const input = document.getElementById('search');
        if (input) input.focus();
      }, 100);
    } else {
      document.body.classList.remove('search-active');
    }
  }, [searchActive]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') || 'bookmarks';
    setCurrentTab(tab);
  }, []);

  const [showBackToTop, setShowBackToTop] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      const container = document.querySelector('.tools-container');
      if (container) {
        setShowBackToTop(container.scrollTop > 300);
      }
    };
    const container = document.querySelector('.tools-container');
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }
    return () => container?.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    const container = document.querySelector('.tools-container');
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Additional Settings
  const [isCompact, setIsCompact] = useLocalStorageState('hub_compact', false, 'boolean');
  const [hideBookmarkUrls, setHideBookmarkUrls] = useLocalStorageState('hub_hide_bookmark_urls', false, 'boolean');
  const [hideBookmarkIcons, setHideBookmarkIcons] = useLocalStorageState('hub_hide_bookmark_icons', false, 'boolean');
  const [showStats, setShowStats] = useLocalStorageState('hub_show_stats', true, 'boolean');
  const [autoFocusSearch, setAutoFocusSearch] = useLocalStorageState('hub_auto_focus_search', false, 'boolean');
  const [openInNewTab, setOpenInNewTab] = useLocalStorageState('hub_open_newtab', true, 'boolean');

  // Visual Settings
  const [disableGlass, setDisableGlass] = useLocalStorageState('hub_disable_glass', false, 'boolean');
  const [disableAnimations, setDisableAnimations] = useLocalStorageState('hub_disable_animations', false, 'boolean');
  const [reducedMotion, setReducedMotion] = useLocalStorageState('hub_reduced_motion', false, 'boolean');
  const [confirmDelete, setConfirmDelete] = useLocalStorageState('hub_confirm_delete', true, 'boolean');
  const [enableHoverEffects, setEnableHoverEffects] = useLocalStorageState('hub_enable_hover_effects', true, 'boolean');

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBookmarkOpen, setIsBookmarkOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const refreshData = async () => {
    setIsRefreshing(true);
    setRefreshTrigger(prev => prev + 1);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const touchStart = React.useRef(0);
  const touchEnd = React.useRef(0);

  const handleTouchStart = (e) => {
    const container = document.querySelector('.tools-container');
    const isInsideScrollableX = e.target.closest('.scrollable-x');
    if (container && container.scrollTop <= 0 && !isInsideScrollableX) {
      touchStart.current = e.targetTouches[0].clientY;
      touchEnd.current = 0;
    } else {
      touchStart.current = 0;
    }
  };

  const handleTouchMove = (e) => {
    if (touchStart.current === 0) return;
    touchEnd.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (touchStart.current === 0) return;
    const distance = touchEnd.current - touchStart.current;
    if (distance > 100) {
      refreshData();
    }
    touchStart.current = 0;
    touchEnd.current = 0;
  };

  useEffect(() => {
    const applyTheme = (t) => {
      let activeTheme = t;
      if (t === 'system') {
        activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', activeTheme);
    };

    applyTheme(theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  useEffect(() => {
    if (disableGlass) document.body.classList.add('no-glass');
    else document.body.classList.remove('no-glass');
  }, [disableGlass]);

  useEffect(() => {
    if (reducedMotion) document.body.classList.add('reduced-motion');
    else document.body.classList.remove('reduced-motion');
  }, [reducedMotion]);

  useEffect(() => {
    if (disableAnimations) document.body.classList.add('no-animations');
    else document.body.classList.remove('no-animations');
  }, [disableAnimations]);

  useEffect(() => {
    if (enableHoverEffects) document.body.classList.remove('no-hover-effects');
    else document.body.classList.add('no-hover-effects');
  }, [enableHoverEffects]);

  useEffect(() => {
    document.documentElement.setAttribute('data-color', accentColor);
  }, [accentColor]);

  useEffect(() => {
    if (autoFocusSearch && !isSettingsOpen) {
      const searchInput = document.getElementById('search');
      if (searchInput && window.innerWidth > 768) {
        searchInput.focus();
      }
    }
  }, [autoFocusSearch, isSettingsOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA' && !isSettingsOpen) {
        e.preventDefault();
        setSearchActive(true);
        setTimeout(() => {
          const input = document.getElementById('search');
          if (input) input.focus();
        }, 100);
      }

      if (e.altKey) {
        if (e.key === '1') { e.preventDefault(); setCurrentTab('bookmarks'); }
        if (e.key === '4') { e.preventDefault(); setIsSettingsOpen(true); }
      }

      if (e.key === 'Escape') {
        setIsSettingsOpen(false);
        setSearchActive(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen]);


  const handleSearchToggle = () => setSearchActive(!searchActive);
  const handleSearchClear = () => {
    setSearchQuery('');
    setSearchActive(false);
  };

  const togglePin = React.useCallback((link) => {
    let storedLinks = storage.getJSON(`hub_links_necs`);
    if (!storedLinks) return;

    storedLinks = storedLinks.map(l => l.id === link.id ? { ...l, is_pinned: !l.is_pinned } : l);
    storage.setJSON(`hub_links_necs`, storedLinks);
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const deleteLink = React.useCallback((id) => {
    if (!confirmDelete || window.confirm("Are you sure you want to delete this bookmark?")) {
        let storedLinks = storage.getJSON(`hub_links_necs`);
        if (!storedLinks) return;

        storedLinks = storedLinks.filter(l => l.id !== id);
        storage.setJSON(`hub_links_necs`, storedLinks);
        setRefreshTrigger(prev => prev + 1);
    }
  }, [confirmDelete]);

  return (
    <div className="app-layout">
      <div className="search-dismiss-overlay" onClick={() => setSearchActive(false)}></div>
      <main className="main-content">
        <Header
          appName={appName}
          setView={(view) => setTab(view)}
          onSettingsClick={() => setIsSettingsOpen(true)}
          currentTab={currentTab}
        >
          <SearchOverlay
            active={searchActive}
            setActive={setSearchActive}
            query={searchQuery}
            onChange={setSearchQuery}
            onClear={handleSearchClear}
            currentTab={currentTab}
          />
        </Header>

        <div
          id="content"
          className={`tools-container ${isCompact ? 'compact' : ''} ${isRefreshing ? 'refreshing' : ''}`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {isRefreshing && (
            <div className="refresh-indicator">
              <span className="material-icons rotating">refresh</span>
              <span>Refreshing...</span>
            </div>
          )}
          {currentTab === 'bookmarks' && (
            <BookmarksView
              searchQuery={searchQuery}
              onPin={togglePin}
              onDelete={deleteLink}
              onEdit={(link) => { setEditingLink(link); setIsBookmarkOpen(true); }}
              refreshTrigger={refreshTrigger}
              hideUrls={hideBookmarkUrls}
              hideIcons={hideBookmarkIcons}
              showStats={showStats}
              openInNewTab={openInNewTab}
            />
          )}
          {currentTab === 'manual_stats' && (
            <ManualStatsView />
          )}
        </div>

        <button
          id="back-to-top"
          className={showBackToTop ? 'visible' : ''}
          onClick={scrollToTop}
          title="Back to Top"
        >
          <span className="material-icons">arrow_upward</span>
        </button>
        <TabBar
          currentTab={currentTab}
          setTab={setTab}
          onAddClick={() => { setEditingLink(null); setIsBookmarkOpen(true); }}
          onSettingsClick={() => setIsSettingsOpen(true)}
          onSearchClick={handleSearchToggle}
          searchActive={searchActive}
        />
      </main>

      {(isSettingsOpen || isBookmarkOpen) && (
        <div className="modal-overlay" style={{display: 'block'}} onClick={() => { setIsSettingsOpen(false); setIsBookmarkOpen(false); }}></div>
      )}

      {isSettingsOpen && (
        <SettingsModal
          deferredPrompt={deferredPrompt}
          setDeferredPrompt={setDeferredPrompt}
          appName={appName}
          setAppName={setAppName}
          enableHoverEffects={enableHoverEffects}
          setEnableHoverEffects={setEnableHoverEffects}
          theme={theme}
          setTheme={setTheme}
          accentColor={accentColor}
          setAccentColor={setAccentColor}
          isCompact={isCompact}
          setIsCompact={setIsCompact}
          hideBookmarkUrls={hideBookmarkUrls}
          setHideBookmarkUrls={setHideBookmarkUrls}
          hideBookmarkIcons={hideBookmarkIcons}
          setHideBookmarkIcons={setHideBookmarkIcons}
          showStats={showStats}
          setShowStats={setShowStats}
          autoFocusSearch={autoFocusSearch}
          setAutoFocusSearch={setAutoFocusSearch}
          openInNewTab={openInNewTab}
          setOpenInNewTab={setOpenInNewTab}
          disableGlass={disableGlass}
          setDisableGlass={setDisableGlass}
          disableAnimations={disableAnimations}
          setDisableAnimations={setDisableAnimations}
          reducedMotion={reducedMotion}
          setReducedMotion={setReducedMotion}
          confirmDelete={confirmDelete}
          setConfirmDelete={setConfirmDelete}
          onAddBookmark={() => { setEditingLink(null); setIsBookmarkOpen(true); }}
          onClose={() => setIsSettingsOpen(false)}
          resetData={() => {
            if (window.confirm("Reset all dashboard data?")) {
              localStorage.clear();
              window.location.reload();
            }
          }}
        />
      )}

      {isBookmarkOpen && (
        <BookmarkModal
          link={editingLink}
          onClose={() => setIsBookmarkOpen(false)}
          onSave={(savedLink) => {
            let storedLinks = storage.getJSON(`hub_links_necs`) || [];

            if (editingLink) {
                storedLinks = storedLinks.map(l => l.id === editingLink.id ? { ...l, ...savedLink } : l);
            } else {
                const newLink = {
                    id: `l-necs-${Date.now()}`,
                    ...savedLink,
                    is_pinned: false
                };
                storedLinks = [newLink, ...storedLinks];
            }

            storage.setJSON(`hub_links_necs`, storedLinks);
            setRefreshTrigger(prev => prev + 1);
            setTab('bookmarks');
            setSearchQuery('');
            setIsBookmarkOpen(false);
          }}
        />
      )}

      <Analytics />
    </div>
  );
}

export default App;
