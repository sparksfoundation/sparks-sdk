// src/utilities/index.ts
import nacl from "tweetnacl";
import util from "tweetnacl-util";
import { createId, isCuid } from "@paralleldrive/cuid2";
function utcEpochTimestamp() {
  const now = /* @__PURE__ */ new Date();
  return now.getTime() + now.getTimezoneOffset() * 60 * 1e3;
}
function randomCuid() {
  return createId();
}
function validCuid(id) {
  return isCuid(id);
}
function snakeToPascal(str) {
  return str.toLowerCase().replace(/_([a-z])/g, (_, char) => char.toUpperCase()).replace(/^[a-z]/, (char) => char.toUpperCase());
}

// src/events/SparkEvent/index.ts
var SparkEvent = class {
  type;
  timestamp;
  metadata;
  data;
  digest;
  constructor(args) {
    this.type = args.type;
    this.metadata = args.metadata;
    this.timestamp = args.timestamp;
    if (args.data)
      this.data = args.data;
    if (args.digest)
      this.digest = args.digest;
  }
};
var SparkRequestEvent = class extends SparkEvent {
};
var SparkConfirmEvent = class extends SparkEvent {
};
var SparkErrorEvent = class extends SparkEvent {
};
var createEvent = (params) => {
  const { type, data, digest } = params;
  const timestamp = utcEpochTimestamp();
  const metadata = { ...params.metadata || {}, eventId: randomCuid() };
  const invalidEvent = !type.endsWith("_REQUEST") && !type.endsWith("_CONFIRM") && !type.endsWith("_ERROR");
  const invalidParams = !!(data && digest || !data && !digest);
  let event;
  if (!!data)
    event = new SparkEvent({ type, metadata, timestamp, data });
  else if (!!digest)
    event = new SparkEvent({ type, metadata, timestamp, digest });
  else
    event = null;
  if (invalidEvent || invalidParams || !event) {
    throw new SparkEvent({
      type: "CREATE_EVENT_ERROR",
      metadata: {
        eventId: randomCuid()
      },
      timestamp,
      data: { message: invalidEvent ? `Invalid event type: ${type}` : `Invalid event params: ${JSON.stringify(params)}` }
    });
  }
  const isError = event.type.endsWith("_ERROR");
  return event;
};

// src/errors/channels.ts
var ChannelErrorTypes = {
  CHANNEL_INVALID_PEER_INFO_ERROR: "CHANNEL_INVALID_PEER_INFO_ERROR",
  CHANNEL_INVALID_MESSAGE_ERROR: "CHANNEL_INVALID_MESSAGE_ERROR",
  CHANNEL_RECEIPT_ERROR: "CHANNEL_RECEIPT_ERROR",
  CHANNEL_SEND_EVENT_ERROR: "CHANNEL_UNEXPECTED_SEND_EVENT_ERROR",
  CHANNEL_HANDLE_EVENT_ERROR: "CHANNEL_UNEXPECTED_HANDLE_EVENT_ERROR",
  CHANNEL_REQUEST_TIMEOUT_ERROR: "CHANNEL_TIMEOUT_ERROR",
  CHANNEL_UNEXPECTED_ERROR: "CHANNEL_UNEXPECTED_ERROR",
  CHANNEL_LOG_EVENT_ERROR: "CHANNEL_LOG_EVENT_ERROR",
  CHANNEL_CLOSED_ERROR: "CHANNEL_CLOSED_ERROR",
  CHANNEL_NO_STREAMS_AVAILABLE_ERROR: "CHANNEL_NO_STREAMS_AVAILABLE_ERROR"
};
var ChannelErrors = {
  CHANNEL_INVALID_PEER_INFO_ERROR: ({ metadata = {} } = {}) => createEvent({
    type: ChannelErrorTypes.CHANNEL_INVALID_PEER_INFO_ERROR,
    metadata: { ...metadata },
    data: { message: "Missing peer info." }
  }),
  CHANNEL_RECEIPT_ERROR: ({ metadata = {}, message } = {}) => createEvent({
    type: ChannelErrorTypes.CHANNEL_RECEIPT_ERROR,
    metadata: { ...metadata },
    data: { message: message || "Invalid receipt." }
  }),
  CHANNEL_INVALID_MESSAGE_ERROR: ({ metadata = {}, message } = {}) => createEvent({
    type: ChannelErrorTypes.CHANNEL_INVALID_MESSAGE_ERROR,
    metadata: { ...metadata },
    data: { message: message || "Invalid message." }
  }),
  CHANNEL_UNEXPECTED_ERROR: ({ metadata = {}, message } = {}) => createEvent({
    type: ChannelErrorTypes.CHANNEL_UNEXPECTED_ERROR,
    metadata: { ...metadata },
    data: { message: message || "Unexpected channel error." }
  }),
  CHANNEL_SEND_EVENT_ERROR: ({ metadata = {}, message } = {}) => createEvent({
    type: ChannelErrorTypes.CHANNEL_SEND_EVENT_ERROR,
    metadata: { ...metadata },
    data: { message: message || "Unexpected send event error." }
  }),
  CHANNEL_LOG_EVENT_ERROR: ({ metadata = {}, message } = {}) => createEvent({
    type: ChannelErrorTypes.CHANNEL_LOG_EVENT_ERROR,
    metadata: { ...metadata },
    data: { message: message || "Unexpected log event error." }
  }),
  CHANNEL_CLOSED_ERROR: ({ metadata = {}, message } = {}) => createEvent({
    type: ChannelErrorTypes.CHANNEL_CLOSED_ERROR,
    metadata: { ...metadata },
    data: { message: message || "Channel closed error." }
  }),
  CHANNEL_REQUEST_TIMEOUT_ERROR: ({ metadata = {}, message } = {}) => createEvent({
    type: ChannelErrorTypes.CHANNEL_REQUEST_TIMEOUT_ERROR,
    metadata: { ...metadata },
    data: { message: message || "Channel timeout error." }
  }),
  CHANNEL_REJECT_OPEN_REQUEST_ERROR: (request, message) => createEvent({
    type: "OPEN_CONFIRM_ERROR",
    metadata: { channelId: request.metadata.channelId, request: request.metadata },
    data: { message: message || "Channel rejected error." }
  }),
  CHANNEL_NO_STREAMS_AVAILABLE_ERROR: ({ metadata = {}, message } = {}) => createEvent({
    type: ChannelErrorTypes.CHANNEL_NO_STREAMS_AVAILABLE_ERROR,
    metadata: { ...metadata },
    data: { message: message || "No streams available." }
  })
};

// src/channels/SparkChannel/index.ts
import EventEmitter from "eventemitter3";

// src/channels/SparkChannel/events.ts
var ChannelEventTypes = {
  PING_REQUEST: "PING_REQUEST",
  PING_CONFIRM: "PING_CONFIRM",
  OPEN_REQUEST: "OPEN_REQUEST",
  OPEN_CONFIRM: "OPEN_CONFIRM",
  CLOSE_REQUEST: "CLOSE_REQUEST",
  CLOSE_CONFIRM: "CLOSE_CONFIRM",
  MESSAGE_REQUEST: "MESSAGE_REQUEST",
  MESSAGE_CONFIRM: "MESSAGE_CONFIRM",
  CALL_REQUEST: "CALL_REQUEST",
  CALL_CONFIRM: "CALL_CONFIRM",
  HANGUP_REQUEST: "HANGUP_REQUEST",
  HANGUP_CONFIRM: "HANGUP_CONFIRM"
};
var ChannelEvents = {
  PING_REQUEST: ({ metadata }) => createEvent({
    type: ChannelEventTypes.PING_REQUEST,
    metadata: { ...metadata },
    data: {}
  }),
  PING_CONFIRM: ({ metadata }) => createEvent({
    type: ChannelEventTypes.PING_CONFIRM,
    metadata: { ...metadata },
    data: {}
  }),
  OPEN_REQUEST: ({ metadata, data }) => createEvent({
    type: ChannelEventTypes.OPEN_REQUEST,
    metadata: { ...metadata },
    data: { ...data }
  }),
  OPEN_CONFIRM: ({ metadata, data }) => createEvent({
    type: ChannelEventTypes.OPEN_CONFIRM,
    metadata: { ...metadata },
    data: { ...data }
  }),
  CLOSE_REQUEST: ({ metadata, data }) => createEvent({
    type: ChannelEventTypes.CLOSE_REQUEST,
    metadata: { ...metadata },
    data: { ...data }
  }),
  CLOSE_CONFIRM: ({ metadata, data }) => createEvent({
    type: ChannelEventTypes.CLOSE_CONFIRM,
    metadata: { ...metadata },
    data: { ...data }
  }),
  MESSAGE_REQUEST: ({ metadata, digest }) => createEvent({
    type: ChannelEventTypes.MESSAGE_REQUEST,
    metadata: { ...metadata },
    digest
  }),
  MESSAGE_CONFIRM: ({ metadata, digest }) => createEvent({
    type: ChannelEventTypes.MESSAGE_CONFIRM,
    metadata: { ...metadata },
    digest
  }),
  CALL_REQUEST: ({ metadata, data }) => createEvent({
    type: ChannelEventTypes.CALL_REQUEST,
    metadata: { ...metadata },
    data: { ...data }
  }),
  CALL_CONFIRM: ({ metadata, data }) => createEvent({
    type: ChannelEventTypes.CALL_CONFIRM,
    metadata: { ...metadata },
    data: { ...data }
  }),
  HANGUP_REQUEST: ({ metadata, data }) => createEvent({
    type: ChannelEventTypes.HANGUP_REQUEST,
    metadata: { ...metadata },
    data: { ...data }
  }),
  HANGUP_CONFIRM: ({ metadata, data }) => createEvent({
    type: ChannelEventTypes.HANGUP_CONFIRM,
    metadata: { ...metadata },
    data: { ...data }
  })
};

// src/channels/SparkChannel/types.ts
var SparkChannelActions = ["OPEN", "CLOSE", "MESSAGE"];

// src/channels/SparkChannel/index.ts
var SparkChannel = class extends EventEmitter {
  _spark;
  _channelId;
  _type;
  _peer;
  _state;
  _eventLog;
  _eventTypes;
  constructor(params) {
    super();
    this._spark = params.spark;
    this._channelId = params.channelId || randomCuid();
    this._type = params.type;
    this._spark = params.spark;
    this._state = { open: false, ...params.state || {} };
    this._eventLog = params.eventLog || [];
    if (params.peer) {
      this._peer = { ...params.peer };
    }
    const actions = (params?.actions || []).concat(SparkChannelActions);
    this._eventTypes = {
      ANY_EVENT: "ANY_EVENT",
      ANY_REQUEST: "ANY_REQUEST",
      ANY_CONFIRM: "ANY_CONFIRM",
      ANY_ERROR: "ANY_ERROR"
    };
    for (const action of actions) {
      this._eventTypes[`${action}_REQUEST`] = `${action}_REQUEST`;
      this._eventTypes[`${action}_CONFIRM`] = `${action}_CONFIRM`;
      this._eventTypes[`${action}_REQUEST_ERROR`] = `${action}_REQUEST_ERROR`;
      this._eventTypes[`${action}_CONFIRM_ERROR`] = `${action}_CONFIRM_ERROR`;
    }
    const sendEvent = this.sendEvent.bind(this);
    this.sendEvent = async (event) => {
      await sendEvent(event);
      this.eventLog.push({ event, request: true });
    };
    this.sendEvent = this.sendEvent.bind(this);
    this.handleEvent = this.handleEvent.bind(this);
  }
  get channelId() {
    return this._channelId;
  }
  get type() {
    return this._type;
  }
  get peer() {
    return this._peer;
  }
  get state() {
    return this._state;
  }
  get eventLog() {
    return this._eventLog;
  }
  get eventTypes() {
    return this._eventTypes;
  }
  async isValidEventPayload(payload = {}) {
    const { type, data, digest, timestamp, metadata } = payload || {};
    if (!type || !(data || digest) || !timestamp || !metadata)
      return false;
    const validEventType = type && this.eventTypes[type];
    const validPayload = data || digest && !(data && digest);
    const validTimestamp = timestamp && typeof timestamp === "number";
    const validMetadata = metadata && typeof metadata === "object";
    const validChannelId = metadata?.channelId === this.channelId && validCuid(metadata?.channelId);
    const validEventId = metadata?.eventId && validCuid(metadata?.eventId);
    return validEventType && validPayload && validTimestamp && validMetadata && validChannelId && validEventId;
  }
  getRequestMethodName(type) {
    const baseType = type.replace("_REQUEST", "");
    const camelType = snakeToPascal(baseType);
    return `on${camelType}Requested`;
  }
  getConfirmMethodName(type) {
    const baseType = type.replace("_CONFIRM", "");
    const camelType = snakeToPascal(baseType);
    return `on${camelType}Confirmed`;
  }
  async getEventData(event, ourEvent) {
    const { data, digest } = event;
    if (!digest && data)
      return data;
    const publicKey = ourEvent ? this._spark.publicKeys?.signer : this.peer?.publicKeys?.signer;
    const opened = await this._spark.signer.open({ signature: digest, publicKey });
    const decrypted = await this._spark.cipher.decrypt({ data: opened, sharedKey: this.peer.sharedKey });
    return decrypted;
  }
  async getReceiptData(event) {
    const data = await this.getEventData(event);
    const { receipt } = data;
    const opened = await this._spark.signer.open({ signature: receipt, publicKey: this.peer?.publicKeys?.signer });
    return opened;
  }
  async dispatchRequest(event, { timeout = 1e4, retries = 0 } = {}) {
    return new Promise((resolve, reject) => {
      const { type, metadata } = event;
      const confirmType = type.replace("_REQUEST", "_CONFIRM");
      const errorType = `${confirmType}_ERROR`;
      let timeoutId;
      const onConfirm = async (confirm) => {
        try {
          if (confirm.type !== confirmType)
            return;
          const receipt = await this.getReceiptData(confirm);
          if (receipt.metadata.eventId !== metadata.eventId)
            return;
          clearTimeout(timeoutId);
          this.off(confirmType, onConfirm);
          resolve(confirm);
        } catch (error) {
          reject(error);
        }
      };
      this.on(confirmType, onConfirm);
      const onError = (error) => {
        const requestId = error.metadata.request.eventId;
        if (requestId !== event.metadata.eventId)
          return;
        clearTimeout(timeoutId);
        this.off(confirmType, onConfirm);
        this.off(error.type, onError);
        reject(error);
      };
      this.on(errorType, onError);
      timeoutId = setTimeout(() => {
        this.off(confirmType, onConfirm);
        this.off(errorType, onError);
        if (retries > 0) {
          this.dispatchRequest(event, { timeout, retries: retries - 1 }).then(resolve).catch(reject);
          return;
        }
        const timeoutError = ChannelErrors.CHANNEL_REQUEST_TIMEOUT_ERROR({
          metadata: { channelId: this.channelId },
          message: `Timeout waiting for ${confirmType} event.`
        });
        this.emit(timeoutError.type, timeoutError);
        reject(timeoutError);
      }, timeout);
      this.sendEvent(event);
    });
  }
  async handleEvent(payload = {}) {
    try {
      if (!this.isValidEventPayload(payload)) {
        return Promise.resolve();
      }
      const { type, data, digest, timestamp, metadata } = payload || {};
      switch (true) {
        case type.endsWith("_REQUEST"):
          const request = new SparkRequestEvent({ type, data, digest, timestamp, metadata });
          const onRequestMethod = this.getRequestMethodName(type);
          await this[onRequestMethod](request);
          this.eventLog.push({ event: request, response: true });
          this.emit(type, request);
          break;
        case type.endsWith("_CONFIRM"):
          const confirm = new SparkConfirmEvent({ type, data, digest, timestamp, metadata });
          const onConfirmMethod = this.getConfirmMethodName(type);
          await this[onConfirmMethod](confirm);
          this.eventLog.push({ event: confirm, response: true });
          this.emit(type, confirm);
          break;
        case type.endsWith("_ERROR"):
          const error = new SparkErrorEvent({ type, data, digest, timestamp, metadata });
          this.emit(type, error);
          break;
      }
    } catch (error) {
      console.log(error);
      const type = `${payload.type}_ERROR`;
      const metadata = payload.type.endsWith("_REQUEST") ? { channelId: this.channelId, request: payload?.metadata } : { channelId: this.channelId, confirm: payload?.metadata };
      const data = { message: error?.message };
      const errorEvent = createEvent({ type, metadata, data });
      this.emit(type, errorEvent);
      await this.sendEvent(errorEvent);
      return Promise.reject(errorEvent);
    }
  }
  import(params) {
    const { channelId, type, peer, eventLog } = params;
    this._channelId = channelId;
    this._type = type;
    this._peer = peer;
    this._eventLog = eventLog;
  }
  export() {
    return {
      channelId: this.channelId,
      type: this.type,
      peer: this.peer,
      eventLog: this.eventLog
    };
  }
  async open(params, options) {
    if (!this._spark.identifier || !this._spark.publicKeys || !this._spark.publicKeys.signer || !this._spark.publicKeys.cipher) {
      throw ChannelErrors.CHANNEL_INVALID_PEER_INFO_ERROR({ metadata: { channelId: this.channelId } });
    }
    const request = ChannelEvents.OPEN_REQUEST({
      metadata: { channelId: this.channelId },
      data: {
        identifier: this._spark.identifier,
        publicKeys: this._spark.publicKeys,
        ...params?.data || {}
      }
    });
    await this.dispatchRequest(request, options);
    return Promise.resolve(this);
  }
  async onOpenRequested(event) {
    const { data: { identifier, publicKeys } } = event;
    if (!identifier || !publicKeys || !publicKeys.signer || !publicKeys.cipher) {
      throw ChannelErrors.CHANNEL_INVALID_PEER_INFO_ERROR({ metadata: { channelId: this.channelId } });
    }
    this.peer.sharedKey = await this._spark.cipher.generateSharedKey({ publicKey: publicKeys.cipher });
    this.peer.identifier = identifier;
    this.peer.publicKeys = publicKeys;
    const confirm = await this.confirmOpen(event);
    this.state.open = true;
    return confirm;
  }
  async confirmOpen(event) {
    const receiptData = {
      type: ChannelEventTypes.OPEN_REQUEST,
      timestamp: event.timestamp,
      metadata: { channelId: this.channelId, eventId: event.metadata.eventId },
      data: { peers: [this._spark.identifier, this.peer.identifier] }
    };
    const confirm = ChannelEvents.OPEN_CONFIRM({
      metadata: { channelId: this.channelId },
      data: {
        identifier: this._spark.identifier,
        publicKeys: this._spark.publicKeys,
        receipt: await this._spark.signer.seal({ data: receiptData })
      }
    });
    return this.sendEvent(confirm);
  }
  async onOpenConfirmed(event) {
    const { data } = event;
    const { identifier, publicKeys, receipt } = data;
    if (!identifier || !publicKeys || !publicKeys.signer || !publicKeys.cipher) {
      throw ChannelErrors.CHANNEL_INVALID_PEER_INFO_ERROR({ metadata: { channelId: this.channelId } });
    }
    this.peer.sharedKey = await this._spark.cipher.generateSharedKey({ publicKey: publicKeys.cipher });
    this.peer.identifier = identifier;
    this.peer.publicKeys = publicKeys;
    this.state.open = true;
    return Promise.resolve();
  }
  async close(params, options) {
    if (!this.state.open)
      throw ChannelErrors.CHANNEL_CLOSED_ERROR({ metadata: { channelId: this.channelId } });
    const request = ChannelEvents.CLOSE_REQUEST({
      metadata: { channelId: this.channelId },
      data: { ...params?.data || {} }
    });
    return this.dispatchRequest(request, options);
  }
  async onCloseRequested(event) {
    const confirm = await this.confirmClose(event);
    this.state.open = false;
    return confirm;
  }
  async confirmClose(event) {
    const receiptData = {
      type: ChannelEventTypes.CLOSE_REQUEST,
      timestamp: event.timestamp,
      metadata: { channelId: this.channelId, eventId: event.metadata.eventId },
      data: {
        peers: [
          this._spark.identifier,
          this.peer.identifier
        ]
      }
    };
    const receipt = await this._spark.signer.seal({ data: receiptData });
    const confirm = ChannelEvents.CLOSE_CONFIRM({
      metadata: { channelId: this.channelId },
      data: { receipt }
    });
    return this.sendEvent(confirm);
  }
  async onCloseConfirmed(event) {
    this.state.open = false;
    return Promise.resolve();
  }
  async message(message, options) {
    if (!this.state.open) {
      throw ChannelErrors.CHANNEL_CLOSED_ERROR({ metadata: { channelId: this.channelId } });
    }
    if (!message) {
      throw ChannelErrors.CHANNEL_INVALID_MESSAGE_ERROR({ metadata: { channelId: this.channelId } });
    }
    const data = { message };
    const encrypted = await this._spark.cipher.encrypt({ data, sharedKey: this.peer.sharedKey });
    const digest = await this._spark.signer.seal({ data: encrypted });
    const request = ChannelEvents.MESSAGE_REQUEST({
      metadata: { channelId: this.channelId },
      digest
    });
    return this.dispatchRequest(request, options);
  }
  async onMessageRequested(event) {
    await this.confirmMessage(event);
  }
  async confirmMessage(event) {
    if (!this.state.open) {
      throw ChannelErrors.CHANNEL_CLOSED_ERROR({ metadata: { channelId: this.channelId } });
    }
    const { digest } = event;
    if (!digest) {
      throw ChannelErrors.CHANNEL_INVALID_MESSAGE_ERROR({ metadata: { channelId: this.channelId } });
    }
    const opened = await this._spark.signer.open({ signature: digest, publicKey: this.peer?.publicKeys?.signer });
    const decrypted = await this._spark.cipher.decrypt({ data: opened, sharedKey: this.peer.sharedKey });
    const receiptData = {
      type: ChannelEventTypes.MESSAGE_REQUEST,
      timestamp: event.timestamp,
      metadata: { channelId: this.channelId, eventId: event.metadata.eventId },
      data: decrypted
    };
    const digestData = {
      receipt: await this._spark.signer.seal({ data: receiptData })
    };
    const encrypted = await this._spark.cipher.encrypt({ data: digestData, sharedKey: this.peer.sharedKey });
    const confirmDigest = await this._spark.signer.seal({ data: encrypted });
    const confirm = ChannelEvents.MESSAGE_CONFIRM({
      metadata: { channelId: this.channelId },
      digest: confirmDigest
    });
    return this.sendEvent(confirm);
  }
  async onMessageConfirmed(event) {
    return Promise.resolve();
  }
  // extend event emitter to accomodate arrays of events for listeners and emitter methods
  emit(event, ...args) {
    const emitted = super.emit(event, ...args);
    const type = event;
    if (type.endsWith("_REQUEST") || type.endsWith("_CONFIRM")) {
      super.emit("ANY_EVENT", ...args);
    }
    if (type.endsWith("_REQUEST")) {
      super.emit("ANY_REQUEST", ...args);
    }
    if (type.endsWith("_CONFIRM")) {
      super.emit("ANY_CONFIRM", ...args);
    }
    if (type.endsWith("_ERROR")) {
      super.emit("ANY_ERROR", ...args);
    }
    return emitted;
  }
  on(event, listener) {
    if (Array.isArray(event)) {
      for (const e of event) {
        super.on(e, listener);
      }
      return this;
    }
    return super.on(event, listener);
  }
  once(event, listener) {
    if (Array.isArray(event)) {
      for (const e of event) {
        super.once(e, listener);
      }
      return this;
    }
    return super.once(event, listener);
  }
  off(event, listener) {
    if (Array.isArray(event)) {
      for (const e of event) {
        super.off(e, listener);
      }
      return this;
    }
    return super.off(event, listener);
  }
  removeListener(event, fn, context, once) {
    if (Array.isArray(event)) {
      for (const e of event) {
        super.removeListener(e, fn, context, once);
      }
      return this;
    }
    return super.removeListener(event, fn, context, once);
  }
};

// src/channels/PostMessage/index.ts
var PostMessage = class _PostMessage extends SparkChannel {
  constructor(params) {
    const type = "PostMessage";
    const { _window, source, peer, ...rest } = params;
    super({ ...rest, type, peer });
    this.peer.url = peer?.url || peer?.origin;
    this.peer.origin = peer?.origin || new URL(peer?.url).origin;
    this.state.window = _window || window;
    this.state.source = source;
    this.handleEvent = this.handleEvent.bind(this);
    this.state.window.addEventListener("message", this.handleEvent);
    this.state.window.addEventListener("beforeunload", async () => {
      await this.close();
      this.state.window.removeEventListener("message", this.handleEvent);
    });
  }
  async open(params = {}) {
    if (!this.state.source) {
      this.state.source = this.state.window.open(this.peer.url, "_blank");
    }
    const { data, ...rest } = params;
    return await super.open({ data: { ...data, url: this.state.window.href, origin: this.state.window.origin }, ...rest });
  }
  async onOpenRequested(request) {
    this.peer.url = request.data.url || request.data.origin;
    this.peer.origin = request.data.origin || new URL(request.data.url).origin;
    await super.onOpenRequested(request);
  }
  async confirmOpen(request) {
    request.data.origin = this.state.window.origin;
    request.data.url = this.state.window.href;
    await super.confirmOpen(request);
  }
  async close(params = {}, options) {
    return new Promise((resolve, reject) => {
      super.close(params, options).then(resolve).catch((error) => {
        this.onCloseConfirmed(null);
        reject(error);
      });
    });
  }
  async onCloseConfirmed(confirm) {
    await super.onCloseConfirmed(confirm);
    this.state.window.removeEventListener("message", this.handleEvent);
    this.state.source = null;
  }
  async onCloseRequested(request) {
    await super.onCloseRequested(request);
    this.state.source = null;
    this.state.window.removeEventListener("message", this.handleEvent);
  }
  async handleEvent(payload) {
    await super.handleEvent(payload.data);
  }
  sendEvent(event) {
    this.state.source.postMessage(event, this.peer.origin);
    return Promise.resolve();
  }
  export() {
    return {
      ...super.export(),
      type: this.type,
      peer: {
        ...this.peer,
        origin: this.peer.origin,
        url: this.peer.url
      }
    };
  }
  async import(data) {
    super.import(data);
    this.peer.origin = data.peer.origin || new URL(data.peer.url).origin;
    this.peer.url = data.peer.url || data.peer.origin;
  }
  static receive = (callback, options) => {
    const { _window, _source, spark } = options;
    const win = _window || window;
    win.addEventListener("message", async (event) => {
      const { source, origin } = event;
      const { type, data, metadata } = event.data;
      if (type !== "OPEN_REQUEST")
        return;
      const confirmOpen = () => {
        return new Promise(async (resolve, reject) => {
          const channel = new _PostMessage({
            _window: win,
            channelId: metadata.channelId,
            peer: { ...data.peer, origin: origin || _source.origin },
            source: _source || source,
            spark
          });
          channel.on(channel.eventTypes.ANY_ERROR, async (event2) => {
            return reject(event2);
          });
          await channel.handleEvent(event);
          return resolve(channel);
        });
      };
      const rejectOpen = () => {
        const error = ChannelErrors.CHANNEL_REJECT_OPEN_REQUEST_ERROR(event.data);
        (_source || source).postMessage(error, origin);
      };
      return callback({ event: event.data, confirmOpen, rejectOpen });
    });
  };
};
export {
  PostMessage
};
//# sourceMappingURL=index.js.map