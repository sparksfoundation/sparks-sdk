
// make this a function that returns a different window based on the context it's called in
// eg. global.window = new MockWindow('http://localhost:3000'); -> one instance
// from alice window.open => another instance

class MockWindow {
  static windows = {};

  constructor(origin) {
    this.origin = origin;
    this.messageListeners = [];
    this.opener = null;
    this.location = { origin };
    this.open = this.open.bind(this);
    this.addEventListener = this.addEventListener.bind(this);
    this.removeEventListener = this.removeEventListener.bind(this);
    this.postMessage = this.postMessage.bind(this);
    MockWindow.windows[origin] = this;
  }

  open(origin, target, specs) {
    if (MockWindow.windows[origin]) {
      MockWindow.windows[origin].opener = this;
      return MockWindow.windows[origin];
    } else {
      MockWindow.windows[origin] = new MockWindow(origin);
      MockWindow.windows[origin].opener = this;
      return MockWindow.windows[origin];
    }
  }

  addEventListener(event, callback) {
    if (event === 'message') {
      const window = MockWindow.windows[this.origin];
      window.messageListeners.push(callback);
    }
  }

  removeEventListener(event, callback) {
    if (event === 'message') {
      const index = this.messageListeners.indexOf(callback);
      if (index !== -1) {
        this.messageListeners.splice(index, 1);
      }
    }
  }

  postMessage(message, origin) {
    const window = MockWindow.windows[origin];
    const source = Object.keys(MockWindow.windows).find(key => MockWindow.windows[key] !== this)
    const sourceWin = MockWindow.windows[source];
    if (window) {
      const event = {
        data: message,
        origin: sourceWin.origin,
        source: sourceWin,
      };
      window.messageListeners.forEach(callback => {
        callback(event)
      });
    }
  }
}

export default MockWindow;

const _0000 = new MockWindow('http://localhost:0000');
const _1111 = new MockWindow('http://localhost:1111');
const _2222 = new MockWindow('http://localhost:2222');

export { _0000, _1111 };
