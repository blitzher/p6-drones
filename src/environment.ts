import { relative } from "path";
import { EventEmitter } from "stream";
import { sdk, State as _StateInfo } from "tellojs-sdk30";
import { Vector3 } from "./linerAlgebra";

type StateInfo = _StateInfo & { position: { x: number; y: number; z: number } };

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

    //Returns true if it doesnt collide
    //public collidesWith(other: Object3D): boolean;
    public collidesWith(
        other: Object3D,
        checkX?: number,
        checkY?: number,
        checkZ?: number
    ): boolean {
        if (checkX != undefined && checkY != undefined && checkZ != undefined) {
            const distance = Math.sqrt(
                (other.x - this.x + checkX) ** 2 +
                    (other.y - this.y + checkY) ** 2 +
                    (other.z - this.z + checkZ) ** 2
            );

            return distance < this.radius + other.radius;
        } else {
            const distance = Math.sqrt(
                (other.x - this.x) ** 2 +
                    (other.y - this.y) ** 2 +
                    (other.z - this.z) ** 2
            );

            return distance < this.radius + other.radius;
        }
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

export const droneState = {
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
    updatePosition: function (speed: { z: number; y: number; x: number }) {
        const temp = speed.z;
        speed.z = speed.y;
        speed.y = temp;

        const temp2 = speed.z;
        speed.z = speed.x;
        speed.x = temp2;

        console.log(speed);

        this.position = this.position.add(speed);
    },

    updateRotation: function (pitch: number, yaw: number, roll: number) {
        this.rotation.pitch = (pitch * Math.PI) / 180;
        this.rotation.yaw = (yaw * Math.PI) / 180;
        this.rotation.roll = (roll * Math.PI) / 180;
    },
};

class Environment extends EventEmitter {
    public objects: Object3D[];

    private dronePositionHistory: Object3D[] = [];

    private borderLength = 200;

    constructor() {
        super();
        this.objects = [];
    }

    public outsideBoundary(drone: Object3D): boolean {
        const actualLength = Math.sqrt(
            Math.abs(drone.x) ** 2 + Math.abs(drone.y) ** 2
        );

        if (actualLength > this.borderLength || drone.z > this.borderLength) {
            return true;
        }
        return false;
    }

    public addObject(arg: {
        pos?: { x: number; y: number; z: number; r: number };
        obj?: Object3D;
    }) {
        let obj;
        if (arg.pos)
            obj = new Object3D(arg.pos.x, arg.pos.y, arg.pos.z, arg.pos.r);
        else if (arg.obj) obj = arg.obj;
        else
            throw new Error(
                `Invalid object passed to environment.addObject: ${arg}`
            );

        this.objects.push(obj);
        this.emit("objects", this.objects);
    }

    public updateDronePosition(newState: { x: number; y: number; z: number }) {
        this.dronePositionHistory.push(
            new Object3D(newState.x, newState.y, newState.z, 2)
        );
        this.emit("drone", {
            dronePosition: droneState.position,
            dronePositionHistory: this.dronePositionHistory,
        });
    }

    public emitEnvironment() {
        this.emit("objects", this.objects);
        this.emit("drone", {
            dronePosition: droneState.position,
            dronePositionHistory: this.dronePositionHistory,
        });
    }

    public serialize() {
        return JSON.stringify(this.objects.map((object) => object.serialize()));
    }

    public listen(
        ...args:
            | [event: "objects", listener: (data: Object3D[]) => void]
            | [
                  event: "drone",
                  listener: (data: {
                      dronePosition: Object3D;
                      dronePositionHistory: Object3D[];
                  }) => void
              ]
    ): this {
        console.log(args);
        return this.on(args[0], args[1]);
    }
}

class DronePath {
    mapWidth: number;
    mapLength: number;

    constructor(mapwidth: number, maplength: number) {
        this.mapWidth = mapwidth;
        this.mapLength = maplength;
    }

    public async DesignPattern() {
        let iterations: number = Math.floor(this.mapWidth / 30);
        let moveLength: number = this.mapLength;
        let moveWidth: number = 30;

        const mission: (() => Promise<any>)[] = [];

        //mission.push(() => sdk.control.takeOff());

        let flyDestination: Vector3 = new Vector3(droneState.position);
        let relevantBoxes: Object3D[] = [];

        for (let index = 0; index < iterations; index++) {
            if (index % 2 == 0) {
                flyDestination.x += moveLength;
                relevantBoxes = this.getRelevantBoxes(
                    flyDestination,
                    moveLength
                );

                if (relevantBoxes.length == 0) {
                    mission.push(() => sdk.control.go(flyDestination, 100));
                    mission.push(() => sdk.control.rotate.clockwise(90));
                } else {
                    mission.push(() => sdk.control.go(relevantBoxes[0], 100));
                }

                //     mission.push(() => sdk.control.move.front(30));
                //     mission.push(() => sdk.control.rotate.clockwise(90));
                // } else {
                //     mission.push(() => sdk.control.move.front(moveLength));
                //     mission.push(() => sdk.control.rotate.counterClockwise(90));
                //     mission.push(() => sdk.control.move.front(30));
                //     mission.push(() => sdk.control.rotate.counterClockwise(90));
                // }
            }

            mission.push(() => sdk.control.land());
            return mission;
        }
    }

    public getRelevantBoxes(
        flyDestination: Vector3,
        moveLength: number
    ): Object3D[] {
        let relevantBoxes: Object3D[] = [];
        let positionCheck: Vector3 = droneState.position;

        let moveVector: Vector3 = positionCheck.subtract(flyDestination);

        for (const box of environment.objects) {
            //Checks each 5 cm. if there is a box in the path
            for (let i = 0; i < moveLength; i += 5) {
                let dronePositions: Object3D = new Object3D(
                    moveVector.x + i,
                    moveVector.y + i,
                    moveVector.z + i,
                    20
                );

                if (dronePositions.collidesWith(box)) {
                    relevantBoxes.push(box);
                    console.log(box);
                }
            }
        }
        return relevantBoxes;
    }

    public async Fly(patteren: string) {
        switch (patteren) {
            case "Snake":
                const snake = await this.DesignPattern();
                for (const iterator of snake!) {
                    await iterator();
                }

                break;

            default:
                break;
        }
    }
    // const testEnvironment = new Environment();
    // const path = new DronePath(60, 100);

    // export default {
    //     testEnvironment,
    //     path,
    // };
}
export const environment = new Environment();
export const drone = new Object3D(0, 0, 0, 20);
export const dronePath = new DronePath(200, 200);
