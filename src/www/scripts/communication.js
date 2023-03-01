import rendering from "./rendering.js";

/* Declare global variables for use in component */
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
			break;
		case "mapdata":
			console.log("Map NYI");
			break;
		default:
			console.error(`Unknown package type: ${pkg.type}`);
	}
}


export default {
	initialise: init,

}

