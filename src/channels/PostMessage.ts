import { Channel } from "./Channel.js";
import { ChannelTypes } from "./types.js";

export class PostMessage extends Channel {
  private source: Window;
  private origin: string;
  private _window: Window;

  constructor({
    _window,
    source,
    origin,
    ...args
  }) {
    super({ channelType: ChannelTypes.POST_MESSAGE, ...args });
    this._window = _window;
    this.origin = origin;
    this.source = source;
    this._window.addEventListener('message', this.recieveMessage);
  }

  protected sendMessage(event: any) {
    // how do we send messages out
    this.source.postMessage(event, this.origin);
  }

  protected recieveMessage(payload: any) {
    // how do we recieve messages
    super.recieveMessage(payload.data);
  }

  static receive(callback, { spark, _window }) {
    // how do we recieve messages as a recipient
    _window.addEventListener('message', (event) => {
      // todo normalize payload
      const source = event.source as Window;
      const origin = event.origin;
      const options = { _window, source, origin, spark };
      const request = Channel.channelRequest({
        payload: event.data,
        options,
        channel: PostMessage,
      })
      if (request) callback(request);
    });
  }
}