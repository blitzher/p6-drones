import { resolve } from "path";
import { Position3D, sdk, SDK } from "tellojs-sdk30";

type DroneState = {
    x: number;
    y: number;
    z: number;
};

/* class DroneState {
    x: number;
    y: number;
    z: number;

    constructor();
    constructor(x?, y?, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
} */

class Object3D {
    x: number;
    y: number;
    z: number;
    radius: number;

    constructor(x, y, z, radius?) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.radius = radius;
    }

    //Returns true if it doesnt collide
    //public collidesWith(other: Object3D): boolean;
    public collidesWith(other: Object3D, checkX?: number, checkY?: number, checkZ?: number): boolean {
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

class Environment {
    public environment: Object3D[];

    private dronePositionHistory: Object3D[];
    private drone: Object3D;

    private borderLength = 200;

    constructor() {
        this.environment = [];
        this.drone = new Object3D(0, 0, 0, 20);
    }

    public OutsideBoundary(drone: Object3D): boolean {
        const actualLength = Math.sqrt(
            Math.abs(drone.x) ** 2 + Math.abs(drone.y) ** 2
        );

        if (actualLength > this.borderLength || drone.z > this.borderLength) {
            return true;
        }
    }

    public addObject(x: number, y: number, z: number, r: number) {
        this.environment.push(new Object3D(x, y, z, r));
    }

    public updateDronePosition(droneState: DroneState) {
        this.drone.x = droneState.x;
        this.drone.y = droneState.y;
        this.drone.z = droneState.z;

        this.dronePositionHistory.push(
            new Object3D(this.drone.x, this.drone.y, this.drone.z, 2)
        );
    }

    public serialize() {
        return JSON.stringify({
            dronePositionHistory: this.dronePositionHistory.map((position) =>
                position.serialize()
            ),
            environment: this.environment.map((object) => object.serialize()),
            drone: this.drone.serialize(),
        });
    }
}




class Fly {
    a: number


}



class DronePath {
    mapWidth: number;
    mapLength: number;

    constructor(mapwidth, maplength) {
        this.mapWidth = mapwidth;
        this.mapLength = maplength;

    }

    public async DesignPattern() {
        let iterations: number = Math.floor(this.mapWidth / 30);
        let moveLength: number = this.mapLength;
        let moveWidth: number = 30;

        const mission: Array<[string, (() => Promise<any>)]> = [];

        mission.push(["takeOff", () => sdk.control.takeOff()]);

        for (let index = 0; index < iterations; index++) {
            if (index % 2 == 0) {

                mission.push(["front", () => sdk.control.go(this.calculateSnakeGo(iterations, index, moveLength, moveWidth), 100)]);
                mission.push(["clockwise", () => sdk.control.rotate.clockwise(90)]);

                mission.push(["front", () => sdk.control.move.front(30)]);
                mission.push(["clockwise", () => sdk.control.rotate.clockwise(90)]);
            } else {
                mission.push(["front", () => sdk.control.move.front(moveLength)]);
                mission.push(["counterClockwise", () => sdk.control.rotate.counterClockwise(90)]);
                mission.push(["front", () => sdk.control.move.front(30)]);
                mission.push(["counterClockwise", () => sdk.control.rotate.counterClockwise(90)]);
            }
        }

        mission.push(["land", () => sdk.control.land()]);
        return mission;

    }

    public calculateSnakeGo(iterations: number, currentIteration: number, moveLength: number, moveWidth: number): Position3D {
        let goPosition: Position3D;
        goPosition.x = drone.x;
        goPosition.y = drone.y;
        goPosition.z = drone.z;

        if (currentIteration == 0) {

            for (const box of environment.environment) {
                for (let i = 0; i < moveLength / 10; i++) {
                    if (drone.collidesWith(box, i * 10, 0, 0)) {
                        //goPosition.x = (goPosition.x + moveLength) / 2
                        return drone;
                    }
                }
            }


            return
        }


        return goPosition;
    }


    public async SnakePattern() {

        let a = await this.DesignPattern();

        for (const iterator of a) {

            await this.ResolveCollision(iterator);
            await iterator[1]();

        }
    }

    public async ResolveCollision(a: [string, () => Promise<any>]) {
        console.log(a[0]);
        // console.log(a.keys);

        for (const box of environment.environment) {

            if (drone.collidesWith(box)) {

            }
        }
    }


}

const environment = new Environment();
const drone = new Object3D(0, 0, 0, 20);
const testEnvironment = new Environment();
const path = new DronePath(60, 100);

export default {
    environment,
    drone,
    testEnvironment,
    path,
};
