import { droneState } from "./communication.js";

/* Declare global variables for use in component */
let ctx, canvas, detector, jmuxer, vcanvas;
/**
 * @type {CanvasRenderingContext2D}
 */
let vctx;

/* Find and set constant element references */
const stateinfodata = $("#stateinfo-data");
const videoElem = $("#camera");

/* Field of Views of the camera, calculated from the 82.6 degree diagonal FOV */
const xFov = 1.1533;
const yFov = 0.865;

/**
 * @typedef {{x:number, y:number}} Pos2D
 *
 * @typedef {{
 *id: number,
 * dist: number,
 * direction: number[],
 * corners: Pos2D[]
 * }} Marker
 */

function init() {
    /* Setup jmuxer on video element */
    jmuxer = new JMuxer({
        node: videoElem,
        mode: "video" /* available values are: both, audio and video */,
        fps: 30,
        noAudio: true,
    });

    /* Initialise ARuco detector */
    detector = new AR.Detector();

    /* Create canvas for extracting video data */
    canvas = document.createElement("canvas");
    canvas.width = 420;
    canvas.height = 315;

    /* Draw video data on canvas for extraction */
    ctx = canvas.getContext("2d", { willReadFrequently: true });

    /* Setup visualisation canvas */
    vcanvas = $("#vcanvas");
    vcanvas.width = 420;
    vcanvas.height = 315;
    vctx = vcanvas.getContext("2d");

    /* Attach event listeners to hovering element */
    initHoveringElement();
}

function initHoveringElement() {
    let attached = false;
    const moveElem = $(".move-hover");
    const stateinfowindow = $("#stateinfo-window");

    moveElem.addEventListener("mousedown", (ev) => {
        attached = true;

        const mousemove = (ev) => {
            stateinfowindow.style.left = ev.clientX - 10;
            stateinfowindow.style.top = ev.clientY - 10;
        };

        const mouseup = (ev) => {
            attached = false;
            document.removeEventListener("mousemove", mousemove);
        };

        moveElem.addEventListener("mouseup", mouseup);
        document.addEventListener("mousemove", mousemove);
    });

    const hideShowInfoElem = $("#hide-show-info");
    hideShowInfoElem.addEventListener("mousedown", (ev) => {
        if (stateinfodata.style.display != "block") {
            stateinfodata.style.display = "block";
            hideShowInfoElem.innerHTML = "&#8593;";
        } else {
            stateinfodata.style.display = "none";
            hideShowInfoElem.innerHTML = "&#8595;";
        }
    });
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
    const FOCAL_LENGTH = 25; /* mm */
    const MARKER_HEIGHT = 100; /* mm */
    const APPARENT_HEIGHT =
        (marker.corners[1].y +
            marker.corners[3].y -
            marker.corners[0].y -
            marker.corners[2].y) /
        2; /* pixels */
    const IMAGE_HEIGHT = canvas.height; /* pixels */
    const SENSOR_HEIGHT = 2.0775; /* mm */
    return (
        (FOCAL_LENGTH * APPARENT_HEIGHT * IMAGE_HEIGHT) /
        (MARKER_HEIGHT * SENSOR_HEIGHT)
    );
}

class Marker3D {
    x;
    y;
    z;

    constructor({ x, y, z }) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    add({ x, y, z }) {
        return new Marker3D({ x: this.x + x, y: this.y + y, z: +this.z + z });
    }

    scale(amount) {
        return new Marker3D({
            x: this.x * amount,
            y: this.y * amount,
            z: this.z * amount,
        });
    }

    length() {
        return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
    }

    normalise() {
        const l = this.length();
        return new Marker3D({ x: this.x / l, y: this.y / l, z: this.z / l });
    }
}
function estimateMarkerPosition(marker) {
    const dist = estimateDistance(marker);

    /* Find center of the marker */
    const x =
        (marker.corners[0].x +
            marker.corners[1].x +
            marker.corners[2].x +
            marker.corners[3].x) /
        4;
    const y =
        (marker.corners[0].y +
            marker.corners[1].y +
            marker.corners[2].y +
            marker.corners[3].y) /
        4;

    const [tx, ty] = [canvas.width, canvas.height];
    /* Find the relative screen position of the marker */
    const [mx, my] = [vcanvas.width / 2, vcanvas.height / 2];
    const [dx, dy] = [x - mx, y - my];

    /* Find the angle to the point on the screen,
     * assumed to be equivalent to real world angle */
    const x0 = linInterp(dx, -mx, mx, -xFov / 2, xFov / 2);
    const y0 = -linInterp(dy, -my, my, -yFov / 2, yFov / 2);

    /* Extrapolate the z angle from based on the distance to the marker */
    let z0 = x0 ** 2 / dist ** 2 + y0 ** 2 / dist ** 2 + 1;

    /* Construct the vector from the direction,
     * length and position of the drone  */
    const direction = new Marker3D({ x: x0, y: y0, z: z0 });
    const norm = direction.normalise();
    const scaled = norm.scale(dist);
    const position = scaled.add(droneState.position);

    return position;
}

/**
 *
 * @param {Uint8ClampedArray} data
 */
function feed(data) {
    jmuxer.feed({
        video: data,
        audio: false,
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

    if (markers.length == 0) {
        let marker = {};

        marker.corners = [
            { x: 100, y: 100 },
            { x: 140, y: 110 },
            { x: 140, y: 140 },
            { x: 100, y: 150 },
        ];
        marker.id = -1;

        markers.push(marker);
    }

    return markers;
}

/**
 *
 * @param {Marker[]} markers
 */
function renderMarkers(markers) {
    vctx.clearRect(0, 0, vcanvas.width, vcanvas.height);
    vctx.strokeStyle = "red";
    vctx.lineWidth = 2;
    vctx.beginPath();
    for (let marker of markers) {
        vctx.moveTo(marker.corners[0].x, marker.corners[0].y);

        for (let corner of marker.corners) {
            vctx.lineTo(corner.x, corner.y);
        }
        vctx.lineTo(marker.corners[0].x, marker.corners[0].y);
    }
    vctx.stroke();
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
    estimateMarkerPosition,
    renderMarkers,
};
