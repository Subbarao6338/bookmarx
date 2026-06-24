import React, { useState } from 'react';

const BookmarkModal = ({ link, onClose, onSave }) => {
  const [title, setTitle] = useState(link?.title || '');
  const [url, setUrl] = useState(link?.url || '');
  const [category, setCategory] = useState(link?.category || 'General');
  const [urls, setUrls] = useState(link?.urls ? link.urls.join('\n') : '');
  const [icon, setIcon] = useState(link?.icon || '');

  // Even if unused in this simplified version, let's keep them if App.jsx might pass them
  // or if they are part of the intended data structure.
  const [profileId, setProfileId] = useState(link?.profile_id || 1);

  const handleSubmit = (e) => {
    e.preventDefault();
    const urlsArray = urls.split('\n').map(u => u.trim()).filter(u => u !== '');

    // Basic validation
    if (urlsArray.length === 0 && !url) {
      alert("Please provide at least one URL");
      return;
    }

    onSave({
      title,
      url: urlsArray[0] || url,
      category,
      profile_id: profileId,
      urls: urlsArray.length > 0 ? urlsArray : [url],
      icon: icon || null
    });
  };

  return (
    <div className="modal" style={{ display: 'block' }} onClick={e => e.stopPropagation()}>
      <div className="modal-header-flex">
        <h2>{link ? 'Edit Bookmark' : 'Add Bookmark'}</h2>
        <button className="icon-btn" onClick={onClose}>
          <span className="material-icons">close</span>
        </button>
      </div>
      <div className="modal-content">
        <form onSubmit={handleSubmit} className="tool-form">
          <div className="form-group">
            <label>Title</label>
            <input
              className="pill"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. My Favorite Site"
              required
            />
          </div>
          <div className="form-group">
            <label>Category</label>
            <input
              className="pill"
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="e.g. Tools"
              required
            />
          </div>
          <div className="form-group">
            <label>URLs (one per line)</label>
            <textarea
              className="pill"
              style={{ minHeight: '100px', resize: 'vertical' }}
              value={urls}
              onChange={e => setUrls(e.target.value)}
              placeholder="Enter one or more URLs"
              required={!url}
            />
          </div>
          <div className="form-group">
            <label>Custom Icon (URL or Material Icon name)</label>
            <input
              className="pill"
              value={icon}
              onChange={e => setIcon(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="modal-footer-actions">
            <button type="submit" className="btn-primary w-full">Save Bookmark</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookmarkModal;
