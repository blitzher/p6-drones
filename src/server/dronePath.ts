import { Commander } from "../tellojs-sdk30/src/commander";
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
    public *SnakePattern(drone: Drone): Generator<() => Promise<string>> {
        const iterations: number = Math.floor(this.mapWidth / 15);
        const moveLength: number = this.mapLength;
        const moveWidth: number = 15;
        const flyDestination: Vector3 = new Vector3({ x: 0, y: 0, z: 100 });

        yield () => drone.control.takeOff();
        for (let index = 0; index < iterations; index++) {
            if (index % 2 == 0) {
                flyDestination.x += moveLength + DronePath.dronePathCounter * 30;
                this.destinationStore = flyDestination;
                console.log(this.destinationStore);

                yield () => drone.control.go(flyDestination, 20, "m8");
                yield () => drone.control.counterClockwise(90);

                flyDestination.y += moveWidth;
                this.destinationStore = flyDestination;
                console.log(this.destinationStore);

                yield () => drone.control.go(flyDestination, 20, "m8");
                yield () => drone.control.counterClockwise(90);
            } else {
                flyDestination.x -= moveLength;
                this.destinationStore = flyDestination;
                console.log(this.destinationStore);

                yield () => drone.control.go(flyDestination, 20, "m8");
                yield () => drone.control.clockwise(90);

                flyDestination.y += moveWidth;
                this.destinationStore = flyDestination;
                console.log(this.destinationStore);

                yield () => drone.control.go(flyDestination, 20, "m8");
                yield () => drone.control.clockwise(90);
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
            for (let i = 0; i < deltaPosition.length(); i++) {
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
                }
            }
        }
        return relevantBoxes;
    }
    public async fly(drone: Drone) {
        const snake = this.SnakePattern(drone);
        let boxes: Object3D[];

        let busy = false;
        let next = snake.next();
        let step: () => Promise<string>;

        while (!next.done) {
            boxes = this.getRelevantBoxes(this.destinationStore, drone);
            if (boxes.length != 0) {
                this.maneuver(boxes, this.destinationStore, drone);
            }
            if (!busy) {
                step = next.value;
                busy = true;
                step().then(() => {
                    busy = false;
                    next = snake.next();
                });
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
        //yield drone.control.go(obstacles[nearestBoxDist], 50, "m8");
        yield () => drone.control.stop({ overwriteQueue: true });
    }
}

// class DronePath {
//     mapWidth: number;
//     mapLength: number;
//     numberOfDrones: number;
//     static dronePathCounter: number = 0;
//     destinationArray: Vector3[] = [];
//     static destination: Vector3[] = []
//     //static firstIteration: boolean = true;

//     constructor(mapwidth: number, maplength: number, numberofdrones: number) {
//         this.mapWidth = mapwidth;
//         this.mapLength = maplength;
//         this.numberOfDrones = numberofdrones;
//     }

//     public async SnakePattern(drone: Drone) {
//         let iterations: number = Math.floor(this.mapWidth / 30);
//         let moveLength: number = this.mapLength;
//         let moveWidth: number = 30;
//         let flyDestination: Vector3 = new Vector3({ x: 0, y: 0, z: 100 });
//         let mission: (() => Promise<string>)[] = [];
//         let X: number = 0;
//         let Y: number = 0;
//         let Z: number = 0;

//         mission.push(() => drone.control.takeOff());

//         for (let index = 0; index < iterations; index++) {
//             if (index % 2 == 0) {
//                 X += moveLength + (DronePath.dronePathCounter * 30);
//                 this.destinationArray.push(new Vector3(flyDestination));

//                 mission.push(() => drone.control.go({ x: X, y: Y, z: Z }, 50, "m8"));
//                 mission.push(() => drone.control.clockwise(90));

//                 Y += moveWidth + (DronePath.dronePathCounter * 30);
//                 this.destinationArray.push(new Vector3(flyDestination));

//                 mission.push(() => drone.control.go({ x: X, y: Y, z: Z }, 50, "m8"));
//                 mission.push(() => drone.control.clockwise(90));

//             } else {
//                 flyDestination.x -= moveLength + (Math.abs((DronePath.dronePathCounter - this.numberOfDrones)) * 30);
//                 this.destinationArray.push(flyDestination);

//                 mission.push(() => drone.control.go(flyDestination, 50, "m8"));
//                 mission.push(() => drone.control.clockwise(90));

//                 flyDestination.y += moveWidth + (Math.abs((DronePath.dronePathCounter - this.numberOfDrones)) * 30);
//                 this.destinationArray.push(flyDestination);

//                 mission.push(() => drone.control.go(flyDestination, 50, "m8"));
//                 mission.push(() => drone.control.clockwise(90));
//             }
//         }

//         if (this.numberOfDrones == DronePath.dronePathCounter) {
//             DronePath.dronePathCounter = 0;
//         }

//         if (this.numberOfDrones > DronePath.dronePathCounter) {
//             DronePath.dronePathCounter += 1;
//         }
//         for (const iterator of this.destinationArray) {
//             console.log(iterator)
//         }
//         return mission;
//     }

//     public getRelevantBoxes(flyDestination: Vector3, drone: Drone): Object3D[] {
//         const relevantBoxes: Object3D[] = [];
//         const positionCheck: Vector3 = drone.state.position;
//         const deltaPosition = positionCheck.subtract(flyDestination);
//         const moveVector: Vector3 = deltaPosition.normalise();

//         for (const box of Object.values(environment.objects)) {
//             //Checks each 5 cm. if there is a box in the path
//             for (let i = 0; i < deltaPosition.length(); i += 5) {
//                 const positionOffset = moveVector.scale(i);
//                 const prospectedPosition = positionCheck.add(positionOffset);
//                 const dronePosition = new Object3D(
//                     prospectedPosition.x,
//                     prospectedPosition.y,
//                     prospectedPosition.z,
//                     20
//                 );

//                 if (dronePosition.collidesWith(box)) {
//                     relevantBoxes.push(box);
//                     console.log(box);
//                 }
//             }
//         }
//         return relevantBoxes;
//     }

//     public async fly(drone: Drone) {
//         const snake = await this.SnakePattern(drone);
//         let boxes: Object3D[];
//         //J for movements, excluding rotations
//         let j: number = 0;

//         // for (let i = 0; i < snake.length; i++) {
//         //     if (i % 2 == 0) {
//         //         boxes = this.getRelevantBoxes(this.destinationArray[j], drone);
//         //         if (boxes.length != 0) {
//         //             //gotoclosesbox + undvigelse skal rykkes in foran her i snake array
//         //             snake.splice(i, 0, ...await this.maneuver(boxes, this.destinationArray[j], drone)); // :^)

//         //         }
//         //         j++;
//         //     }
//         //     await snake[i]();
//         // }

//         for (const iterator of snake) {
//             await iterator();
//         }

//         await drone.control.land();
//     }

//     public maneuver(obstacles: Object3D[], flyDestination: Vector3, drone: Drone): (() => Promise<any>)[] {
//         const maneuverCommands: (() => Promise<any>)[] = [];

//         let lengthArray: number[] = [];
//         let nearestBoxDist: number;

//         // Go to position just before hitting the obstacle & locate boxes on either side of current obstacle
//         for (const obstacle of obstacles) {
//             lengthArray.push(flyDestination.lengthToBox(obstacle));
//         }

//         nearestBoxDist = lengthArray.indexOf(Math.min(...lengthArray));

//         let rightBox = new Object3D(
//             obstacles[nearestBoxDist].x + BOX_RADIUS,
//             obstacles[nearestBoxDist].y,
//             obstacles[nearestBoxDist].z,
//             BOX_RADIUS
//         );
//         let leftBox = new Object3D(
//             obstacles[nearestBoxDist].x - BOX_RADIUS,
//             obstacles[nearestBoxDist].y,
//             obstacles[nearestBoxDist].z,
//             BOX_RADIUS
//         );

//         maneuverCommands.push(() => drone.control.go(obstacles[nearestBoxDist], 50, "m8"));
//         return maneuverCommands;

//     }
// }

export const dronePath = new DronePath(30, 200, 1);
