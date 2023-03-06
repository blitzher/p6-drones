import rendering from "./rendering.js";

/* Declare global variables for use in component */
/**
 * @type {WebSocket}
 */
let ws;

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
        const cmd = $("#input-command").value;
        command(ws, cmd);
    });
}

export const droneState = {
    position: {
        x: 0,
        y: 0,
        z: 0,
    },
    rotation: {
        pitch: 0,
        yaw: 0,
        roll: 0,
    },
    updatePosition: function (speed) {
        this.position.x += speed.x;
        this.position.y += speed.y;
        this.position.z += speed.z;
    },

    updateRotation: function (pitch, yaw, roll) {
        this.rotation.pitch = (pitch * Math.PI) / 180;
        this.rotation.yaw = (yaw * Math.PI) / 180;
        this.rotation.roll = (roll * Math.PI) / 180;
    },
};

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
            rendering.updateState(pkg.data);
            droneState.updatePosition(pkg.data.speed);
            droneState.updateRotation(
                pkg.data.pitch,
                pkg.data.yaw,
                pkg.data.roll
            );
            ws.send(
                JSON.stringify({
                    type: "dronestate",
                    data: droneState,
                })
            );
            break;
        case "mapdata":
            console.log("Map NYI");
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
