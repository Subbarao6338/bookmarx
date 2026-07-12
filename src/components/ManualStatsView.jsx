import React, { useState, useEffect, useRef } from 'react';
import htmx from 'htmx.org';

const ManualStatsView = () => {
  const containerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

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

      // 1. If already controlled, we are ready!
      if (checkState()) {
        return;
      }

      // 2. Otherwise, set a defensive fallback timeout of 2.5s (to handle browsers without SW support or blocked SWs)
      timeoutId = setTimeout(() => {
        if (active) {
          console.warn("Service worker controller timeout, forcing ready state");
          setIsReady(true);
        }
      }, 2500);

      // 3. Listen for when a Service Worker takes control
      const handleControllerChange = () => {
        if (checkState()) {
          navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
        }
      };
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

      // Also listen to ready promise just in case
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

  useEffect(() => {
    // Process HTMX attributes when the component is ready and mounts
    if (isReady && containerRef.current) {
      htmx.process(containerRef.current);
    }
  }, [isReady]);

  return (
    <div ref={containerRef} className="manual-stats-wrapper" style={{ padding: '20px 10px', maxWidth: '1200px', margin: '0 auto' }}>
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
          {/* Main Navigation tabs - powered by HTMX! */}
          <div className="manual-stats-nav pill-group" style={{ justifyContent: 'center', gap: '12px', marginBottom: '2rem' }}>
            <button
              className="pill active"
              hx-get="/api/manual?section=overview"
              hx-target="#manual-stats-content"
              hx-swap="innerHTML"
              onClick={(e) => {
                const container = e.currentTarget.parentNode;
                container.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
                e.currentTarget.classList.add('active');
              }}
            >
              <span className="material-icons mr-10" style={{ fontSize: '1.2rem' }}>menu_book</span>
              User Manual
            </button>
            <button
              className="pill"
              hx-post="/api/stats"
              hx-vals="js:{links: localStorage.getItem('hub_links_necs') || '[]'}"
              hx-target="#manual-stats-content"
              hx-swap="innerHTML"
              onClick={(e) => {
                const container = e.currentTarget.parentNode;
                container.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
                e.currentTarget.classList.add('active');
              }}
            >
              <span className="material-icons mr-10" style={{ fontSize: '1.2rem' }}>insights</span>
              Live Analytics
            </button>
          </div>

          {/* Target container where HTMX loads returned HTML blocks dynamically */}
          <div
            id="manual-stats-content"
            hx-get="/api/manual?section=overview"
            hx-trigger="load"
            hx-swap="innerHTML"
            style={{ minHeight: '300px' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 0', gap: '12px' }}>
              <span className="material-icons rotating" style={{ fontSize: '2.5rem', color: 'var(--primary)' }}>refresh</span>
              <p style={{ opacity: 0.7 }}>Retrieving dynamic document via HTMX...</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ManualStatsView;
