import React, { useState, memo } from 'react';

const BookmarkIcon = memo(({ link, categoryIcon }) => {
  const getHostname = (url) => {
    try {
      return new URL(url.startsWith('http') ? url : 'http://' + url).hostname;
    } catch (e) {
      return '';
    }
  };

  const [src, setSrc] = useState(link.icon || `https://www.google.com/s2/favicons?domain=${getHostname(link.url)}&sz=64`);
  const [errorCount, setErrorCount] = useState(0);

  const handleError = () => {
    if (errorCount === 0 && link.optional_icon) {
      setSrc(link.optional_icon);
    } else if (errorCount === 1) {
      const hostname = getHostname(link.url);
      setSrc(hostname ? `https://icons.duckduckgo.com/ip3/${hostname}.ico` : null);
    } else {
      setSrc(null);
    }
    setErrorCount(errorCount + 1);
  };

  if (!src) return <div className="card-icon" style={{display:'grid', placeItems:'center', background:'var(--bg)'}}><span className="material-icons">{categoryIcon}</span></div>;

  if (src.length < 5 && !src.includes('/') && !src.includes('.')) {
    const isMaterialIcon = /^[a-z0-9_]+$/.test(src);
    return (
      <div className="card-icon" style={{display:'grid', placeItems:'center', background:'var(--bg)', fontSize: isMaterialIcon ? 'inherit' : '24px'}}>
        {isMaterialIcon ? <span className="material-icons">{src}</span> : src}
      </div>
    );
  }

  return <img src={src} className="card-icon" loading="lazy" onError={handleError} alt="" />;
});

export default BookmarkIcon;
