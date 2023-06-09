import { Identifier } from "../controllers/types";
import { PublicKeys } from "../types";
import { SparkError } from "../errors/SparkError";
import { CoreChannel } from "./CoreChannel";
export type ChannelId = string;
export type ChannelEventId = string;
export type ChannelNextId = string;
export type ChannelMessageId = string;
export type ChannelEventTimestamp = number;
export type ChannelEventMetadata = Record<string, any>;
export type ChannelMessageDataDigest = string;
export type ChannelMessageData = string | Record<string, any>;
export type ChannelEventData = string | Record<string, any>;
export type ChannelPeer = {
    identifier: Identifier;
    publicKeys: PublicKeys;
};
export declare enum ChannelState {
    PENDING = "PENDING",
    OPENED = "OPENED",
    CLOSED = "CLOSED"
}
export declare enum ChannelType {
    CORE_CHANNEL = "CORE_CHANNEL",
    POSTMESSAGE_CHANNEL = "POSTMESSAGE_CHANNEL",
    WEBSOCKET_CHANNEL = "WEBSOCKET_CHANNEL",
    WEBRTC_CHANNEL = "WEBRTC_CHANNEL",
    REST_API_CHANNEL = "REST_API_CHANNEL",
    FETCH_API_CHANNEL = "FETCH_API_CHANNEL"
}
export type ResolveOpenPromise = {
    (params: ChannelOpenRejectionEvent): ChannelOpenRejectionEvent;
    (params: CoreChannel): CoreChannel;
    (params: SparkError): SparkError;
};
export type ResolveClosePromise = {
    (params: ChannelCloseConfirmationEvent): ChannelCloseConfirmationEvent;
    (params: SparkError): SparkError;
};
export type ResolveMessagePromise = {
    (params: ChannelMessageConfirmationEvent): ChannelMessageConfirmationEvent;
    (params: SparkError): SparkError;
};
export type RejectPromise = {
    (params: ChannelOpenRejectionEvent): ChannelOpenRejectionEvent;
    (params: SparkError): SparkError;
};
export type HandleOpenRequested = ({ event, resolve, reject }: {
    event: ChannelOpenRequestEvent;
    resolve: () => void;
    reject: () => void;
}) => void;
export type HandleOpenAccepted = ({ event, resolve, reject, }: {
    event: ChannelOpenAcceptanceEvent;
    resolve: () => void;
    reject: () => void;
}) => void;
export declare enum ChannelEventType {
    OPEN_REQUEST = "OPEN_REQUEST",
    OPEN_ACCEPTANCE = "OPEN_ACCEPTANCE",
    OPEN_CONFIRMATION = "OPEN_CONFIRMATION",
    OPEN_REJECTION = "OPEN_REJECTION",
    CLOSE = "CLOSE",
    CLOSE_CONFIRMATION = "CLOSE_CONFIRMATION",
    MESSAGE = "MESSAGE",
    MESSAGE_RECEIVED = "MESSAGE_RECEIVED",
    MESSAGE_CONFIRMATION = "MESSAGE_CONFIRMATION",
    ERROR = "ERROR"
}
export interface ChannelOpenRequestEvent {
    type: ChannelEventType.OPEN_REQUEST;
    timestamp: ChannelEventTimestamp;
    data: {
        identifier: Identifier;
        publicKeys: PublicKeys;
    };
    metadata: {
        eid: ChannelEventId;
        cid: ChannelId;
        nid: ChannelEventId;
    };
}
export interface ChannelOpenAcceptanceEvent {
    type: ChannelEventType.OPEN_ACCEPTANCE;
    timestamp: ChannelEventTimestamp;
    data: {
        identifier: Identifier;
        publicKeys: PublicKeys;
        receipt: ChannelEventDigest;
    };
    metadata: {
        eid: ChannelEventId;
        cid: ChannelId;
        nid: ChannelEventId;
    };
}
export interface ChannelOpenConfirmationEvent {
    type: ChannelEventType.OPEN_CONFIRMATION;
    timestamp: ChannelEventTimestamp;
    data: {
        receipt: ChannelEventDigest;
    };
    metadata: {
        eid: ChannelEventId;
        cid: ChannelId;
        nid: ChannelEventId;
    };
}
export interface ChannelOpenRejectionEvent {
    type: ChannelEventType.OPEN_REJECTION;
    timestamp: ChannelEventTimestamp;
    data: {};
    metadata: {
        eid: ChannelEventId;
        cid: ChannelId;
        nid: ChannelEventId;
    };
}
export interface ChannelCloseEvent {
    type: ChannelEventType.CLOSE;
    timestamp: ChannelEventTimestamp;
    data: {};
    metadata: {
        eid: ChannelEventId;
        cid: ChannelId;
        nid: ChannelEventId;
    };
}
export interface ChannelCloseConfirmationEvent {
    type: ChannelEventType.CLOSE_CONFIRMATION;
    timestamp: ChannelEventTimestamp;
    data: {
        receipt: ChannelEventDigest;
    };
    metadata: {
        eid: ChannelEventId;
        cid: ChannelId;
        nid: ChannelEventId;
    };
}
export interface ChannelMessageEvent {
    type: ChannelEventType.MESSAGE;
    timestamp: ChannelEventTimestamp;
    data: ChannelMessageDataDigest;
    metadata: {
        eid: ChannelEventId;
        cid: ChannelId;
        nid: ChannelEventId;
        mid: ChannelMessageId;
    };
}
export interface ChannelDecryptedMessageEvent {
    type: ChannelEventType.MESSAGE_RECEIVED;
    timestamp: ChannelEventTimestamp;
    data: ChannelMessageData;
    metadata: {
        eid: ChannelEventId;
        cid: ChannelId;
        nid: ChannelEventId;
        mid: ChannelMessageId;
    };
}
export interface ChannelMessageConfirmationEvent {
    type: ChannelEventType.MESSAGE_CONFIRMATION;
    timestamp: ChannelEventTimestamp;
    data: {
        receipt: ChannelEventDigest;
    };
    metadata: {
        eid: ChannelEventId;
        cid: ChannelId;
        nid: ChannelEventId;
        mid: ChannelMessageId;
    };
}
export interface ChannelErrorEvent {
    type: ChannelEventType.ERROR;
    timestamp: ChannelEventTimestamp;
    data: SparkError;
    metadata: {
        eid: ChannelEventId;
        cid: ChannelId;
        nid: ChannelEventId;
    };
}
export type AnyChannelEvent = ChannelOpenRequestEvent | ChannelOpenAcceptanceEvent | ChannelOpenConfirmationEvent | ChannelOpenRejectionEvent | ChannelCloseEvent | ChannelCloseConfirmationEvent | ChannelMessageEvent | ChannelDecryptedMessageEvent | ChannelMessageConfirmationEvent | ChannelErrorEvent;
export type AnyChannelEventWithSource = AnyChannelEvent & {
    request?: boolean;
    response?: boolean;
};
export type ChannelEventLog = AnyChannelEventWithSource[];
export type ChannelReceiptDigest = string;
export type ChannelEventDigest = string;
export declare enum ChannelReceiptType {
    OPEN_ACCEPTED = "OPEN_ACCEPTED",
    OPEN_CONFIRMED = "OPEN_CONFIRMED",
    CLOSE_CONFIRMED = "CLOSE_CONFIRMED",
    MESSAGE_RECEIVED = "MESSAGE_RECEIVED"
}
export interface ChannelOpenAcceptanceReceipt {
    type: ChannelReceiptType.OPEN_ACCEPTED;
    peers: [ChannelPeer, ChannelPeer];
    eventDigest: ChannelEventDigest;
}
export interface ChannelOpenConfirmationReceipt {
    type: ChannelReceiptType.OPEN_CONFIRMED;
    peers: [ChannelPeer, ChannelPeer];
    eventDigest: ChannelEventDigest;
}
export interface ChannelCloseConfirmationReceipt {
    type: ChannelReceiptType.CLOSE_CONFIRMED;
    eventDigest: ChannelEventDigest;
}
export interface ChannelMessageReceivedReceipt {
    type: ChannelReceiptType.MESSAGE_RECEIVED;
    messageDigest: ChannelMessageDataDigest;
    eventDigest: ChannelEventDigest;
}
export type AnyChannelReceipt = ChannelOpenAcceptanceReceipt | ChannelOpenConfirmationReceipt | ChannelCloseConfirmationReceipt | ChannelMessageReceivedReceipt;
export type ChannelListenerOff = (callback?: (event: AnyChannelEvent) => void) => void;
export type ChannelListenerOn = (event: ChannelEventType | ChannelEventType[], callback: (event: AnyChannelEvent) => void, options?: {
    once?: boolean;
}) => () => void;
