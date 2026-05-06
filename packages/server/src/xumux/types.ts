export interface XumuxTransport {
  send(data: Uint8Array): void;
  close(): void;
  readonly bufferedAmount: number;
}

export interface XumuxChannelEvent {
  channelId: number;
  type: number;
  payload: Uint8Array;
}

export interface XumuxServerEvents {
  onOpenChannel?: (channelId: number) => void;
  onCloseChannel?: (channelId: number) => void;
  onChannelMessage?: (event: XumuxChannelEvent) => void;
  onError?: (error: Error) => void;
}
