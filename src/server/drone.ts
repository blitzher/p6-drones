import { EventEmitter } from "stream";
import sdk, { StateInfo } from "../tellojs-sdk30/src";
import { H264Segmenter } from "./h264-segmenter";
import { com } from "./frontend-com";
import * as env from "./environment";
import { Vector3 } from "./linerAlgebra";
import logger from "../log";

export const droneState = {};
export type DroneId = string;

export class Drone extends sdk.Drone {
    static allDrones: { [key: string]: Drone } = {};

    /* Setup public attributes */
    public readonly positionHistory: Vector3[] = [];

    public readonly state = {
        position: new Vector3({
            x: 0,
            y: 0,
            z: 0,
        }),
        rotation: {
            pitch: 0,
            yaw: 0,
            roll: 0,
        },
        speed: new Vector3({
            x: 0,
            y: 0,
            z: 0,
        }),
    };

    private lastStateTime: number;

    constructor({ ip, port }: { ip: string; port?: { state: number; video: number } }) {
        super(ip, port);

        /* Add drone object reference to arrays */
        Drone.allDrones[this.id] = this;
        env.environment.addDrone(this);

        this.lastStateTime = Date.now();

        this.stateEmitter.on("message", this.onstate());
        this.videoEmitter.on("message", this.onvideo());
    }

    private updateState(state: StateInfo) {
        /* Calculate delta time and set lastStateTime to now */
        const now = Date.now();
        const deltaTime = (now - this.lastStateTime) / 1000; /* Divide by 1000 to get seconds */
        this.lastStateTime = now;

        /* Ensure consistent order of coordinates, and convert to cm */
        this.state.speed.y = state.height;
        this.state.speed.z = state.speed.x * 10;
        this.state.speed.x = state.speed.y * 10;

        this.state.position = this.state.position.add(this.state.speed.scale(deltaTime));

        const pos = this.state.position;
        const posString = `${Math.round(pos.x * 10) / 10}, ${Math.round(pos.y * 10) / 10}, ${
            Math.round(pos.z * 10) / 10
        }`;
        logger.concurrent(this.id, posString);

        this.state.rotation.pitch = (state.pitch * Math.PI) / 180;
        this.state.rotation.yaw = (state.yaw * Math.PI) / 180;
        this.state.rotation.roll = (state.roll * Math.PI) / 180;

        this.positionHistory.push(new Vector3(this.state.position));
    }
    private onvideo() {
        let isFirst = true;
        let segmenter: H264Segmenter;

        return (...res: any[]) => {
            if (isFirst) {
                segmenter = new H264Segmenter(res[0]);
                isFirst = false;
            }

            /* Feed the segmenter segments as they come in */
            const segment = segmenter.feed(res[0]);

            /* If the segmenter.feed method returns an object,
             * dispatch the segment to clients */
            if (segment) com.video(segment, this.id);
        };
    }

    /* Whenever a new state is received, update the position of the drone,
     * and inform the enviroment of the new position */
    private onstate() {
        return (res: any) => {
            com.state(res, this.id);
            this.updateState(res);
            env.environment.updateDronePosition(this.id);
        };
    }
}
