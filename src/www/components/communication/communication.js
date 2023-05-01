/* communication.js */
import droneCam from "../drone-cam/drone-cam.js";
import environment3d from "../3d-map/3d-map.js";
import * as THREE from "../../libs/three.min.js";

/* Declare global variables for use in component */
/** @type {{[key:string]:StateInfo}} */
export let droneState = {};
const wsUrl = `ws:${window.location.host}`;
let ws;
const points = [];
/**
 * @type {WebSocket}
 */
function init() {
    ws = new WebSocket(wsUrl);
    ws.addEventListener("message", (msg) => {
        let pkg;

        try {
            pkg = JSON.parse(msg.data);
        } catch (e) {
            ws.send(
                JSON.stringify({
                    type: "error",
                    data: "Invalid JSON received",
                })
            );
            return;
        }

        handle(pkg, ws);
    });
}

function handle(pkg, ws) {
    switch (pkg.type) {
        case "stream":
            const h264data = Uint8Array.from(pkg.data);
            droneCam.feed(h264data, pkg.id);
            break;
        case "error":
            console.error(`Server error: ${pkg.data}`);
            break;
        case "state":
            droneState[pkg.id] = pkg.data;
            break;
        case "environment" /* [Object3D] */:
            environment3d.clearCubes();
            for (let marker of Object.values(pkg.data)) {
                environment3d.make3DCubeInstance(
                    { x: 10, y: 10, z: 10 },
                    { x: marker.x, y: marker.y, z: marker.z },
                    0x0000ff
                );
            }
            break;
        case "drone" /* {dronePosition: Object3D, dronePositionHistory: Object3D[]} */:
            const pos = pkg.data.dronePosition;
            points.push(new THREE.Vector3(pos.x, pos.z, -pos.y));
            environment3d.clearPathLine();
            environment3d.drawPathLine(points);
            environment3d.updateDronePosition(pos.x, pos.y, pos.z);
            break;
        default:
            console.error(`Unknown package type: ${pkg.type}`);
    }
}

/**
 * Temporary function for sending raw command to the drone;
 */

function trySend(obj) {
    const str = JSON.stringify(obj);
    if (ws.readyState != 1) {
        console.log(`Could not send ${str}. Websocket is not open!`);
        return;
    }
    ws.send(str);
}

function command(cmd) {
    trySend({
        type: "command",
        data: cmd,
    });
}

function emergencyStop() {
    trySend({ type: "emergencyStop" });
}

function initSearch() {
    trySend({ type: "initSearch" });
}

function sendMarker(marker) {
    ws.send(
        JSON.stringify({
            type: "marker",
            data: marker,
        })
    );
}

export default {
    initialise: init,
    droneState,
    command,
    emergencyStop,
    initSearch,
    sendMarker,
};
