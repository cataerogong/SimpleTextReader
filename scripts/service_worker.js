let cacheStorageKey = 'SimpleTextReader-enhance-PWA-1';

let cacheList = [
    "./index.html",
    "./fonts/qiji-combo.woff",
    "./fonts/FZSKBXKK.woff2",
    "./fonts/LXGWWenKai-Regular.woff2",
    "./images/drop.png",
    "./images/loading_geometry.gif",
    "./images/seal_CN.png",
    "./images/seal_EN.png",
    "./images/note_CN.png",
    "./images/note_EN.png",
    "./images/icon.png",
    "./css/darkmode_toggle.css",
    "./css/ui_variables.css",
    "./css/ui.css",
    "./css/reader.css",
    "./css/footnotes.css",
    "./css/enhance.css",
    "./scripts/jquery.min.js",
    "./scripts/jschardet.min.js",
    "./scripts/css-global-variables.js",
    "./scripts/regex_rules.js",
    "./scripts/utilities.js",
    "./scripts/footnotes.js",
    "./scripts/ui_variables.js",
    "./scripts/processText.js",
    "./scripts/ui_helpers.js",
    "./scripts/ui.js",
    "./scripts/webdav.js",
    "./scripts/enhance-db.js",
    "./scripts/enhance.js",
];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(cacheStorageKey)
            .then(cache => cache.addAll(cacheList))
            .then(() => self.skipWaiting())
    )
});
