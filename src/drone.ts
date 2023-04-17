import { EventEmitter } from "stream";
import sdk, { StateInfo } from "../tellojs-sdk30/src";
import { H264Segmenter } from "./h264-segmenter";
import { com } from "./frontend-com";
import * as env from "./environment";
import { Vector3 } from "./linerAlgebra";

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

    constructor({ ip, port }: { ip: string; port?: { state: number; video: number } }) {
        super(ip, port);

        /* Add drone object reference to arrays */
        Drone.allDrones[this.id] = this;
        env.environment.addDrone(this);

        this.stateEmitter.on("message", this.onstate());
        this.videoEmitter.on("message", this.onvideo());
    }

    private updateState(state: StateInfo) {
        /* Ensure consistent order of coordinates */
        this.state.speed.y = state.speed.z;
        this.state.speed.z = state.speed.x;
        this.state.speed.x = state.speed.y;

        this.state.position = this.state.position.add(state.speed);

        this.state.rotation.pitch = (state.pitch * Math.PI) / 180;
        this.state.rotation.yaw = (state.yaw * Math.PI) / 180;
        this.state.rotation.roll = (state.roll * Math.PI) / 180;
    }
    onvideo() {
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

    /* If its the first segment, initialise a new segmenter */
    onstate() {
        return (res: any) => {
            com.state(res, this.id);
            const speed = {
                x: Number.parseInt(res.speed.x),
                y: Number.parseInt(res.speed.y),
                z: Number.parseInt(res.speed.z),
            };
            this.updateState(res);
            this.positionHistory.push(new Vector3(this.state.position));
            env.environment.updateDronePosition(this.id);
        };
    }
}
