import rendering from "./rendering.js";
import environment3d from "./3dmap.js";

/* Declare global variables for use in component */
export let droneState = {};

/**
 * @type {WebSocket}
 */
function init() {
    const wsUrl = `ws:${window.location.host}`;
    const ws = new WebSocket(wsUrl);

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

    /* Add event listener to command input field */
    $("form").addEventListener("submit", (ev) => {
        ev.preventDefault();
        const ifield = $("#input-command");
        const cmd = ifield.value;
        ifield.value = "";
        command(ws, cmd);
        return false;
    });
    $("#button").addEventListener("click", (ev) => {
        const emergencyStop = "stop";
        command(ws, emergencyStop);
        return false;
    });
}

function handle(pkg, ws) {
    switch (pkg.type) {
        case "stream":
            const h264data = Uint8Array.from(pkg.data);
            rendering.feed(h264data);
            break;
        case "error":
            console.error(`Server error: ${pkg.data}`);
            break;
        case "state":
            const dataToRender = pkg.data;
            droneState = pkg.data;
            Object.assign(dataToRender, droneState);
            rendering.updateState(dataToRender);
            break;
        case "environment" /* [Object3D] */:
            environment3d.clearCubes();
            for (let marker of pkg.data) {
                environment3d.make3DCubeInstance(
                    { x: 10, y: 10, z: 10 },
                    { x: marker.x, y: marker.y, z: marker.z },
                    0x0000ff
                );
            }
            break;
        case "drone" /* {dronePosition: Object3D, dronePositionHistory: Object3D[]} */:
            const pos = pkg.data.dronePosition;
            environment3d.updateDronePosition(pos.x, pos.y, pos.z);
            console.log(pos);
            break;
        default:
            console.error(`Unknown package type: ${pkg.type}`);
    }
}

/**
 * Temporary function for sending raw command to the drone;
 */

function command(ws, cmd) {
    ws.send(
        JSON.stringify({
            type: "command",
            data: cmd,
        })
    );
}

export default {
    initialise: init,
    droneState,
};
