import React, { useState, useEffect, useRef } from 'react';
import htmx from 'htmx.org';

const ManualStatsView = () => {
  const contentRef = useRef(null);
  const diagnosticsFormRef = useRef(null);

  const [isReady, setIsReady] = useState(false);
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' | 'stats' | 'diagnostics'

  useEffect(() => {
    let active = true;
    let timeoutId = null;

    if ('serviceWorker' in navigator) {
      const checkState = () => {
        if (navigator.serviceWorker.controller) {
          if (active) {
            clearTimeout(timeoutId);
            setIsReady(true);
          }
          return true;
        }
        return false;
      };

      if (checkState()) {
        return;
      }

      timeoutId = setTimeout(() => {
        if (active) {
          console.warn("Service worker controller timeout, forcing ready state");
          setIsReady(true);
        }
      }, 2500);

      const handleControllerChange = () => {
        if (checkState()) {
          navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
        }
      };
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

      navigator.serviceWorker.ready.then(() => {
        if (checkState()) {
          navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
        }
      });

      return () => {
        active = false;
        if (timeoutId) clearTimeout(timeoutId);
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    } else {
      setIsReady(true);
    }
  }, []);

  // Programmatically trigger HTMX content loading on tab change
  useEffect(() => {
    if (isReady) {
      if (activeTab === 'manual') {
        htmx.ajax('GET', '/api/manual?section=overview', '#manual-stats-content')
          .then(() => {
            if (contentRef.current) htmx.process(contentRef.current);
          });
      } else if (activeTab === 'stats') {
        const links = localStorage.getItem('hub_links_necs') || '[]';
        htmx.ajax('POST', '/api/stats', {
          target: '#manual-stats-content',
          values: { links }
        }).then(() => {
          if (contentRef.current) htmx.process(contentRef.current);
        });
      } else if (activeTab === 'diagnostics') {
        if (diagnosticsFormRef.current) htmx.process(diagnosticsFormRef.current);
      }
    }
  }, [isReady, activeTab]);

  // Hook HTMX swap with Alpine.js to compile dynamic nodes
  useEffect(() => {
    const handleSwap = () => {
      if (window.Alpine) {
        setTimeout(() => {
          try {
            if (typeof window.Alpine.discoverUninitializedComponents === 'function') {
              window.Alpine.discoverUninitializedComponents();
            } else if (typeof window.Alpine.initTree === 'function') {
              window.Alpine.initTree(document.body);
            }
          } catch (e) {
            console.warn("Alpine discovery failed:", e);
          }
        }, 50);
      }
    };
    document.body.addEventListener('htmx:afterSwap', handleSwap);
    return () => document.body.removeEventListener('htmx:afterSwap', handleSwap);
  }, []);

  return (
    <div className="manual-stats-wrapper" style={{ padding: '20px 10px', maxWidth: '1200px', margin: '0 auto' }}>
      <style>{`
        .htmx-indicator {
          display: none;
        }
        .htmx-request .htmx-indicator {
          display: block !important;
        }
        .htmx-request.htmx-indicator {
          display: block !important;
        }
      `}</style>

      <div className="toolbox-page-header" style={{ marginBottom: '2rem' }}>
        <h2>System Guide & Analytics</h2>
        <p>Interactive diagnostics and technical manual powered by HTMX client routing.</p>
      </div>

      {!isReady ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', gap: '12px' }}>
          <span className="material-icons rotating" style={{ fontSize: '2.5rem', color: 'var(--primary)' }}>refresh</span>
          <p style={{ opacity: 0.7 }}>Initializing system diagnostics...</p>
        </div>
      ) : (
        <>
          {/* Main Navigation tabs - 100% pure React to avoid conflict with HTMX DOM mutation */}
          <div className="manual-stats-nav pill-group" style={{ justifyContent: 'center', gap: '12px', marginBottom: '2rem' }}>
            <button
              className={`pill ${activeTab === 'manual' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('manual');
              }}
            >
              <span className="material-icons mr-10" style={{ fontSize: '1.2rem' }}>menu_book</span>
              User Manual
            </button>
            <button
              className={`pill ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('stats');
              }}
            >
              <span className="material-icons mr-10" style={{ fontSize: '1.2rem' }}>insights</span>
              Live Analytics
            </button>
            <button
              className={`pill ${activeTab === 'diagnostics' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('diagnostics');
              }}
            >
              <span className="material-icons mr-10" style={{ fontSize: '1.2rem' }}>troubleshoot</span>
              Diagnostics
            </button>
          </div>

          {activeTab === 'diagnostics' ? (
            <div ref={diagnosticsFormRef} key="diagnostics" className="diagnostics-form-wrapper fade-in" style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
              <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)' }}>
                <h3 style={{ marginTop: 0, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-icons" style={{ color: 'var(--primary)' }}>settings_suggest</span>
                  Interactive System Diagnostics
                </h3>
                <p className="smallest opacity-7" style={{ marginBottom: '1.5rem' }}>Run an automated/manual evaluation to optimize your link speeds and sync configurations.</p>

                <form
                  id="diagnostics-form"
                  hx-post="/api/diagnostics"
                  hx-target="#diagnostics-result"
                  hx-indicator="#diagnostics-indicator"
                  hx-swap="innerHTML"
                  onSubmit={(e) => {
                    e.preventDefault();
                  }}
                >
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Detected Browser Agent</label>
                    <input type="text" name="browser" className="pill" readOnly defaultValue={navigator.userAgent.split(' ')[0] || 'Modern Browser'} style={{ width: '100%', background: 'var(--primary-glow)' }} />
                  </div>

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Network Connection Speed</label>
                    <select name="connectionSpeed" className="pill" style={{ width: '100%', WebkitAppearance: 'none' }}>
                      <option value="fast">Fast Connection (WiFi / 4G / Broadband)</option>
                      <option value="slow">Slow Connection (Offline / Isolated / 2G / 3G)</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Issue or Optimization Goal</label>
                    <select name="issueType" className="pill" style={{ width: '100%', WebkitAppearance: 'none' }}>
                      <option value="none">None (Optimal health check & validation)</option>
                      <option value="slow">Display/Animation latency (Make layout faster)</option>
                      <option value="sync">PocketBase sync issues (Configure connection)</option>
                      <option value="ui">Theme or design issues (Fix card visual styles)</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Additional details / description</label>
                    <textarea name="description" className="pill" placeholder="Describe any behavior or questions..." style={{ width: '100%', minHeight: '80px', resize: 'vertical' }} />
                  </div>

                  <button type="submit" className="pill btn-primary w-full" style={{ padding: '12px' }}>
                    <span className="material-icons mr-10" style={{ fontSize: '1.2rem' }}>play_circle</span> Run Diagnostics Report
                  </button>
                </form>

                {/* HTMX Loading Indicator */}
                <div id="diagnostics-indicator" className="htmx-indicator" style={{ margin: '1rem 0', textAlign: 'center' }}>
                  <span className="material-icons rotating" style={{ color: 'var(--primary)', fontSize: '2rem' }}>refresh</span>
                  <p className="smallest opacity-6">Analyzing environment metrics...</p>
                </div>

                {/* HTMX Swapped Response Container */}
                <div id="diagnostics-result" style={{ marginTop: '1.5rem' }}></div>
              </div>
            </div>
          ) : (
            /* Target container where HTMX loads returned HTML blocks dynamically */
            <div
              ref={contentRef}
              key="manual-stats"
              id="manual-stats-content"
              style={{ minHeight: '300px' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 0', gap: '12px' }}>
                <span className="material-icons rotating" style={{ fontSize: '2.5rem', color: 'var(--primary)' }}>refresh</span>
                <p style={{ opacity: 0.7 }}>Retrieving dynamic document via HTMX...</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ManualStatsView;
