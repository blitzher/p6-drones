/*drone-cam.js*/
import { droneState } from "../communication/communication.js";

/* Declare global variables for use in component */
let ctx, canvas, detector, jmuxer, vcanvas;
/**
 * @type {CanvasRenderingContext2D}
 */
let vctx;

/* Find and set constant element references */
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
    canvas.width = 960;
    canvas.height = 720;

    /* Draw video data on canvas for extraction */
    ctx = canvas.getContext("2d", { willReadFrequently: true });

    /* Setup visualisation canvas */
    vcanvas = $("#vcanvas");
    vcanvas.width = 420;
    vcanvas.height = 315;
    vctx = vcanvas.getContext("2d");
    vctx.strokeStyle = "red";
    vctx.lineWidth = 2;
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
 * @param {Marker} marker
 * @returns
 */
function estimateDistance(marker) {
    const FOCAL_LENGTH = 25; /* mm */
    const MARKER_HEIGHT = 140; /* mm */
    const APPARENT_HEIGHT =
        (marker.corners[3].y - marker.corners[0].y + marker.corners[2].y - marker.corners[1].y) / 2; /* pixels */
    const IMAGE_HEIGHT = canvas.height; /* pixels */
    const SENSOR_HEIGHT = 2.0775; /* mm */
    return (
        ((FOCAL_LENGTH * MARKER_HEIGHT * IMAGE_HEIGHT) / (APPARENT_HEIGHT * SENSOR_HEIGHT)) * 0.1
    ); /* Divide by 10 because ¯\_(ツ)_/¯ */
}

/**
 *
 * @param {Marker} marker
 * @returns {{relative: {x: number, y:number, z:number}}}
 */
function estimateMarkerPosition(marker) {
    const dist = estimateDistance(marker);

    /* Find center of the marker */
    const x = (marker.corners[0].x + marker.corners[1].x + marker.corners[2].x + marker.corners[3].x) / 4;
    const y = (marker.corners[0].y + marker.corners[1].y + marker.corners[2].y + marker.corners[3].y) / 4;

    /* Find the relative screen position of the marker */
    const [mx, my] = [canvas.width / 2, canvas.height / 2];
    const [dx, dy] = [x - mx, y - my];

    /* Find the angle to the point on the screen,
     * assumed to be equivalent to real world angle */
    const x0 = linInterp(dx, -mx, mx, -xFov / 2, xFov / 2);
    const y0 = -linInterp(dy, -my, my, -yFov / 2, yFov / 2);

    const x1 = x0 * dist;
    const y1 = y0 * dist;

    /* Extrapolate the z angle from based on the distance to the marker */
    let z0 = x1 ** 2 / dist ** 2 + y1 ** 2 / dist ** 2 + 1;
    let z1 = z0 * dist;

    const markerRelativePosition = new Vector3({ x: x1, y: y1, z: z1 });

    /* Adjust for camera tilt, estimated 15degrees */
    const cameraAdjusted = rotateVectorAroundXAxis(
        markerRelativePosition,
        /*Degrees recalculated to radians*/
        Math.PI / 12 - droneState.pitch
    );

    /* Adjust for rotation of drone */
    const adjustedPosition = rotateVectorAroundYAxis(cameraAdjusted, droneState.yaw);

    return { relative: adjustedPosition, id: marker.id };
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
    vctx.clearRect(0, 0, vcanvas.width, vcanvas.height);
    const imgData = extractImgData();
    let markers = ARReader(imgData);

    if (markers.length == 0) {
        let marker = {};

        marker.corners = [
            { x: 125, y: 45 },
            { x: 269, y: 39 },
            { x: 282, y: 180 },
            { x: 125, y: 187 },
        ];
        marker.id = -1;

        //markers.push(marker);
    }

    markers = markers.filter((marker) => marker.id != 97);
    return markers;
}

/**
 *
 * @param {Marker[]} markers
 */
function renderMarkers(markers) {
    vctx.beginPath();
    for (let marker of markers) {
        const start = linInterpCanvas(marker.corners[0], canvas, vcanvas);
        vctx.moveTo(start.x, start.y);

        for (let corner of marker.corners) {
            const c = linInterpCanvas(corner, canvas, vcanvas);
            vctx.lineTo(c.x, c.y);
        }
        vctx.lineTo(start.x, start.y);
    }
    vctx.stroke();
}

export default {
    initialise: init,
    feed,
    findMarkers,
    estimateMarkerPosition,
    renderMarkers,
};
