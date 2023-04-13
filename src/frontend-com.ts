import * as env from "./environment";
import { StateInfo } from "../tellojs-sdk30/src";
import { Drone, DroneId } from "./drone";
import { v4 as uuidv4 } from "uuid";
import logger from "../tellojs-sdk30/src/log";

type UWebSocket = { client: WebSocket; uuid: string };
const clients: UWebSocket[] = [];
type Package = { type: string; data: any };

/* Setup helper functions for back-front-communication */
export const com = {
    video: (buffer: Uint8Array, id: DroneId) => {
        const dataArray = Array.from(buffer);

        for (let { client } of clients)
            client.send(
                JSON.stringify({
                    type: "stream",
                    data: dataArray,
                    id,
                })
            );

        logger.increment(`Sending video stream to ${id}`);
    },
    state: (state: StateInfo, id: DroneId) => {
        for (let { client } of clients)
            client.send(
                JSON.stringify({
                    type: "state",
                    data: state,
                    id,
                })
            );
    },
    environment: (data: env.Object3D[]) => {
        for (let { client } of clients) client.send(JSON.stringify({ type: "environment", data }));
    },
    drone: (data: { dronePosition: env.Object3D; dronePositionHistory: env.Object3D[] }) => {
        for (let { client } of clients) client.send(JSON.stringify({ type: "drone", data }));
    },
};

export const initialiseWebSocket = (ws: WebSocket) => {
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
};

function handle(pkg: Package) {
    switch (pkg.type) {
        case "command":
            const [drone_id, ...cmd] = pkg.data.split(" ");
            Drone.allDrones[drone_id].command(pkg.data);
            break;
        case "marker":
            console.log(`Found marker {${JSON.stringify(pkg.data, undefined, 2)}}`);

            const marker = pkg.data.relative;
            const id = pkg.data.id;

            env.environment.addObject({
                pos: {
                    x: marker.x / 10,
                    y: marker.y / 10,
                    z: marker.z / 10,
                    r: env.BOX_RADIUS,
                },
                id,
            });

            break;
    }
}
