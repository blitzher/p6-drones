/* Import npm packages */
import express from "express";
import expressWs from "express-ws";

/* Import local packages */
import * as env from "./environment";
import { Object3D } from "./environment";
import { Drone } from "./drone";
import { com, initialiseWebSocket } from "./frontend-com";
import logger from "../log";
import { dronePath } from "./dronePath";
import * as readline from "node:readline/promises";
import { Vector3 } from "./linerAlgebra";

const readlineInterface = readline.createInterface(process.stdin, process.stdout);

/* Global constant */
const HTTP_PORT = 42069;

/* Initialise HTTP and websocket server */
const { app } = expressWs(express());

/* Instantiate drones */
<<<<<<< HEAD
new Drone({ ip: "192.168.1.130" });
//new Drone({ ip: "192.168.1.141" });
//new Drone({ ip: "192.168.1.174" });
//new Drone({ ip: "192.168.1.191" });
=======
// new Drone({ ip: "192.168.1.130" });
// new Drone({ ip: "192.168.1.141" });
// new Drone({ ip: "192.168.1.174" });
new Drone({ ip: "192.168.1.191" });
>>>>>>> 2941eae (Readded connection reconnect)

/* Setup web server */
app.use(express.json());
app.use(express.static("./src/www"));

app.ws("/", (ws) => {
    initialiseWebSocket(<WebSocket>(<any>ws));
});

/* Launch server */
app.listen(HTTP_PORT, async () => {
    console.log(`Listening on ${HTTP_PORT}...`);
    logger.log(`Listening on ${HTTP_PORT}...`);

    for (let droneId in Drone.allDrones) {
        let drone = Drone.allDrones[droneId];
        drone.connect().then(async () => {
            env.environment.addDrone(drone);
            drone.startVideoStream();
            // dronePath.fly(drone);
        });
    }

    function CLI() {
        readlineInterface.question("Type drone ids to start flying.\n").then((msg) => {
            const ids = msg.split(" ");
            for (let id of ids) {
                let drone = Drone.allDrones[id];
                if (drone) dronePath.fly(drone);
            }
            CLI();
        });
    }
    CLI();

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
