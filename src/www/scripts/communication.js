import rendering from "./rendering.js";

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
        case "environment" /* {environment: string[]} */:
            console.log("Environment NYI");
            break;
        case "drone" /* {dronePosition: string, dronePositionHistory: string[]} */:
            console.log("DroneData NYI");
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
