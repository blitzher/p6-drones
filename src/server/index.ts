/* Import npm packages */
import express from "express";
import expressWs from "express-ws";

/* Import local packages */
import * as env from "./environment";
import { Object3D } from "./environment";
import { Drone } from "./drone";
import { com, initialiseWebSocket } from "./frontend-com";
import logger from "../log";

/* Global constant */
const HTTP_PORT = 42069;

/* Initialise HTTP and websocket server */
const { app } = expressWs(express());

/* Instantiate drones */
new Drone({ ip: "192.168.1.130" });
new Drone({ ip: "192.168.1.141" });
new Drone({ ip: "192.168.1.174" });
new Drone({ ip: "192.168.1.191" });

/* Setup web server */
app.use(express.json());
app.use(express.static("./src/www"));

app.ws("/", (ws) => {
    initialiseWebSocket(<WebSocket>(<any>ws));
});

function startTest() {
    console.log(`Starting test: ${process.title}`);
    //Position of dummy boxes for testing
    const BOX_COUNT = 20;
    let time = 0;
    const addObjectInterval = setInterval(() => {
        let x = Math.cos(time) * time * 30;
        let z = Math.sin(time) * time * 30;
        let obstacle = new Object3D(x, 0, z, 10);
        time += 0.2;
        env.environment.addObject({ obj: obstacle, id: time });
        if (time > 0.2 * BOX_COUNT) clearInterval(addObjectInterval);
    }, 1000);
}

/* Launch server */
app.listen(HTTP_PORT, async () => {
    console.log(`Listening on ${HTTP_PORT}...`);
    logger.log(`Listening on ${HTTP_PORT}...`);

    for (let droneId in Drone.allDrones) {
        let drone = Drone.allDrones[droneId];
        drone.connect().then(async () => {
            await drone.set.mon();
            drone.startVideoStream();
        });
    }

    /* Listen for environment updates, and send to frontend */
    env.environment.listen("objects", (data: Object3D[]) => {
        com.environment(data);
    });
    env.environment.listen(
        "drone",
        (data: { droneId: string; dronePosition: Object3D; dronePositionHistory: Object3D[] }) => {
            com.drone(data);
        }
    );
});
