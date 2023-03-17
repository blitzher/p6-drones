import { resolve } from "path";
import { sdk, SDK } from "tellojs-sdk30";

type DroneState = {
    x: number;
    y: number;
    z: number;
};

class Object3D {
    x: number;
    y: number;
    z: number;
    radius: number;

    constructor(x, y, z, radius) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.radius = radius;
    }

    public collidesWith(other: Object3D): boolean {
        const distance = Math.sqrt(
            (other.x - this.x) ** 2 +
            (other.y - this.y) ** 2 +
            (other.z - this.z) ** 2
        );

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


type DroneCommand = {
    Command: Promise<any>;
}


class Path {

    DroneCommand: Promise<any>[];

    constructor(dronecommand) {
        this.DroneCommand = dronecommand;
    }

    public async DesignPattern(mapWidth: number, mapLength: number) {
        let iterations: number = Math.floor(mapWidth / 30);
        let moveLength: number = mapLength;

        let mission: (() => Promise<any>)[] = [];
        mission.push(() => sdk.control.takeOff());

        for (let index = 0; index < iterations; index++) {
            if (index % 2 == 0) {
                mission.push(() => sdk.control.move.front(moveLength));
                mission.push(() => sdk.control.rotate.clockwise(90));
                mission.push(() => sdk.control.move.front(30));
                mission.push(() => sdk.control.rotate.clockwise(90));
            } else {
                mission.push(() => sdk.control.move.front(moveLength));
                mission.push(() => sdk.control.rotate.counterClockwise(90));
                mission.push(() => sdk.control.move.front(30));
                mission.push(() => sdk.control.rotate.counterClockwise(90));
            }
        }

        mission.push(() => sdk.control.land());
        return this.DroneCommand;

    }


    public async SnakePattern() {

        let a = await this.DesignPattern(60, 100);




        for (const iterator of a) {
            this.ResolveCollision(iterator);

        }
    }

    public ResolveCollision(a: Promise<any>) {
        console.log(a.);

        // for (const box of environment.environment) {

        //     if (drone.collidesWith(box)) {

        //     }
        // }
    }


}

const environment = new Environment();
const drone = new Object3D(0, 0, 0, 20);
const testEnvironment = new Environment();
const path = new Path();

export default {
    environment,
    drone,
    testEnvironment,
    path,
};
