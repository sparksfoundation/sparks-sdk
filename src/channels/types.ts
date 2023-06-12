import { SharedEncryptionKey } from "../ciphers/types";

export type MessageOptions = {
  data: string | object;              // data to send to the other side
  receipt: boolean;                   // whether to wait for a receipt
};

export type MessagePayload = {
  mid: string;                        // unique id for this message
  data: string | object;              // data to recieved from the other side
  sent: number;                       // timestamp of when the message was sent
};

export type MessageReceipt = {
  mid: string;                        // unique id for this message
  data: string | object;              // data to recieved from the other side
  signature: string;                  // signature of the message
  sent: number;                       // timestamp of when the message was sent
  received: number;                   // timestamp of when the message was received
};

export type MessageError = {
  mid: string;                        // unique id for this message
  error: Error;                       // the error that occurred
  timestamp: number;                  // timestamp of when the error occurred
};

export type ChannelCloseOptions = {
  receipt: boolean;                   // whether to wait for a receipt
};

export type ChannelClosedPayload = {
  cid: string;                        // unique id for this channel
  closed: number;                     // timestamp of when the channel was closed
  signature: string;                  // signature of the channel id
}

export type ChannelClosedReceipt = {
  cid: string;                        // unique id for this channel
  closed: number;                     // timestamp of when the channel was closed
  signature: string;                  // signature of the channel id
};

export type ChannelOpenedPayload = {
  cid: string;                        // unique id for this channel
  channel: Channel;                   // the channel that was opened
  opened: number;                     // timestamp of when the channel was opened
  signature: string;                  // signature of the channel id
};

export type ChannelError = {
  cid: string;                        // unique id for this channel
  error: Error;                       // the error that occurred
  timestamp: number;                  // timestamp of when the error occurred
};  

export type ChannelTarget = any;

export type ChannelOptions = {
  target?: ChannelTarget;                                                       // if provided it's an intiator, if not it's a responder
  onOpen?: (connection: Channel) => void;                                       // called when the channel is opened by the other side
  onClose?: (connection: Channel) => void;                                      // called when the channel is closed by the other side
  onMessage?: (connection: Channel, message: MessagePayload) => void;           // called when a message is received from the other side
  onError?: (connection: Channel, error: MessageError | ChannelError) => void;  // called when an error occurs
};

export type ChannelFactoryOptions = {
  target?: ChannelTarget;                                                       // if provided it's an intiator, if not it's a responder
  onOpen?: (connection: Channel) => void;                                       // called when the channel is opened by the other side
  onClose?: (connection: Channel) => void;                                      // called when the channel is closed by the other side
  onMessage?: (connection: Channel, message: MessagePayload) => void;           // called when a message is received from the other side
  onError?: (connection: Channel, error: MessageError | ChannelError) => void;  // called when an error occurs
};

// Channel is an abstract class that represents a channel of communication
export abstract class Channel {
  abstract cid: string;                                                                     // the unique id for the channel
  abstract target: ChannelTarget;                                                           // the target of the channel
  abstract sharedKey: SharedEncryptionKey;                                                  // the shared key for the channel
  abstract send(args: MessageOptions): Promise<MessageReceipt> | void | never;              // returns a promise if receipt is true or throws an error
  abstract close(args: ChannelCloseOptions): Promise<ChannelClosedReceipt> | void | never;  // returns a promise if receipt is true or throws an error 
  abstract onOpen(args: ChannelOpenedPayload): void | never;                                // called when the channel is opened by the other side or throws an error
  abstract onClose(args: ChannelClosedPayload): void | never;                               // called when the channel is closed by the other side or throws an error
  abstract onMessage(args: MessagePayload): void | never;                                   // called when a message is received from the other side or throws an error
}

// ChannelFactory is an abstract class that represents a factory for creating channels of a specific type
export abstract class ChannelFactory {
  abstract open(args: ChannelFactoryOptions): Channel | never;  // returns a channel or throws an error
}

// Mixin: ChannelManager is an abstract class that represents a mixin which contains a ChannelFactory of a specific type
export abstract class ChannelManager {
  constructor(args: { [key: string]: ChannelFactory }) {
    const propertyKeys = Object.keys(args);
    const managerKey = propertyKeys.find((key) => args[key] instanceof Object && "channels" in args[key]);
    if (!managerKey) {
      throw new Error("At least one property must be a ChannelFactory.");
    }
    this[managerKey] = args[managerKey];
  }
}
