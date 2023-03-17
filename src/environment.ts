import { EventEmitter } from "stream";
import { sdk, State as _StateInfo } from "tellojs-sdk30";
import { Vector3 } from "./linerAlgebra";

type StateInfo = _StateInfo & { position: { x: number; y: number; z: number } };

class Object3D {
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
    private drone: Object3D;

    private borderLength = 200;

    constructor() {
        super();
        this.objects = [];
        this.drone = new Object3D(0, 0, 0, 20);
    }

    public outsideBoundary(drone: Object3D): boolean {
        const actualLength = Math.sqrt(Math.abs(drone.x) ** 2 + Math.abs(drone.y) ** 2);

        if (actualLength > this.borderLength || drone.z > this.borderLength) {
            return true;
        }
        return false;
    }

    public addObject(x: number, y: number, z: number, r: number) {
        this.objects.push(new Object3D(x, y, z, r));
        this.emit("object", this.serialize());
    }

    public updateDronePosition(droneState: StateInfo) {
        this.drone.x = droneState.position.x;
        this.drone.y = droneState.position.y;
        this.drone.z = droneState.position.z;

        this.dronePositionHistory.push(new Object3D(this.drone.x, this.drone.y, this.drone.z, 2));
        this.emit("drone", {
            dronePosition: this.drone.serialize(),
            dronePositionHistory: this.dronePositionHistory.map((pos) => pos.serialize()),
        });
    }

    public serialize() {
        return JSON.stringify({
            environment: this.objects.map((object) => object.serialize()),
        });
    }

    public listen(
        ...args:
            | [event: "environment", listener: (data: { environment: string[] }) => void]
            | [event: "drone", listener: (data: { dronePosition: string; dronePositionHistory: string }) => void]
    ): this {
        console.log(args);
        return this.on(args[0], args[1]);
    }
}

export const path = {
    async snakePattern() {
        await sdk.control
            .takeOff()
            .then(() => sdk.control.move.up(150))
            .catch((e) => console.log(e));

        for (let index = 0; index < 5; index++) {
            if (index % 2 == 0) {
                await sdk.control.move
                    .front(100)
                    .then(() => sdk.control.rotate.clockwise(90))
                    .then(() => sdk.control.move.front(30))
                    .then(() => sdk.control.rotate.clockwise(90))
                    .catch(console.log);
            } else {
                await sdk.control.move
                    .front(100)
                    .then(() => sdk.control.rotate.counterClockwise(90))
                    .then(() => sdk.control.move.front(30))
                    .then(() => sdk.control.rotate.counterClockwise(90))
                    .catch((e) => console.log(e));
            }
        }

        await sdk.control.move
            .down(50)
            .then(() => sdk.control.flip.back())
            .then(() => sdk.control.land())
            .catch((e) => console.log(e));
    },
};

export const environment = new Environment();
export const drone = new Object3D(0, 0, 0, 20);
