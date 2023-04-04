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
    static firstIteration: boolean = true;

    constructor(mapwidth: number, maplength: number) {
        this.mapWidth = mapwidth;
        this.mapLength = maplength;
    }

    public async SnakePattern() {
        let iterations: number = Math.floor(this.mapWidth / 30);
        let moveLength: number = this.mapLength;
        let moveWidth: number = 30;
        const mission: (() => Promise<any>)[] = [];

        let flyDestination: Vector3 = new Vector3(droneState.position);
        let relevantBoxes: Object3D[] = [];

        for (let index = 0; index < iterations / 2; index++) {
            if (index % 2 == 0) {
                if (DronePath.firstIteration) {
                    flyDestination.x = 100;
                    mission.push(() => sdk.control.go(flyDestination, 100));
                    mission.push(() => sdk.control.rotate.clockwise(90));
                    flyDestination.z += moveWidth;
                    mission.push(() => sdk.control.go(flyDestination, 100));
                    mission.push(() => sdk.control.rotate.clockwise(90));
                    DronePath.firstIteration = false;
                }

                flyDestination.x += moveLength;
                mission.push(() => sdk.control.go(flyDestination, 100));
                mission.push(() => sdk.control.rotate.clockwise(90));
                flyDestination.z += moveWidth;
                mission.push(() => sdk.control.go(flyDestination, 100));
                mission.push(() => sdk.control.rotate.clockwise(90));

                if (relevantBoxes.length == 0) {
                    flyDestination.x -= moveLength;
                    mission.push(() => sdk.control.go(flyDestination, 100));
                    mission.push(() => sdk.control.rotate.clockwise(90));
                    flyDestination.z += moveWidth;
                    mission.push(() => sdk.control.go(flyDestination, 100));
                    mission.push(() => sdk.control.rotate.clockwise(90));
                }
            }
        }


        for (let index = 0; index < iterations / 2; index++) {

        }
        return mission;

    }

    public getRelevantBoxes(flyDestination: Vector3, moveLength: number): Object3D[] {
        let relevantBoxes: Object3D[] = [];
        let positionCheck: Vector3 = droneState.position;
<<<<<<< Updated upstream

        let moveVector: Vector3 = positionCheck
            .subtract(flyDestination)
            .normalise();
=======
        flyDestination.x += moveLength;
        let moveVector: Vector3 = positionCheck.subtract(flyDestination).normalise();
>>>>>>> Stashed changes
        let dronePosition: Object3D = new Object3D(0, 0, 0, 20);

        for (const box of environment.objects) {
            //Checks each 5 cm. if there is a box in the path
            for (let i = 0; i < moveLength; i += 5) {
                moveVector.scale(i);
                dronePosition = new Object3D(
                    moveVector.x,
                    moveVector.y,
                    moveVector.z,
                    20
                );

                if (dronePosition.collidesWith(box)) {
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

    public async Maneuver(obstacles: Object3D[], flyDestination: Vector3) {
        const maneuverCommands: (() => Promise<any>)[] = [];
        let nearestBox = this.goToClosestBox(obstacles, flyDestination);
        let relevantBoxes: Object3D[] = [];

<<<<<<< Updated upstream
        const obstaclePosition = new Object3D(
            obstacle.x,
            obstacle.y,
            obstacle.z - obstacle.radius,
            obstacle.radius
        );
=======
>>>>>>> Stashed changes
        // Go to position just before hitting the obstacle
        maneuverCommands.push(() => sdk.control.go(nearestBox, 100));
        maneuverCommands.push(() => sdk.control.rotate.clockwise(90));

        relevantBoxes = this.getRelevantBoxes(flyDestination, moveLength);

        if (condition) {

        }
        maneuverCommands.push(() => sdk.control.go())

        return maneuverCommands;
    }

    public goToClosestBox(obstacles: Object3D[], flyDestination: Vector3) {

        let lengthArray: number[] = [];
        let nearestBox: number;
        for (const obstacle of obstacles) {
            lengthArray.push(flyDestination.lengthToBox(obstacle));
        }
        nearestBox = lengthArray.indexOf(Math.min(...lengthArray));

        return () => sdk.control.go(obstacles[nearestBox], 100);
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
