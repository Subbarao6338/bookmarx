export const Utils = {
  getHostname(urlStr) {
    try {
      return new URL(urlStr).hostname;
    } catch (e) {
      return urlStr.replace(/^https?:\/\//, '').split('/')[0];
    }
  },

  tryUrlWithFallback(urls, linkTitle) {
    if (!urls || urls.length === 0) return;
    const primaryUrl = urls[0];
    const win = window.open(primaryUrl, '_blank', 'noopener,noreferrer');
    if (urls.length > 1 && (!win || win.closed || typeof win.closed === 'undefined')) {
      let tried = 1;
      const tryNext = () => {
        if (tried < urls.length) {
          window.open(urls[tried], '_blank', 'noopener,noreferrer');
          tried++;
          setTimeout(tryNext, 500);
        }
      };
      setTimeout(tryNext, 300);
    }
  }
};
