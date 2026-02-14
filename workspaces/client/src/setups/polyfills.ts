const hasWindow = typeof window !== 'undefined';

if (
  hasWindow &&
  (!('Promise' in window) || !('fetch' in window) || !('URL' in window) || !('queueMicrotask' in window))
) {
  void import('core-js');
}

if (typeof globalThis.setImmediate !== 'function') {
  void import('setimmediate');
}

if (!('startViewTransition' in document)) {
  void import('view-transitions-polyfill');
}
