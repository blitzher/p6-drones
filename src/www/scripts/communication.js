import rendering from "./rendering.js";

/* Declare global variables for use in component */
/**
 * @type {WebSocket}
 */
let ws;

function init() {
	const wsUrl = `ws:${window.location.host}`
	const ws = new WebSocket(wsUrl)

	ws.addEventListener('message', (msg) => {
		let pkg;
		try {
			pkg = JSON.parse(msg.data);
		}
		catch (e) {
			ws.send(JSON.stringify({
				type: "error",
				data: "Invalid JSON received"
			}))
			return;
		}

		handle(pkg);
	})

	/* Add event listener to command input field */
	$('form').addEventListener('submit', (ev) => {
		const cmd = $('#input-command').value;
		command(ws, cmd);
	})
}

export const droneState = {
	position: {
		x: 0,
		y: 0,
		z: 0

	},
	updatePosition: function (speed) {
		this.position.x += speed.x;
		this.position.y += speed.y;
		this.position.z += speed.z;
	}
}

function handle(pkg) {
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
			ws.send(JSON.stringify({
				type: "dronestate",
				data: droneState
			}));
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
	ws.send(JSON.stringify({
		type: "command",
		data: cmd
	}))
}


export default {
	initialise: init,
	droneState,
}

