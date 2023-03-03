
/* Declare global variables for use in component */
let ctx, canvas, detector, jmuxer;

/* Find and set constant element references */
const stateinfodata = $("#stateinfo-data")
const videoElem = $("#camera");

/**
 * @typedef {{x:number, y:number}} 2DPos
 * 
 * @typedef {{
*	id: number,
* 	dist: number,
* 	direction: number[],
*  corners: 2DPos[]
* }} Marker
*/

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
	canvas.width = 420;
	canvas.height = 315;

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
 * @param {Marker} marker 
 * @returns 
 */
function estimateDistance(marker) {
	const FOCAL_LENGTH = 25;	 		/* mm */
	const MARKER_HEIGHT = 100; 	 		/* mm */
	const APPARENT_HEIGHT = (marker.corners[1].y + marker.corners[3].y - marker.corners[0].y - marker.corners[2].y) / 2; /* pixels */
	const IMAGE_HEIGHT = canvas.height;	/* pixels */
	const SENSOR_HEIGHT = 2.0775;		/* mm */
	return (FOCAL_LENGTH * APPARENT_HEIGHT * IMAGE_HEIGHT) / (MARKER_HEIGHT * SENSOR_HEIGHT);
}

class Marker3D {

x;
y;
z;

constructor(X,Y,Z){
	this.x=X;
	this.y=Y;
	this.z=Z;
}

}
function estimateMarkerPosition(marker) {
	const dist = estimateDistance(marker);
	
	const markerPos3D = new Marker3D();
	markerPos3D.x = (marker.corners[0].x * dist + marker.corners[1].x * dist + marker.corners[2].x * dist + marker.corners[3].x * dist)/4;
	markerPos3D.y = (marker.corners[0].y * dist + marker.corners[1].y * dist + marker.corners[2].y * dist + marker.corners[3].y * dist)/4;
	markerPos3D.z = ((((-markerPos3D.x)**2)/(dist**2))+(((-markerPos3D.y)**2)/(dist**2))+1)

	return markerPos3D;
	
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
 * 
 * @returns {Marker[]} markers
 */
function findMarkers() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	const imgData = extractImgData();
	const markers = ARReader(imgData);

	return markers;

}

function updateState(state) {
	const formattedData = `
    Pitch/Roll/Yaw: ${state.pitch}/${state.roll}/${state.yaw}<br>
    Battery: ${state.battery}%<br>
    Speed:<br>
	&nbsp;x: ${state.speed.x}<br>
	&nbsp;y: ${state.speed.y}<br>
	&nbsp;z: ${state.speed.z}<br>
    Temperature:<br>
	&nbsp;low: ${state.temperature.low}<br>
	&nbsp;high: ${state.temperature.high}<br>
    Height: ${state.heigh}<br>
    TOF: ${state.tof}<br>
    Barometer: ${state.barometer}<br>
    Flight time: ${state.time}<br>
    Acceleration:<br>
	&nbsp;x: ${state.acceleration.x}<br>
	&nbsp;y: ${state.acceleration.y}<br>
	&nbsp;z: ${state.acceleration.z}<br>
    `;

	stateinfodata.innerHTML = formattedData;
}

export default {
	initialise: init,
	feed,
	findMarkers,
	updateState,
	estimateMarkerPosition
}