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
    private environment: Object3D[];

    private dronePositionHistory: Object3D[];
    private drone: Object3D;

    constructor() {
        this.environment = [];
        this.drone = new Object3D(0, 0, 0, 20);
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

export default {
    environment: new Environment(),
};
