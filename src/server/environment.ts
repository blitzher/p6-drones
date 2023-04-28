import { EventEmitter } from "stream";
import { Drone, DroneId } from "./drone";
export const BOX_RADIUS = 30;
export const DRONE_RADIUS = 30;
export const ERROR_MARGIN = 1.5;

export class Object3D {
    x: number;
    y: number;
    z: number;
    radius: number;
    id: number;

    constructor(x: number, y: number, z: number, radius: number, id?: number) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.radius = radius;
        this.id = id ?? -1;
    }

    collidesWith(other: Object3D): boolean {
        const distance = Math.sqrt(
            (other.x - this.x) ** 2 +
                (other.y - this.y) ** 2 +
                (other.z - this.z) ** 2
        );
        return distance < (this.radius + other.radius) * ERROR_MARGIN;
    }
}

class Environment extends EventEmitter {
    public objects: { [key: number]: Object3D } = {};
    private dronePositionHistory: Object3D[] = [];
    private borderLength = 200;
    private drones: { [key: string]: Drone } = {};
    public mapWidth: number = 200;
    public mapLength: number = 200; //200 x 200 cm default environment

    public outsideBoundary(drone: Object3D): boolean {
        const actualLength = Math.sqrt(
            Math.abs(drone.x) ** 2 + Math.abs(drone.y) ** 2
        );

        if (actualLength > this.borderLength || drone.z > this.borderLength) {
            return true;
        }
        return false;
    }

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
        arg: {
            pos?: { x: number; y: number; z: number; r?: number };
            obj?: Object3D;
        },
        id: number
    ) {
        let obj;
        if (arg.pos)
            obj = new Object3D(
                arg.pos.x,
                arg.pos.y,
                arg.pos.z,
                arg.pos.r || BOX_RADIUS,
                id
            );
        else if (arg.obj) {
            obj = arg.obj;
            if (obj.id == -1 && id != -1) obj.id = id;
        } else
            throw new Error(
                `Invalid object passed to environment.addObject: ${arg}`
            );

        if (this.objects[id] == undefined) this.objects[id] = obj;
        this.emit("objects", this.objects);
    }

    public updateDronePosition(id: string) {
        const drone = this.drones[id];
        this.emit("drone", {
            droneId: id,
            dronePosition: drone.state.position,
            dronePositionHistory: this.dronePositionHistory,
        });
    }

    public emitEnvironment() {
        this.emit("objects", this.objects);
        this.emit("dimensions", this.mapWidth, this.mapLength);

        for (let drone of Object.values(this.drones)) {
            this.emit("drone", {
                id: drone.id,
                dronePosition: drone.state.position,
                dronePositionHistory: drone.positionHistory,
            });
        }
    }

    public serialize() {
        return JSON.stringify(this.objects);
    }

    public listen(
        ...args:
            | [event: "objects", listener: (data: Object3D[]) => void]
            | [
                  event: "drone",
                  listener: (data: {
                      droneId: DroneId;
                      dronePosition: Object3D;
                      dronePositionHistory: Object3D[];
                  }) => void
              ]
            | [event: "dimensions", listener: (data: Number[]) => void]
    ): this {
        return this.on(args[0], args[1]);
    }
}

export const environment = new Environment();
