import { Drone } from "./drone";
import { BOX_RADIUS, Object3D, environment } from "./environment";
import { Vector3 } from "./linerAlgebra";

class DronePath {
    mapWidth: number;
    mapLength: number;
    numberOfDrones: number;
    static dronePathCounter: number = 0;
    destinationStore: Vector3 = new Vector3({ x: 0, y: 0, z: 0 });
    //static firstIteration: boolean = true;

    constructor(mapwidth: number, maplength: number, numberofdrones: number) {
        this.mapWidth = mapwidth;
        this.mapLength = maplength;
        this.numberOfDrones = numberofdrones;
    }

    public *SnakePattern(drone: Drone) {
        const iterations: number = Math.floor(this.mapWidth / 30);
        const moveLength: number = this.mapLength;
        const moveWidth: number = 30;
        const flyDestination: Vector3 = new Vector3(drone.state.position);
        const mission: (() => Promise<any>)[] = [];
        yield drone.control.takeOff();

        for (let index = 0; index < iterations; index++) {
            if (index % 2 == 0) {
                console.log(index);
                flyDestination.x = moveLength + DronePath.dronePathCounter * 30;
                this.destinationStore = flyDestination;
                yield drone.control.go(flyDestination, 100);
                yield drone.control.clockwise(90);
                flyDestination.x = moveWidth;
                this.destinationStore = flyDestination;
                yield drone.control.go(flyDestination, 100);
                yield drone.control.clockwise(90);
            } else {
                flyDestination.x = moveLength;
                this.destinationStore = flyDestination;
                yield drone.control.go(flyDestination, 100);
                yield drone.control.counterClockwise(90);
                flyDestination.x = moveWidth;
                this.destinationStore = flyDestination;
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
        const relevantBoxes: Object3D[] = [];
        const positionCheck: Vector3 = drone.state.position;
        const deltaPosition = positionCheck.subtract(flyDestination);
        const moveVector: Vector3 = deltaPosition.normalise();

        for (const box of Object.values(environment.objects)) {
            //Checks each 5 cm. if there is a box in the path
            for (let i = 0; i < deltaPosition.length(); i += 5) {
                const positionOffset = moveVector.scale(i);
                const prospectedPosition = positionCheck.add(positionOffset);
                const dronePosition = new Object3D(
                    prospectedPosition.x,
                    prospectedPosition.y,
                    prospectedPosition.z,
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

    public async fly(drone: Drone) {
        const snake = this.SnakePattern(drone);
        let boxes: Object3D[];

        for (let step of snake) {
            await step;
            boxes = this.getRelevantBoxes(this.destinationStore, drone);
            if (boxes.length != 0) {
                //gotoclosestbox + undvigelse skal rykkes in foran her i snake array
                this.maneuver(boxes, this.destinationStore, drone);
            }
        }

        drone.control.land();
    }
    public *maneuver(obstacles: Object3D[], flyDestination: Vector3, drone: Drone) {
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

        yield drone.control.go(obstacles[nearestBoxDist], 100);

        // Avoidance
        // TODO: Check if an obstacle is on either side of the current obstacle

        // maneuverCommands.push(() => drone.control.clockwise(90));
        // maneuverCommands.push(() => drone.control.forward(BOX_RADIUS));
        // maneuverCommands.push(() => drone.control.counterClockwise(90));
        // maneuverCommands.push(() => drone.control.forward(BOX_RADIUS * 2));
        // maneuverCommands.push(() => drone.control.counterClockwise(90));
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
export const dronePath = new DronePath(60, 60, 1);
