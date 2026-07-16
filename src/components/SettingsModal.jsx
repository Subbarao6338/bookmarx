import React, { useState } from 'react';
import { storage } from '../utils/storage';
import { testPBConnection, pushToPocketBase, pullFromPocketBase, seedPocketBaseFromJson } from '../utils/pocketbase';

const CollapsibleSection = ({ id, title, icon, isOpen, onToggle, children }) => {
  return (
    <div className={`settings-collapsible ${isOpen ? 'is-open' : ''}`}>
      <div className="collapsible-header" onClick={() => onToggle(id)}>
        <div className="header-left">
          <span className="material-icons">{icon}</span>
          <span>{title}</span>
        </div>
        <span className="material-icons toggle-icon">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </div>
      <div className="collapsible-content">
        <div className="collapsible-inner">
          {children}
        </div>
      </div>
    </div>
  );
};

const THEME_COLORS = [
  'indigo', 'blue', 'sky', 'teal', 'green', 'amber', 'orange', 'red', 'rose', 'purple', 'violet', 'slate'
];

const SettingsModal = ({
  deferredPrompt, setDeferredPrompt,
  appName, setAppName,
  enableHoverEffects, setEnableHoverEffects,
  theme, setTheme,
  accentColor, setAccentColor,
  isCompact, setIsCompact,
  hideBookmarkUrls, setHideBookmarkUrls,
  hideBookmarkIcons, setHideBookmarkIcons,
  showStats, setShowStats,
  autoFocusSearch, setAutoFocusSearch,
  openInNewTab, setOpenInNewTab,
  disableGlass, setDisableGlass,
  disableAnimations, setDisableAnimations,
  reducedMotion, setReducedMotion,
  confirmDelete, setConfirmDelete,
  onClose,
  resetData
}) => {
  const [openSections, setOpenSections] = useState(['global']);

  // PocketBase Config States
  const [pbUrl, setPbUrl] = useState(storage.get('hub_pb_url') || '');
  const [pbCollection, setPbCollection] = useState(storage.get('hub_pb_collection') || 'bookmarks');
  const [pbEmail, setPbEmail] = useState(storage.get('hub_pb_email') || '');
  const [pbPassword, setPbPassword] = useState(storage.get('hub_pb_password') || '');
  const [pbIsAdmin, setPbIsAdmin] = useState(storage.getBoolean('hub_pb_is_admin', false));

  const [pbStatus, setPbStatus] = useState('');
  const [syncStatus, setSyncStatus] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const toggleSection = (id) => {
    setOpenSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleExport = () => {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('hub_')) {
        data[key] = localStorage.getItem(key);
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `necs_bookmarks_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const handleTestConnection = async () => {
    if (!pbUrl) {
      setPbStatus('Please enter a PocketBase URL first');
      return;
    }
    setPbStatus('Testing connection...');
    const connected = await testPBConnection(pbUrl);
    if (connected) {
      setPbStatus('Connected successfully! ✅');
      storage.set('hub_pb_url', pbUrl);
    } else {
      setPbStatus('Failed to connect ❌. Check URL or network.');
    }
  };

  const handlePush = async () => {
    if (!pbUrl) {
      setSyncStatus('Configure PocketBase URL first');
      return;
    }
    setIsSyncing(true);
    setSyncStatus('Pushing to PocketBase...');

    // Save current config
    storage.set('hub_pb_url', pbUrl);
    storage.set('hub_pb_collection', pbCollection);
    storage.set('hub_pb_email', pbEmail);
    storage.set('hub_pb_password', pbPassword);
    storage.set('hub_pb_is_admin', pbIsAdmin ? 'true' : 'false');

    const localLinks = storage.getJSON('hub_links_necs') || [];
    const config = { url: pbUrl, collection: pbCollection, email: pbEmail, password: pbPassword, isAdmin: pbIsAdmin };

    const res = await pushToPocketBase(config, localLinks);
    setIsSyncing(false);
    setSyncStatus(res.message);
    if (res.success) {
      setTimeout(() => setSyncStatus(''), 6000);
    }
  };

  const handlePull = async () => {
    if (!pbUrl) {
      setSyncStatus('Configure PocketBase URL first');
      return;
    }
    setIsSyncing(true);
    setSyncStatus('Pulling from PocketBase...');

    // Save current config
    storage.set('hub_pb_url', pbUrl);
    storage.set('hub_pb_collection', pbCollection);
    storage.set('hub_pb_email', pbEmail);
    storage.set('hub_pb_password', pbPassword);
    storage.set('hub_pb_is_admin', pbIsAdmin ? 'true' : 'false');

    const localLinks = storage.getJSON('hub_links_necs') || [];
    const config = { url: pbUrl, collection: pbCollection, email: pbEmail, password: pbPassword, isAdmin: pbIsAdmin };

    const res = await pullFromPocketBase(config, localLinks);
    setIsSyncing(false);
    setSyncStatus(res.message);
    if (res.success) {
      storage.setJSON('hub_links_necs', res.links);
      alert(res.message + "\nRefreshing app to load new bookmarks.");
      window.location.reload();
    }
  };

  const handleSeed = async () => {
    if (!pbUrl) {
      setSyncStatus('Configure PocketBase URL first');
      return;
    }
    setIsSyncing(true);
    setSyncStatus('Seeding PocketBase from default JSON file...');

    // Save current config
    storage.set('hub_pb_url', pbUrl);
    storage.set('hub_pb_collection', pbCollection);
    storage.set('hub_pb_email', pbEmail);
    storage.set('hub_pb_password', pbPassword);
    storage.set('hub_pb_is_admin', pbIsAdmin ? 'true' : 'false');

    const config = { url: pbUrl, collection: pbCollection, email: pbEmail, password: pbPassword, isAdmin: pbIsAdmin };

    const res = await seedPocketBaseFromJson(config);
    setIsSyncing(false);
    setSyncStatus(res.message);
    if (res.success) {
      setTimeout(() => setSyncStatus(''), 6000);
    }
  };

  const Toggle = ({ label, value, onChange, icon }) => (
    <div className="settings-row">
      <div className="settings-row-label">
        {icon && <span className="material-icons mr-10" style={{fontSize: '1.2rem', opacity: 0.7}}>{icon}</span>}
        <span>{label}</span>
      </div>
      <label className="switch">
        <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
        <span className="slider round"></span>
      </label>
    </div>
  );

  return (
    <div className="modal glass-card" style={{maxWidth: '600px'}}>
      <div className="modal-header-flex">
        <h2 style={{margin: 0, fontSize: '1.5rem', fontWeight: 800}}>Settings</h2>
        <button className="icon-btn" onClick={onClose}><span className="material-icons">close</span></button>
      </div>

      <div className="settings-container" style={{flex: 1, overflowY: 'auto', paddingRight: '5px', marginTop: '1rem'}}>
        <CollapsibleSection id="global" title="General" icon="settings" isOpen={openSections.includes('global')} onToggle={toggleSection}>
          <div className="form-group">
            <label>Application Name</label>
            <input type="text" className="pill" value={appName} onChange={(e) => setAppName(e.target.value)} />
          </div>
          <Toggle label="Auto-focus Search" value={autoFocusSearch} onChange={setAutoFocusSearch} icon="search" />
          <Toggle label="Open links in new tab" value={openInNewTab} onChange={setOpenInNewTab} icon="open_in_new" />
          <Toggle label="Confirm Deletion" value={confirmDelete} onChange={setConfirmDelete} icon="delete" />
        </CollapsibleSection>

        <CollapsibleSection id="bookmarks" title="Bookmarks" icon="bookmarks" isOpen={openSections.includes('bookmarks')} onToggle={toggleSection}>
          <Toggle label="Hide Bookmark Icons" value={hideBookmarkIcons} onChange={setHideBookmarkIcons} icon="image_not_supported" />
          <Toggle label="Hide Bookmark URLs" value={hideBookmarkUrls} onChange={setHideBookmarkUrls} icon="link_off" />
        </CollapsibleSection>

        <CollapsibleSection id="pocketbase" title="PocketBase Remote Sync" icon="cloud_sync" isOpen={openSections.includes('pocketbase')} onToggle={toggleSection}>
          <p className="smallest opacity-6 mb-10">Sync and secure your bookmark collection in a personal or shared PocketBase backend.</p>

          <div className="form-group">
            <label>PocketBase Instance URL</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="pill"
                style={{ flex: 1 }}
                value={pbUrl}
                onChange={(e) => {
                  setPbUrl(e.target.value);
                  storage.set('hub_pb_url', e.target.value);
                  storage.set('hub_pb_connected', 'false');
                }}
                placeholder="https://my-pocketbase.pockethost.io"
              />
              <button type="button" className="pill" onClick={handleTestConnection} style={{ flexShrink: 0, padding: '8px 16px' }}>
                Test
              </button>
            </div>
            {pbStatus && <p className="smallest mt-5" style={{ fontWeight: 'bold' }}>{pbStatus}</p>}
          </div>

          <div className="form-group">
            <label>Collection Name</label>
            <input
              type="text"
              className="pill"
              value={pbCollection}
              onChange={(e) => {
                setPbCollection(e.target.value);
                storage.set('hub_pb_collection', e.target.value);
              }}
              placeholder="bookmarks"
            />
          </div>

          <div className="form-group">
            <label>Auth Email / Username (Optional)</label>
            <input
              type="text"
              className="pill"
              value={pbEmail}
              onChange={(e) => {
                setPbEmail(e.target.value);
                storage.set('hub_pb_email', e.target.value);
              }}
              placeholder="user@example.com"
            />
          </div>

          <div className="form-group">
            <label>Auth Password (Optional)</label>
            <input
              type="password"
              className="pill"
              value={pbPassword}
              onChange={(e) => {
                setPbPassword(e.target.value);
                storage.set('hub_pb_password', e.target.value);
              }}
              placeholder="••••••••"
            />
          </div>

          <Toggle
            label="Authenticate as Superuser (Admin)"
            value={pbIsAdmin}
            onChange={(v) => {
              setPbIsAdmin(v);
              storage.set('hub_pb_is_admin', v ? 'true' : 'false');
            }}
            icon="admin_panel_settings"
          />

          <div className="pill-group mt-15" style={{ width: '100%', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <button
                type="button"
                className="pill btn-primary"
                style={{ flex: 1, padding: '10px' }}
                onClick={handlePush}
                disabled={isSyncing}
              >
                <span className="material-icons mr-10" style={{ fontSize: '1.2rem' }}>cloud_upload</span>
                Push Local to Cloud
              </button>
              <button
                type="button"
                className="pill btn-primary"
                style={{ flex: 1, padding: '10px' }}
                onClick={handlePull}
                disabled={isSyncing}
              >
                <span className="material-icons mr-10" style={{ fontSize: '1.2rem' }}>cloud_download</span>
                Pull Cloud to Local
              </button>
            </div>

            <button
              type="button"
              className="pill"
              style={{ width: '100%', padding: '10px', borderColor: 'var(--primary)', color: 'var(--primary)' }}
              onClick={handleSeed}
              disabled={isSyncing}
              title="Populates PocketBase using default JSON bookmarks file"
            >
              <span className="material-icons mr-10" style={{ fontSize: '1.2rem' }}>publish</span>
              Seed Cloud from Default JSON File
            </button>
          </div>
          {syncStatus && (
            <div className="glass-card mt-10 p-10" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
              <p className="smallest font-bold text-center" style={{ margin: 0 }}>{syncStatus}</p>
            </div>
          )}
        </CollapsibleSection>

        <CollapsibleSection id="appearance" title="UI & Theme" icon="palette" isOpen={openSections.includes('appearance')} onToggle={toggleSection}>
          <div className="form-group">
            <label>Theme Mode</label>
            <div className="pill-group">
              {['light', 'dark', 'system'].map(t => (
                <button key={t} className={`pill ${theme === t ? 'active' : ''}`} onClick={() => setTheme(t)}>
                  <span className="material-icons mr-10" style={{fontSize: '1.1rem'}}>{t === 'light' ? 'light_mode' : t === 'dark' ? 'dark_mode' : 'settings_brightness'}</span>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Accent Color</label>
            <div className="scrollable-x" style={{padding: '5px 0'}}>
              <div className="flex-gap">
                {THEME_COLORS.map(color => (
                  <button key={color} className={`color-circle ${accentColor === color ? 'active' : ''}`} style={{background: `var(--${color})` || color}} onClick={() => setAccentColor(color)} title={color} />
                ))}
              </div>
            </div>
          </div>
          <Toggle label="Compact View" value={isCompact} onChange={setIsCompact} icon="view_headline" />
          <Toggle label="Show Statistics" value={showStats} onChange={setShowStats} icon="bar_chart" />
          <Toggle label="Enable Glass Morphism" value={!disableGlass} onChange={(v) => setDisableGlass(!v)} icon="blur_on" />
          <Toggle label="Enable Animations" value={!disableAnimations} onChange={(v) => setDisableAnimations(!v)} icon="auto_awesome" />
          <Toggle label="Reduced Motion" value={reducedMotion} onChange={setReducedMotion} icon="motion_photos_off" />
          <Toggle label="Hover Effects" value={enableHoverEffects} onChange={setEnableHoverEffects} icon="mouse" />
        </CollapsibleSection>

        <CollapsibleSection id="data" title="Maintenance & Data" icon="storage" isOpen={openSections.includes('data')} onToggle={toggleSection}>
          {deferredPrompt && (
            <button className="btn-primary w-full mb-15" onClick={() => deferredPrompt.prompt()}>
              <span className="material-icons mr-10">install_desktop</span> Install App
            </button>
          )}

          <div className="form-group">
            <label>Backup & Restore</label>
            <p className="smallest opacity-6 mb-10">Export your bookmarks and settings to a JSON file or import from a previous backup.</p>
            <div className="pill-group">
                <button className="pill" onClick={handleExport} title="Download a JSON backup of your data">
                    <span className="material-icons mr-10">download</span> Export Data
                </button>
                <label className="pill" style={{cursor: 'pointer'}} title="Restore data from a JSON backup">
                    <span className="material-icons mr-10">upload</span> Import Data
                    <input type="file" hidden accept=".json" onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                                try {
                                    const json = JSON.parse(ev.target.result);
                                    Object.keys(json).forEach(k => localStorage.setItem(k, json[k]));
                                    window.location.reload();
                                } catch(e) { alert("Invalid backup file"); }
                            };
                            reader.readAsText(file);
                        }
                    }} />
                </label>
            </div>
          </div>

          <div className="form-group">
            <label>Data Management</label>
            <p className="smallest opacity-6 mb-10">Reset specific parts of the application data or settings.</p>
            <div className="pill-group">
                <button className="pill" onClick={() => {
                    if(confirm("Refresh bookmarks from defaults? Your settings will be preserved, but custom bookmarks will be reset.")) {
                        Object.keys(localStorage).forEach(key => {
                            if (key.startsWith('hub_links_necs') || key.startsWith('hub_cats_necs')) {
                                localStorage.removeItem(key);
                            }
                        });
                        window.location.reload();
                    }
                }}>
                    <span className="material-icons mr-10">refresh</span> Refresh Local Storage
                </button>
                <button className="pill" onClick={() => {
                    if(confirm("Reset all settings to default? Your bookmarks will be preserved.")) {
                        Object.keys(localStorage).forEach(key => {
                            if (key && key.startsWith('hub_') && !key.startsWith('hub_links_necs') && !key.startsWith('hub_cats_necs')) {
                                localStorage.removeItem(key);
                            }
                        });
                        window.location.reload();
                    }
                }}>
                    <span className="material-icons mr-10">settings_backup_restore</span> Reset Settings
                </button>
            </div>
          </div>

          <div className="form-group">
             <label style={{color: 'var(--danger)'}}>Danger Zone</label>
             <p className="smallest opacity-6 mb-10">Completely wipe all data and settings, returning the app to its original state. This action is permanent and cannot be undone.</p>
             <button className="pill w-full" style={{color: 'var(--danger)', borderColor: 'var(--danger)'}} onClick={() => {
                if (window.confirm("CRITICAL: This will permanently delete ALL your bookmarks and settings. Are you absolutely sure?")) {
                    localStorage.clear();
                    window.location.reload();
                }
             }}>
                <span className="material-icons mr-10">delete_forever</span> Wipe All Data & Factory Reset
             </button>
          </div>

          <div className="p-10 text-center opacity-4 smallest uppercase font-bold">
             Local Storage Usage: {(JSON.stringify(localStorage).length / 1024).toFixed(2)} KB
          </div>
        </CollapsibleSection>
      </div>

      <div className="form-actions" style={{marginTop: '1.5rem'}}>
        <button type="button" className="btn-primary w-full" onClick={onClose}>Finish</button>
      </div>

    </div>
  );
};

export default SettingsModal;
