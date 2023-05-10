import { IP, Port, StateInfo, commander } from ".";
import logger from "../../log";
import { CommandOptions } from "./commander";
import { StateStream, VideoStream } from "./streams/streams";
import { Drone } from "./drone";
import { Drone as SRVDrone } from "../../server/drone";
import * as constants from "./constants.json";
import { Vector3, rotateVectorAroundZAxis } from "../../server/linerAlgebra";

let nextStatePort = constants.ports.state;
let nextVideoPort = constants.ports.video;

type Pos3D = { x: number; y: number; z: number };
type SVPorts = { state: Port; video: Port };

export class VirtualDrone {
    static _allVirtualDrones: VirtualDrone[] = [];
    public readonly state!: StateInfo;

    public readonly ip: IP;
    public readonly id: string;

    private _connected: boolean = false;
    private ports: SVPorts = { state: 0, video: 0 };

    private stateStream: StateStream;
    private videoStream: VideoStream;

    /* Timeout to signal a disconnect, when no state data is received */
    private disconnectTimeout!: NodeJS.Timeout;

    public get connected() {
        return this._connected;
    }

    /* Expose emitters */
    public get stateEmitter() {
        return this.stateStream;
    }
    public get videoEmitter() {
        return this.videoStream;
    }

    private virtualState: StateInfo = {
        pitch: 0,
        roll: 0,
        yaw: 0,
        speed: {
            x: 0,
            y: 0,
            z: 0,
        },
        temperature: {
            low: 50,
            high: 50,
        },
        tof: 0,
        height: 0,
        battery: 100,
        barometer: 0,
        time: 0,
        acceleration: {
            x: 0,
            y: 0,
            z: 0,
        },
        mid: 0,
    };

    constructor(ip: IP, ports?: SVPorts) {
        this.ip = ip;
        this.id = ip.split(".").pop() || ip;

        /* Initialise ports */
        this.ports.state = ports?.state || nextStatePort++;
        this.ports.video = ports?.state || nextVideoPort++;

        this.stateStream = new StateStream(this.ports.state, this.ip);
        this.videoStream = new VideoStream(this.ports.video, this.ip);

        /* Setup connected variable */
        // this.stateStream.start();
        this.stateStream.on("message", (state) => {
            /* Only read initial mission id */
            if (this.state.mid != -1) state.mid = this.state.mid;
        });

        VirtualDrone._allVirtualDrones.push(this);
    }

    public data() {
        return {
            connected: this.connected,
            ports: this.ports,
            ip: this.ip,
            id: this.id,
        };
    }

    public close() {
        clearTimeout(this.disconnectTimeout);
        this.stateStream.client.close();
        this.videoStream.client.close();
    }

    async connect() {
        return new Promise<void>(async (resolve) => {
            logger.log(`Establishing connection to ${this.id}`);
            const sdk = 30;
            const bat = 100;
            logger.stat(`Connected to drone ${this.id}@v${sdk}_${bat}%`);
            this._connected = true;
            setInterval(() => {
                this.position.add(
                    new Vector3(this.state.speed).scale(
                        1 / constants.virtual.STATES_PER_SECOND
                    )
                );
                this.stateEmitter.emitter.emit("message", this.virtualState);
                this.virtualState.time++;
            }, 1000 / constants.virtual.STATES_PER_SECOND);
            resolve();
        });
    }

    public startVideoStream() {
        logger.info(`Starting video stream on ${this.id}`);
        /* this.videoStream.start(); */
    }

    private async send(command: string, options?: CommandOptions): Promise<string> {
        return new Promise((resolve) => {
            logger.log(`Sending ${this.id}:${command}`);
            this.resolveNextTimeout = setTimeout(() => {
                resolve("ok");
                logger.log(`Virtual resolved (${command})`);
            }, constants.virtual.MS_PER_COMMAND);
        });

        // return await commander.send(command, this.ip, options);
    }

    private get position(): Vector3 {
        return SRVDrone.allDrones[this.id].state.position;
    }
    private resolveNextTimeout: NodeJS.Timeout | undefined;

    private async lerpToPosition(pos: Vector3) {
        this.enqueue(() => {
            return new Promise<void>((resolve) => {
                const directionToDestination = this.position.subtract(pos);
                directionToDestination.y = -directionToDestination.y;
                this.virtualState.speed = directionToDestination.scale(
                    1000 / (constants.virtual.MS_PER_COMMAND * 10)
                );

                setTimeout(() => {
                    this.virtualState.speed = { x: 0, y: 0, z: 0 };
                    resolve();
                }, constants.virtual.MS_PER_COMMAND);
            });
        });
    }

    private async setRotation(amount: number, direction: number) {
        this.enqueue(() => {
            return new Promise<void>((resolve) => {
                this.virtualState.yaw += amount * direction;
                while (this.virtualState.yaw > 180) {
                    this.virtualState.yaw = this.virtualState.yaw - 360;
                }

                setTimeout(() => {
                    resolve();
                }, constants.virtual.MS_PER_COMMAND);
            });
        });

        return new Promise<void>((resolve) => { });
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

    private busy = false;
    private queue: (() => Promise<void>)[] = [];
    private async enqueue(func: () => Promise<void>, options?: CommandOptions) {
        if (!options) options = {};

        if (options.overwriteQueue) {
            this.queue.splice(0, 0, func);
        } else this.queue.push(func);

        if (options.overwriteQueue && options.forceReady) {
            clearTimeout(this.resolveNextTimeout);
        }

        if (options.forceReady) this.busy = false;
        if (!this.busy) this.runNextInQueue();
    }

    private async runNextInQueue() {
        const next = this.queue.shift();
        if (next) {
            this.busy = true;
            await next();
            if (this.queue.length > 0) await this.runNextInQueue();
            else this.busy = false;
        } else this.busy = false;
    }

    control = {
        takeOff: (options?: CommandOptions) =>
            this.control.up(constants.virtual.FLIGHT_HEIGHT, options),

        land: (options?: CommandOptions) =>
            this.control.down(constants.virtual.FLIGHT_HEIGHT, options),

        emergency: (options?: CommandOptions) => this.send("emergency", options),

        stop: (options?: CommandOptions) => {
            this.enqueue(
                () =>
                    new Promise((res) => {
                        this.virtualState.speed = { x: 0, y: 0, z: 0 };
                        res();
                    }),
                options
            );
            return this.send("stop", options);
        },

        flip: (side: string, options?: CommandOptions) =>
            this.send(`flip ${side}`, options),

        up: (distance: number, options?: CommandOptions) => {
            let targetPos = new Vector3({ x: 0, y: 0, z: distance });
            targetPos = rotateVectorAroundZAxis(targetPos, this.virtualState.yaw);
            this.lerpToPosition(this.position.add(targetPos));
            return this.send(`up ${Math.round(distance)}`, options);
        },

        down: (distance: number, options?: CommandOptions) => {
            let targetPos = new Vector3({ x: 0, y: 0, z: -distance });
            targetPos = rotateVectorAroundZAxis(targetPos, this.virtualState.yaw);
            this.lerpToPosition(this.position.add(targetPos));
            return this.send(`down ${Math.round(distance)}`, options);
        },

        left: (distance: number, options?: CommandOptions) => {
            let targetPos = new Vector3({ x: 0, y: distance, z: 0 });
            targetPos = rotateVectorAroundZAxis(targetPos, this.virtualState.yaw);
            this.lerpToPosition(this.position.add(targetPos));
            return this.send(`left ${Math.round(distance)}`, options);
        },

        right: (distance: number, options?: CommandOptions) => {
            let targetPos = new Vector3({ x: 0, y: -distance, z: 0 });
            targetPos = rotateVectorAroundZAxis(targetPos, this.virtualState.yaw);
            this.lerpToPosition(this.position.add(targetPos));
            return this.send(`right ${Math.round(distance)}`, options);
        },

        forward: (distance: number, options?: CommandOptions) => {
            let targetPos = new Vector3({ x: distance, y: 0, z: 0 });
            targetPos = rotateVectorAroundZAxis(targetPos, this.virtualState.yaw);
            this.lerpToPosition(this.position.add(targetPos));
            return this.send(`forward ${Math.round(distance)}`, options);
        },

        back: (distance: number, options?: CommandOptions) => {
            let targetPos = new Vector3({ x: -distance, y: 0, z: 0 });
            targetPos = rotateVectorAroundZAxis(targetPos, this.virtualState.yaw);
            this.lerpToPosition(this.position.add(targetPos));
            return this.send(`back ${Math.round(distance)}`, options);
        },

        clockwise: (angle: number, options?: CommandOptions) => {
            this.setRotation(angle, 1);
            return this.send(`cw ${angle}`, options);
        },

        counterClockwise: (angle: number, options?: CommandOptions) => {
            this.setRotation(angle, -1);
            return this.send(`ccw ${angle}`, options);
        },

        go: (
            { x, y, z }: Pos3D,
            speed: number,
            mid?: string,
            options?: CommandOptions
        ) => {
            this.lerpToPosition(new Vector3({ x, y, z }));
            return this.send(`go ${x} ${y} ${z} ${speed} ${mid ?? ""}`, options);
        },

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

        battery: async () => 100,

        time: async () => await this.send("time?"),

        height: async () => await this.send("height?"),

        temperature: async () => await this.send("temp?"),

        attitude: async () => await this.send("attitude?"),

        barometer: async () => await this.send("baro?"),

        acceleration: async () => await this.send("acceleration?"),

        tof: async () => await this.send("tof?"),

        wifi: async () => await this.send("wifi?"),

        sdk: async () => 30,
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
