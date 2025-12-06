const CACHE_NAME = "preview";

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only handle requests under /preview/
  if (!url.pathname.startsWith("/preview/")) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(event.request).then((response) => {
        if (response) {
          return response;
        }
        // Fallback to network if not in cache
        return fetch(event.request);
      })
    )
  );
});
