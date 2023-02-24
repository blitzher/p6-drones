const { default: jsQR } = require("jsqr");

const $ = (q) => document.querySelector(q);
const videoElem = $("#camera");
window.addEventListener("load", (doc, ev) => {

})


const wsUrl = `ws:${window.location.host}`
const ws = new WebSocket(wsUrl)

function handle(package) {
    switch (package.type) {
        case "stream":
            console.log("Receiving stream data");
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
        x: ${state.speed.x}
        y: ${state.speed.x}
        z: ${state.speed.x}
    Temperature:
        low: ${state.temperature.low}
        high: ${state.temperature.high}
    Height: ${state.heigh}
    TOF: ${state.tof}
    Barometer: ${state.barometer}
    Flight time: ${state.time}
    Acceleration:
        x: ${state.acceleration.x}
        y: ${state.acceleration.y}
        z: ${state.acceleration.z}
    `;

    stateinfodata.innerText = formattedData;
    


}


ws.addEventListener('message', (msg) => {
    let pkg;
    try {
        pkg = JSON.parse(msg.data);
    }
    catch(e) {
        ws.send(JSON.stringify({
            type: "error",
            data: "Invalid JSON received"
        }))
        return;
    }

    handle(pkg);
})

ws.addEventListener('open', () => {
    ws.send("Hello from the front!");
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

const jmuxer = new JMuxer({
    node: videoElem,
    mode: 'video', /* available values are: both, audio and video */
    fps: 25,
    noAudio: true,
    
});
//Create canvas for extracting video data

let canvas = document.createElement('canvas');


canvas.width = 420;
canvas.height = 315;

//Draw video data on canvas for extraction
let ctx = canvas.getContext('2d');

function extractImgData(){

    ctx.drawImage(videoElem,0,0,canvas.width,canvas.height);
    
    let imgData = ctx.getImageData(0,0,canvas.width,canvas.height);
    QRReader(imgData);

    
}

/**
 * 
 * @param {ImageData} imgData 
 * @param {any} options 
 */
function QRReader(imgData)
{
    const QRcode = jsQR(imgData.data, imgData.width, imgData.height, {inversionAttempts:"dontInvert"});
    if(QRcode)
        console.log(QRcode);
}


setInterval(extractImgData,1000);



/* Now feed media data using feed method. audio and video is buffer data and duration is in milliseconds */

/* 
{
    "pitch": -1, "roll": 1, "yaw": 4,
    "speed": {
        "x": 0,
        "y": 0,
        "z": 0
    },
    "temperature": {
        "low": 62,
        "high": 63
    },
    "tof": 10,
    "heigh": 0,
    "battery": 85,
    "barometer": 179.3,
    "time": 0,
    "acceleration": {
        "x": -16,
        "y": -38,
        "z": -999
    }
} */
