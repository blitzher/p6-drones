import { relative } from "path";
import { EventEmitter } from "stream";
import { Drone, DroneId } from "./drone";
import { env } from "process";
import { commander } from "../tellojs-sdk30/src";

const BOX_RADIUS = 10;

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
}

class Environment extends EventEmitter {
    public objects: { [key: number]: Object3D } = {};
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

    public getDrone(key: string) {
        return this.drones[key];
    }

    /**
     *
     * @param arg Combined argument, must include either a position or object.
     * @param id The internal `id` of the object.
     */
    public addObject(arg: { pos?: { x: number; y: number; z: number; r?: number }; obj?: Object3D }, id: number) {
        let obj;
        if (arg.pos) obj = new Object3D(arg.pos.x, arg.pos.y, arg.pos.z, arg.pos.r || BOX_RADIUS);
        else if (arg.obj) obj = arg.obj;
        else
            throw new Error(
                `Invalid object passed to environment.addObject: ${arg}`
            );

        this.objects[id] = obj;
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

    public *SnakePattern(drone: Drone) {
        let iterations: number = Math.floor(this.mapWidth / 30);
        let moveLength: number = this.mapLength;
        let moveWidth: number = 30;
        let flyDestination: Vector3 = new Vector3(drone.state.position);
        const mission: (() => Promise<any>)[] = [];
        yield drone.control.takeOff();

        for (let index = 0; index < iterations; index++) {
            if (index % 2 == 0) {
                console.log(index);
                flyDestination.x = moveLength + DronePath.dronePathCounter * 30;
                this.destinationArray.push(flyDestination);
                yield drone.control.go(flyDestination, 100);
                yield drone.control.clockwise(90);
                flyDestination.x = moveWidth;
                this.destinationArray.push(flyDestination);
                yield drone.control.go(flyDestination, 100);
                yield drone.control.clockwise(90);
            } else {
                flyDestination.x = moveLength;
                this.destinationArray.push(flyDestination);
                yield drone.control.go(flyDestination, 100);
                yield drone.control.counterClockwise(90);
                flyDestination.x = moveWidth;
                this.destinationArray.push(flyDestination);
                yield drone.control.go(flyDestination, 100);
                yield drone.control.counterClockwise(90);
            }
        }

        if (this.numberOfDrones == DronePath.dronePathCounter) {
            DronePath.dronePathCounter = 0;
        }

        if (this.numberOfDrones > DronePath.dronePathCounter) {
            DronePath.dronePathCounter += 1;
        }
    }

    public getRelevantBoxes(flyDestination: Vector3, drone: Drone): Object3D[] {
        let relevantBoxes: Object3D[] = [];
        let positionCheck: Vector3 = drone.state.position;
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

    public async Fly(drone: Drone) {
        const snake = await this.SnakePattern(drone);
        let boxes: Object3D[];
        //J for movements, excluding rotations
        let j: number = 0;
        commander.socket.on("message", (msg) => {
            if (msg.toString().includes("ok")) {
                console.log(drone.state.position);
                boxes = this.getRelevantBoxes(this.destinationArray[j], drone);
                if (boxes.length != 0) {
                    //gotoclosestbox + undvigelse skal rykkes in foran her i snake array
                    this.Maneuver(boxes, this.destinationArray[j], drone);
                } else {
                    snake.next();
                }
            }
            if (snake.next().done) drone.control.land();
        });
    }
    public Maneuver(
        obstacles: Object3D[],
        flyDestination: Vector3,
        drone: Drone
    ) {
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
            drone.control.go(obstacles[nearestBoxDist], 100)
        );

        // Avoidance
        // TODO: Check if an obstacle is on either side of the current obstacle

        // maneuverCommands.push(() => drone.control.clockwise(90));
        // maneuverCommands.push(() => drone.control.forward(BOX_RADIUS));
        // maneuverCommands.push(() => drone.control.counterClockwise(90));
        // maneuverCommands.push(() => drone.control.forward(BOX_RADIUS * 2));
        // maneuverCommands.push(() => drone.control.counterClockwise(90));

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
