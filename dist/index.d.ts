type Identifier = string;
type SigningPublicKey = string;
type SigningSecretKey = string;
type EncryptionPublicKey = string;
type EncryptionSecretKey = string;
type EncryptionSharedKey = string;
type SingingPublicKeyHash = string;
type EncryptionPublicKeyHash = string;
type EncryptionKeyPair = {
    publicKey: EncryptionPublicKey;
    secretKey: EncryptionSecretKey;
};
type SigningKeyPair = {
    publicKey: SigningPublicKey;
    secretKey: EncryptionPublicKey;
};
type PublicKeys = {
    encryption: EncryptionPublicKey;
    signing: SigningPublicKey;
};
type SecretKeys = {
    encryption: EncryptionSecretKey;
    signing: SigningSecretKey;
};
type KeyPairs = {
    encryption: EncryptionKeyPair;
    signing: SigningKeyPair;
};
type KeriEventIndex = number;
declare enum KeriEventType {
    INCEPTION = "inception",
    ROTATION = "rotation",
    DELETION = "deletion"
}
type SigningThreshold = number;
type SigningKeys = SigningPublicKey[];
type NextKeyCommitments = SingingPublicKeyHash[];
type Backer = SigningPublicKey;
type BackerThreshold = number;
type Backers = Backer[];
type SelfAddressingIdentifier = string;
type Version = string;
type PreviousEventDigest = string;
type KeriRotationEventArgs = {
    eventType: KeriEventType.ROTATION;
    keyPairs: KeyPairs;
    nextKeyPairs: KeyPairs;
    backers: Backers;
    previousEventDigest: PreviousEventDigest;
};
type KeriDeletionEventArgs = {
    eventType: KeriEventType.DELETION;
    backers: Backers;
};
type KeriInceptionEventArgs = {
    eventType: KeriEventType.INCEPTION;
    keyPairs: KeyPairs;
    nextKeyPairs: KeyPairs;
    backers: Backers;
};
type KeriEventArgs = KeriInceptionEventArgs | KeriRotationEventArgs | KeriDeletionEventArgs;
type KeriEvent = {
    identifier: Identifier;
    version: Version;
    eventIndex: KeriEventIndex;
    eventType: KeriEventType;
    signingThreshold: SigningThreshold;
    signingKeys: SigningKeys;
    nextKeyCommitments: NextKeyCommitments;
    backerThreshold: BackerThreshold;
    backers: Backers;
    selfAddressingIdentifier: SelfAddressingIdentifier;
};
type KeriInceptionEvent = KeriEvent & {
    eventType: KeriEventType.INCEPTION;
};
type KeriRotationEvent = KeriEvent & {
    previousEventDigest: string;
    eventType: KeriEventType.ROTATION;
};
type KeriDeletionEvent = KeriRotationEvent;
type KeriKeyEvent = KeriInceptionEvent | KeriRotationEvent | KeriDeletionEvent;
type InceptionArgs = {
    keyPairs: KeyPairs;
    nextKeyPairs: KeyPairs;
    backers: Backers;
};
type RotationArgs = {
    keyPairs: KeyPairs;
    nextKeyPairs: KeyPairs;
    backers: Backers;
};
type DeletionArgs = {
    backers: Backers;
};
type ImportArgs = {
    keyPairs: KeyPairs;
    data: string;
};
/**
 * Controller interface
 * responsible for managing keypairs and key event log
 * must implement methods for incepting, rotating, deleting, importing and exporting
 * relies on a cipher for encryption and decryption, a hasher for hashing and a signer
 * also provides and import and export method for backing up or restoring data
 * this is the main interface for the spark Identity
 * extend Controller class provide custom key derivation functionality
 */
interface IController {
    /**
     * Incepts a new identity
     * @param {Object} args - The args for incepting.
     * @param {Object} args.keyPairs - Key pairs to incept with.
     * @param {Object} args.nextKeyPairs - Next key pairs to rotate to.
     * @param {Array} args.backers - List of backers to back this inception.
     * @returns {Promise<void> | never} A promise that resolves when the incept operation is complete,
     * or rejects with an error.
     */
    incept(args: InceptionArgs): Promise<void> | never;
    /**
     * Rotates the current key pairs to a new key pair
     * @param {Object} args - The args for incepting.
     * @param {Object} args.keyPairs - Key pairs to incept with.
     * @param {Object} args.nextKeyPairs - Next key pairs to rotate to.
     * @param {Array} args.backers - List of backers to back this inception.
     * @returns {Promise<void> | never} A promise that resolves when the rotate operation is complete,
     */
    rotate(args: RotationArgs): Promise<void> | never;
    /**
     * Deletes the current key pairs by rotating to a null set
     * @param {Object} args - The args for rotating.
     * @param {Array} args.backers - List of backers to back this deletion.
     * @returns {Promise<void> | never} A promise that resolves when the delete operation is complete,
     * or rejects with an error.
     */
    delete(args: DeletionArgs): Promise<void> | never;
    /**
     * Imports an identity from an encrypted serialized base64 string
     * @param {Object} args - The args for importing.
     * @param {Object} args.keyPairs - Key pairs to decrypt with.
     * @param {string} args.data - The encrypted serialized base64 string.
     * @returns {Promise<void> | never} A promise that resolves when the import operation is complete,
     * or rejects with an error.
     */
    import(args: ImportArgs): Promise<void> | never;
    /**
     * Exports an identity to an encrypted serialized base64 string
     * @returns {Promise<string> | never} A promise that resolves to the encrypted serialized base64 string.
     * or rejects with an error.
     */
    export(): Promise<any> | never;
}

declare class Controller implements IController {
    protected _identifier: Identifier;
    protected keyPairs: KeyPairs;
    protected keyEventLog: KeriKeyEvent[];
    protected spark: any;
    constructor(spark: any);
    get identifier(): string;
    set identifier(identifier: string);
    get encryptionKeys(): EncryptionKeyPair;
    get signingKeys(): SigningKeyPair;
    get secretKeys(): SecretKeys;
    get publicKeys(): PublicKeys;
    incept(args: InceptionArgs): Promise<void>;
    rotate(args: RotationArgs): Promise<void>;
    delete(args: DeletionArgs): Promise<void>;
    protected keyEvent(args: KeriEventArgs): Promise<KeriKeyEvent>;
    import({ keyPairs, data }: {
        keyPairs: any;
        data: any;
    }): Promise<void>;
    export(): Promise<any>;
}

declare class Random extends Controller {
    private randomKeyPairs;
    incept(args: any): Promise<void>;
    rotate(args: any): Promise<void>;
    import({ keyPairs, data }: {
        keyPairs: KeyPairs;
        data: string;
    }): Promise<void>;
}

declare class Password extends Controller {
    incept(args: any): Promise<void>;
    import(args: any): Promise<void>;
    export(): Promise<{
        data: any;
        salt: string;
    }>;
    rotate(args: any): any;
}

/**
 * Agent interface
 * reponsible for unique agent functionality
 * in other words "Persona" specific function and properties
 * extend Agent class to implement other agent types
 */
interface IAgent {
}

declare class Agent implements IAgent {
    protected spark: any;
    constructor(spark: any);
}

declare class Verifier extends Agent {
    /**
   * Verifies the data integrity and key commitment of the entire event log
   * @param eventLog
   * @returns
   */
    verifyEventLog(eventLog: any): Promise<any>;
}

declare class Attester extends Agent {
}

declare class User extends Agent {
    protected name: string;
    protected avatar: string;
}

/**
 * Signer interface
 * responsible for signing and verifying data
 * can sign messages detached or attached
 * can open detached signatures OR verify attached signatures
 * extend Signer class to implement other signing algorithms
 */
interface ISigner {
    /**
     * Signs data using ed25519
     * @param {object|string} data - data to sign (object will be stringified)
     * @param {boolean} detached - whether to return detached signature
     * @returns {Promise<string>} - resolved with base64 encoded signature,
     * or rejected with an error.
     */
    sign: ({ data, detached }: {
        data: object | string;
        detached?: boolean;
    }) => Promise<string> | never;
    /**
     * Verifies data using ed25519
     * @param {string} publicKey - base64 encoded public key
     * @param {string} signature - base64 encoded signature
     * @param {object|string} data - string or object to verify, if provided verifies detached signature
     * @returns {Promise<boolean|string|object|null>} - resolve with boolen result if data is provided, otherwise returns parsed data, string or null,
     * or rejected with an error.
     */
    verify: ({ publicKey, signature, data }: {
        publicKey: string;
        signature: string;
        data?: object | string;
    }) => Promise<boolean> | Promise<string | object | null> | never;
}

declare class Signer implements ISigner {
    protected spark: any;
    constructor(spark: any);
    sign({ data, detached }: {
        data: any;
        detached?: boolean;
    }): Promise<string>;
    verify({ publicKey, signature, data }: {
        publicKey: string;
        signature: string;
        data?: string | object;
    }): Promise<boolean>;
}

declare class Ed25519 extends Signer {
    sign({ data, detached }: {
        data: any;
        detached?: boolean;
    }): Promise<string>;
    verify({ publicKey, signature, data }: {
        publicKey: any;
        signature: any;
        data: any;
    }): Promise<any>;
}

type SharedEncryptionKey = string;
/**
 * Cipher interface
 * responsible for symmetric and asymmetric encrypting & decrypting operations.
 * must also implement a method for computing a shared key.
 * relies on controller's keyPairs and inbound public keys.
 * extend Cipher class to provide other cipher algorithms.
 */
interface ICipher {
    /**
     * Encrypts data using X25519SalsaPoly
     * @param {object|string} data
     * @param {string} publicKey
     * @param {string} sharedKey
     * @returns {string}
     */
    encrypt: (args: {
        data: object | string;
        publicKey?: string;
        sharedKey?: string;
    }) => Promise<string | null> | never;
    /**
     * Decrypts data using X25519SalsaPoly
     * @param {string} data
     * @param {string} publicKey
     * @param {string} sharedKey
     * @returns {string}
     */
    decrypt: (args: {
        data: string;
        publicKey?: string;
        sharedKey?: string;
    }) => Promise<string | Record<string, any> | null> | never;
    /**
     * Computes a shared key using X25519SalsaPoly
     * @param {string} publicKey
     * @returns {string} sharedKey
     */
    sharedKey: (args: {
        publicKey: string;
    }) => Promise<string> | never;
}

declare class Cipher implements ICipher {
    protected spark: any;
    constructor(spark: any);
    encrypt(args: any): Promise<string>;
    decrypt(args: any): Promise<Record<string, any> | null>;
    sharedKey(args: any): Promise<string>;
}

declare class X25519SalsaPoly extends Cipher {
    constructor(spark: any);
    sharedKey({ publicKey }: {
        publicKey: any;
    }): Promise<string>;
    encrypt({ data, publicKey, sharedKey }: {
        data: any;
        publicKey: any;
        sharedKey: any;
    }): Promise<string>;
    decrypt({ data, publicKey, sharedKey }: {
        data: any;
        publicKey: any;
        sharedKey: any;
    }): Promise<any>;
}

/**
 * Hasher interface
 * responsible for hashing data
 * extend Hasher class to implement other hashing algorithms
 */
interface IHasher {
    /**
     * Hashes object or string
     * @param {string} data - data to hash (object will be stringified)
     * @returns {Promise<string> | never} A promise that resolves to the base64 encoded string.
     * or rejects with an error.
     */
    hash: (data: any) => Promise<string> | never;
}

declare class Hasher implements IHasher {
    hash(data: any): Promise<any>;
}

declare class Blake3 extends Hasher {
    hash(data: any): Promise<string>;
}

declare enum ChannelActions {
    CONFIRM = "confirm",
    ACCEPT = "accept",
    REJECT = "reject"
}
declare enum ChannelTypes {
    POST_MESSAGE = "post_message",
    WEB_RTC = "web_rtc",
    WEB_SOCKET = "web_socket",
    BLUE_TOOTH = "blue_tooth",
    NFC = "nfc",
    QR_CODE = "qr_code",
    REST_API = "rest_api",
    FETCH_API = "fetch_api"
}
declare enum ChannelEventTypes {
    OPEN_REQUEST = "open_request",
    OPEN_ACCEPT = "open_accept",
    OPEN_CONFIRM = "open_confirm",
    CLOSE_REQUEST = "close_request",
    CLOSE_CONFIRM = "close_confirm",
    MESSAGE_SEND = "message_send",
    MESSAGE_CONFIRM = "message_confirm"
}
declare enum ChannelEventConfirmTypes {
    CLOSE_REQUEST = "close_request",
    MESSAGE_SEND = "message_send"
}
declare enum ChannelErrorCodes {
    OPEN_REQUEST_ERROR = "open_request_error",
    OPEN_ACCEPT_ERROR = "open_accept_error",
    OPEN_CONFIRM_ERROR = "open_confirm_error",
    TIMEOUT_ERROR = "timeout_error",
    CLOSE_REQUEST_ERROR = "close_request_error",
    CLOSE_CONFIRM_ERROR = "close_confirm_error",
    MESSAGE_SEND_ERROR = "message_send_error",
    MESSAGE_CONFIRM_ERROR = "message_confirm_error"
}
type ChannelTimeSamp = number;
type ChannelEventId = string;
type ChannelId = string;
type ChannelError = {
    eventId: ChannelEventId;
    error: ChannelErrorCodes;
    message: string;
};
/**
 * ChannelReceiptData - stringified and passed to receiver
 * provides info about channel and peers
 */
type ChannelReceiptData = {
    channelType: ChannelTypes;
    channelId: ChannelId;
    timestamp: ChannelTimeSamp;
    peers: ChannelPeers;
};
type ChannelReceipt = string;
/**
 * ChannelRequestEvent
 * Sent by initiator of request: provides propsed channel and peer info
 */
type ChannelRequestEvent = {
    eventType: ChannelEventTypes.OPEN_REQUEST;
    timestamp: ChannelTimeSamp;
    eventId: ChannelEventId;
    channelId: ChannelId;
    identifier: Identifier;
    publicKeys: PublicKeys;
};
/**
 * ChannelAcceptEvent
 * Send by receiver accepting request: provides peer info
*/
type ChannelAcceptEvent = {
    eventType: ChannelEventTypes.OPEN_ACCEPT;
    timestamp: ChannelTimeSamp;
    eventId: ChannelEventId;
    channelId: ChannelId;
    receipt: ChannelReceipt;
    identifier: Identifier;
    publicKeys: PublicKeys;
};
/**
 * ChannelConfirmEvent
 * Send by receiver accepting request: provides peer info and receipt
 */
type ChannelConfirmEvent = {
    eventType: ChannelEventTypes.OPEN_CONFIRM;
    timestamp: ChannelTimeSamp;
    eventId: ChannelEventId;
    channelId: ChannelId;
    receipt: ChannelReceipt;
    identifier: Identifier;
    publicKeys: PublicKeys;
};
/**
 * ChannelConfirmPayload
 * Sent by initiator confirming request: provides receipt
 */
type ChannelCompletePayload = {
    eventType: ChannelEventTypes.OPEN_CONFIRM;
    eventId: ChannelEventId;
    channelId: ChannelId;
    timestamp: ChannelTimeSamp;
    receipt: ChannelReceipt;
};
/**
 * CompleteChannelArgs
 * The args passed to completeChannel on both sides
 */
type ChannelCompleteOpenData = {
    channelId: ChannelId;
    timestamp: ChannelTimeSamp;
    receipt: ChannelReceipt;
    identifier: Identifier;
    publicKeys: PublicKeys;
    sharedKey: SharedEncryptionKey;
};
type ChannelPromiseHandler = any;
type ChannelPeer = {
    identifier: Identifier;
    publicKeys: PublicKeys;
};
type ChannelPeers = [
    ChannelPeer,
    ChannelPeer
];
type ChannelMessage = string | Record<string, any>;
type ChannelMessageEncrypted = string;
type ChannelMessageId = string;
type ChannelMessageEvent = {
    eventType: ChannelEventTypes.MESSAGE_SEND;
    message: ChannelMessageEncrypted;
    timestamp: ChannelTimeSamp;
    eventId: ChannelEventId;
    channelId: ChannelId;
    messageId: ChannelMessageId;
};
type ChannelMessageConfirmEvent = {
    eventType: ChannelEventTypes.MESSAGE_CONFIRM;
    receipt: ChannelMessageEncrypted;
    timestamp: ChannelTimeSamp;
    eventId: ChannelEventId;
    channelId: ChannelId;
    messageId: ChannelMessageId;
};
type ChannelMessageReceiptData = {
    messageId: ChannelMessageId;
    timestamp: ChannelTimeSamp;
    message: ChannelMessage;
};
type ChannelMessagereceipt = string;
type ChannelMessageConfirm = {
    eventType: ChannelEventTypes.MESSAGE_CONFIRM;
    timestamp: ChannelTimeSamp;
    eventId: ChannelEventId;
    channelId: ChannelId;
    receipt: ChannelMessagereceipt;
};
type ChannelCloseEvent = {
    eventType: ChannelEventTypes.CLOSE_REQUEST;
    timestamp: ChannelTimeSamp;
    eventId: ChannelEventId;
    channelId: ChannelId;
};
type ChannelClosedReceiptData = {
    channelId: ChannelId;
    channelType: ChannelTypes;
    timestamp: ChannelTimeSamp;
    peers: ChannelPeers;
};
type ChannelClosedReceipt = string;
type ChannelCloseConfirmationEvent = {
    eventType: ChannelEventTypes.CLOSE_CONFIRM;
    timestamp: ChannelTimeSamp;
    eventId: ChannelEventId;
    channelId: ChannelId;
    receipt: ChannelClosedReceipt;
};

declare class Channel {
    static OPEN_RETRIES: number;
    static OPEN_TIMEOUT: number;
    static MESSAGE_RETRIES: number;
    static MESSAGE_TIMEOUT: number;
    static CLOSE_TIMEOUT: number;
    protected spark: Spark;
    protected channelType: ChannelTypes;
    protected channelId: ChannelEventId;
    protected identifier: Identifier;
    protected publicKeys: PublicKeys;
    protected sharedKey: SharedEncryptionKey;
    protected receipt: ChannelReceipt;
    protected _promiseHandlers: Map<string, any>;
    protected _preconnectQueue: ChannelMessageEvent[];
    onopen: ((error: Channel) => void) | null;
    onclose: ((error: ChannelClosedReceipt) => void) | null;
    onmessage: ((payload: ChannelMessage) => void) | null;
    onerror: ((error: ChannelError) => void) | null;
    constructor(args: any);
    open(payload: any, action: any, attempts?: number): Promise<Channel | ChannelError>;
    send(payload: any, action: any, attempts?: number): Promise<unknown>;
    close(payload: any, action: any): Promise<unknown>;
    protected sendMessage(event: any): void;
    protected receiveMessage(payload: any): void;
    static receive(callback: any, options: any): void;
    static channelRequest({ payload, channel: Channel, options }: {
        payload: any;
        channel: any;
        options: any;
    }): {
        resolve: () => Promise<any>;
        reject: (message: any) => void;
        details: any;
    };
}

declare class PostMessage extends Channel {
    private source;
    private origin;
    private _window;
    constructor({ _window, source, origin, ...args }: {
        [x: string]: any;
        _window: any;
        source: any;
        origin: any;
    });
    protected sendMessage(event: any): void;
    protected receiveMessage(payload: any): void;
    static receive(callback: any, { spark, _window }: {
        spark: any;
        _window: any;
    }): void;
}

declare class FetchAPI extends Channel {
    private url;
    constructor({ url, ...args }: {
        url: string;
        args: any;
    });
    protected sendMessage(payload: any): Promise<void>;
    static receive(): Promise<void>;
}

declare class RestAPI extends Channel {
    static promises: Map<string, any>;
    static receives: Map<string, any>;
    static eventHandler: Function;
    constructor({ ...args }: any);
    protected sendMessage(payload: any): Promise<void>;
    static receive(callback: any, { spark }: {
        spark: any;
    }): void;
}

declare class WebRTC extends Channel {
    protected peerConnection: RTCPeerConnection;
    protected dataChannel: RTCDataChannel;
    constructor({ configuration, ...args }: {
        [x: string]: any;
        configuration: any;
    });
    protected receiveMessage(event: any): void;
    protected sendMessage(payload: any): void;
    static receive(callback: any, { spark, configuration, Channel }: {
        spark: any;
        configuration: any;
        Channel: any;
    }): Promise<void>;
}

/**
 * Storage interface
 * responsible for storing, retrieving and deleting serialized identity
 * leverage Spark main class to get data to store
 * extend Storage class to implement other storage mechanisms
 */
interface IStorage {
    /**
     * get the serialized identity from storage
     * @returns {Promise<string>} A promise that resolves to the serialized identity,
     * or rejects with an error.
     */
    get(): Promise<string> | never;
    /**
     * set the serialized identity to storage
     * @returns {Promise<void>} A promise that resolves when the delete operation is complete,
     * or rejects with an error.
     */
    set(): Promise<void> | never;
    /**
     * delete the serialized identity from storage
     * @returns {Promise<void>} A promise that resolves when the delete operation is complete,
     * or rejects with an error.
     */
    delete(): Promise<void> | never;
}

declare class Storage implements IStorage {
    get(): Promise<string>;
    set(): Promise<void>;
    delete(): Promise<void>;
}

declare class Spark {
    controller: Controller;
    signer: Signer;
    cipher: Cipher;
    hasher: Hasher;
    storage: Storage;
    agents: {
        [key: string]: Agent;
    };
    channels: {
        [key: string]: typeof Channel;
    };
    constructor(options: any);
}

export { Agent, Attester, Backer, BackerThreshold, Backers, Blake3, Channel, ChannelAcceptEvent, ChannelActions, ChannelCloseConfirmationEvent, ChannelCloseEvent, ChannelClosedReceipt, ChannelClosedReceiptData, ChannelCompleteOpenData, ChannelCompletePayload, ChannelConfirmEvent, ChannelError, ChannelErrorCodes, ChannelEventConfirmTypes, ChannelEventId, ChannelEventTypes, ChannelId, ChannelMessage, ChannelMessageConfirm, ChannelMessageConfirmEvent, ChannelMessageEncrypted, ChannelMessageEvent, ChannelMessageId, ChannelMessageReceiptData, ChannelMessagereceipt, ChannelPeer, ChannelPeers, ChannelPromiseHandler, ChannelReceipt, ChannelReceiptData, ChannelRequestEvent, ChannelTimeSamp, ChannelTypes, Cipher, Controller, DeletionArgs, Ed25519, EncryptionKeyPair, EncryptionPublicKey, EncryptionPublicKeyHash, EncryptionSecretKey, EncryptionSharedKey, FetchAPI, Hasher, ICipher, IController, Identifier, ImportArgs, InceptionArgs, KeriDeletionEvent, KeriDeletionEventArgs, KeriEvent, KeriEventArgs, KeriEventIndex, KeriEventType, KeriInceptionEvent, KeriInceptionEventArgs, KeriKeyEvent, KeriRotationEvent, KeriRotationEventArgs, KeyPairs, NextKeyCommitments, Password, PostMessage, PreviousEventDigest, PublicKeys, Random, RestAPI, RotationArgs, SecretKeys, SelfAddressingIdentifier, SharedEncryptionKey, Signer, SigningKeyPair, SigningKeys, SigningPublicKey, SigningSecretKey, SigningThreshold, SingingPublicKeyHash, Spark, Storage, User, Verifier, Version, WebRTC, X25519SalsaPoly };
