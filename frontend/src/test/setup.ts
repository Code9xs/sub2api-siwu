const testJsdom = (globalThis as typeof globalThis & { jsdom?: { window: Window } }).jsdom

if (testJsdom) {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: testJsdom.window.localStorage
  })
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: testJsdom.window.sessionStorage
  })
}
