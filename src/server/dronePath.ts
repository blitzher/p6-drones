import logger from "../log";
import { Commander } from "../tellojs-sdk30/src/commander";
import { Drone } from "./drone";
import { BOX_RADIUS, Object3D, environment } from "./environment";
import { Vector3 } from "./linerAlgebra";

const speed = 25;

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
        const flyDestination: Vector3 = new Vector3({ x: 0, y: 0, z: 60 });

        yield () => drone.control.takeOff();
        for (let index = 0; index < iterations; index++) {
            if (index % 2 == 0) {
                flyDestination.x += moveLength + DronePath.dronePathCounter * 30;
                this.destinationStore = flyDestination;

                yield () => drone.control.go(flyDestination, speed, "m8");
                yield () => drone.control.counterClockwise(90);

                flyDestination.y += moveWidth;
                this.destinationStore = flyDestination;

                yield () => drone.control.go(flyDestination, speed, "m8");
                yield () => drone.control.counterClockwise(90);
            } else {
                flyDestination.x -= moveLength;
                this.destinationStore = flyDestination;

                yield () => drone.control.go(flyDestination, speed, "m8");
                yield () => drone.control.clockwise(90);

                flyDestination.y += moveWidth;
                this.destinationStore = flyDestination;

                yield () => drone.control.go(flyDestination, speed, "m8");
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
        const droneStartPosition: Vector3 = drone.state.position;
        const deltaPosition = droneStartPosition.subtract(flyDestination);
        const moveVector: Vector3 = deltaPosition.normalise();

        for (const box of Object.values(environment.objects)) {
            //Checks each 5 cm. if there is a box in the path
            for (let i = 0; i < deltaPosition.length(); i += 5) {
                const positionOffset = moveVector.scale(i);
                const prospectedPosition = droneStartPosition.add(positionOffset);
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
        if (drone.inFlight) return;
        drone.inFlight = true;

        const snake = this.SnakePattern(drone);

        let busy = false;
        let next = snake.next();
        let step: () => Promise<string>;

        let loop_p = async () => {
            if (next.done) {
                drone.control.land();
                drone.inFlight = false;
                return;
            }

            let boxes = this.getRelevantBoxes(this.destinationStore, drone);
            logger.concurrent(
                "destination store",
                `${JSON.stringify(this.destinationStore)}`
            );
            if (boxes.length != 0) {
                logger.log(`Found box ${JSON.stringify(boxes[0])}`);
                const maneuver = this.maneuver(boxes, this.destinationStore, drone);
                for (let manStep of maneuver) {
                    logger.log("Performing maneuver...");
                    await manStep();
                }
            }
            if (!busy) {
                step = next.value;
                busy = true;
                step().then(() => {
                    busy = false;
                    next = snake.next();
                });
            }
        };

        const loop = async () => {
            loop_p().then(() => {
                if (!next.done) {
                    setTimeout(loop, 100);
                }
            });
        };
        loop();
    }

    public maneuver(obstacles: Object3D[], flyDestination: Vector3, drone: Drone) {
        const maneuver: (() => Promise<string>)[] = [];
        const lengthArray: number[] = [];
        let nearestBoxDist: number;
        // Go to position just before hitting the obstacle & locate boxes on either side of current obstacle
        for (const obstacle of obstacles) {
            lengthArray.push(flyDestination.lengthToBox(obstacle));
        }
        nearestBoxDist = lengthArray.indexOf(Math.min(...lengthArray));
        const rightBox = new Object3D(
            obstacles[nearestBoxDist].x + BOX_RADIUS,
            obstacles[nearestBoxDist].y,
            obstacles[nearestBoxDist].z,
            BOX_RADIUS
        );
        const leftBox = new Object3D(
            obstacles[nearestBoxDist].x - BOX_RADIUS,
            obstacles[nearestBoxDist].y,
            obstacles[nearestBoxDist].z,
            BOX_RADIUS
        );
        //yield drone.control.go(obstacles[nearestBoxDist], 50, "m8");
        logger.error(`Avoiding obstacle`);
        maneuver.push(() =>
            drone.control.stop({
                overwriteQueue: true,
                expectedResponse: "forced stop",
                forceReady: true,
            })
        );
        maneuver.push(() => drone.control.back(100, { overwriteQueue: true }));
        maneuver.push(() => drone.control.land({ overwriteQueue: true }));

        return maneuver;
    }
}

export const dronePath = new DronePath(30, 200, 1);
