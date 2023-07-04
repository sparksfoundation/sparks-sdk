import { ChannelErrors } from "../../errors/channel.mjs";
import { CoreChannel } from "../CoreChannel.mjs";
import { ChannelEventType, ChannelType } from "../types.mjs";
const _PostMessage = class extends CoreChannel {
  constructor({ _window, cid, source, origin, spark, eventLog, peer }) {
    super({ cid, spark, eventLog, peer });
    this._window = _window || window || null;
    this._origin = origin;
    this._source = source;
    this.sendRequest = this.sendRequest.bind(this);
    this.handleResponse = this.handleResponse.bind(this);
    this._window.addEventListener("message", this.handleResponse);
    this._window.addEventListener("beforeunload", async () => {
      await this.close();
    });
  }
  get origin() {
    return this._origin;
  }
  get source() {
    return this._source;
  }
  async open() {
    this._source = this._source || this._window.open(this._origin, "_blank");
    if (!this._source)
      throw ChannelErrors.OpenRequestError();
    return super.open();
  }
  handleClosed() {
    this._window.removeEventListener("message", this.handleResponse);
  }
  async handleResponse(event) {
    return super.handleResponse(event.data);
  }
  async sendRequest(event) {
    this._source.postMessage(event, this._origin);
    return Promise.resolve();
  }
  static handleOpenRequests(callback, { spark, _window }) {
    const win = _window || window;
    if (!win || !spark || !callback) {
      throw new Error("missing required arguments: spark, callback");
    }
    win.addEventListener("message", async (event) => {
      const { type, cid } = event.data;
      const isRequest = type === ChannelEventType.OPEN_REQUEST;
      if (!isRequest)
        return;
      const channel = new _PostMessage({
        _window: win,
        cid,
        source: event.source,
        origin: event.origin,
        spark
      });
      channel.handleOpenRequested = callback;
      channel.handleResponse(event);
    });
  }
  async export() {
    const data = await super.export();
    const origin = this._origin;
    return Promise.resolve({ ...data, origin });
  }
  async import(data) {
    const { origin } = data;
    if (origin !== this._origin)
      throw new Error("origin mismatch");
    return super.import(data);
  }
};
export let PostMessage = _PostMessage;
PostMessage.type = ChannelType.POSTMESSAGE_CHANNEL;
