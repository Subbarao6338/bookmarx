import React, { useRef, memo, useCallback } from 'react';
import SafeHighlight from './SafeHighlight';
import BookmarkIcon from './BookmarkIcon';

const BookmarkCard = memo(({ link, idx, openInNewTab, onPin, onLongPress, categoryIcon, hideIcons, hideUrls, searchQuery, noAnimation }) => {
  const pressTimer = useRef(null);
  const isLongPressActive = useRef(false);
  const cardRef = useRef(null);

  const cancelPress = useCallback(() => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }, []);

  const startPress = useCallback((e) => {
    if (e.type === 'mousedown' && e.button !== 0) return;

    const coords = {
      x: e.clientX || (e.touches ? e.touches[0].clientX : 0),
      y: e.clientY || (e.touches ? e.touches[0].clientY : 0)
    };

    cancelPress();
    isLongPressActive.current = false;
    pressTimer.current = setTimeout(() => {
      isLongPressActive.current = true;
      onLongPress(coords);
    }, 500);
  }, [cancelPress, onLongPress]);

  const handleClick = useCallback((e) => {
    if (isLongPressActive.current) {
      isLongPressActive.current = false;
      return;
    }
    window.open(link.url, openInNewTab ? '_blank' : '_self');
  }, [link.url, openInNewTab]);

  const handleContextMenu = useCallback((e) => {
    if (link.urls && link.urls.length > 1) {
        e.preventDefault();
    }
  }, [link.urls]);

  return (
    <div
      ref={cardRef}
      className={`card ${noAnimation ? 'no-animation' : ''}`}
      style={{'--delay': idx}}
      onClick={handleClick}
      onMouseDown={startPress}
      onMouseUp={cancelPress}
      onMouseLeave={cancelPress}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
      onTouchMove={cancelPress}
      onContextMenu={handleContextMenu}
    >
      <div className="card-header">
        {!hideUrls && (
          <div className="card-url">
            <span>{link.url}</span>
          </div>
        )}
      </div>

      <div className="card-body">
        {!hideIcons && <BookmarkIcon link={link} categoryIcon={categoryIcon || 'link'} />}
        <div className="card-title-group">
          <div className="card-title">
            <SafeHighlight text={link.title} query={searchQuery} />
          </div>
        </div>
      </div>

      <div className="card-footer">
        <span className="fallback-badge" title={`This bookmark has ${link.urls?.length || 1} URL(s). Long-press to see all.`}>
          <span className="material-icons">layers</span>
          {link.urls?.length || 1}
        </span>
        <button className={`pin-btn ${link.is_pinned ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onPin(link); }} title={link.is_pinned ? 'Unpin' : 'Pin to Top'}>
          <span className="material-icons">push_pin</span>
        </button>
      </div>
    </div>
  );
});

export default BookmarkCard;
