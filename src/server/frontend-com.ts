import * as env from "./environment";
import { StateInfo } from "../tellojs-sdk30/src";
import { Drone, DroneId } from "./drone";
import { v4 as uuidv4 } from "uuid";
import logger from "../log";
import { CommandOptions } from "../tellojs-sdk30/src/commander";

type Millimeter = number;
type UWebSocket = { client: WebSocket; uuid: string };
const clients: UWebSocket[] = [];
type Package = { type: string; data: any };
type MarkerData = {
    relative: {
        x: Millimeter;
        y: Millimeter;
        z: Millimeter;
    };
    id: number;
    dist: Millimeter;
    droneId: string;
};

/* Setup helper functions for back-front-communication */
export const com = {
    video: (buffer: Uint8Array, id: DroneId) => {
        const dataArray = Array.from(buffer);

        for (let { client } of clients) {
            logger.increment(`Sending video stream from drone ${id}`);
            client.send(
                JSON.stringify({
                    type: "stream",
                    data: dataArray,
                    id,
                })
            );
        }
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

        /* Remove client from array */
        for (let i = 0; i < clients.length; i++) {
            const { uuid } = clients[i];
            if (uuid == myUuid) {
                clients.splice(i, 1);
            }
        }
    };
};

let GoingToMarker = false;
function handle(pkg: Package) {
    switch (pkg.type) {
        case "command":
            let [drone_id, ...cmd] = pkg.data.split(" ");
            cmd = cmd.join(" ");

            const commandOptions: CommandOptions = { overwriteQueue: cmd == "stop" };
            Drone.allDrones[drone_id].command(cmd, commandOptions);
            break;
        case "marker":
            // console.log(`Found marker {${JSON.stringify(pkg.data, undefined, 2)}}`);

            const marker: MarkerData = pkg.data;

            let drone = env.environment.getDrone(marker.droneId);
            /* Relative is in mm, so convert to cm */
            let x = Math.round(marker.relative.x / 10 + drone.state.position.x);
            let y = Math.round(marker.relative.y / 10 + drone.state.position.y);
            let z = Math.round(marker.relative.z / 10 + drone.state.position.z);

            env.environment.addObject({ pos: { x, y, z } }, marker.id);
            const o = env.environment.objects[marker.id]
            logger.info(`Object at (${o.x},${o.y},${o.z})`);
            break;
    }
}
