import * as dgram from "dgram";

export enum SocketState {
    CLOSED,
    OPEN,
}

/**
 * Small extention of the `dgram.Socket` type,
 * adding a socket state attribute that is updated on open and close.
 */
export class Socket extends dgram.Socket {
    private _socketState: SocketState;

    public get socketState() {
        return this._socketState;
    }

    constructor() {
        // @ts-ignore
        super("udp4");
        this._socketState = SocketState.CLOSED;
        this.on("listening", () => (this._socketState = SocketState.OPEN));
        this.on("close", () => (this._socketState = SocketState.CLOSED));
    }
}

new Socket();
