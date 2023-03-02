
/* Declare global variables for use in component */
let ctx, canvas, detector, jmuxer;

/* Find and set constant element references */
const stateinfodata = $("#stateinfo-data")
const videoElem = $("#camera");

function init() {

	/* Setup jmuxer on video element */
	jmuxer = new JMuxer({
		node: videoElem,
		mode: 'video', /* available values are: both, audio and video */
		fps: 30,
		noAudio: true,
	});

	/* Initialise ARuco detector */
	detector = new AR.Detector();

	/* Create canvas for extracting video data */
	canvas = document.createElement('canvas');
	canvas.width = 720;
	canvas.height = 960;

	/* Draw video data on canvas for extraction */
	ctx = canvas.getContext('2d', { willReadFrequently: true });

	/* Attach event listeners to hovering element */
	initHoveringElement();
}

function initHoveringElement() {
	let attached = false;
	const moveElem = $(".move-hover")
	const stateinfowindow = $("#stateinfo-window")

	moveElem.addEventListener("mousedown", (ev) => {
		attached = true;

		const mousemove = (ev) => {

			stateinfowindow.style.left = ev.clientX - 10
			stateinfowindow.style.top = ev.clientY - 10
		}

		const mouseup = (ev) => {
			attached = false;
			document.removeEventListener("mousemove", mousemove);
		}

		moveElem.addEventListener("mouseup", mouseup);
		document.addEventListener("mousemove", mousemove);

	})

	const hideShowInfoElem = $("#hide-show-info");
	hideShowInfoElem.addEventListener("mousedown", (ev) => {
		if (stateinfodata.style.display != "block") {
			stateinfodata.style.display = "block"
			hideShowInfoElem.innerHTML = "&#8593;"
		}
		else {
			stateinfodata.style.display = "none";
			hideShowInfoElem.innerHTML = "&#8595;"
		}
	})
}

function extractImgData() {

	ctx.drawImage(videoElem, 0, 0, canvas.width, canvas.height);

	return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/**
 * 
 * @param {ImageData} imgData 
 * @param {any} options 
 */
function ARReader(imgData) {
	try {
		var markers = detector.detect(imgData);
	} catch (e) {
		console.log(e);
	}
	return markers;
}


/**
 * 
 * @param {Uint8ClampedArray} data 
 */
function feed(data) {
	jmuxer.feed({
		video: data,
		audio: false
	});
}


/**
 * @typedef {{id: number}} Marker
 */

/**
 * 
 * @returns {Marker[]} markers
 */
function findMarkers() {
	const imgData = extractImgData();
	const markers = ARReader(imgData);

	return markers;

}

function updateState(state) {
	const formattedData = `
    Pitch/Roll/Yaw: ${state.pitch}/${state.roll}/${state.yaw}
    Battery: ${state.battery}%
    Speed:
        \tx: ${state.speed.x}
        \ty: ${state.speed.x}
        \tz: ${state.speed.x}
    Temperature:
        \tlow: ${state.temperature.low}
        \thigh: ${state.temperature.high}
    Height: ${state.heigh}
    TOF: ${state.tof}
    Barometer: ${state.barometer}
    Flight time: ${state.time}
    Acceleration:
        \tx: ${state.acceleration.x}
        \ty: ${state.acceleration.y}
        \tz: ${state.acceleration.z}
    `;

	stateinfodata.innerText = formattedData;
}

export default {
	initialise: init,
	feed,
	findMarkers,
	updateState
}