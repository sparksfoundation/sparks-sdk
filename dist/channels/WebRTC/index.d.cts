import Peer, { DataConnection, MediaConnection } from 'peerjs';
import { S as SparkChannelParams, k as ChannelState, c as SparkChannelActions, a as SparkChannel, b as SparkChannelInterface, d as SparkEvent, R as RequestParams, h as SparkRequestEvent, j as SparkConfirmEvent, e as ChannelReceive } from '../../index-e16de22b.js';
import { N as Nullable } from '../../index-cf660960.js';
import { RequestOptions } from 'https';
import 'eventemitter3';
import '../../types-c76b4006.js';
import '../../types-d473a34c.js';
import '../../types-188a9fde.js';
import '../../types-40269ceb.js';
import '../../types-14ae8009.js';

type WebRTCParams = SparkChannelParams & {
    connection?: DataConnection;
};
type WebRTCMediaStreams = {
    local: Nullable<MediaStream>;
    remote: Nullable<MediaStream>;
};
type WebRTCState = ChannelState & {
    streamable: Nullable<boolean>;
    call: Nullable<MediaConnection>;
    streams: WebRTCMediaStreams;
};
type WebRTCActions = SparkChannelActions | [
    'CALL',
    'HANGUP'
];
declare const WebRTCActions: readonly ["OPEN", "CLOSE", "MESSAGE", "CALL", "HANGUP"];

declare class WebRTC extends SparkChannel implements SparkChannelInterface<WebRTCActions> {
    private connection;
    get state(): WebRTCState;
    constructor({ connection, ...params }: WebRTCParams);
    setStreamable(): Promise<boolean>;
    getLocalStream(): Promise<MediaStream>;
    private ensurePeerConnection;
    sendEvent(event: SparkEvent): Promise<void>;
    open(params?: RequestParams, options?: RequestOptions): Promise<this>;
    onCloseRequested(request: SparkRequestEvent): Promise<void>;
    onCloseConfirmed(confirm: SparkConfirmEvent): Promise<void>;
    call(params?: RequestParams, options?: RequestOptions): Promise<SparkConfirmEvent>;
    handleCallRequest(request: SparkRequestEvent): Promise<void>;
    onCallRequested(request: SparkRequestEvent): Promise<void>;
    onCallConfirmed(confirm: SparkConfirmEvent): Promise<void>;
    confirmCall(request: SparkRequestEvent): Promise<void>;
    private closeStreams;
    hangup(params?: RequestParams, options?: RequestOptions): Promise<SparkConfirmEvent>;
    confirmHangup(request: SparkRequestEvent): Promise<void>;
    onHangupRequested(request: SparkRequestEvent): Promise<void>;
    onHangupConfirmed(confirm: SparkConfirmEvent): Promise<void>;
    protected static peerjs: Peer;
    protected static deriveAddress(identifier?: string): string;
    static receive: ChannelReceive;
}

export { WebRTC };
