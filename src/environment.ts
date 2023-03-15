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

    collidesWith(other: Object3D): boolean {
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

let testEnvironment = new Environment();

testEnvironment.addObject(150, 0, 150, 20),
    testEnvironment.addObject(150, 50, 150, 20),
    testEnvironment.addObject(150, 150, 150, 20);



class Fly {



}

class Path {
    public async DesignPattern(movement: number) {

    }


    public async SnakePattern() {
        // await sdk.control.takeOff()
        //     .then(() => sdk.control.move.up(150))
        //     .catch((e) => console.log(e));


        // for (let index = 0; index < 5; index++) {
        //     if (index % 2 == 0) {
        //         await sdk.control.move.front(100)
        //             .then(() => sdk.control.rotate.clockwise(90))
        //             .then(() => sdk.control.move.front(30))
        //             .then(() => sdk.control.rotate.clockwise(90))
        //             .catch((e) => console.log(e));
        //     } else {
        //         await sdk.control.move.front(100)
        //             .then(() => sdk.control.rotate.counterClockwise(90))
        //             .then(() => sdk.control.move.front(30))
        //             .then(() => sdk.control.rotate.counterClockwise(90))
        //             .catch((e) => console.log(e));
        //     }
        // }
        // await sdk.control.move.down(50)
        //     .then(() => sdk.control.flip.back())
        //     .then(() => sdk.control.land())
        //     .catch((e) => console.log(e));

        // await sdk.command("takeoff").then(() => sdk.command("forward 100")).then(() => sdk.command("flip"));


    }

}

export default {
    environment: new Environment(),
    drone: new Object3D(0, 0, 0, 20),
    testEnvironment,
    path: new Path()
};
