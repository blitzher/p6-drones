import EventEmitter from "events";
import { IP, Port } from "..";
import * as constants from "../constants.json";
import { commander } from "../index";
import { Socket } from "../socket";
import logger from "../../../log";

export type StateInfo = {
    pitch: number;
    roll: number;
    yaw: number;
    speed: { x: number; y: number; z: number };
    temperature: { low: number; high: number };
    tof: number;
    height: number;
    battery: number;
    barometer: number;
    time: number;
    acceleration: { x: number; y: number; z: number };
};

export class StateStream {
    readonly port: Port;
    readonly client: Socket;
    readonly ip: IP;
    readonly emitter: EventEmitter;

    constructor(port: Port, ip: IP) {
        this.port = port;
        this.ip = ip;
        this.client = new Socket();
        this.emitter = new EventEmitter();
    }
    private format = (mapped: any) => ({
        pitch: mapped.pitch,
        roll: mapped.roll,
        yaw: mapped.yaw,
        speed: { x: mapped.vgx, y: mapped.vgy, z: mapped.vgz },
        temperature: { low: mapped.templ, high: mapped.temph },
        tof: mapped.tof,
        height: mapped.h,
        battery: mapped.bat,
        barometer: mapped.baro,
        time: mapped.time,
        acceleration: { x: mapped.agx, y: mapped.agy, z: mapped.agz },
    });

    private map = (message: Buffer) => {
        let mapped = message
            .toString()
            .slice(0, -1)
            .split(";")
            .map((element: any) => element.split(":"))
            .reduce((acc: any, [key, value]: [any, any]) => {
                acc[key] = Number.parseInt(value);
                return acc;
            }, {});

        return this.format(mapped);
    };

    start() {
        this.client.bind(this.port);
        this.client.on("message", (message) => {
            logger.increment(`State data received@${this.port}`);
            this.emitter.emit("message", this.map(message));
        });
    }
}

export class VideoStream {
    readonly port: Port;
    readonly client: Socket;
    readonly ip: IP;
    readonly emitter: EventEmitter;

    constructor(port: Port, ip: IP) {
        this.port = port;
        this.ip = ip;

        this.client = new Socket();
        this.emitter = new EventEmitter();
    }
    async start() {
        commander.send("streamon", this.ip);
        this.client.bind(this.port);
        this.client.on("message", (message) => {
            logger.increment(`Video data received@${this.port}`);
            this.emitter.emit("message", message);
        });
        return 0;
    }

    async stop() {
        await commander.send("streamoff", this.ip);

        this.client.close();
    }
}
