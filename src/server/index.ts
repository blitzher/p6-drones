/* Import npm packages */
import express from "express";
import expressWs from "express-ws";
import * as readline from "node:readline/promises";

/* Import local packages */
import * as env from "./environment";
import { Object3D } from "./environment";
import { Drone } from "./drone";
import { com, initialiseWebSocket } from "./frontend-com";
import logger from "../log";
import * as constants from "./constants.json";

const readlineInterface = readline.createInterface(process.stdin, process.stdout);

/* Initialise HTTP and websocket server */
const { app } = expressWs(express());

/* Instantiate drones */
new Drone({ ip: "192.168.1.130" }, constants.drone.START_POS[130]);
new Drone({ ip: "192.168.1.141" }, constants.drone.START_POS[141]);
new Drone({ ip: "192.168.1.174" }, constants.drone.START_POS[174]);
new Drone({ ip: "192.168.1.191" }, constants.drone.START_POS[191]);

/* Setup web server */
app.use(express.json());
app.use(express.static("./src/www"));

app.ws("/", (ws) => {
    initialiseWebSocket(<WebSocket>(<any>ws));
});

/* Launch server */
app.listen(constants.server.HTTP_PORT, async () => {
    console.log(`Listening on ${constants.server.HTTP_PORT}...`);
    logger.log(`Listening on ${constants.server.HTTP_PORT}...`);

    for (let droneId in Drone.allDrones) {
        let drone = Drone.allDrones[droneId];
        drone.connect().then(async () => {
            drone.set.speed(constants.drone.SPEED);
            env.environment.addDrone(drone);
            drone.startVideoStream();
        });
    }

    /* Listen for environment updates, and send to frontend */
    env.environment.listen("objects", (data: Object3D[]) => {
        com.environment(data);
    });
    env.environment.listen(
        "drone",
        (data: {
            droneId: string;
            dronePosition: Object3D;
            dronePositionHistory: Object3D[];
        }) => {
            com.drone(data);
        }
    );
});
