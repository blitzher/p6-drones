import { EventEmitter } from "stream";

import { Vector3 } from "./linerAlgebra";
import { Drone, DroneId } from "./drone";

export class Object3D {
    x: number;
    y: number;
    z: number;
    radius: number;

    constructor(x: number, y: number, z: number, radius: number) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.radius = radius;
    }

    collidesWith(other: Object3D): boolean {
        const distance = Math.sqrt((other.x - this.x) ** 2 + (other.y - this.y) ** 2 + (other.z - this.z) ** 2);

        return distance < this.radius + other.radius;
    }

    public serialize() {
        return JSON.stringify({
            x: this.x,
            y: this.y,
            z: this.z,
            radius: this.radius,
        });
    }
}

class Environment extends EventEmitter {
    public objects: Object3D[] = [];
    private dronePositionHistory: Object3D[] = [];
    private borderLength = 200;
    private drones: { [key: string]: Drone } = {};

    public outsideBoundary(drone: Object3D): boolean {
        const actualLength = Math.sqrt(Math.abs(drone.x) ** 2 + Math.abs(drone.y) ** 2);

        if (actualLength > this.borderLength || drone.z > this.borderLength) {
            return true;
        }
        return false;
    }

    public addDrone(drone: Drone) {
        this.drones[drone.id] = drone;
    }

    public addObject(arg: { pos?: { x: number; y: number; z: number; r: number }; obj?: Object3D; id: number }) {
        let obj;
        if (arg.pos) obj = new Object3D(arg.pos.x, arg.pos.y, arg.pos.z, arg.pos.r);
        else if (arg.obj) obj = arg.obj;
        else throw new Error(`Invalid object passed to environment.addObject: ${arg}`);

        this.objects.push(obj);
        this.emit("objects", this.objects);
    }

    public updateDronePosition(id: string) {
        const drone = this.drones[id];
        this.emit("drone", {
            dronePosition: drone.state.position,
            dronePositionHistory: this.dronePositionHistory,
        });
    }

    public emitEnvironment() {
        this.emit("objects", this.objects);

        for (let drone of Object.values(this.drones)) {
            this.emit("drone", {
                id: drone.id,
                dronePosition: drone.state.position,
                dronePositionHistory: drone.positionHistory,
            });
        }
    }

    public serialize() {
        return JSON.stringify(this.objects.map((object) => object.serialize()));
    }

    public listen(
        ...args:
            | [event: "objects", listener: (data: Object3D[]) => void]
            | [
                  event: "drone",
                  listener: (data: { id: DroneId; dronePosition: Object3D; dronePositionHistory: Object3D[] }) => void
              ]
    ): this {
        return this.on(args[0], args[1]);
    }
}

export const environment = new Environment();
export const drone = new Object3D(0, 0, 0, 20);
export const BOX_RADIUS = 10;
