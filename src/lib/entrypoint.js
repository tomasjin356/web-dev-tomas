/**
 * @fileoverview Site entrypoint. This runs only in supported browsers and is
 * dynamically inserted by "bootstrap.js" if the user's browser is supported.
 *
 * This is web.dev's core JS bundle; it includes unistore, routing, Service
 * Worker initialization, component loading for routes, et al.
 */

import './webcomponents-config'; // must go before -loader below
import '@webcomponents/webcomponentsjs/webcomponents-loader.js';
import {swapContent, getPartial} from './loader';
import * as router from './utils/router';
import {store} from './store';
import removeServiceWorkers from './utils/sw-remove';

WebComponents.waitFor(async () => {
  // TODO(samthor): This isn't quite the right class name because not all Web Components are ready
  // at this point due to code-splitting.
  document.body.classList.remove('unresolved');

  // Run as long-lived router w/ history & "<a>" bindings
  // Also immediately calls `swapContent()` handler for current location,
  // loading its required JS entrypoint
  router.listen(swapContent);

  // If the site becomes online again, and the special offline page was shown,
  // then trigger a reload
  window.addEventListener('online', () => {
    const {isOffline} = store.getState();
    if (isOffline) {
      router.reload();
    }
  });
});

if (serviceWorkerIsSupported(window.location.hostname)) {
  ensureServiceWorker();
} else {
  removeServiceWorkers();
}

function serviceWorkerIsSupported(hostname) {
  // Allow local/prod as well as .netlify staging deploy target.
  const allowedHostnames = ['web.dev', 'localhost'];
  return (
    'serviceWorker' in navigator &&
    (allowedHostnames.includes(hostname) || hostname.endsWith('.netlify.com'))
  );
}

function ensureServiceWorker() {
  const ensurePartialCache = (isFirstInstall = false) => {
    const {pathname} = window.location;
    if (isFirstInstall) {
      // We don't fetch the partial for the initial, real, HTML fetch from out HTTP server. This
      // ensures that if the user goes offline and reloads for some reason, the page still loads.
      getPartial(pathname);
    }
    if (pathname !== '/') {
      // Aggressively refetch the landing page every time the site is loaded.
      // TODO(samthor): Check Workbox's cache time and fetch if needed. Additionally, cache a
      // number of recent articles.
      getPartial('/');
    }
  };

  const isFirstInstall = !navigator.serviceWorker.controller;
  if (isFirstInstall) {
    // Watch for the brand new Service Worker to be activated. We claim this foreground page
    // inside the Service Worker, so this event will fire when it is activated.
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      ensurePartialCache(true);
    });
  } else {
    // This isn't the first install, but ensure some partials are up-to-date.
    ensurePartialCache();

    // We claim active clients if the Service Worker's architecture rev changes. We can't
    // reliably force a reload via the Client interface as it's unsupported in Safari.
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }
  navigator.serviceWorker.register('/sw.js');
}
