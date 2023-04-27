/*drone-cam.js*/
import { droneState } from "../communication/communication.js";

/**
 * @typedef {number} Millimeter
 */

/* Declare global variables for use in component */
let ctx = {},
    canvas = {},
    detector,
    jmuxer = {},
    vcanvas = {},
    videoElems = {};
/**
 * @type {{[key:string]:CanvasRenderingContext2D}}
 */
let vctx = {};

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
    detector = new AR.Detector();
    initMulticam($("#camera0"), 130);
    initMulticam($("#camera1"), 141);
    initMulticam($("#camera2"), 174);
    initMulticam($("#camera3"), 191);
    /* initMulticam($("camera0"), 130)
    initMulticam($("camera0"), 130) */

    return [130, 141, 174, 191];
}

function initMulticam(videoElem, id) {
    videoElems[id] = videoElem;
    /* Setup jmuxer on video element */
    jmuxer[id] = new JMuxer({
        node: videoElem,
        mode: "video" /* available values are: both, audio and video */,
        fps: 30,
        noAudio: true,
    });

    /* Initialise ARuco detector */

    /* Create canvas for extracting video data */
    canvas[id] = document.createElement("canvas");
    canvas[id].width = 960;
    canvas[id].height = 720;

    /* Draw video data on canvas[id] for extraction */
    ctx[id] = canvas[id].getContext("2d", { willReadFrequently: true });

    /* Setup visualisation canvas */
    const vcanvasIndex = Object.keys(vcanvas).length;
    vcanvas[id] = $(`#vcanvas${vcanvasIndex}`);
    vcanvas[id].width = 420;
    vcanvas[id].height = 315;
    vctx[id] = vcanvas[id].getContext("2d");
    vctx[id].strokeStyle = "red";
    vctx[id].lineWidth = 2;
}

function extractImgData(id) {
    ctx[id].drawImage(videoElems[id], 0, 0, canvas[id].width, canvas[id].height);
    return ctx[id].getImageData(0, 0, canvas[id].width, canvas[id].height);
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
function estimateDistance(marker, id) {
    const FOCAL_LENGTH = 25; /* mm */
    const MARKER_HEIGHT = 140; /* mm */
    const APPARENT_HEIGHT =
        (marker.corners[3].y - marker.corners[0].y + marker.corners[2].y - marker.corners[1].y) / 2; /* pixels */
    const IMAGE_HEIGHT = canvas[id].height; /* pixels */
    const SENSOR_HEIGHT = 2.0775; /* mm */
    return (
        ((FOCAL_LENGTH * MARKER_HEIGHT * IMAGE_HEIGHT) / (APPARENT_HEIGHT * SENSOR_HEIGHT)) * 0.1
    ); /* Divide by 10 because ¯\_(ツ)_/¯ */
}

/**
 *
 * @param {Marker} marker
 * @returns {{relative: {x: Millimeter, y:Millimeter, z:Millimeter}, id: number, dist: Millimeter, isValid: boolean, droneId: number }}
 */
function estimateMarkerPosition(marker, id) {
    const dist = estimateDistance(marker, id);
    if (Math.abs(dist) > 10000) return { isValid: false };

    /* Find center of the marker */
    const x = (marker.corners[0].x + marker.corners[1].x + marker.corners[2].x + marker.corners[3].x) / 4;
    const y = (marker.corners[0].y + marker.corners[1].y + marker.corners[2].y + marker.corners[3].y) / 4;

    /* Find the relative screen position of the marker */
    const [mx, my] = [canvas[id].width / 2, canvas[id].height / 2];
    const [dx, dy] = [x - mx, y - my];

    /* Find the angle to the point on the screen,
     * assumed to be equivalent to real world angle */
    const x0 = linInterp(dx, -mx, mx, -xFov / 2, xFov / 2);
    const y0 = -linInterp(dy, -my, my, -yFov / 2, yFov / 2);

    const x1 = Math.sin(x0) * dist;
    const y1 = Math.sin(y0) * dist;

    /* Extrapolate the z angle from based on the distance to the marker */
    let z0 = x1 ** 2 / dist ** 2 + y1 ** 2 / dist ** 2 + 1;
    let z1 = z0 * dist;

    const markerRelativePosition = new Vector3({ x: -x1, y: y1, z: z1 });

    /* Adjust for camera tilt, estimated 15degrees */
    const cameraAdjusted = rotateVectorAroundXAxis(
        markerRelativePosition,

        13.5 - droneState[id].pitch
    );

    /* Adjust for rotation of drone */
    const adjustedPosition = rotateVectorAroundYAxis(cameraAdjusted, -droneState[id].yaw);

    const droneRelativeCoordinates = {
        x: adjustedPosition.z,
        y: adjustedPosition.x,
        z: adjustedPosition.y,
    };

    return { relative: droneRelativeCoordinates, id: marker.id, dist, isValid: true, droneId: id };
}

/**
 *
 * @param {Uint8ClampedArray} data
 * @param {number} id
 */
function feed(data, id) {
    jmuxer[id].feed({
        video: data,
        audio: false,
    });
}

/**
 *
 * @returns {Marker[]} markers
 */
function findMarkers(id) {
    ctx[id].clearRect(0, 0, canvas[id].width, canvas[id].height);
    vctx[id].clearRect(0, 0, vcanvas[id].width, vcanvas[id].height);
    const imgData = extractImgData(id);
    let markers = ARReader(imgData);

    if (!markers || markers.length == 0) return;
    /* Filter out the weird marker that appears randomly */
    markers = markers.filter((marker) => marker.id != 97);
    return markers;
}

/**
 *
 * @param {Marker[]} markers
 */
function renderMarkers(markers, id) {
    vctx[id].beginPath();
    if (!markers || markers.length == 0) return;
    for (let marker of markers) {
        const start = linInterpCanvas(marker.corners[0], canvas[id], vcanvas[id]);
        vctx[id].moveTo(start.x, start.y);

        for (let corner of marker.corners) {
            const c = linInterpCanvas(corner, canvas[id], vcanvas[id]);
            vctx[id].lineTo(c.x, c.y);
        }
        vctx[id].lineTo(start.x, start.y);
    }
    vctx[id].stroke();
}

function lookForMarkers(camIds, internal) {
    for (let id of camIds) {
        setInterval(() => {
            const markers = droneCam.findMarkers(id);
            let markerPos;

            if (markers != undefined && markers.length > 0) {
                droneCam.renderMarkers(markers, id);

                markers.forEach((marker) => {
                    markerPos = droneCam.estimateMarkerPosition(marker, id);

                    if (!markerPos.isValid) return;

                    communication.sendMarker(markerPos);

                    const [rx, ry, rz] = Object.values(markerPos.relative).map((v) => Math.round(v) / 10);
                    const rd = Math.round(markerPos.dist) / 10;

                    console.log(`Relative x:${rx}cm y:${ry}cm z:${rz}cm dist:${rd}cm id:${markerPos.id}`);
                });
            }
        }, 2500);
    }
}

export default {
    initialise: init,
    feed,
    findMarkers,
    estimateMarkerPosition,
    renderMarkers,
};
