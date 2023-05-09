import { EventEmitter } from "stream";
import sdk, { StateInfo as sdkStateInfo } from "../tellojs-sdk30/src";
import { H264Segmenter } from "./h264-segmenter";
import { com } from "./frontend-com";
import * as env from "./environment";
import { Vector3, rotateVectorAroundZAxis } from "./linerAlgebra";
import logger from "../log";
import * as constants from "./constants.json";

export const droneState = {};
export type DroneId = string;

interface StateInfo extends sdkStateInfo {
    position: Vector3;
    rotation: {
        pitch: number;
        yaw: number;
        roll: number;
    };
    speedVector: Vector3;
}

export class Drone extends sdk.VirtualDrone {
    static allDrones: { [key: string]: Drone } = {};

    /* Setup public attributes */
    public readonly positionHistory: Vector3[] = [];

    /* Set default state values */
    public readonly state: StateInfo = {
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
        speedVector: new Vector3({
            x: 0,
            y: 0,
            z: 0,
        }),
        speed: { x: 0, y: 0, z: 0 },
        acceleration: { x: 0, y: 0, z: 0 },
        barometer: 0,
        battery: 0,
        height: 0,
        mid: -1,
        pitch: 0,
        yaw: 0,
        roll: 0,
        temperature: { low: 0, high: 0 },
        time: 0,
        tof: 0,
    };

    /* Used to ensure that a drone can only be
     * on a single 'mission' at a time */
    public inFlight: boolean = false;

    private lastStateTime: number;
    public readonly rotOffset: { pitch: number; yaw: number; roll: number } = {
        pitch: 0,
        yaw: 0,
        roll: 0,
    };

    /**
     *
     * @param param0
     * @param param1 Starting position of drone
     */
    constructor(
        { ip, port }: { ip: string; port?: { state: number; video: number } },
        startingPostition?: { x: number; y: number; z: number },
        startingRotation?: { pitch: number; yaw: number; roll: number }
    ) {
        super(ip, port);

        /* Add drone object reference to arrays */
        Drone.allDrones[this.id] = this;
        env.environment.addDrone(this);

        if (startingPostition) {
            this.state.position = new Vector3(startingPostition);
        }
        if (startingRotation) {
            this.rotOffset = startingRotation;
        }

        this.lastStateTime = Date.now();

        this.stateEmitter.on("message", this.onstate());
        this.videoEmitter.on("message", this.onvideo());
    }

    private updateState(state: StateInfo) {
        /* Calculate delta time and set lastStateTime to now */
        const now = Date.now();
        const deltaTime =
            (now - this.lastStateTime) / 1000; /* Divide by 1000 to get seconds */
        this.lastStateTime = now;

        /* Convert from dm to cm.
         * Speed forward is negative for some reason */
        let speedVector = new Vector3({ x: 0, y: 0, z: 0 });
        speedVector.x = -state.speed.x * 10;
        speedVector.y = state.speed.y * 10;

        /* Adjust for undershoot of speed and initial rotation*/
        // speedVector = speedVector.scale(constants.drone.POSITION_CORRECTION_FACTOR);
        speedVector = rotateVectorAroundZAxis(speedVector, this.rotOffset.yaw);

        state.position = this.state.position.add(speedVector.scale(deltaTime));

        state.position.z = state.tof;

        state.rotation = {
            pitch: state.pitch + this.rotOffset.pitch,
            roll: state.roll + this.rotOffset.roll,
            yaw: state.yaw + this.rotOffset.yaw,
        };
        state.rotation.pitch = (state.rotation.pitch * Math.PI) / 180;
        state.rotation.roll = (state.rotation.roll * Math.PI) / 180;
        state.rotation.yaw = (state.rotation.yaw * Math.PI) / 180;
        /* Assign state to drone */
        Object.assign(this.state, state);
        logger.concurrent(`D${this.id} State`, JSON.stringify(this.state, undefined, 2));
    }
    private onvideo() {
        let isFirst = true;
        let segmenter: H264Segmenter;

        return (...res: any[]) => {
            if (isFirst) {
                segmenter = new H264Segmenter();
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
