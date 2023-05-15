import logger from "../log";
import { Drone } from "./drone";
import { Object3D, environment } from "./environment";
import { Vector3 } from "./linerAlgebra";
import * as constants from "./constants.json";
import * as linAlg from "./linerAlgebra";

class DronePath {
    mapWidth: number;
    mapLength: number;
    moveWidth: number;
    destinationStore: { [key: string]: Vector3 } = {};

    constructor(mapWidth: number, mapLength: number, moveWidth: number) {
        this.mapWidth = mapWidth;
        this.mapLength = mapLength;
        this.moveWidth = moveWidth;
    }

    public *SnakePattern(drone: Drone): Generator<() => Promise<string>> {
        const iterations: number = Math.floor(this.mapWidth / this.moveWidth);
        const flyDestination: Vector3 = new Vector3({ x: 0, y: 0, z: 60 });
        this.destinationStore[drone.id] = new Vector3({ x: 0, y: 0, z: 0 });
        let X: number = 1;
        let Y: number = 1;

        //For virtual only
        if (drone.id == "102") {
            X = -1;
            Y = 1;
            yield () => drone.control.counterClockwise(90);
        }
        if (drone.id == "103") {
            X = -1;
            Y = -1;
            yield () => drone.control.counterClockwise(180);
        }
        if (drone.id == "104") {
            X = 1;
            Y = -1;
            yield () => drone.control.counterClockwise(270);
        }
        if (drone.id == "101") {
            yield () => drone.control.counterClockwise(360);
        }

        yield () => drone.control.takeOff();

        for (let index = 0; index < iterations; index++) {
            if (index % 2 == 0) {
                if (drone.id == "102" || drone.id == "104") {
                    flyDestination.y += this.mapLength * Y;
                } else {
                    flyDestination.x += this.mapLength * X;
                }
                this.destinationStore[drone.id] = flyDestination;

                yield () => drone.control.go(flyDestination, constants.drone.SPEED, `m${drone.state.mid}`);
                yield () => drone.control.counterClockwise(90);

                if (drone.id == "102" || drone.id == "104") {
                    flyDestination.x += this.moveWidth * X;
                } else {
                    flyDestination.y += this.moveWidth * Y;
                }
                this.destinationStore[drone.id] = flyDestination;

                yield () => drone.control.go(flyDestination, constants.drone.SPEED, `m${drone.state.mid}`);
                yield () => drone.control.counterClockwise(90);
            } else {
                if (drone.id == "102" || drone.id == "104") {
                    flyDestination.y -= this.mapLength * Y;
                } else {
                    flyDestination.x -= this.mapLength * X;
                }
                //flyDestination.x -= this.mapLength;
                this.destinationStore[drone.id] = flyDestination;

                yield () => drone.control.go(flyDestination, constants.drone.SPEED, `m${drone.state.mid}`);
                yield () => drone.control.clockwise(90);

                if (drone.id == "102" || drone.id == "104") {
                    flyDestination.x += this.moveWidth * X;
                } else {
                    flyDestination.y += this.moveWidth * Y;
                }
                //flyDestination.y += this.moveWidth;
                this.destinationStore[drone.id] = flyDestination;

                yield () => drone.control.go(flyDestination, constants.drone.SPEED, `m${drone.state.mid}`);
                yield () => drone.control.clockwise(90);
            }
        }
    }

    public getRelevantBoxes(flyDestination: Vector3, start: Vector3): Object3D[] {
        const relevantBoxes: Object3D[] = [];
        const deltaPosition = flyDestination.subtract(start);
        const moveVector: Vector3 = deltaPosition.normalise();
        const checkInterval = constants.env.DRONE_RADIUS;
        for (const box of Object.values(environment.objects)) {
            //Checks each 5 cm. if there is a box in the path

            for (let i = checkInterval; i < deltaPosition.length(); i += checkInterval) {
                const positionOffset = moveVector.scale(i);
                const prospectedPosition = start.add(positionOffset);
                const dronePosition = new Object3D(
                    prospectedPosition.x,
                    prospectedPosition.y,
                    prospectedPosition.z,
                    constants.env.DRONE_RADIUS
                );
                if (dronePosition.collidesWith(box)) {
                    relevantBoxes.push(box);
                }
            }
        }

        const foundIds: number[] = [];
        return relevantBoxes.filter((o) => {
            if (foundIds.indexOf(o.id) > -1) return false;
            else {
                foundIds.push(o.id);
                return true;
            }
        });
    }

    public async fly(drone: Drone) {
        return new Promise<void>((resolve) => {
            if (drone.inFlight) return;
            drone.inFlight = true;

            const snake = this.SnakePattern(drone);

            logger.log(`Starting snake pattern on ${drone.id}`);

            let busy = false;
            let next = snake.next();
            let step: () => Promise<string>;

            let flightStep = async () => {
                if (next.done) {
                    resolve();
                    return;
                }

                let boxes = this.getRelevantBoxes(this.destinationStore[drone.id], drone.state.position);
                if (boxes.length > 0) {
                    let closestBox: { box: Object3D; dist: number } = {
                        box: boxes[0],
                        dist: Infinity,
                    };
                    for (let box of boxes) {
                        const dist = drone.state.position.lengthToBox(box);
                        if (dist < closestBox.dist) {
                            closestBox = { box, dist };
                        }
                    }
                    if (
                        closestBox.dist <
                        (constants.env.BOX_RADIUS + constants.env.DRONE_RADIUS) * constants.env.ERROR_MARGIN
                    ) {
                        /* Box is near drone, avoid it */
                        logger.log(
                            `Found box ${JSON.stringify(boxes[0])} drone at ${JSON.stringify(drone.state.position)}`
                        );
                        const maneuver = this.maneuver(boxes, this.destinationStore[drone.id], drone);
                        for (let maneuverStep of maneuver) {
                            logger.log("Performing maneuver...");
                            await maneuverStep();
                        }
                        busy = false;
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
                flightStep().then(() => {
                    if (!next.done) {
                        setTimeout(loop, 100);
                    }
                });
            };
            loop();
        });
    }

    public maneuver(obstacles: Object3D[], flyDestination: Vector3, drone: Drone) {
        const maneuver: (() => Promise<string>)[] = [];
        const lengthArray: number[] = [];
        let nearestBoxDist: number;

        // flyDestination = linAlg.rotateVectorAroundZAxis(
        //     flyDestination,
        //     drone.rotOffset.yaw
        // );

        // Go to position just before hitting the obstacle & locate boxes on either side of current obstacle
        for (const obstacle of obstacles) {
            lengthArray.push(flyDestination.lengthToBox(obstacle));
        }
        nearestBoxDist = lengthArray.indexOf(Math.min(...lengthArray));

        //Current position of the nearest box
        const boxPosition: Vector3 = new Vector3(obstacles[nearestBoxDist]);
        //Position of the drone
        const currentPosition: Vector3 = new Vector3(drone.state.position);
        //Vector of the distance from current position to the distanation
        const currentToDestination: Vector3 = flyDestination.subtract(currentPosition);
        //Vector of the distance from current position to the box
        const currentToBox: Vector3 = boxPosition.subtract(currentPosition);

        const crossProduct: Vector3 = currentToDestination.crossProduct(currentToBox);

        //vector of the distance flydestination to currentposition
        const moveVector: Vector3 = currentPosition.subtract(flyDestination);
        //Dot product over vectors
        const dotAPAB: number = boxPosition.subtract(currentPosition).dotP(moveVector);
        const dotABAB: number = moveVector.dotP(moveVector);
        //Scaling and adding the move vector with the dot product to find the projection
        const scaleVector: Vector3 = moveVector.scale(dotAPAB / dotABAB);
        const boxProjection = currentPosition.add(scaleVector);
        const boxRelativeProjection = boxProjection.subtract(currentPosition);
        //Number containing the width of the vector from drone to box
        let boxOffset: number = boxRelativeProjection.length();
        //Actual vector of the offset between drone and box
        const boxVector = boxProjection.subtract(boxPosition);
        //Giving the drone plenty of room to avoid the box.
        let avoidanceDistance: number =
            (constants.env.DRONE_RADIUS + constants.env.BOX_RADIUS) * constants.env.ERROR_MARGIN - boxVector.length();

        //Minimum value; 10
        boxOffset = boxOffset < 10 ? 10 : boxOffset;
        avoidanceDistance = avoidanceDistance < 10 ? 10 : avoidanceDistance;

        logger.error(`Avoiding obstacle`);
        maneuver.push(() =>
            drone.control.stop({
                overwriteQueue: true,
                expectedResponse: "forced stop",
                forceReady: true,
            })
        );
        //Box is to the right
        if (crossProduct.z < 0) {
            maneuver.push(() => drone.control.left(avoidanceDistance));
            maneuver.push(() => drone.control.forward(boxOffset * 2));
            maneuver.push(() => drone.control.right(avoidanceDistance));
        }
        //Box is to the left
        else {
            maneuver.push(() => drone.control.right(avoidanceDistance));
            maneuver.push(() => drone.control.forward(boxOffset * 2));
            maneuver.push(() => drone.control.left(avoidanceDistance));
        }

        return maneuver;
    }
}

export const dronePaths = new DronePath(300, 300, 60);

// export const dronePaths = {
//     PosPos: new DronePath(60, 300, 30),
//     PosNeg: new DronePath(60, 300, -30),
//     NegPos: new DronePath(60, -300, 30),
//     NegNeg: new DronePath(60, -300, -30),
// };
