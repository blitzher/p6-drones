import { IP, Port, commander } from "./index";
import * as constants from "./constants.json";
import { StateInfo, StateStream, VideoStream } from "./streams/streams";
import logger from "../../log";
import { SocketState } from "./socket";
import { CommandOptions } from "./commander";

let nextStatePort = constants.ports.state;
let nextVideoPort = constants.ports.video;

type Pos3D = { x: number; y: number; z: number };
type SVPorts = { state: Port; video: Port };

export class Drone {
    readonly ip: IP;
    readonly id: string;
    private _connected: boolean = false;
    static _allDrones: Drone[] = [];

    public readonly state!: StateInfo;
    public readonly isVirtual = true;

    public get connected() {
        return this._connected;
    }

    private ports: SVPorts = { state: 0, video: 0 };

    private stateStream: StateStream;
    private videoStream: VideoStream;

    /* Expose emitters */
    public get stateEmitter() {
        return this.stateStream;
    }
    public get videoEmitter() {
        return this.videoStream;
    }

    /* Timeout to signal a disconnect, when no state data is received */
    private disconnectTimeout!: NodeJS.Timeout;

    public data() {
        return {
            connected: this.connected,
            ports: this.ports,
            ip: this.ip,
            id: this.id,
        };
    }

    constructor(ip: IP, ports?: SVPorts) {
        this.ip = ip;
        this.id = ip.split(".").pop() || ip;

        /* Initialise ports */
        this.ports.state = ports?.state || nextStatePort++;
        this.ports.video = ports?.state || nextVideoPort++;

        this.stateStream = new StateStream(this.ports.state, this.ip);
        this.videoStream = new VideoStream(this.ports.video, this.ip);

        /* Setup connected variable */
        this.stateStream.start();
        this.stateStream.on("message", (state) => {
            clearTimeout(this.disconnectTimeout);
            /* Only read ini */
            if (this.state.mid != -1) state.mid = this.state.mid;
            this.disconnectTimeout = setTimeout(() => {
                this._connected = false;
                logger.log(`Drone ${this.id} disconnected`);
                commander.relayConnected(this);
            }, 1000);
        });

        Drone._allDrones.push(this);
    }

    public close() {
        clearTimeout(this.disconnectTimeout);
        this.stateStream.client.close();
        this.videoStream.client.close();
    }

    async connect() {
        return new Promise<void>(async (resolve) => {
            logger.log(`Establishing connection to ${this.id}`);

            /* Enter command mode */
            await this.send("command", {
                timeout: constants.timeouts.retryConnectTimeout,
                shouldRetry: true,
            });
            const sdk = await this.read.sdk();
            const bat = await this.read.battery();
            await this.set.port(this.ports.state, this.ports.video);
            logger.stat(`Connected to drone ${this.id}@v${sdk}_${bat}%`);
            this._connected = true;
            commander.relayConnected(this);
            resolve();
        });
    }

    public startVideoStream() {
        logger.info(`Starting video stream on ${this.id}`);
        this.videoStream.start();
    }

    private async send(command: string, options?: CommandOptions) {
        logger.log(`Sending ${this.id}:${command}`);
        return await commander.send(command, this.ip, options);
    }

    /**
     * @deprecated
     *  Do not use! Use the built ins `control`, `read` and `set` attributes.
     * Use ONLY for debugging and exposing CLI to frontend
     * @param command Command to send drone
     */
    public command(command: string, options?: CommandOptions) {
        this.send(command, options);
    }

    control = {
        takeOff: (options?: CommandOptions) => this.send("takeoff", options),

        land: (options?: CommandOptions) => this.send("land", options),

        emergency: (options?: CommandOptions) => this.send("emergency", options),

        stop: (options?: CommandOptions) => this.send("stop", options),

        flip: (side: string, options?: CommandOptions) =>
            this.send(`flip ${side}`, options),

        up: (distance: number, options?: CommandOptions) =>
            this.send(`up ${Math.round(distance)}`, options),

        down: (distance: number, options?: CommandOptions) =>
            this.send(`down ${Math.round(distance)}`, options),

        left: (distance: number, options?: CommandOptions) =>
            this.send(`left ${Math.round(distance)}`, options),

        right: (distance: number, options?: CommandOptions) =>
            this.send(`right ${Math.round(distance)}`, options),

        forward: (distance: number, options?: CommandOptions) =>
            this.send(`forward ${Math.round(distance)}`, options),

        back: (distance: number, options?: CommandOptions) =>
            this.send(`back ${Math.round(distance)}`, options),

        clockwise: (angle: number, options?: CommandOptions) =>
            this.send(`cw ${angle}`, options),

        counterClockwise: (angle: number, options?: CommandOptions) =>
            this.send(`ccw ${angle}`, options),

        go: ({ x, y, z }: Pos3D, speed: number, mid?: string, options?: CommandOptions) =>
            this.send(`go ${x} ${y} ${z} ${speed} ${mid ?? ""}`, options),

        curve: (start: Pos3D, end: Pos3D, speed: number, options?: CommandOptions) =>
            this.send(
                `curve ${start.x} ${start.y} ${start.z} ${end.x} ${end.y} ${end.z} ${speed}`,
                options
            ),

        jump: (
            start: Pos3D,
            speed: number,
            yaw: number,
            mid1: number,
            mid2: number,
            options?: CommandOptions
        ) =>
            this.send(
                `jump ${start.x} ${start.y} ${start.z} ${speed} ${yaw}${mid1} ${mid2}`,
                options
            ),

        reboot: (options?: CommandOptions) => this.send("reboot", options),
    };

    read = {
        speed: async () => await this.send("speed?"),

        battery: async () => await this.send("battery?"),

        time: async () => await this.send("time?"),

        height: async () => await this.send("height?"),

        temperature: async () => await this.send("temp?"),

        attitude: async () => await this.send("attitude?"),

        barometer: async () => await this.send("baro?"),

        acceleration: async () => await this.send("acceleration?"),

        tof: async () => await this.send("tof?"),

        wifi: async () => await this.send("wifi?"),

        sdk: async () => await this.send("sdk?"),
    };

    set = {
        speed: (speed: number) => this.send(`speed ${speed}`),

        rc: (x: number, y: number, z: number, yaw: number) =>
            this.send(`rc ${x} ${y} ${z} ${yaw}`),

        wifi: (ssid: string, password: string) => this.send(`wifi ${ssid} ${password}`),

        mon: () => this.send("motoron"),

        moff: () => this.send("motoroff"),

        mdirection: (direction: 0 | 1 | 2) => this.send(`mdirection ${direction}`),

        ap: (ssid: string, pass: string) => this.send(`ap ${ssid} ${pass}`),

        port: (info: Port, video: Port) => this.send(`port ${info} ${video}`),

        fps: (fps: "low" | "middle" | "high") => this.send(`setfps ${fps}`),

        bitrate: (bitrate: 0 | 1 | 2 | 3 | 4 | 5) => this.send(`setbitrate ${bitrate}`),

        resolution: (resolution: "low" | "high") =>
            this.send(`setresolution ${resolution}`),
    };
}
