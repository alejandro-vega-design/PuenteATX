// Companion to the media="print" trick in index.html: swaps each marked font
// stylesheet to media="all" once it finishes loading, without a blocking
// request. Kept as an external file (not an inline onload="...") because the
// site's Content-Security-Policy has no 'unsafe-inline' in script-src —
// CSP treats an inline event-handler attribute as inline script and blocks it.
//
// This script tag must stay non-deferred and placed right after the two
// <link> tags below (not moved to <head> with `defer`): the classic loadCSS
// pattern relies on the listener existing before the browser's own fetch of a
// tiny same-origin-adjacent stylesheet can finish. A deferred script runs
// after the whole document is parsed, which is often later than that — the
// `load` event fires and is missed, and the link stays on media="print"
// (invisible) forever. `link.sheet` covers the case where it already
// finished by the time this runs at all.
document.querySelectorAll('link[data-swap-media]').forEach(link => {
  if (link.sheet) { link.media = 'all'; return; }
  link.addEventListener('load', () => { link.media = 'all'; });
});
