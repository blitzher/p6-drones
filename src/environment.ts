import { relative } from "path";
import { EventEmitter } from "stream";

import { Vector3 } from "./linerAlgebra";
import { Drone, DroneId } from "./drone";
import { env } from "process";
import Fly from "./Fly";

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

class Environment extends EventEmitter {
    public objects: Object3D[] = [];
    private dronePositionHistory: Object3D[] = [];
    private borderLength = 200;
    private drones: { [key: string]: Drone } = {};

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

    public addObject(arg: {
        pos?: { x: number; y: number; z: number; r: number };
        obj?: Object3D;
        id: number;
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
                  listener: (data: {
                      id: DroneId;
                      dronePosition: Object3D;
                      dronePositionHistory: Object3D[];
                  }) => void
              ]
    ): this {
        return this.on(args[0], args[1]);
    }
}
class DronePath {
    mapWidth: number;
    mapLength: number;
    numberOfDrones: number;
    static dronePathCounter: number = 0;
    destinationArray: Vector3[] = [];
    //static firstIteration: boolean = true;

    constructor(mapwidth: number, maplength: number, numberofdrones: number) {
        this.mapWidth = mapwidth;
        this.mapLength = maplength;
        this.numberOfDrones = numberofdrones;
    }

    public async SnakePattern() {
        let iterations: number = Math.floor(this.mapWidth / 30);
        let moveLength: number = this.mapLength;
        let moveWidth: number = 30;
        let flyDestination: Vector3 = new Vector3(droneOne.state.position);
        const mission: (() => Promise<any>)[] = [];

        for (let index = 0; index < iterations; index++) {
            if (index % 2 == 0) {
                flyDestination.x +=
                    moveLength + DronePath.dronePathCounter * 30;
                this.destinationArray.push(flyDestination);
                mission.push(() => droneOne.control.go(flyDestination, 100));
                mission.push(() => droneOne.control.clockwise(90));
                flyDestination.z += moveWidth + DronePath.dronePathCounter * 30;
                this.destinationArray.push(flyDestination);
                mission.push(() => droneOne.control.go(flyDestination, 100));
                mission.push(() => droneOne.control.clockwise(90));
            } else {
                flyDestination.x -=
                    moveLength +
                    Math.abs(DronePath.dronePathCounter - this.numberOfDrones) *
                        30;
                this.destinationArray.push(flyDestination);
                mission.push(() => droneOne.control.go(flyDestination, 100));
                mission.push(() => droneOne.control.clockwise(90));
                flyDestination.z +=
                    moveWidth +
                    Math.abs(DronePath.dronePathCounter - this.numberOfDrones) *
                        30;
                this.destinationArray.push(flyDestination);
                mission.push(() => droneOne.control.go(flyDestination, 100));
                mission.push(() => droneOne.control.clockwise(90));
            }
        }

        if (this.numberOfDrones == DronePath.dronePathCounter) {
            DronePath.dronePathCounter = 0;
        }

        if (this.numberOfDrones > DronePath.dronePathCounter) {
            DronePath.dronePathCounter += 1;
        }

        return mission;
    }

    public getRelevantBoxes(flyDestination: Vector3): Object3D[] {
        let relevantBoxes: Object3D[] = [];
        let positionCheck: Vector3 = droneOne.state.position;
        let moveVector: Vector3 = positionCheck
            .subtract(flyDestination)
            .normalise();
        let dronePosition: Object3D = new Object3D(0, 0, 0, 20);

        for (const box of environment.objects) {
            //Checks each 5 cm. if there is a box in the path
            for (let i = 0; i < moveVector.length(); i += 5) {
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

    public async Fly() {
        const snake = await this.SnakePattern();
        let boxes: Object3D[];
        //J for movements, excluding rotations
        let j: number = 0;

        for (let i = 0; i < snake.length; i++) {
            if (i % 2 == 0) {
                boxes = this.getRelevantBoxes(this.destinationArray[j]);
                if (boxes.length != 0) {
                    //gotoclosesbox + undvigelse skal rykkes in foran her i snake array
                    snake.splice(
                        i,
                        0,
                        ...this.Maneuver(boxes, this.destinationArray[j])
                    );

                    j++;
                }
            }
            await snake[i];
        }
    }
    public Maneuver(obstacles: Object3D[], flyDestination: Vector3) {
        const maneuverCommands: (() => Promise<any>)[] = [];

        let lengthArray: number[] = [];
        let nearestBoxDist: number;

        // Go to position just before hitting the obstacle & locate boxes on either side of current obstacle
        for (const obstacle of obstacles) {
            lengthArray.push(flyDestination.lengthToBox(obstacle));
        }

        nearestBoxDist = lengthArray.indexOf(Math.min(...lengthArray));

        let rightBox = new Object3D(
            obstacles[nearestBoxDist].x + BOX_RADIUS,
            obstacles[nearestBoxDist].y,
            obstacles[nearestBoxDist].z,
            BOX_RADIUS
        );
        let leftBox = new Object3D(
            obstacles[nearestBoxDist].x - BOX_RADIUS,
            obstacles[nearestBoxDist].y,
            obstacles[nearestBoxDist].z,
            BOX_RADIUS
        );

        maneuverCommands.push(() =>
            droneOne.control.go(obstacles[nearestBoxDist], 100)
        );

        // Avoidance
        // TODO: Check if an obstacle is on either side of the current obstacle

        maneuverCommands.push(() => droneOne.control.clockwise(90));
        maneuverCommands.push(() => droneOne.control.forward(BOX_RADIUS));
        maneuverCommands.push(() => droneOne.control.counterClockwise(90));
        maneuverCommands.push(() => droneOne.control.forward(BOX_RADIUS * 2));
        maneuverCommands.push(() => droneOne.control.counterClockwise(90));

        return maneuverCommands;
    }

    // public goToClosestBox(obstacles: Object3D[], flyDestination: Vector3) {

    //     let lengthArray: number[] = [];
    //     let nearestBox: number;
    //     for (const obstacle of obstacles) {
    //         lengthArray.push(flyDestination.lengthToBox(obstacle));
    //     }
    //     nearestBox = lengthArray.indexOf(Math.min(...lengthArray));

    //     return () => sdk.control.go(obstacles[nearestBox], 100);
    // }
}

// const testEnvironment = new Environment();
// const path = new DronePath(60, 100);

// export default {
//     testEnvironment,
//     path,
// };

export const environment = new Environment();
export const drone = new Object3D(0, 0, 0, 20);
export const BOX_RADIUS = 10;
export const dp = new DronePath(30, 30, 1);
