import { EventEmitter } from "stream";
import { Drone, DroneId } from "./drone";
import * as constants from "./constants.json";
import * as fs from "fs";
import { dist } from "./linerAlgebra";

export class Object3D {
    x: number;
    y: number;
    z: number;
    radius: number;
    id: number;
    isTarget: boolean;
    whoScanned?: string;

    constructor(
        x: number,
        y: number,
        z: number,
        radius: number,
        id?: number,
        whoScanned?: string
    ) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.radius = radius;
        this.id = id ?? -1;
        this.whoScanned = whoScanned;
        this.isTarget = this.id === constants.env.TARGET_ID;
    }

    collidesWith(other: Object3D): boolean {
        const distance = Math.sqrt(
            (other.x - this.x) ** 2 + (other.y - this.y) ** 2 + (other.z - this.z) ** 2
        );
        return distance < (this.radius + other.radius) * constants.env.ERROR_MARGIN;
    }
}

class Environment extends EventEmitter {
    public objects: { [key: number]: Object3D } = {};
    private dronePositionHistory: Object3D[] = [];
    private drones: { [key: string]: Drone } = {};

    public addDrone(drone: Drone) {
        this.drones[drone.id] = drone;
    }

    public getDrone(key: string) {
        return this.drones[key];
    }

    /**
     *
     * @param arg Combined argument, must include either a position or object.
     * @param id The internal `id` of the object.
     */
    public addObject(
        arg: { pos?: { x: number; y: number; z: number; r?: number }; obj?: Object3D },
        id: number,
        whoScanned: string
    ) {
        let obj;
        if (arg.pos)
            obj = new Object3D(
                arg.pos.x,
                arg.pos.y,
                arg.pos.z,
                arg.pos.r || constants.env.BOX_RADIUS,
                id,
                whoScanned
            );
        else if (arg.obj) {
            obj = arg.obj;
            if (obj.id == -1 && id != -1) obj.id = id;
        } else throw new Error(`Invalid object passed to environment.addObject: ${arg}`);

        if (this.objects[id] == undefined) this.objects[id] = obj;
        this.emit("objects", this.objects);
    }

    public updateDronePosition(id: string) {
        const drone = this.drones[id];

        if (drone.isVirtual && dist(drone.state.position, constants.env.VIRTUAL_TARGET_POSITION) < 100) {
            this.addObject({ pos: constants.env.VIRTUAL_TARGET_POSITION }, constants.env.TARGET_ID, drone.id);
        }

        this.emit("drone", {
            droneId: id,
            dronePosition: drone.state.position,
            droneYaw: drone.state.rotation.yaw,
            dronePositionHistory: drone.positionHistory,
        });
    }

    /* Emit the environment to be sent to the frontend */
    public emitEnvironment() {
        this.emit("objects", this.objects);

        for (let drone of Object.values(this.drones)) {
            this.emit("drone", {
                droneId: drone.id,
                dronePosition: drone.state.position,
                droneYaw: drone.state.rotation.yaw,
                dronePositionHistory: drone.positionHistory,
            });
        }
    }

    public serialize() {
        const data = {
            objects: this.objects,
            drones: this.drones,
        };
        fs.writeFileSync("environment.json", JSON.stringify(data));
    }

    public listen(
        ...args:
            | [event: "objects", listener: (data: Object3D[]) => void]
            | [
                event: "drone",
                listener: (data: {
                    droneId: DroneId;
                    dronePosition: Object3D;
                    droneYaw: number;
                    dronePositionHistory: Object3D[];
                }) => void
            ]
    ): this {
        return this.on(args[0], args[1]);
    }
}

export const environment = new Environment();
