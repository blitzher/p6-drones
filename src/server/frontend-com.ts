import * as env from "./environment";
import { StateInfo } from "../tellojs-sdk30/src";
import { Drone, DroneId } from "./drone";
import { v4 as uuidv4 } from "uuid";
import logger from "../log";
import { CommandOptions } from "../tellojs-sdk30/src/commander";
import { dronePaths } from "./dronePath";
import * as linAlg from "./linerAlgebra";
import * as constants from "./constants.json"

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

export const close = () => {
    for (let { client } of clients) {
        client.close();
    }
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
    state: (data: StateInfo, id: DroneId) => {
        for (let { client } of clients)
            client.send(
                JSON.stringify({
                    type: "state",
                    data,
                    id,
                })
            );
    },
    environment: (data: env.Object3D[]) => {
        for (let { client } of clients)
            client.send(JSON.stringify({ type: "environment", data }));
    },
    drone: (data: {
        droneId: string;
        dronePosition: env.Object3D;
        droneYaw: number;
        dronePositionHistory: env.Object3D[];
    }) => {
        for (let { client } of clients)
            client.send(JSON.stringify({ type: "drone", data }));
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

function handle(pkg: Package) {
    let drone: Drone | undefined;
    switch (pkg.type) {
        case "emergencyStop":
            for (let drone of Object.values(Drone.allDrones)) {
                drone.control.stop({ forceReady: true, clearQueue: true });
            }
            break;
        case "initSearch":
            for (let drone of Object.values(Drone.allDrones)) {
                dronePaths.fly(drone).then(() => {
                    const targetBox = Object.values(env.environment.objects).filter((o) => o.isTarget)[0];
                    const { x, y, z } = targetBox;
                    if (drone.id == targetBox.whoScanned) {
                        drone.control.go({ x, y, z: z + constants.drone.TARGET_HOVER_HEIGHT }, 50)
                    }
                    else {
                        drone.control.go({ x: 0, y: 0, z: 60 }, 50);
                        drone.control.land()
                    }
                    logger.info(`Virtual:${drone.id} done flight`)
                });
            }
            break;
        case "command":
            let [drone_id, ...cmd] = pkg.data.split(" ");

            drone = Drone.allDrones[drone_id];
            if (!drone) break;

            const cmd_s = cmd.join(" ");

            const isStop = cmd_s == "stop";
            const commandOptions: CommandOptions = {
                clearQueue: isStop,
                forceReady: isStop,
            };

            if (cmd_s == "streamon") {
                Drone.allDrones[drone_id].startVideoStream();
                break;
            }

            // @ts-ignore
            const func: any = drone.control[cmd[0]];
            if (func) {
                if (cmd[0] == "go") {
                    cmd[3] = { x: cmd[1], y: cmd[2], z: cmd[3] };
                    cmd = cmd.slice(3);
                    cmd.unshift("go");
                }
                func(...cmd.slice(1));
            } else Drone.allDrones[drone_id].command(cmd_s, commandOptions);
            break;
        case "marker":
            const marker: MarkerData = pkg.data;

            drone = env.environment.getDrone(marker.droneId);
            marker.relative = linAlg.rotateVectorAroundZAxis(
                new linAlg.Vector3(marker.relative),
                (drone.state.rotation.yaw * 180) / Math.PI
            );
            /* Relative is in mm, so convert to cm */
            let x = Math.round(marker.relative.x / 10 + drone.state.position.x);
            let y = Math.round(marker.relative.y / 10 + drone.state.position.y);
            let z = Math.round(marker.relative.z / 10 + drone.state.position.z);

            env.environment.addObject({ pos: { x, y, z } }, marker.id, marker.droneId);
            const o = env.environment.objects[marker.id];
            logger.info(`Object at (${o.x},${o.y},${o.z})`);
            break;
    }
}
