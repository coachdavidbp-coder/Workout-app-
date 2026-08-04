// Stand-in for `virtual:pwa-register` in PREVIEW builds, which are a single
// inlined file with no service worker for the plugin to register.
export function registerSW() {
  return async () => {};
}
