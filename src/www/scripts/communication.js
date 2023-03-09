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
        ev.preventDefault();
        const ifield = $("#input-command");
        const cmd = ifield.value;
        ifield.value = "";
        command(ws, cmd);
        return false;
    });
}

export const droneState = {
    position: new Vector3({
        x: 0,
        y: 0,
        z: 0,
    }),
    rotation: {
        pitch: 0,
        yaw: 0,
        roll: 0,
    },
    speed: new Vector3({
        x: 0,
        y: 0,
        z: 0,
    }),
    updatePosition: function (rawSpeed) {
        if (!this._dt) {
            this._dt = Date.now();
            return;
        }
        /* Construct vector */
        let vector = new Vector3({
            x: rawSpeed.y * 10,
            y: rawSpeed.z * 10,
            z: rawSpeed.x * 10,
        });
        vector = rotateVectorAroundYAxis(vector, -this.rotation.yaw);

        /* Scale wrt. deltaTime */
        const cTime = Date.now();
        const deltaTime = (cTime - this._dt) / 1000;
        this._dt = cTime;
        vector = vector.scale(deltaTime);

        this.position = this.position.add(vector);
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
            droneState.updateRotation(
                pkg.data.pitch,
                pkg.data.yaw,
                pkg.data.roll
            );
            droneState.updatePosition(pkg.data.speed);
            const dataToRender = pkg.data;
            Object.assign(dataToRender, droneState);
            rendering.updateState(dataToRender);
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
