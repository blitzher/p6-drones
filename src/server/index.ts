/* Import npm packages */
import express from "express";
import expressWs from "express-ws";

/* Import local packages */
import * as env from "./environment";
import { Object3D } from "./environment";
import { Drone } from "./drone";
import * as frontendCom from "./frontend-com";
import logger from "../log";
import * as constants from "./constants.json";

import * as tellojs from "../tellojs-sdk30/src";
import { Vector3, rotateVectorAroundZAxis } from "./linerAlgebra";

/* Initialise HTTP and websocket server */
const { app } = expressWs(express());

/* Instantiate drones */
// new Drone(
//     { ip: "192.168.1.130" },
//     constants.drone.START_POS[130],
//     constants.drone.START_ROT[141]
// );
// new Drone(
//     { ip: "192.168.1.141" },
//     constants.drone.START_POS[141],
//     constants.drone.START_ROT[141]
// );
// new Drone(
//     { ip: "192.168.1.174" },
//     constants.drone.START_POS[174],
//     constants.drone.START_ROT[174]
// );
// new Drone(
//     { ip: "192.168.1.191" },
//     constants.drone.START_POS[191],
//     constants.drone.START_ROT[191]
// );

new Drone({ ip: "0.0.0.101" });
new Drone({ ip: "0.0.0.102" });
new Drone({ ip: "0.0.0.103" });
new Drone({ ip: "0.0.0.104" });

/* Setup web server */
app.use(express.json());
app.use(express.static("./src/www"));

app.ws("/", (ws) => {
    frontendCom.initialiseWebSocket(<WebSocket>(<any>ws));
});

const connectDrones = () => {
    for (let droneId in Drone.allDrones) {
        let drone = Drone.allDrones[droneId];
        drone.connect().then(async () => {
            // await drone.set.mon();
            await drone.set.speed(constants.drone.SPEED);
            // await drone.set.bitrate(5);
            env.environment.addDrone(drone);
            drone.startVideoStream();
            // await dronePaths.fly(drone);
        });
    }
};

/* Launch server */
const server = app.listen(constants.server.HTTP_PORT, async () => {
    console.log(`Listening on ${constants.server.HTTP_PORT}...`);
    logger.log(`Listening on ${constants.server.HTTP_PORT}...`);

    /* Make virtual box */
    env.environment.addObject({ pos: { x: 120, y: 120, z: 60 } }, 1, "101");
    env.environment.addObject({ pos: { x: 120, y: -120, z: 60 } }, 2, "102");
    env.environment.addObject({ pos: { x: -120, y: 120, z: 60 } }, 3, "103");
    env.environment.addObject({ pos: { x: -120, y: -120, z: 60 } }, 4, "104");
    env.environment.addObject({ pos: { x: 75, y: 250, z: 60 } }, 5, "101");
    env.environment.addObject({ pos: { x: 250, y: 60, z: 60 } }, 6, "101");
    env.environment.addObject({ pos: { x: -250, y: 200, z: 60 } }, 7, "101");

    /* Establish connection to drones */
    connectDrones();

    /* Listen for environment updates, and send to frontend */
    env.environment.listen("objects", (data: Object3D[]) => {
        frontendCom.com.environment(data);
    });
    env.environment.listen(
        "drone",
        (data: { droneId: string; dronePosition: Object3D; droneYaw: number; dronePositionHistory: Object3D[] }) => {
            frontendCom.com.drone(data);
        }
    );
});

const cleanup = () => {
    /* Close sockets and log */
    server.close();
    tellojs.close();
    frontendCom.close();
    logger.error("Closed server");

    /* Serialize environment to disk */
    env.environment.serialize();

    logger.close();
};

/* Setup signal listener  */
const EXIT_SIGNALS = ["SIGTERM", "SIGINT", "SIGQUIT", "SIGABRT", "SIGHUP"];
for (let signal of EXIT_SIGNALS) process.on(signal, cleanup);
