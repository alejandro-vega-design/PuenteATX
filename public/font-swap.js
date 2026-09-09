// Companion to the media="print" trick in index.html: swaps each marked font
// stylesheet to media="all" once it finishes loading, without a blocking
// request. Kept as an external file (not an inline onload="...") because the
// site's Content-Security-Policy has no 'unsafe-inline' in script-src —
// CSP treats an inline event-handler attribute as inline script and blocks it.
document.querySelectorAll('link[data-swap-media]').forEach(link => {
  link.addEventListener('load', () => { link.media = 'all'; });
});
