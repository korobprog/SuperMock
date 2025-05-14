declare module 'simple-peer' {
  import { EventEmitter } from 'events';

  export interface SignalData {
    type?: string;
    sdp?: string;
    candidate?: RTCIceCandidate;
  }

  export interface PeerOptions {
    initiator?: boolean;
    channelConfig?: object;
    channelName?: string;
    config?: RTCConfiguration;
    offerOptions?: RTCOfferOptions;
    answerOptions?: RTCAnswerOptions;
    sdpTransform?: (sdp: string) => string;
    stream?: MediaStream;
    streams?: MediaStream[];
    trickle?: boolean;
    allowHalfTrickle?: boolean;
    objectMode?: boolean;
  }

  // Определяем класс Peer
  class PeerClass extends EventEmitter {
    constructor(opts?: PeerOptions);
    signal(data: SignalData): void;
    send(data: any): void;
    addStream(stream: MediaStream): void;
    removeStream(stream: MediaStream): void;
    addTrack(track: MediaStreamTrack, stream: MediaStream): void;
    removeTrack(track: MediaStreamTrack, stream: MediaStream): void;
    replaceTrack(
      oldTrack: MediaStreamTrack,
      newTrack: MediaStreamTrack,
      stream: MediaStream
    ): void;
    destroy(err?: Error): void;

    // Свойства
    connected: boolean;
    destroyed: boolean;
  }

  // Определяем пространство имен Peer
  namespace Peer {
    export type Instance = PeerClass;
  }

  // Экспортируем класс как default и также как тип
  const Peer: {
    new (opts?: PeerOptions): PeerClass;
    prototype: PeerClass;
  };

  export default Peer;
}
