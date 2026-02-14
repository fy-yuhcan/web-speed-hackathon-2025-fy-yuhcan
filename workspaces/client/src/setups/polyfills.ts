import 'core-js';
import 'setimmediate';

if (!('startViewTransition' in document)) {
  void import('view-transitions-polyfill');
}
