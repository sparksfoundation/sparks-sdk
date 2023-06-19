import nacl from 'tweetnacl';
import util from 'tweetnacl-util';
import * as scrypt from 'scrypt-pbkdf';
import { blake3 } from '@noble/hashes/blake3';
import { Peer } from 'peerjs';

var KeriEventType = /* @__PURE__ */ ((KeriEventType2) => {
  KeriEventType2["INCEPTION"] = "inception";
  KeriEventType2["ROTATION"] = "rotation";
  KeriEventType2["DELETION"] = "deletion";
  return KeriEventType2;
})(KeriEventType || {});

class Controller {
  // TODO define spark interface
  constructor(spark) {
    this.spark = spark;
    this.keyEventLog = [];
  }
  get identifier() {
    return this._identifier;
  }
  set identifier(identifier) {
    this._identifier = identifier;
  }
  get encryptionKeys() {
    return {
      publicKey: this.keyPairs.encryption.publicKey,
      secretKey: this.keyPairs.encryption.secretKey
    };
  }
  get signingKeys() {
    return {
      publicKey: this.keyPairs.signing.publicKey,
      secretKey: this.keyPairs.signing.secretKey
    };
  }
  get secretKeys() {
    return {
      signing: this.keyPairs.signing.secretKey,
      encryption: this.keyPairs.encryption.secretKey
    };
  }
  get publicKeys() {
    return {
      signing: this.keyPairs.signing.publicKey,
      encryption: this.keyPairs.encryption.publicKey
    };
  }
  async incept(args) {
    const { keyPairs, nextKeyPairs, backers = [] } = args || {};
    this.keyPairs = keyPairs;
    const inceptionEvent = await this.keyEvent({
      keyPairs,
      nextKeyPairs,
      eventType: KeriEventType.INCEPTION,
      backers: [...backers]
    });
    if (!inceptionEvent) {
      this.keyPairs = void 0;
      throw new Error("Inception failed");
    }
    const { identifier } = inceptionEvent;
    this._identifier = identifier;
    this.keyPairs = keyPairs;
    this.keyEventLog.push(inceptionEvent);
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
    this.keyPairs = keyPairs;
    this.keyEventLog.push(rotationEvent);
  }
  async delete(args) {
    const { backers = [] } = args || {};
    const deletionEvent = await this.keyEvent({
      eventType: KeriEventType.DELETION,
      backers: [...backers]
    });
    if (!deletionEvent)
      throw new Error("Deletion failed");
    this.keyPairs = { signing: { publicKey: "", secretKey: "" }, encryption: { publicKey: "", secretKey: "" } };
    this.keyEventLog.push(deletionEvent);
  }
  async keyEvent(args) {
    const { eventType, backers = [] } = args || {};
    const { keyPairs, nextKeyPairs } = args || {};
    const lastEvent = this.keyEventLog[this.keyEventLog.length - 1];
    const keyHash = keyPairs ? await this.spark.hasher.hash(keyPairs.signing.publicKey) : null;
    const hasKeyPairs = !!keyPairs && !!nextKeyPairs;
    const isIncepted = !!this.identifier || !!this.keyEventLog?.length;
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
    const identifier = this.identifier || `B${keyPairs.signing.publicKey.replace(/=$/, "")}`;
    const nextKeyCommitments = [await this.spark.hasher.hash(nextKeyPairs.signing.publicKey)];
    const eventIndex = this.keyEventLog.length;
    const signingKeys = [keyPairs.signing.publicKey];
    const event = {
      identifier,
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
    const hashedEvent = await this.spark.hasher.hash(eventJSON);
    const signedEventHash = await this.spark.signer.sign({ data: hashedEvent, detached: true });
    if (eventType === KeriEventType.ROTATION) {
      const previousEventDigest = this.keyEventLog[this.keyEventLog.length - 1].selfAddressingIdentifier;
      if (!previousEventDigest)
        throw new Error("Previous event digest not found");
      event.previousEventDigest = previousEventDigest;
    }
    const keyEvent = {
      ...event,
      selfAddressingIdentifier: signedEventHash,
      version
    };
    return keyEvent;
  }
  // todo - some thinking around how to handle this given dynamic agents, not to mention private/protected props
  async import({ keyPairs, data }) {
    this.keyPairs = keyPairs;
    const decrypted = await this.spark.cipher.decrypt({ data });
    const deepCopy = JSON.parse(JSON.stringify(decrypted));
    delete deepCopy.postMessage;
    Object.assign(this, deepCopy);
  }
  async export() {
    const { keyPairs, ...data } = this;
    const encrypted = await this.spark.cipher.encrypt({ data: JSON.stringify(data) });
    return encrypted;
  }
}

const signingKeyPair$1 = () => {
  const signing = nacl.sign.keyPair();
  return {
    publicKey: util.encodeBase64(signing.publicKey),
    secretKey: util.encodeBase64(signing.secretKey)
  };
};
const encryptionKeyPair$1 = () => {
  const encryption = nacl.box.keyPair();
  return {
    publicKey: util.encodeBase64(encryption.publicKey),
    secretKey: util.encodeBase64(encryption.secretKey)
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
    await super.incept({ keyPairs, nextKeyPairs, ...args });
  }
  async rotate(args) {
    const keyPairs = { ...this.randomKeyPairs[this.randomKeyPairs.length - 1] };
    const nextKeyPairs = generateKeyPairs$1();
    this.randomKeyPairs.push(nextKeyPairs);
    await super.rotate({ keyPairs, nextKeyPairs, ...args });
  }
  async import({ keyPairs, data }) {
    await super.import({ keyPairs, data });
  }
}

const generateSalt = (data) => {
  return util.encodeBase64(blake3(JSON.stringify(data)));
};
const signingKeyPair = async ({ password, salt }) => {
  const options = { N: 16384, r: 8, p: 1 };
  const buffer = await scrypt.scrypt(
    password,
    salt,
    nacl.box.secretKeyLength / 2,
    options
  );
  const seed = [...new Uint8Array(buffer)].map((x) => x.toString(16).padStart(2, "0")).join("");
  const uint8Seed = util.decodeUTF8(seed);
  const uint8Keypair = nacl.sign.keyPair.fromSeed(uint8Seed);
  return {
    publicKey: util.encodeBase64(uint8Keypair.publicKey),
    secretKey: util.encodeBase64(uint8Keypair.secretKey)
  };
};
const encryptionKeyPair = async ({ password, salt }) => {
  const options = { N: 16384, r: 8, p: 1 };
  const buffer = await scrypt.scrypt(
    password,
    salt,
    nacl.box.secretKeyLength / 2,
    options
  );
  const seed = [...new Uint8Array(buffer)].map((x) => x.toString(16).padStart(2, "0")).join("");
  const uint8Seed = util.decodeUTF8(seed);
  const uint8Keypair = nacl.box.keyPair.fromSecretKey(uint8Seed);
  return {
    publicKey: util.encodeBase64(uint8Keypair.publicKey),
    secretKey: util.encodeBase64(uint8Keypair.secretKey)
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
    let salt = util.encodeBase64(nacl.randomBytes(16));
    const keyPairs = await generateKeyPairs({ password, salt });
    salt = generateSalt(keyPairs.signing.publicKey);
    const nextKeyPairs = await generateKeyPairs({ password, salt });
    await super.incept({ keyPairs, nextKeyPairs, ...args });
    await this.rotate({ password });
  }
  async import(args) {
    const { password, salt, data } = args;
    const keyPairs = await generateKeyPairs({ password, salt });
    await super.import({ keyPairs, data });
  }
  async export() {
    const kel = this.keyEventLog;
    const salt = await generateSalt(kel.length < 3 ? kel[0].signingKeys[0] : kel[kel.length - 3]);
    const data = await super.export();
    return { data, salt };
  }
  async rotate(args) {
    const { password, newPassword } = args;
    const eventLog = this.keyEventLog;
    let salt, nextKeyPairs, keyPairs, keyHash;
    if (!password)
      throw new Error("Password is required to rotate keys.");
    salt = await generateSalt(eventLog.length < 2 ? eventLog[0].signingKeys[0] : eventLog[eventLog.length - 2]);
    keyPairs = await generateKeyPairs({ password, salt });
    keyHash = await this.spark.hasher.hash(keyPairs.signing.publicKey);
    if (keyHash !== eventLog[eventLog.length - 1].nextKeyCommitments[0]) {
      throw new Error("Key commitment does not match your previous commitment. If you are trying to change your password provide password & newPassword parameters.");
    }
    salt = generateSalt(eventLog[eventLog.length - 1]);
    nextKeyPairs = await generateKeyPairs({ password: newPassword || password, salt });
    await super.rotate({ keyPairs, nextKeyPairs, ...args });
    if (newPassword) {
      return await this.rotate({ password: newPassword });
    }
  }
}

class Agent {
  // TODO define spark interface
  constructor(spark) {
    this.spark = spark;
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
      const data = await this.spark.hasher.hash(JSON.stringify(eventBody));
      const dataInTact = await this.spark.signer.verify({
        data,
        signature: selfAddressingIdentifier,
        publicKey: event.signingKeys[0]
      });
      valid2 = valid2 && dataInTact;
      if (index > 0) {
        const keyCommittment = eventLog[index - 1].nextKeyCommitments[0];
        const currenKey = this.spark.hasher.hash(event.signingKeys[0]);
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

class Signer {
  // TODO define spark interface
  constructor(spark) {
    this.spark = spark;
  }
  async sign({ data, detached = false }) {
    throw new Error("sign not implemented");
  }
  async verify({ publicKey, signature, data }) {
    throw new Error("verify not implemented");
  }
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
  return util.encodeBase64(nacl.randomBytes(nacl.secretbox.nonceLength));
}

class Ed25519 extends Signer {
  async sign({ data, detached = false }) {
    const dataString = typeof data === "string" ? data : JSON.stringify(data);
    const uintData = util.decodeUTF8(dataString);
    const uintSecretKey = util.decodeBase64(this.spark.controller.signingKeys.secretKey);
    const signature = detached ? util.encodeBase64(nacl.sign.detached(uintData, uintSecretKey)) : util.encodeBase64(nacl.sign(uintData, uintSecretKey));
    return signature;
  }
  async verify({ publicKey, signature, data }) {
    if (!publicKey || !signature)
      throw new Error("publicKey and signature are required");
    if (data) {
      if (typeof data !== "string" && !(data instanceof Uint8Array)) {
        data = parseJSON(data);
      }
      data = util.decodeUTF8(data);
    }
    const uintSignature = util.decodeBase64(signature);
    const uintPublicKey = util.decodeBase64(publicKey);
    if (data) {
      return nacl.sign.detached.verify(data, uintSignature, uintPublicKey);
    } else {
      const uintResult = nacl.sign.open(uintSignature, uintPublicKey);
      if (uintResult === null)
        return uintResult;
      const utf8Result = util.encodeUTF8(uintResult);
      return parseJSON(utf8Result) || utf8Result;
    }
  }
}

class Cipher {
  constructor(spark) {
    this.spark = spark;
  }
  async encrypt(args) {
    throw new Error("Not implemented");
  }
  async decrypt(args) {
    throw new Error("Not implemented");
  }
  async sharedKey(args) {
    throw new Error("Not implemented");
  }
}

class X25519SalsaPoly extends Cipher {
  constructor(spark) {
    super(spark);
  }
  async sharedKey({ publicKey }) {
    if (!this.spark.controller.encryptionKeys) {
      throw new Error("No key pairs found, please import or incept identity");
    }
    const baseEncryptionPublicKey = util.decodeBase64(publicKey);
    const baseEncryptionSecretKey = util.decodeBase64(this.spark.controller.encryptionKeys.secretKey);
    const uintSharedKey = nacl.box.before(baseEncryptionPublicKey, baseEncryptionSecretKey);
    const baseSharedKey = util.encodeBase64(uintSharedKey);
    return baseSharedKey;
  }
  async encrypt({ data, publicKey, sharedKey }) {
    if (!this.spark.controller.encryptionKeys) {
      throw new Error("No key pairs found, please import or incept identity");
    }
    const utfData = typeof data === "string" ? data : JSON.stringify(data);
    const uintData = util.decodeUTF8(utfData);
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    let box;
    if (publicKey) {
      const publicKeyUint = util.decodeBase64(publicKey);
      box = nacl.box(uintData, nonce, publicKeyUint, util.decodeBase64(this.spark.controller.encryptionKeys.secretKey));
    } else if (sharedKey) {
      const sharedKeyUint = util.decodeBase64(sharedKey);
      box = nacl.box.after(uintData, nonce, sharedKeyUint);
    } else {
      const secreKeyUint = util.decodeBase64(this.spark.controller.encryptionKeys.secretKey);
      box = nacl.secretbox(uintData, nonce, secreKeyUint);
    }
    const encrypted = new Uint8Array(nonce.length + box.length);
    encrypted.set(nonce);
    encrypted.set(box, nonce.length);
    return util.encodeBase64(encrypted);
  }
  async decrypt({ data, publicKey, sharedKey }) {
    if (!this.spark.controller.keyPairs) {
      throw new Error("No key pairs found, please import or incept identity");
    }
    const uintDataAndNonce = util.decodeBase64(data);
    const nonce = uintDataAndNonce.slice(0, nacl.secretbox.nonceLength);
    const uintData = uintDataAndNonce.slice(nacl.secretbox.nonceLength, uintDataAndNonce.length);
    let decrypted;
    if (publicKey) {
      const publicKeyUint = util.decodeBase64(publicKey);
      decrypted = nacl.box.open(uintData, nonce, publicKeyUint, util.decodeBase64(this.spark.controller.encryptionKeys.secretKey));
    } else if (sharedKey) {
      const sharedKeyUint = util.decodeBase64(sharedKey);
      decrypted = nacl.box.open.after(uintData, nonce, sharedKeyUint);
    } else {
      const secreKeyUint = util.decodeBase64(this.spark.controller.encryptionKeys.secretKey);
      decrypted = nacl.secretbox.open(uintData, nonce, secreKeyUint);
    }
    if (!decrypted)
      return null;
    const utf8Result = util.encodeUTF8(decrypted);
    const result = parseJSON(utf8Result) || utf8Result;
    return result;
  }
}

class Hasher {
  async hash(data) {
    return data;
  }
}

class Blake3 extends Hasher {
  async hash(data) {
    const stringData = typeof data !== "string" ? JSON.stringify(data) : data;
    return util.encodeBase64(blake3(stringData));
  }
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
    Object.defineProperties(this, {
      spark: { enumerable: false, writable: false }
    });
    if (!args.channelType) {
      throw new Error("Channel: missing channelType");
    }
    this.channelType = args.channelType;
    this.channelId = args.channelId;
    this.identifier = args.identifier;
    this.publicKeys = args.publicKeys;
    this.sharedKey = args.sharedKey;
    this.receipt = args.receipt;
    this.receiveMessage = this.receiveMessage.bind(this);
  }
  open(payload, action, attempts = 0) {
    return new Promise((resolve, reject) => {
      const request = () => {
        console.log(this.spark.controller.signingKeys.publicKey.slice(0, 4) + " => open request\n");
        const event = {
          eventType: ChannelEventTypes.OPEN_REQUEST,
          eventId: randomNonce(),
          channelId: randomNonce(),
          timestamp: getTimestamp(),
          identifier: this.spark.controller.identifier,
          publicKeys: this.spark.controller.publicKeys
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
        console.log(this.spark.controller.signingKeys.publicKey.slice(0, 4) + " => open accept\n");
        const ourInfo = {
          identifier: this.spark.controller.identifier,
          publicKeys: this.spark.controller.publicKeys
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
        const sharedKey = await this.spark.cipher.sharedKey({ publicKey: args.publicKeys.encryption });
        const ciphertext = await this.spark.cipher.encrypt({ data: receiptData, sharedKey });
        const receipt = await this.spark.signer.sign({ data: ciphertext });
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
        console.log(this.spark.controller.signingKeys.publicKey.slice(0, 4) + " => open confirm\n");
        const peerInfo = {
          identifier: args.identifier,
          publicKeys: args.publicKeys
        };
        const sharedKey = await this.spark.cipher.sharedKey({ publicKey: args.publicKeys.encryption });
        const channelData = {
          channelId: args.channelId,
          timestamp: args.timestamp,
          sharedKey,
          receipt: args.receipt,
          ...peerInfo
        };
        const openedReceipt = await this.spark.signer.verify({ signature: args.receipt, publicKey: args.publicKeys.signing });
        const decrypted = await this.spark.cipher.decrypt({ data: openedReceipt, sharedKey });
        if (!decrypted || !decrypted.channelId || decrypted.channelId !== args.channelId) {
          return error({
            error: ChannelErrorCodes.OPEN_CONFIRM_ERROR,
            eventId: args.eventId,
            message: "failed to open and decrypt receipt"
          });
        }
        const encrypted = await this.spark.cipher.encrypt({ data: decrypted, sharedKey });
        const receipt = await this.spark.signer.sign({ data: encrypted });
        const ourInfo = {
          identifier: this.spark.controller.identifier,
          publicKeys: this.spark.controller.publicKeys
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
        console.log(this.spark.controller.signingKeys.publicKey.slice(0, 4) + " => open complete\n");
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
        console.log(this.spark.controller.signingKeys.publicKey.slice(0, 4) + " => open deny\n");
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
        console.log(this.spark.controller.signingKeys.publicKey.slice(0, 4) + " => open error\n");
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
        console.log(this.spark.controller.signingKeys.publicKey.slice(0, 4) + " => send msg request\n");
        const encrypted = await this.spark.cipher.encrypt({ data, sharedKey: this.sharedKey });
        const message = await this.spark.signer.sign({ data: encrypted });
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
              return this.open(payload, action, attempts + 1);
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
        console.log(this.spark.controller.signingKeys.publicKey.slice(0, 4) + " => send msg confirm\n");
        const opened = await this.spark.signer.verify({ signature: payload2.message, publicKey: this.publicKeys.signing });
        const message = await this.spark.cipher.decrypt({ data: opened, sharedKey: this.sharedKey });
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
        const encrypted = await this.spark.cipher.encrypt({ data: receiptData, sharedKey: this.sharedKey });
        const receipt2 = await this.spark.signer.sign({ data: encrypted });
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
        console.log(this.spark.controller.signingKeys.publicKey.slice(0, 4) + " => send msg complete\n");
        if (this.onmessage)
          this.onmessage(payload2);
        return resolve(payload2);
      };
      const error = (payload2) => {
        console.log(this.spark.controller.signingKeys.publicKey.slice(0, 4) + " => send msg error\n");
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
        console.log(this.spark.controller.signingKeys.publicKey.slice(0, 4) + " => close request\n");
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
        console.log(this.spark.controller.signingKeys.publicKey.slice(0, 4) + " => close confirm\n");
        const ourInfo = {
          identifier: this.spark.controller.identifier,
          publicKeys: this.spark.controller.publicKeys
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
        const encrypted = await this.spark.cipher.encrypt({ data: receiptData, sharedKey: this.sharedKey });
        const receipt2 = await this.spark.signer.sign({ data: encrypted });
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
        console.log(this.spark.controller.signingKeys.publicKey.slice(0, 4) + " => close receipt\n");
        if (this.onclose)
          this.onclose(payload2.receipt);
        return resolve(payload2.receipt);
      };
      const complete = (payload2) => {
        console.log(this.spark.controller.signingKeys.publicKey.slice(0, 4) + " => close complete\n");
        if (this.onclose)
          this.onclose(payload2.receipt);
        return resolve(payload2.receipt);
      };
      const error = (payload2) => {
        console.log(this.spark.controller.signingKeys.publicKey.slice(0, 4) + " => close error\n");
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
    ...args
  }) {
    super({ channelType: ChannelTypes.POST_MESSAGE, ...args });
    this._window = _window || window;
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
      this.peer = new Peer();
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
    console.log(getUserMedia, "here");
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
    const peer = new Peer();
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

class Storage {
  async get() {
    throw new Error("Not implemented");
  }
  async set() {
    throw new Error("Not implemented");
  }
  async delete() {
    throw new Error("Not implemented");
  }
}

const SINGLETONS = {
  controller: Controller,
  signer: Signer,
  cipher: Cipher,
  hasher: Hasher,
  storage: Storage
};
const COLLECTIONS = {
  agents: Agent
};
const FACTORIES = {
  channels: Channel
};
class Spark {
  constructor(options) {
    Object.keys(options).forEach((prop) => {
      if (SINGLETONS[prop]) {
        const instance = new options[prop](this);
        const valid = instance && instance instanceof SINGLETONS[prop];
        const typeName = SINGLETONS[prop].name;
        if (!valid)
          throw new Error(`${prop} must be an instance of ${typeName}`);
        this[prop] = instance;
        Object.defineProperties(instance, {
          spark: { enumerable: false, writable: false }
        });
      } else if (COLLECTIONS[prop]) {
        this[prop] = {};
        options[prop].forEach((clazz) => {
          const name = clazz.name;
          const instance = new clazz(this);
          const valid = instance && instance instanceof COLLECTIONS[prop];
          const typeName = COLLECTIONS[prop].name;
          if (!valid)
            throw new Error(`${prop} must be an instance of ${typeName}`);
          const camel = name.charAt(0).toLowerCase() + name.slice(1);
          this[prop][camel] = instance;
          Object.defineProperties(instance, {
            spark: { enumerable: false, writable: false }
          });
        });
      } else if (FACTORIES[prop]) {
        this[prop] = {};
        options[prop].forEach((clazz) => {
          const name = clazz.name;
          const valid = clazz.prototype instanceof FACTORIES[prop];
          const typeName = FACTORIES[prop].name;
          if (!valid)
            throw new Error(`${prop} must be an extension of ${typeName}`);
          const self = this;
          class Factory extends clazz {
            constructor(args) {
              super({ spark: self, ...args });
            }
          }
          Object.defineProperty(Factory, "name", { value: name, writable: false });
          this[prop][name] = Factory;
        });
      } else {
        throw new Error(`invalid option ${prop}`);
      }
    });
  }
}

export { Agent, Attester, Blake3, Channel, ChannelActions, ChannelErrorCodes, ChannelEventConfirmTypes, ChannelEventTypes, ChannelTypes, Cipher, Controller, Ed25519, FetchAPI, Hasher, KeriEventType, Password, PostMessage, Random, RestAPI, Signer, Spark, Storage, User, Verifier, WebRTC, X25519SalsaPoly };
