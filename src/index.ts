/* Import nodejs packages */
import * as fs from "fs";
import * as path from "path";

/* Import npm packages */
import express from "express";
import { State as StateInfo, sdk } from "tellojs-sdk30";
import expressWs from "express-ws";
import { v4 as uuidv4 } from "uuid";
import { WebSocket } from "ws";

/* Import local packages */
import { H264Segmenter } from "./h264-segmenter";
import * as env from "./environment";
import { Vector3 } from "./linerAlgebra";
import { Object3D } from "./environment";
import Fly from "./Fly";

import { dronePath } from "./environment";

/* Global constant */
const PORT = 42069;

/* Initialise HTTP and websocket server */
const { app } = expressWs(express());
type UWebSocket = { client: WebSocket; uuid: string };
type Package = { type: string; data: any };
const clients: UWebSocket[] = [];

/* Setup web server */
app.use(express.json());
app.use(express.static("./src/www"));

/* Setup helper functions for back-front-communication */
const com = {
    video: (buffer: Uint8Array) => {
        const dataArray = Array.from(buffer);

        for (let { client } of clients)
            client.send(
                JSON.stringify({
                    type: "stream",
                    data: dataArray,
                })
            );
    },
    state: (state: StateInfo) => {
        for (let { client } of clients)
            client.send(
                JSON.stringify({
                    type: "state",
                    data: state,
                })
            );
    },
    environment: (data: Object3D[]) => {
        for (let { client } of clients)
            client.send(JSON.stringify({ type: "environment", data }));
    },
    drone: (data: {
        dronePosition: Object3D;
        dronePositionHistory: Object3D[];
    }) => {
        for (let { client } of clients)
            client.send(JSON.stringify({ type: "drone", data }));
    },
};

/* Setup drone connection */
const drone = {
    connected: false,
    keepAlive: () => {
        if (!drone.connected) return;
        console.log("Keeping drone alive");

        setInterval(async () => await sdk.read.battery(), 5000);
    },
    command: async (cmd: string) => {
        if (!drone.connected) return;

        sdk.command(cmd).catch((e) => {
            console.log(e);
        });
    },
};

async function droneControl() {
    try {
        await sdk.control.connect();
    } catch (e) {
        console.log("Could not connect to drone. Retrying...");
        return;
    }

    const sdkVersion = await sdk.read.sdk();
    console.log(`"Using SDK version: ${sdkVersion}`);

    drone.keepAlive();
    drone.connected = true;

    console.log(`Drone connection established`);
    const videoEmitter = await sdk.receiver.video.bind();
    let isFirst = true;
    let segmenter: H264Segmenter;
    videoEmitter.on("message", (res) => {
        /* If its the first segment, initialise a new segmenter */
        if (isFirst) {
            segmenter = new H264Segmenter(res);
            isFirst = false;
        }

        /* Feed the segmenter segments as they come in */
        const segment = segmenter.feed(res);

        /* If the segmenter.feed method returns an object,
         * dispatch the segment to clients */
        if (segment) com.video(segment);
    });

    const stateEmitter = sdk.receiver.state.bind();
    /* env.path.snakePattern(); */
    //sdk.set.mon().catch((e) => { });
    let disconnectedTimeout = setTimeout(() => { }, 10e5);
    stateEmitter.on("message", (res) => {
        clearTimeout(disconnectedTimeout);
        com.state(res);
        const speed = {
            x: Number.parseInt(res.speed.x),
            y: Number.parseInt(res.speed.y),
            z: Number.parseInt(res.speed.z),
        };
        env.droneState.updatePosition(speed);
        env.droneState.updateRotation(res.pitch, res.yaw, res.roll);
        env.environment.updateDronePosition(env.droneState.position);

        disconnectedTimeout = setTimeout(async () => {
            drone.connected = false;
            console.log("Drone disconnected");
        }, 1000);
    });
}

app.ws("/", (ws) => {
    const myUuid = uuidv4();
    clients.push({ client: ws, uuid: myUuid });
    console.log("New client!");

    /* When a new client connects, send the current env */
    env.environment.emitEnvironment();

    ws.onmessage = (msg) => {
        try {
            const pkg = JSON.parse(msg.data.toString());
            handle(pkg);
        } catch (e) {
            console.log(`Invalid package ${msg}:${e}`);
        }
    };

    ws.onclose = () => {
        console.log("Client closed!");

        for (let i = 0; i < clients.length; i++) {
            const { uuid } = clients[i];
            if (uuid == myUuid) {
                clients.splice(i, 1);
            }
        }
    };
});

function handle(pkg: Package) {
    switch (pkg.type) {
        case "command":
            if (pkg.data == "Snake") {
                env.dronePath.Fly("Snake");
            } else {
                drone.command(pkg.data);
            }
            drone.command(pkg.data);
            break;
        case "dronestate":
            console.log("Receiving 'dronestate' pkg");
            break;
        case "Fly":
            env.dronePath.Fly("Snake");
    }
}

function startTest() {
    console.log(`Starting test: ${process.title}`);

    /* Position of dummy boxes for testing */
    const BOX_COUNT = 20;
    let time = 0;
    const addObjectInterval = setInterval(() => {
        let x = Math.cos(time) * time * 30;
        let z = Math.sin(time) * time * 30;
        let obstacle = new Object3D(x, 0, z, 10);
        time += 0.2;
        env.environment.addObject({ obj: obstacle });
        if (time > 0.2 * BOX_COUNT) clearInterval(addObjectInterval);
    }, 1000);

    env.environment.listen("objects", (data: Object3D[]) => {
        com.environment(data);
    });
    env.environment.listen(
        "drone",
        (data: {
            dronePosition: Object3D;
            dronePositionHistory: Object3D[];
        }) => {
            com.drone(data);
        }
    );
}

/* Launch server */
app.listen(PORT, async () => {
    console.log(`Listening on ${PORT}...`);

    startTest();

    console.log(`Connecting to drone...`);
    while (!drone.connected) {
        await droneControl();
    }
});
