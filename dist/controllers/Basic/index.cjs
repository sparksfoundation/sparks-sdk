"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/controllers/Basic/index.ts
var Basic_exports = {};
__export(Basic_exports, {
  Basic: () => Basic
});
module.exports = __toCommonJS(Basic_exports);

// src/controllers/SparkController/types.ts
var KeyEventType = /* @__PURE__ */ ((KeyEventType2) => {
  KeyEventType2["INCEPT"] = "INCEPT";
  KeyEventType2["ROTATE"] = "ROTATE";
  KeyEventType2["DESTROY"] = "DESTROY";
  return KeyEventType2;
})(KeyEventType || {});

// src/controllers/SparkController/index.ts
var SparkController = class {
  _spark;
  _identifier;
  _keyEventLog;
  constructor(spark) {
    this._spark = spark;
    this._keyEventLog = [];
    this.incept = this.incept.bind(this);
    this.rotate = this.rotate.bind(this);
    this.destroy = this.destroy.bind(this);
  }
  get identifier() {
    return this._identifier;
  }
  get keyEventLog() {
    return this._keyEventLog;
  }
  async import(data) {
    if (data?.identifier && data?.keyEventLog) {
      this._identifier = data.identifier;
      this._keyEventLog = data.keyEventLog;
    }
    return Promise.resolve();
  }
  async export() {
    return Promise.resolve({
      identifier: this._identifier,
      keyEventLog: this._keyEventLog
    });
  }
};

// src/utilities/index.ts
var import_tweetnacl = __toESM(require("tweetnacl"), 1);
var import_tweetnacl_util = __toESM(require("tweetnacl-util"), 1);
var import_cuid2 = require("@paralleldrive/cuid2");
function utcEpochTimestamp() {
  const now = /* @__PURE__ */ new Date();
  return now.getTime() + now.getTimezoneOffset() * 60 * 1e3;
}
function randomCuid() {
  return (0, import_cuid2.createId)();
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

// src/errors/controllers.ts
var ControllerErrorTypes = {
  CONTROLLER_ALREADY_INCEPTED_ERROR: "CONTROLLER_ALREADY_INCEPTED_ERROR",
  CONTROLLER_INCEPTION_MISSING_ERROR: "CONTROLLER_INCEPTION_MISSING_ERROR",
  CONTROLLER_ALREADY_DESTROYED_ERROR: "CONTROLLER_ALREADY_DESTROYED_ERROR",
  CONTROLLER_INVALID_NEXT_KEYPAIRS_ERROR: "CONTROLLER_INVALID_NEXT_KEYPAIRS_ERROR",
  CONTROLLER_INVALID_KEY_EVENT_TYPE_ERROR: "CONTROLLER_INVALID_KEY_EVENT_TYPE_ERROR",
  CONTROLLER_INVALID_NEXT_KEY_COMMITMENT_ERROR: "CONTROLLER_INVALID_NEXT_KEY_COMMITMENT_ERROR",
  CONTROLLER_MISSING_PREVIOUS_DIGEST_ERROR: "CONTROLLER_MISSING_PREVIOUS_DIGEST_ERROR",
  CONTROLLER_MISSING_IDENTIFIER_ERROR: "CONTROLLER_MISSING_IDENTIFIER_ERROR",
  CONTROLLER_UNEXPECTED_ERROR: "CONTROLLER_UNEXPECTED_ERROR"
};
var ControllerErrors = {
  CONTROLLER_ALREADY_INCEPTED_ERROR: ({ metadata = {} } = {}) => createEvent({
    type: ControllerErrorTypes.CONTROLLER_ALREADY_INCEPTED_ERROR,
    metadata: { ...metadata },
    data: { message: "Controller already incepted." }
  }),
  CONTROLLER_INCEPTION_MISSING_ERROR: ({ metadata = {} } = {}) => createEvent({
    type: ControllerErrorTypes.CONTROLLER_INCEPTION_MISSING_ERROR,
    metadata: { ...metadata },
    data: { message: "Missing controller inception." }
  }),
  CONTROLLER_ALREADY_DESTROYED_ERROR: ({ metadata = {} } = {}) => createEvent({
    type: ControllerErrorTypes.CONTROLLER_ALREADY_DESTROYED_ERROR,
    metadata: { ...metadata },
    data: { message: "Controller already destroyed." }
  }),
  CONTROLLER_INVALID_NEXT_KEYPAIRS_ERROR: ({ metadata = {} } = {}) => createEvent({
    type: ControllerErrorTypes.CONTROLLER_INVALID_NEXT_KEYPAIRS_ERROR,
    metadata: { ...metadata },
    data: { message: "Invalid next keypairs." }
  }),
  CONTROLLER_INVALID_KEY_EVENT_TYPE_ERROR: ({ metadata = {} } = {}) => createEvent({
    type: ControllerErrorTypes.CONTROLLER_INVALID_KEY_EVENT_TYPE_ERROR,
    metadata: { ...metadata },
    data: { message: "Invalid key event type." }
  }),
  CONTROLLER_INVALID_NEXT_KEY_COMMITMENT_ERROR: ({ metadata = {} } = {}) => createEvent({
    type: ControllerErrorTypes.CONTROLLER_INVALID_NEXT_KEY_COMMITMENT_ERROR,
    metadata: { ...metadata },
    data: { message: "Invalid next key commitment." }
  }),
  CONTROLLER_MISSING_PREVIOUS_DIGEST_ERROR: ({ metadata = {} } = {}) => createEvent({
    type: ControllerErrorTypes.CONTROLLER_MISSING_PREVIOUS_DIGEST_ERROR,
    metadata: { ...metadata },
    data: { message: "Missing previous key event digest." }
  }),
  CONTROLLER_MISSING_IDENTIFIER_ERROR: ({ metadata = {} } = {}) => createEvent({
    type: ControllerErrorTypes.CONTROLLER_MISSING_IDENTIFIER_ERROR,
    metadata: { ...metadata },
    data: { message: "Missing controller identifier." }
  }),
  CONTROLLER_UNEXPECTED_ERROR: ({ metadata = {}, message } = {}) => createEvent({
    type: ControllerErrorTypes.CONTROLLER_UNEXPECTED_ERROR,
    metadata: { ...metadata },
    data: { message: message || "Unexpected controller error." }
  })
};

// src/controllers/Basic/index.ts
var Basic = class extends SparkController {
  async import(data) {
    await super.import(data);
    return Promise.resolve();
  }
  async export() {
    const data = await super.export();
    return Promise.resolve(data);
  }
  async keyEvent({ nextKeyPairs, type }) {
    const keyPairs = this._spark.keyPairs;
    const previousKeyCommitment = this.keyEventLog[this.keyEventLog.length - 1]?.nextKeyCommitments;
    const keyCommitment = await this._spark.hash({ data: keyPairs.signer.publicKey });
    const nextKeyCommitments = type === "DESTROY" /* DESTROY */ ? void 0 : await this._spark.hash({ data: nextKeyPairs?.signer.publicKey });
    try {
      switch (true) {
        case (type === "INCEPT" /* INCEPT */ && this.keyEventLog.length > 0):
          throw ControllerErrors.CONTROLLER_ALREADY_INCEPTED_ERROR();
        case (type === "ROTATE" /* ROTATE */ && this.keyEventLog.length === 0):
        case (type === "DESTROY" /* DESTROY */ && this.keyEventLog.length === 0):
          throw ControllerErrors.CONTROLLER_INCEPTION_MISSING_ERROR();
        case (type === "DESTROY" /* DESTROY */ && this.keyEventLog.length > 0 && this.keyEventLog[this.keyEventLog.length - 1].type === "DESTROY" /* DESTROY */):
          throw ControllerErrors.CONTROLLER_ALREADY_DESTROYED_ERROR();
        case (type !== "DESTROY" /* DESTROY */ && !nextKeyPairs):
          throw ControllerErrors.CONTROLLER_INVALID_NEXT_KEYPAIRS_ERROR();
        case !Object.values(KeyEventType).includes(type):
          throw ControllerErrors.CONTROLLER_INVALID_KEY_EVENT_TYPE_ERROR();
        case (type === "ROTATE" /* ROTATE */ && previousKeyCommitment !== keyCommitment):
          throw ControllerErrors.CONTROLLER_INVALID_NEXT_KEY_COMMITMENT_ERROR();
        case (this.keyEventLog.length > 0 && !this.keyEventLog[this.keyEventLog.length - 1].selfAddressingIdentifier):
          throw ControllerErrors.CONTROLLER_MISSING_PREVIOUS_DIGEST_ERROR();
      }
      const baseEventProps = {
        index: this.keyEventLog.length,
        signingThreshold: 1,
        signingKeys: [keyPairs.signer.publicKey],
        backerThreshold: 0,
        backers: [],
        nextKeyCommitments
      };
      const eventJSON = JSON.stringify(baseEventProps);
      const versionData = eventJSON.length.toString(16).padStart(6, "0");
      const version = "KERI10JSON" + versionData + "_";
      const hashedEvent = await this._spark.hash({ data: eventJSON });
      const selfAddressingIdentifier = await this._spark.seal({ data: hashedEvent });
      const identifier = this._identifier || `B${selfAddressingIdentifier}`;
      const previousEventDigest = this.keyEventLog[this.keyEventLog.length - 1]?.selfAddressingIdentifier;
      const commonEventProps = {
        identifier,
        type,
        version,
        ...baseEventProps,
        selfAddressingIdentifier
      };
      switch (type) {
        case "INCEPT" /* INCEPT */:
          return {
            ...commonEventProps,
            type: "INCEPT" /* INCEPT */
          };
        case "ROTATE" /* ROTATE */:
          return {
            ...commonEventProps,
            type: "ROTATE" /* ROTATE */,
            previousEventDigest
          };
        case "DESTROY" /* DESTROY */:
          return {
            ...commonEventProps,
            type: "DESTROY" /* DESTROY */,
            previousEventDigest,
            nextKeyCommitments: [],
            signingKeys: []
          };
        default:
          throw ControllerErrors.CONTROLLER_INVALID_KEY_EVENT_TYPE_ERROR();
      }
    } catch (error) {
      if (error instanceof SparkEvent)
        return Promise.reject(error);
      return Promise.reject(ControllerErrors.CONTROLLER_UNEXPECTED_ERROR({
        message: `Failed to create key event. ${error?.message || ""}`
      }));
    }
  }
  async incept() {
    try {
      const keyPairs = this._spark.keyPairs;
      const inceptionEvent = await this.keyEvent({ nextKeyPairs: keyPairs, type: "INCEPT" /* INCEPT */ });
      this.keyEventLog.push(inceptionEvent);
      this._identifier = inceptionEvent.identifier;
    } catch (error) {
      return Promise.reject(error);
    }
  }
  async rotate({ nextKeyPairs }) {
    try {
      const rotationEvent = await this.keyEvent({ nextKeyPairs, type: "ROTATE" /* ROTATE */ });
      this.keyEventLog.push(rotationEvent);
    } catch (error) {
      return Promise.reject(error);
    }
  }
  async destroy() {
    try {
      const destructionEvent = await this.keyEvent({ type: "DESTROY" /* DESTROY */ });
      this.keyEventLog.push(destructionEvent);
    } catch (error) {
      return Promise.reject(error);
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Basic
});
//# sourceMappingURL=index.cjs.map