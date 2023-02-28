
const $ = (q) => document.querySelector(q);
const videoElem = $("#camera");
window.addEventListener("load", (doc, ev) => {

})

var detector = new AR.Detector();
const wsUrl = `ws:${window.location.host}`
const ws = new WebSocket(wsUrl)

function handle(package) {
    switch (package.type) {
        case "stream":
            const h264data = Uint8Array.from(package.data);
            jmuxer.feed({
                video: h264data,
                audio: false
            });
            // videoElem.play();
            break;
        case "error":
            console.error(`Server error: ${package.data}`);
            break;
        case "state":
            updateState(package.data);
            break;
        case "mapdata":
            console.log("Map NYI");
            break;
        default:
            console.error(`Unknown package type: ${package.type}`);
    }
}

const stateinfodata = $("#stateinfo-data")
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

const jmuxer = new JMuxer({
    node: videoElem,
    mode: 'video', /* available values are: both, audio and video */
    fps: 30,
    noAudio: true,

});
//Create canvas for extracting video data

let canvas = document.createElement('canvas');


canvas.width = 420;
canvas.height = 315;

//Draw video data on canvas for extraction
let ctx = canvas.getContext('2d', { willReadFrequently: true });

function extractImgData() {

    ctx.drawImage(videoElem, 0, 0, canvas.width, canvas.height);

    let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    ARReader(imgData);


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
    //const QRcode = jsQR(imgData.data, imgData.width, imgData.height, {inversionAttempts:"dontInvert"});
    if (markers)
        console.log(markers);
}


setInterval(extractImgData, 1000);



/* Now feed media data using feed method. audio and video is buffer data and duration is in milliseconds */

/* 
{
    "binaryData": [
        104,
        116,
        116,
        112,
        58,
        47,
        47,
        101,
        110,
        46,
        109,
        46,
        119,
        105,
        107,
        105,
        112,
        101,
        100,
        105,
        97,
        46,
        111,
        114,
        103
    ],
    "data": "http://en.m.wikipedia.org",
    "chunks": [
        {
            "type": "byte",
            "bytes": [
                104,
                116,
                116,
                112,
                58,
                47,
                47,
                101,
                110,
                46,
                109,
                46,
                119,
                105,
                107,
                105,
                112,
                101,
                100,
                105,
                97,
                46,
                111,
                114,
                103
            ],
            "text": "http://en.m.wikipedia.org"
        }
    ],
    "version": 3,
    "location": {
        "topRightCorner": {
            "x": 310.6693295346836,
            "y": 120.27539302951396
        },
        "topLeftCorner": {
            "x": 163.35582979854328,
            "y": 139.27441323323546
        },
        "bottomRightCorner": {
            "x": 317.98339604704904,
            "y": 253.7291313877667
        },
        "bottomLeftCorner": {
            "x": 183.301795191882,
            "y": 268.7608605275987
        },
        "topRightFinderPattern": {
            "x": 293.75,
            "y": 140
        },
        "topLeftFinderPattern": {
            "x": 183.25,
            "y": 154
        },
        "bottomLeftFinderPattern": {
            "x": 197.25,
            "y": 252.5
        },
        "bottomRightAlignmentPattern": {
            "x": 285.25,
            "y": 229.5
        }
    }
} */

