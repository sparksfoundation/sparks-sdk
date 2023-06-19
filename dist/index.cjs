'use strict';

const nacl = require('tweetnacl');
const util = require('tweetnacl-util');
const Peer = require('simple-peer');
const scrypt = require('scrypt-pbkdf');
const blake3 = require('@noble/hashes/blake3');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

function _interopNamespaceCompat(e) {
  if (e && typeof e === 'object' && 'default' in e) return e;
  const n = Object.create(null);
  if (e) {
    for (const k in e) {
      n[k] = e[k];
    }
  }
  n.default = e;
  return n;
}

const nacl__default = /*#__PURE__*/_interopDefaultCompat(nacl);
const util__default = /*#__PURE__*/_interopDefaultCompat(util);
const Peer__default = /*#__PURE__*/_interopDefaultCompat(Peer);
const scrypt__namespace = /*#__PURE__*/_interopNamespaceCompat(scrypt);

class Spark {
  constructor(options) {
    this.agents = {};
    this.cipher = new options.cipher(this);
    this.controller = new options.controller(this);
    this.hasher = new options.hasher(this);
    this.signer = new options.signer(this);
    const agents = options.agents || [];
    agents.forEach((agent) => {
      const mixin = new agent(this);
      this.agents[agent.name.toLowerCase()] = mixin;
    });
  }
  get identifier() {
    return this.controller.identifier;
  }
  get keyEventLog() {
    return this.controller.keyEventLog;
  }
  get encryptionKeys() {
    return this.controller.encryptionKeys;
  }
  get signingKeys() {
    return this.controller.signingKeys;
  }
  get publicKeys() {
    return this.controller.publicKeys;
  }
  get keyPairs() {
    return this.controller.keyPairs;
  }
  sign(args) {
    return this.signer.sign(args);
  }
  verify(args) {
    return this.signer.verify(args);
  }
  hash(args) {
    return this.hasher.hash(args);
  }
  encrypt(args) {
    return this.cipher.encrypt(args);
  }
  decrypt(args) {
    return this.cipher.decrypt(args);
  }
  computeSharedKey(args) {
    return this.cipher.computeSharedKey(args);
  }
}

class Agent {
  // TODO define spark interface
  constructor(spark) {
    if (!spark)
      throw new Error("Channel: missing spark");
    this.spark = spark;
    Object.defineProperties(this, { spark: { enumerable: false, writable: false } });
  }
}

class Verifier extends Agent {
  /**
  * Verifies the data integrity and key commitment of the entire event log
  * @param eventLog
  * @returns
  */
  async verifyEventLog(eventLog) {
    const valid = eventLog.every(async (event, index) => {
      let valid2 = true;
      const { previousEventDigest, selfAddressingIdentifier, version, ...eventBody } = event;
      const data = await this.spark.hash(JSON.stringify(eventBody));
      const dataInTact = await this.spark.verify({
        data,
        signature: selfAddressingIdentifier,
        publicKey: event.signingKeys[0]
      });
      valid2 = valid2 === true && dataInTact === true;
      if (index > 0) {
        const keyCommittment = eventLog[index - 1].nextKeyCommitments[0];
        const currenKey = this.spark.hash(event.signingKeys[0]);
        const committmentValid = currenKey === keyCommittment;
        valid2 = valid2 && committmentValid;
      }
      return valid2;
    });
    return valid;
  }
}

class Attester extends Agent {
}

class User extends Agent {
}

function getTimestamp() {
  const now = /* @__PURE__ */ new Date();
  return now.getTime() + now.getTimezoneOffset() * 60 * 1e3;
}
function parseJSON(data) {
  try {
    return JSON.parse(data);
  } catch (e) {
    return data;
  }
}
function randomNonce(len) {
  return util__default.encodeBase64(nacl__default.randomBytes(nacl__default.secretbox.nonceLength));
}

var ChannelActions = /* @__PURE__ */ ((ChannelActions2) => {
  ChannelActions2["CONFIRM"] = "confirm";
  ChannelActions2["ACCEPT"] = "accept";
  ChannelActions2["REJECT"] = "reject";
  return ChannelActions2;
})(ChannelActions || {});
var ChannelTypes = /* @__PURE__ */ ((ChannelTypes2) => {
  ChannelTypes2["POST_MESSAGE"] = "post_message";
  ChannelTypes2["WEB_RTC"] = "web_rtc";
  ChannelTypes2["WEB_SOCKET"] = "web_socket";
  ChannelTypes2["BLUE_TOOTH"] = "blue_tooth";
  ChannelTypes2["NFC"] = "nfc";
  ChannelTypes2["QR_CODE"] = "qr_code";
  ChannelTypes2["REST_API"] = "rest_api";
  ChannelTypes2["FETCH_API"] = "fetch_api";
  return ChannelTypes2;
})(ChannelTypes || {});
var ChannelEventTypes = /* @__PURE__ */ ((ChannelEventTypes2) => {
  ChannelEventTypes2["OPEN_REQUEST"] = "open_request";
  ChannelEventTypes2["OPEN_ACCEPT"] = "open_accept";
  ChannelEventTypes2["OPEN_CONFIRM"] = "open_confirm";
  ChannelEventTypes2["CLOSE_REQUEST"] = "close_request";
  ChannelEventTypes2["CLOSE_CONFIRM"] = "close_confirm";
  ChannelEventTypes2["MESSAGE_SEND"] = "message_send";
  ChannelEventTypes2["MESSAGE_CONFIRM"] = "message_confirm";
  return ChannelEventTypes2;
})(ChannelEventTypes || {});
var ChannelEventConfirmTypes = /* @__PURE__ */ ((ChannelEventConfirmTypes2) => {
  ChannelEventConfirmTypes2["CLOSE_REQUEST"] = "close_request" /* CLOSE_REQUEST */;
  ChannelEventConfirmTypes2["MESSAGE_SEND"] = "message_send" /* MESSAGE_SEND */;
  return ChannelEventConfirmTypes2;
})(ChannelEventConfirmTypes || {});
var ChannelErrorCodes = /* @__PURE__ */ ((ChannelErrorCodes2) => {
  ChannelErrorCodes2["OPEN_REQUEST_ERROR"] = "open_request_error";
  ChannelErrorCodes2["OPEN_ACCEPT_ERROR"] = "open_accept_error";
  ChannelErrorCodes2["OPEN_CONFIRM_ERROR"] = "open_confirm_error";
  ChannelErrorCodes2["TIMEOUT_ERROR"] = "timeout_error";
  ChannelErrorCodes2["CLOSE_REQUEST_ERROR"] = "close_request_error";
  ChannelErrorCodes2["CLOSE_CONFIRM_ERROR"] = "close_confirm_error";
  ChannelErrorCodes2["MESSAGE_SEND_ERROR"] = "message_send_error";
  ChannelErrorCodes2["MESSAGE_CONFIRM_ERROR"] = "message_confirm_error";
  return ChannelErrorCodes2;
})(ChannelErrorCodes || {});

const _Channel = class {
  constructor(args) {
    this._promiseHandlers = /* @__PURE__ */ new Map();
    this._preconnectQueue = [];
    this.onopen = null;
    this.onclose = null;
    this.onmessage = null;
    this.onerror = null;
    this.spark = args.spark;
    if (!this.spark)
      throw new Error("Channel: missing spark");
    Object.defineProperties(this, { spark: { enumerable: false, writable: false } });
    if (!args.channelType)
      throw new Error("Channel: missing channelType");
    this.channelType = args.channelType;
    this.channelId = args.channelId;
    this.identifier = args.identifier;
    this.publicKeys = args.publicKeys;
    this.sharedKey = args.sharedKey;
    this.receipt = args.receipt;
    this.receiveMessage = this.receiveMessage.bind(this);
  }
  get publicSigningKey() {
    return this.publicKeys.signing;
  }
  get sharedEncryptionKey() {
    return this.sharedKey;
  }
  open(payload, action, attempts = 0) {
    return new Promise((resolve, reject) => {
      const request = () => {
        console.log(this.spark.signingKeys.publicKey.slice(0, 4) + " => open request\n");
        const event = {
          eventType: ChannelEventTypes.OPEN_REQUEST,
          eventId: randomNonce(),
          channelId: randomNonce(),
          timestamp: getTimestamp(),
          identifier: this.spark.identifier,
          publicKeys: this.spark.publicKeys
        };
        const timeout = setTimeout(() => {
          if (this._promiseHandlers.has(event.eventId)) {
            this._promiseHandlers.delete(event.eventId);
            if (attempts <= _Channel.OPEN_RETRIES) {
              return this.open(payload, action, attempts + 1);
            } else {
              const payload2 = {
                eventId: event.eventId,
                error: ChannelErrorCodes.TIMEOUT_ERROR,
                message: "Channel open request timed out"
              };
              error(payload2);
            }
          }
        }, _Channel.OPEN_TIMEOUT);
        this._promiseHandlers.set(event.eventId, {
          resolve: (args) => {
            clearTimeout(timeout);
            confirm(args);
          },
          reject: (args) => {
            clearTimeout(timeout);
            error(args);
          }
        });
        this.sendMessage(event);
      };
      const accept = async (args) => {
        console.log(this.spark.signingKeys.publicKey.slice(0, 4) + " => open accept\n");
        const ourInfo = {
          identifier: this.spark.identifier,
          publicKeys: this.spark.publicKeys
        };
        const peerInfo = {
          identifier: args.identifier,
          publicKeys: args.publicKeys
        };
        const peers = [ourInfo, peerInfo];
        const receiptData = {
          channelType: this.channelType,
          channelId: args.channelId,
          timestamp: args.timestamp,
          peers
        };
        const sharedKey = await this.spark.computeSharedKey({ publicKey: args.publicKeys.encryption });
        const ciphertext = await this.spark.encrypt({ data: receiptData, sharedKey });
        const receipt = await this.spark.sign({ data: ciphertext });
        const event = {
          eventType: ChannelEventTypes.OPEN_ACCEPT,
          eventId: args.eventId,
          channelId: args.channelId,
          timestamp: getTimestamp(),
          receipt,
          ...ourInfo
        };
        this._promiseHandlers.set(args.eventId, {
          resolve: confirm,
          reject: error
        });
        this.sendMessage(event);
      };
      const confirm = async (args) => {
        console.log(this.spark.signingKeys.publicKey.slice(0, 4) + " => open confirm\n");
        const peerInfo = {
          identifier: args.identifier,
          publicKeys: args.publicKeys
        };
        const sharedKey = await this.spark.computeSharedKey({ publicKey: args.publicKeys.encryption });
        const channelData = {
          channelId: args.channelId,
          timestamp: args.timestamp,
          sharedKey,
          receipt: args.receipt,
          ...peerInfo
        };
        const openedReceipt = await this.spark.verify({ signature: args.receipt, publicKey: args.publicKeys.signing });
        const decrypted = await this.spark.decrypt({ data: openedReceipt, sharedKey });
        if (!decrypted || !decrypted.channelId || decrypted.channelId !== args.channelId) {
          return error({
            error: ChannelErrorCodes.OPEN_CONFIRM_ERROR,
            eventId: args.eventId,
            message: "failed to open and decrypt receipt"
          });
        }
        const encrypted = await this.spark.encrypt({ data: decrypted, sharedKey });
        const receipt = await this.spark.sign({ data: encrypted });
        const ourInfo = {
          identifier: this.spark.identifier,
          publicKeys: this.spark.publicKeys
        };
        const event = {
          eventType: ChannelEventTypes.OPEN_CONFIRM,
          eventId: args.eventId,
          channelId: args.channelId,
          timestamp: args.timestamp,
          receipt,
          ...ourInfo
        };
        this.sendMessage(event);
        complete(channelData);
      };
      const complete = (args) => {
        console.log(this.spark.signingKeys.publicKey.slice(0, 4) + " => open complete\n");
        Object.keys(args).forEach((key) => {
          this[key] = args[key];
        });
        if (this._preconnectQueue.length) {
          this._preconnectQueue.forEach((event) => {
            this.send(event, ChannelActions.CONFIRM);
          });
          this._preconnectQueue = [];
        }
        if (this.onopen)
          this.onopen(this);
        return resolve(this);
      };
      const deny = (args) => {
        console.log(this.spark.signingKeys.publicKey.slice(0, 4) + " => open deny\n");
        const event = {
          error: ChannelErrorCodes.OPEN_ACCEPT_ERROR,
          eventId: args.eventId,
          message: `open request denied${args.message ? ": " + args.message : ""}`
        };
        this._promiseHandlers.set(event.eventId, {
          resolve: error,
          reject: error
        });
        this.sendMessage(event);
      };
      const error = (args) => {
        console.log(this.spark.signingKeys.publicKey.slice(0, 4) + " => open error\n");
        if (this.onerror)
          this.onerror(args);
        this._promiseHandlers.delete(args.eventId);
        resolve(args);
      };
      if (action === ChannelActions.ACCEPT)
        accept(payload);
      else if (action === ChannelActions.REJECT)
        deny(payload);
      else
        request();
    });
  }
  send(payload, action, attempts = 0) {
    return new Promise((resolve, reject) => {
      const send = async (data) => {
        console.log(this.spark.signingKeys.publicKey.slice(0, 4) + " => send msg request\n");
        const encrypted = await this.spark.encrypt({ data, sharedKey: this.sharedKey });
        const message = await this.spark.sign({ data: encrypted });
        const eventId = randomNonce();
        const messageId = randomNonce();
        const event = {
          eventType: ChannelEventTypes.MESSAGE_SEND,
          eventId,
          messageId,
          channelId: this.channelId,
          timestamp: getTimestamp(),
          message
        };
        const timeout = setTimeout(() => {
          if (this._promiseHandlers.has(event.eventId)) {
            this._promiseHandlers.delete(event.eventId);
            if (attempts <= _Channel.MESSAGE_RETRIES) {
              return this.send(payload, action, attempts + 1);
            } else {
              const payload2 = {
                error: ChannelErrorCodes.TIMEOUT_ERROR,
                eventId: event.eventId,
                message: "message send timed out"
              };
              return error(payload2);
            }
          }
        }, _Channel.MESSAGE_TIMEOUT);
        this._promiseHandlers.set(eventId, {
          resolve: (args) => {
            clearTimeout(timeout);
            receipt(args);
          },
          reject: (args) => {
            clearTimeout(timeout);
            error(args);
          }
        });
        this.sendMessage(event);
      };
      const confirm = async (payload2) => {
        console.log(this.spark.signingKeys.publicKey.slice(0, 4) + " => send msg confirm\n");
        const opened = await this.spark.verify({ signature: payload2.message, publicKey: this.publicKeys.signing });
        const message = await this.spark.decrypt({ data: opened, sharedKey: this.sharedKey });
        if (!message) {
          return error({
            error: ChannelErrorCodes.MESSAGE_CONFIRM_ERROR,
            eventId: payload2.eventId,
            message: "failed to decrypt message"
          });
        }
        const receiptData = {
          messageId: payload2.messageId,
          timestamp: payload2.timestamp,
          message
        };
        const encrypted = await this.spark.encrypt({ data: receiptData, sharedKey: this.sharedKey });
        const receipt2 = await this.spark.sign({ data: encrypted });
        const event = {
          eventType: ChannelEventTypes.MESSAGE_CONFIRM,
          eventId: payload2.eventId,
          messageId: payload2.messageId,
          channelId: this.channelId,
          timestamp: getTimestamp(),
          receipt: receipt2
        };
        this.sendMessage(event);
        complete(receiptData);
      };
      const receipt = (payload2) => {
        if (!payload2.receipt) {
          return error({
            error: ChannelErrorCodes.MESSAGE_CONFIRM_ERROR,
            eventId: payload2.eventId,
            message: "failed to get receipt"
          });
        }
        if (this.onmessage)
          this.onmessage(payload2.receipt);
        return resolve(payload2.receipt);
      };
      const complete = (payload2) => {
        console.log(this.spark.signingKeys.publicKey.slice(0, 4) + " => send msg complete\n");
        if (this.onmessage)
          this.onmessage(payload2);
        return resolve(payload2);
      };
      const error = (payload2) => {
        console.log(this.spark.signingKeys.publicKey.slice(0, 4) + " => send msg error\n");
        if (this.onerror)
          this.onerror(payload2);
        this._promiseHandlers.delete(payload2.eventId);
        return reject(payload2);
      };
      if (action === "confirm")
        confirm(payload);
      else
        send(payload);
    });
  }
  close(payload, action) {
    return new Promise((resolve, reject) => {
      const eventId = randomNonce();
      const close = () => {
        console.log(this.spark.signingKeys.publicKey.slice(0, 4) + " => close request\n");
        const event = {
          eventType: ChannelEventTypes.CLOSE_REQUEST,
          eventId,
          channelId: this.channelId,
          timestamp: getTimestamp()
        };
        const timeout = setTimeout(() => {
          if (this._promiseHandlers.has(event.eventId)) {
            this._promiseHandlers.delete(event.eventId);
            const payload2 = {
              error: ChannelErrorCodes.CLOSE_CONFIRM_ERROR,
              eventId: event.eventId,
              message: "close request timed out, could not get receipt"
            };
            return error(payload2);
          }
        }, _Channel.CLOSE_TIMEOUT);
        this._promiseHandlers.set(eventId, {
          resolve: (args) => {
            clearTimeout(timeout);
            receipt(args);
          },
          reject: (args) => {
            clearTimeout(timeout);
            error(args);
          }
        });
        this.sendMessage(event);
      };
      const confirm = async (payload2) => {
        console.log(this.spark.signingKeys.publicKey.slice(0, 4) + " => close confirm\n");
        const ourInfo = {
          identifier: this.spark.identifier,
          publicKeys: this.spark.publicKeys
        };
        const theirInfo = {
          identifier: this.identifier,
          publicKeys: this.publicKeys
        };
        const receiptData = {
          channelType: this.channelType,
          timestamp: payload2.timestamp,
          channelId: payload2.channelId,
          peers: [ourInfo, theirInfo]
        };
        const encrypted = await this.spark.encrypt({ data: receiptData, sharedKey: this.sharedKey });
        const receipt2 = await this.spark.sign({ data: encrypted });
        const event = {
          eventType: ChannelEventTypes.CLOSE_CONFIRM,
          eventId: payload2.eventId,
          channelId: this.channelId,
          timestamp: getTimestamp(),
          receipt: receipt2
        };
        this.sendMessage(event);
        complete(event);
      };
      const receipt = (payload2) => {
        console.log(this.spark.signingKeys.publicKey.slice(0, 4) + " => close receipt\n");
        if (this.onclose)
          this.onclose(payload2.receipt);
        return resolve(payload2.receipt);
      };
      const complete = (payload2) => {
        console.log(this.spark.signingKeys.publicKey.slice(0, 4) + " => close complete\n");
        if (this.onclose)
          this.onclose(payload2.receipt);
        return resolve(payload2.receipt);
      };
      const error = (payload2) => {
        console.log(this.spark.signingKeys.publicKey.slice(0, 4) + " => close error\n");
        if (this.onerror)
          this.onerror(payload2);
        this._promiseHandlers.delete(payload2.eventId);
        return reject(payload2);
      };
      if (action === ChannelActions.CONFIRM)
        confirm(payload);
      else
        close();
    });
  }
  sendMessage(event) {
    throw new Error("sendMessage not implemented");
  }
  receiveMessage(payload) {
    const { eventType, eventId, messageId } = payload;
    if (!eventType || !eventId)
      return;
    const isEvent = Object.values(ChannelEventTypes).includes(eventType);
    const isError = Object.values(ChannelErrorCodes).includes(eventType);
    const isMessage = eventType === ChannelEventTypes.MESSAGE_SEND;
    const needsConfirm = Object.values(ChannelEventConfirmTypes).includes(eventType);
    if (isError) {
      const handler = this._promiseHandlers.get(eventId);
      this._promiseHandlers.delete(eventId);
      if (handler)
        handler.reject(payload);
    }
    if (isMessage && !this.identifier) {
      this._preconnectQueue.push(payload);
    } else if (needsConfirm) {
      if (eventType === ChannelEventTypes.CLOSE_REQUEST) {
        this.close(payload, ChannelActions.CONFIRM);
      } else if (eventType === ChannelEventTypes.MESSAGE_SEND) {
        this.send(payload, ChannelActions.CONFIRM);
      }
    } else if (isEvent) {
      const handler = this._promiseHandlers.get(eventId);
      this._promiseHandlers.delete(eventId);
      if (handler)
        handler.resolve(payload);
    }
  }
  static receive(callback, options) {
    throw new Error("receive not implemented");
  }
  static channelRequest({ payload, Channel: Channel2, options }) {
    const { eventType, channelId } = payload;
    const isRequest = eventType === ChannelEventTypes.OPEN_REQUEST;
    const hasId = channelId;
    const denied = [];
    if (!isRequest || !hasId)
      return null;
    let channel = new Channel2({
      channelId,
      ...options
    });
    let resolve = async () => {
      if (denied.includes(channelId)) {
        throw new Error("trying to resolve a rejected channel");
      } else {
        return await channel.open(payload, ChannelActions.ACCEPT);
      }
    };
    const reject = (message) => {
      denied.push(channelId);
      channel.open({ ...payload, message }, ChannelActions.REJECT);
    };
    const details = payload;
    return { resolve, reject, details };
  }
};
let Channel = _Channel;
Channel.OPEN_RETRIES = 3;
Channel.OPEN_TIMEOUT = 1e4;
Channel.MESSAGE_RETRIES = 3;
Channel.MESSAGE_TIMEOUT = 1e4;
Channel.CLOSE_TIMEOUT = 1e4;

class PostMessage extends Channel {
  constructor({
    _window,
    source,
    origin,
    spark,
    ...args
  }) {
    super({ channelType: ChannelTypes.POST_MESSAGE, spark, ...args });
    this._window = _window || window || null;
    if (!this._window)
      throw new Error("PostMessage: missing window");
    this.origin = origin;
    this.source = source;
    this._window.addEventListener("message", this.receiveMessage);
  }
  sendMessage(event) {
    this.source.postMessage(event, this.origin);
  }
  receiveMessage(payload) {
    super.receiveMessage(payload.data);
  }
  static receive(callback, { spark, _window }) {
    const win = _window || window;
    win.addEventListener("message", (event) => {
      const source = event.source;
      const origin = event.origin;
      const options = { _window: win, source, origin, spark };
      const request = Channel.channelRequest({
        payload: event.data,
        options,
        Channel: PostMessage
      });
      if (request)
        callback(request);
    });
  }
}

class FetchAPI extends Channel {
  constructor({ url, ...args }) {
    super({ channelType: ChannelTypes.FETCH_API, ...args });
    this.url = url;
    this.sendMessage = this.sendMessage.bind(this);
    this.receiveMessage = this.receiveMessage.bind(this);
  }
  async sendMessage(payload) {
    const response = await fetch(this.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const json = await response.json();
    if (json.error)
      throw new Error(json.error);
    this.receiveMessage(json);
  }
  static async receive() {
    throw new Error("Fetch channels are outgoing only");
  }
}

class WebRTC extends Channel {
  constructor({ peerId, peer, conn, ...args }) {
    super({ channelType: ChannelTypes.WEB_RTC, ...args });
    if (!peerId)
      throw new Error("WebRTC channel requires a peerId");
    if (peer && conn) {
      this.peer = peer;
      this.conn = conn;
      this.conn.on("data", this.receiveMessage);
    }
    this.peerId = peerId;
    this.open = this.open.bind(this);
    this.receiveMessage = this.receiveMessage.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
  }
  async open(payload, action) {
    const isReceiver = this.peer && this.conn;
    if (isReceiver)
      return super.open(payload, action);
    return new Promise((resolve, reject) => {
      this.peer = new Peer__default();
      this.peer.on("error", console.log);
      this.peer.on("open", (id) => {
        console.log("opened");
        console.log(this.peerId);
        const conn = this.peer.connect(this.peerId);
        console.log(conn);
        conn.on("error", console.log);
        conn.on("open", async () => {
          console.log("connected");
          this.conn = conn;
          this.conn.on("data", this.receiveMessage);
          const result = await super.open(payload, action);
          resolve(result);
        });
        this.peer.on("call", function(call) {
          if (!this._oncall)
            return;
          const accept = () => {
            return new Promise((resolve2, reject3) => {
              const navigator = window.navigator;
              const getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
              getUserMedia({ video: true, audio: true }, function(stream) {
                call.answer(stream);
                call.on("stream", function(stream2) {
                  resolve2(stream2);
                });
              });
            });
          };
          const reject2 = () => {
            call.close();
          };
          this._oncall({ call, accept, reject: reject2 });
        });
      });
    });
  }
  receiveMessage(payload) {
    super.receiveMessage(payload);
  }
  sendMessage(payload) {
    this.conn.send(payload);
  }
  call() {
    const navigator = window.navigator;
    if (!this.peer || !this.conn || !this.peerId)
      throw new Error("WebRTC channel not open");
    if (!navigator || !navigator.mediaDevices)
      throw new Error("WebRTC not supported");
    const getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    getUserMedia({ video: true, audio: true }, function(stream) {
      console.log("right here");
      const call = this.peer.call(this.peerId, stream);
      call.on("stream", function(stream2) {
        this.stream = stream2;
      });
    }, function(err) {
      console.log("Failed to get local stream", err);
    });
  }
  oncall(callback) {
    this._oncall = callback;
  }
  static async receive(callback, { spark }) {
    const peer = new Peer__default();
    peer.on("open", (id) => {
      console.log(id);
      peer.on("connection", (conn) => {
        conn.on("open", () => {
          conn.on("data", (payload) => {
            const args = Channel.channelRequest({
              payload,
              options: {
                peerId: conn.peer,
                peer,
                conn,
                spark
              },
              Channel: WebRTC
            });
            if (args)
              callback(args);
          });
        });
      });
    });
  }
}

const _RestAPI = class extends Channel {
  constructor({ ...args }) {
    super({ channelType: ChannelTypes.REST_API, ...args });
    this.receiveMessage = this.receiveMessage.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    _RestAPI.receives.set(this.channelId, this.receiveMessage);
  }
  async sendMessage(payload) {
    const { eventId } = payload;
    if (eventId) {
      const promise = _RestAPI.promises.get(eventId);
      if (promise)
        promise.resolve(payload);
    }
  }
  static receive(callback, { spark }) {
    if (!spark || !callback) {
      throw new Error("missing required arguments: spark, callback");
    }
    _RestAPI.eventHandler = async (payload) => {
      return new Promise((resolve, reject) => {
        const eventId = payload.eventId;
        const eventType = payload.eventType;
        const channelId = payload.channelId;
        if (!eventId || !eventType || !channelId) {
          return reject({ error: "Invalid payload" });
        }
        _RestAPI.promises.set(eventId, { resolve, reject });
        const receive = _RestAPI.receives.get(channelId);
        if (receive)
          return receive(payload);
        if (eventType === "open_request") {
          const args = Channel.channelRequest({
            payload,
            options: {
              spark
            },
            Channel: _RestAPI
          });
          if (args)
            return callback(args);
        }
      });
    };
  }
};
let RestAPI = _RestAPI;
RestAPI.promises = /* @__PURE__ */ new Map();
RestAPI.receives = /* @__PURE__ */ new Map();

<<<<<<< HEAD
class WebRTC extends Channel {
=======
class Cipher {
  constructor(spark) {
    this.spark = spark;
    if (!this.spark)
      throw new Error("Channel: missing spark");
    Object.defineProperties(this, { spark: { enumerable: false, writable: false } });
  }
  async encrypt(args) {
    throw new Error("Not implemented");
  }
  async decrypt(args) {
    throw new Error("Not implemented");
  }
  async computeSharedKey(args) {
    throw new Error("Not implemented");
  }
}

class X25519SalsaPoly extends Cipher {
  async computeSharedKey({ publicKey }) {
    if (!this.spark.encryptionKeys) {
      throw new Error("No key pairs found, please import or incept identity");
    }
    const baseEncryptionPublicKey = util__default.decodeBase64(publicKey);
    const baseEncryptionSecretKey = util__default.decodeBase64(this.spark.encryptionKeys.secretKey);
    const uintSharedKey = nacl__default.box.before(baseEncryptionPublicKey, baseEncryptionSecretKey);
    const baseSharedKey = util__default.encodeBase64(uintSharedKey);
    return baseSharedKey;
  }
  async encrypt({ data, publicKey, sharedKey }) {
    if (!this.spark.encryptionKeys) {
      throw new Error("No key pairs found, please import or incept identity");
    }
    const utfData = typeof data === "string" ? data : JSON.stringify(data);
    const uintData = util__default.decodeUTF8(utfData);
    const nonce = nacl__default.randomBytes(nacl__default.box.nonceLength);
    let box;
    if (publicKey) {
      const publicKeyUint = util__default.decodeBase64(publicKey);
      box = nacl__default.box(uintData, nonce, publicKeyUint, util__default.decodeBase64(this.spark.encryptionKeys.secretKey));
    } else if (sharedKey) {
      const sharedKeyUint = util__default.decodeBase64(sharedKey);
      box = nacl__default.box.after(uintData, nonce, sharedKeyUint);
    } else {
      const secreKeyUint = util__default.decodeBase64(this.spark.encryptionKeys.secretKey);
      box = nacl__default.secretbox(uintData, nonce, secreKeyUint);
    }
    const encrypted = new Uint8Array(nonce.length + box.length);
    encrypted.set(nonce);
    encrypted.set(box, nonce.length);
    return util__default.encodeBase64(encrypted);
  }
  async decrypt({ data, publicKey, sharedKey }) {
    if (!this.spark.keyPairs) {
      throw new Error("No key pairs found, please import or incept identity");
    }
    const uintDataAndNonce = util__default.decodeBase64(data);
    const nonce = uintDataAndNonce.slice(0, nacl__default.secretbox.nonceLength);
    const uintData = uintDataAndNonce.slice(nacl__default.secretbox.nonceLength, uintDataAndNonce.length);
    let decrypted;
    if (publicKey) {
      const publicKeyUint = util__default.decodeBase64(publicKey);
      decrypted = nacl__default.box.open(uintData, nonce, publicKeyUint, util__default.decodeBase64(this.spark.encryptionKeys.secretKey));
    } else if (sharedKey) {
      const sharedKeyUint = util__default.decodeBase64(sharedKey);
      decrypted = nacl__default.box.open.after(uintData, nonce, sharedKeyUint);
    } else {
      const secreKeyUint = util__default.decodeBase64(this.spark.encryptionKeys.secretKey);
      decrypted = nacl__default.secretbox.open(uintData, nonce, secreKeyUint);
    }
    if (!decrypted)
      return null;
    const utf8Result = util__default.encodeUTF8(decrypted);
    const result = parseJSON(utf8Result) || utf8Result;
    return result;
  }
>>>>>>> main
}

var KeriEventType = /* @__PURE__ */ ((KeriEventType2) => {
  KeriEventType2["INCEPTION"] = "incept";
  KeriEventType2["ROTATION"] = "rotate";
  KeriEventType2["DELETION"] = "delete";
  return KeriEventType2;
})(KeriEventType || {});

class Controller {
  constructor(spark) {
    if (!spark)
      throw new Error("Channel: missing spark");
    this.spark = spark;
    Object.defineProperties(this, { spark: { enumerable: false, writable: false } });
    this._keyEventLog = [];
  }
  get identifier() {
    return this._identifier;
  }
  get keyEventLog() {
    return this._keyEventLog;
  }
  get keyPairs() {
    return this._keyPairs;
  }
  get encryptionKeys() {
    return {
      publicKey: this._keyPairs.encryption.publicKey,
      secretKey: this._keyPairs.encryption.secretKey
    };
  }
  get signingKeys() {
    return {
      publicKey: this._keyPairs.signing.publicKey,
      secretKey: this._keyPairs.signing.secretKey
    };
  }
  get secretKeys() {
    return {
      signing: this._keyPairs.signing.secretKey,
      encryption: this._keyPairs.encryption.secretKey
    };
  }
  get publicKeys() {
    return {
      signing: this._keyPairs.signing.publicKey,
      encryption: this._keyPairs.encryption.publicKey
    };
  }
  async incept(args) {
    const { keyPairs, nextKeyPairs, backers = [] } = args || {};
    this._keyPairs = keyPairs;
    const inceptionEvent = await this.keyEvent({
      keyPairs,
      nextKeyPairs,
      eventType: KeriEventType.INCEPTION,
      backers: [...backers]
    });
    if (!inceptionEvent) {
      this._keyPairs = void 0;
      throw new Error("Inception failed");
    }
    const { identifier } = inceptionEvent;
    this._identifier = identifier;
    this._keyPairs = keyPairs;
    this._keyEventLog.push(inceptionEvent);
  }
  async rotate(args) {
    const { keyPairs, nextKeyPairs, backers = [] } = args;
    const rotationEvent = await this.keyEvent({
      keyPairs,
      nextKeyPairs,
      eventType: KeriEventType.ROTATION,
      backers: [...backers]
    });
    if (!rotationEvent)
      throw new Error("Rotation failed");
    this._keyPairs = keyPairs;
    this._keyEventLog.push(rotationEvent);
  }
  async delete(args) {
    const { backers = [] } = args || {};
    const deletionEvent = await this.keyEvent({
      eventType: KeriEventType.DELETION,
      backers: [...backers]
    });
    if (!deletionEvent)
      throw new Error("Deletion failed");
    this._keyPairs = { signing: { publicKey: "", secretKey: "" }, encryption: { publicKey: "", secretKey: "" } };
    this._keyEventLog.push(deletionEvent);
  }
  async keyEvent(args) {
    const { eventType, backers = [] } = args || {};
    const { keyPairs, nextKeyPairs } = args || {};
    const lastEvent = this._keyEventLog[this._keyEventLog.length - 1];
    const keyHash = keyPairs ? await this.spark.hash(keyPairs.signing.publicKey) : null;
    const hasKeyPairs = !!keyPairs && !!nextKeyPairs;
    const isIncepted = !!this.identifier || !!this._keyEventLog?.length;
    const isDeleted = lastEvent?.eventType === KeriEventType.DELETION;
    const isValidCommit = keyHash === lastEvent?.nextKeyCommitments[0];
    if (eventType === KeriEventType.INCEPTION) {
      if (isIncepted)
        throw new Error("Identity already incepted");
      if (!hasKeyPairs)
        throw new Error("current and next key pairs required for inception");
    } else if (eventType === KeriEventType.ROTATION) {
      if (!isIncepted)
        throw Error("Keys can not be rotated before inception");
      if (!hasKeyPairs)
        throw new Error("current and next key pairs required for rotation");
      if (isDeleted)
        throw new Error("Keys can not be rotated after destruction");
      if (!isValidCommit)
        throw new Error("Key commitment does not match the current key commitment");
    } else if (eventType === KeriEventType.DELETION) {
      if (isDeleted)
        throw new Error("Identity has already been deleted");
    }
    const eventIndex = this._keyEventLog.length;
    const nextKeyCommitments = eventType === KeriEventType.DELETION ? [] : [await this.spark.hash(nextKeyPairs.signing.publicKey)];
    const signingKeys = eventType === KeriEventType.DELETION ? [] : [keyPairs.signing.publicKey];
    const event = {
      eventIndex,
      eventType,
      signingThreshold: 1,
      signingKeys,
      nextKeyCommitments,
      backerThreshold: 1,
      backers
    };
    const eventJSON = JSON.stringify(event);
    const version = "KERI10JSON" + eventJSON.length.toString(16).padStart(6, "0") + "_";
    const hashedEvent = await this.spark.hash(eventJSON);
    const signedEventHash = await this.spark.sign({ data: hashedEvent, detached: true });
    const identifier = this.identifier || `B${signedEventHash}`;
    if (eventType === KeriEventType.ROTATION) {
      const previousEventDigest = this._keyEventLog[this._keyEventLog.length - 1].selfAddressingIdentifier;
      if (!previousEventDigest)
        throw new Error("Previous event digest not found");
      event.previousEventDigest = previousEventDigest;
    }
    const keyEvent = {
      ...event,
      identifier,
      selfAddressingIdentifier: signedEventHash,
      version
    };
    return keyEvent;
  }
  // todo - some thinking around how to handle import and export given dynamic agents
  async import({ keyPairs, data }) {
    this._keyPairs = keyPairs;
    const decrypted = await this.spark.decrypt({ data });
    const deepCopy = JSON.parse(JSON.stringify(decrypted));
    delete deepCopy.postMessage;
    Object.assign(this, deepCopy);
  }
  async export() {
    const { _keyPairs, ...data } = this;
    const encrypted = await this.spark.encrypt({ data: JSON.stringify(data) });
    return encrypted;
  }
}

const signingKeyPair$1 = () => {
  const signing = nacl__default.sign.keyPair();
  return {
    publicKey: util__default.encodeBase64(signing.publicKey),
    secretKey: util__default.encodeBase64(signing.secretKey)
  };
};
const encryptionKeyPair$1 = () => {
  const encryption = nacl__default.box.keyPair();
  return {
    publicKey: util__default.encodeBase64(encryption.publicKey),
    secretKey: util__default.encodeBase64(encryption.secretKey)
  };
};
const generateKeyPairs$1 = () => {
  return {
    signing: signingKeyPair$1(),
    encryption: encryptionKeyPair$1()
  };
};
class Random extends Controller {
  constructor() {
    super(...arguments);
    this.randomKeyPairs = [];
  }
  async incept(args) {
    const keyPairs = generateKeyPairs$1();
    const nextKeyPairs = generateKeyPairs$1();
    this.randomKeyPairs = [keyPairs, nextKeyPairs];
    await super.incept({ ...args, keyPairs, nextKeyPairs });
  }
  async rotate(args) {
    const keyPairs = { ...this.randomKeyPairs[this.randomKeyPairs.length - 1] };
    const nextKeyPairs = generateKeyPairs$1();
    this.randomKeyPairs.push(nextKeyPairs);
    await super.rotate({ ...args, keyPairs, nextKeyPairs });
  }
  async import(args) {
    await super.import({ ...args });
  }
}

const generateSalt = (data) => {
  return util__default.encodeBase64(blake3.blake3(JSON.stringify(data)));
};
const signingKeyPair = async ({ password, salt }) => {
  return generateKeyPair({
    password,
    salt,
    naclFunc: nacl__default.sign.keyPair.fromSeed
  });
};
const encryptionKeyPair = async ({ password, salt }) => {
  return generateKeyPair({
    password,
    salt,
    naclFunc: nacl__default.box.keyPair.fromSecretKey
  });
};
const generateKeyPair = async ({ password, salt, naclFunc }) => {
  const options = { N: 16384, r: 8, p: 1 };
  const buffer = await scrypt__namespace.scrypt(
    password,
    salt,
    nacl__default.box.secretKeyLength / 2,
    options
  );
  const seed = [...new Uint8Array(buffer)].map((x) => x.toString(16).padStart(2, "0")).join("");
  const uint8Seed = util__default.decodeUTF8(seed);
  const uint8Keypair = naclFunc(uint8Seed);
  return {
    publicKey: util__default.encodeBase64(uint8Keypair.publicKey),
    secretKey: util__default.encodeBase64(uint8Keypair.secretKey)
  };
};
const generateKeyPairs = async ({ password, salt }) => {
  return Promise.all([signingKeyPair({ password, salt }), encryptionKeyPair({ password, salt })]).then(([signing, encryption]) => {
    return {
      signing,
      encryption
    };
  });
};
class Password extends Controller {
  async incept(args) {
    const { password } = args;
    let salt = util__default.encodeBase64(nacl__default.randomBytes(16));
    const keyPairs = await generateKeyPairs({ password, salt });
    salt = generateSalt(keyPairs.signing.publicKey);
    const nextKeyPairs = await generateKeyPairs({ password, salt });
    await super.incept({ ...args, keyPairs, nextKeyPairs });
    await this.rotate({ ...args, password, newPassword: null });
  }
  async import(args) {
    const { password, salt, data } = args;
    const keyPairs = await generateKeyPairs({ password, salt });
    await super.import({ keyPairs, data });
  }
  async export() {
    const kel = this.keyEventLog;
    const salt = generateSalt(this.getSaltInput(kel));
    const data = await super.export();
    return { data, salt };
  }
  async rotate(args) {
    const { password, newPassword } = args;
    const eventLog = this.keyEventLog;
    let salt, nextKeyPairs, keyPairs, keyHash;
    if (!password)
      throw new Error("Password is required to rotate keys.");
    salt = generateSalt(this.inceptionOnly(eventLog) ? this.inceptionEventSigningKeys(eventLog) : eventLog[eventLog.length - 2]);
    keyPairs = await generateKeyPairs({ password, salt });
    keyHash = await this.spark.hash(keyPairs.signing.publicKey);
    if (keyHash !== this.getLastEvent(eventLog).nextKeyCommitments[0]) {
      throw new Error("Key commitment does not match your previous commitment. If you are trying to change your password provide password & newPassword parameters.");
    }
    salt = generateSalt(this.getLastEvent(eventLog));
    nextKeyPairs = await generateKeyPairs({ password: newPassword || password, salt });
    await super.rotate({ ...args, keyPairs, nextKeyPairs });
    if (newPassword) {
      return await this.rotate({ ...args, password: newPassword });
    }
  }
  getSaltInput(kel) {
    const hasOneRotation = kel.length < 3;
    if (this.inceptionOnly(kel) || hasOneRotation) {
      return this.inceptionEventSigningKeys(kel);
    } else {
      const rotationEvent = kel[kel.length - 3];
      return rotationEvent;
    }
  }
  inceptionEventSigningKeys(kel) {
    return this.getInceptionEvent(kel).signingKeys[0];
  }
  inceptionOnly(kel) {
    return 2 > kel.length;
  }
  getLastEvent(kel) {
    return kel[kel.length - 1];
  }
  getInceptionEvent(kel) {
    return kel[0];
  }
}

class Hasher {
  constructor(spark) {
    if (!spark)
      throw new Error("Channel: missing spark");
    this.spark = spark;
    Object.defineProperties(this, { spark: { enumerable: false, writable: false } });
  }
  async hash(data) {
    return data;
  }
}

class Blake3 extends Hasher {
  async hash(data) {
    const stringData = typeof data !== "string" ? JSON.stringify(data) : data;
    return util__default.encodeBase64(blake3.blake3(stringData));
  }
}

class Signer {
  constructor(spark) {
    if (!spark)
      throw new Error("Channel: missing spark");
    this.spark = spark;
    Object.defineProperties(this, { spark: { enumerable: false, writable: false } });
  }
  async sign({ data, detached = false }) {
    throw new Error("sign not implemented");
  }
  async verify({ publicKey, signature, data }) {
    throw new Error("verify not implemented");
  }
}

class Ed25519 extends Signer {
  async sign({ data, detached = false }) {
    const dataString = typeof data === "string" ? data : JSON.stringify(data);
    const uintData = util__default.decodeUTF8(dataString);
    const uintSecretKey = util__default.decodeBase64(this.spark.signingKeys.secretKey);
    const signature = detached ? util__default.encodeBase64(nacl__default.sign.detached(uintData, uintSecretKey)) : util__default.encodeBase64(nacl__default.sign(uintData, uintSecretKey));
    return signature;
  }
  async verify({ publicKey, signature, data }) {
    if (!publicKey || !signature)
      throw new Error("publicKey and signature are required");
    if (data) {
      if (typeof data !== "string" && !(data instanceof Uint8Array)) {
        data = parseJSON(data);
      }
      data = util__default.decodeUTF8(data);
    }
    const uintSignature = util__default.decodeBase64(signature);
    const uintPublicKey = util__default.decodeBase64(publicKey);
    if (data) {
      return nacl__default.sign.detached.verify(data, uintSignature, uintPublicKey);
    } else {
      const uintResult = nacl__default.sign.open(uintSignature, uintPublicKey);
      if (uintResult === null)
        return uintResult;
      const utf8Result = util__default.encodeUTF8(uintResult);
      return parseJSON(utf8Result) || utf8Result;
    }
  }
}

exports.Agent = Agent;
exports.Attester = Attester;
exports.Blake3 = Blake3;
exports.Channel = Channel;
exports.ChannelActions = ChannelActions;
exports.ChannelErrorCodes = ChannelErrorCodes;
exports.ChannelEventConfirmTypes = ChannelEventConfirmTypes;
exports.ChannelEventTypes = ChannelEventTypes;
exports.ChannelTypes = ChannelTypes;
exports.Cipher = Cipher;
exports.Controller = Controller;
exports.Ed25519 = Ed25519;
exports.FetchAPI = FetchAPI;
exports.Hasher = Hasher;
exports.KeriEventType = KeriEventType;
exports.Password = Password;
exports.PostMessage = PostMessage;
exports.Random = Random;
exports.RestAPI = RestAPI;
exports.Signer = Signer;
exports.Spark = Spark;
exports.User = User;
exports.Verifier = Verifier;
exports.WebRTC = WebRTC;
exports.X25519SalsaPoly = X25519SalsaPoly;
