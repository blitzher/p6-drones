/* Import nodejs packages */
import * as fs from "fs";
import * as path from "path";

/* Import npm packages */
import express from "express";
import tellojs from "tellojs";
import expressWs from "express-ws";
import { v4 as uuidv4 } from "uuid";
import { WebSocket } from "ws";

/* Import local packages and typedef */
import { H264Segmenter } from "./h264-segmenter";
import { SDK } from "./sdk";
import environment from "./environment";

const sdk: SDK = tellojs;

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
    state: (state: object) => {
        for (let { client } of clients)
            client.send(
                JSON.stringify({
                    type: "state",
                    data: state,
                })
            );
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
        await sdk.control.command(cmd);
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
    stateEmitter.on("message", (res) => {
        com.state(res);
    });
}

app.ws("/", (ws) => {
    const myUuid = uuidv4();
    clients.push({ client: ws, uuid: myUuid });
    console.log("New client!");

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
            drone.command(pkg.data);
            break;
        case "dronestate":
            environment;
            break;
    }
}

/* Launch server */
app.listen(PORT, async () => {
    console.log(`Listening on ${PORT}...`);

    console.log(`Connecting to drone...`);
    while (!drone.connected) {
        await droneControl();
    }
});
