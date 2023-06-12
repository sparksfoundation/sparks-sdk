
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
    MockWindow.windows[origin] = this;
  }

  open(origin, target, specs) {
    if (MockWindow.windows[origin]) {
      MockWindow.windows[origin].opener = this;
      return MockWindow.windows[origin];
    }
    this.name = name;
    this.origin = origin;
    return this;
  }

  addEventListener(event, callback) {
    if (event === 'message') {
      this.messageListeners.push(callback);
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
    if (origin === this.origin) {
      const event = {
        data: message,
        origin: this.origin,
        source: this,
      };
      this.messageListeners.forEach(callback => callback(event));
    }
  }
}

export default MockWindow;