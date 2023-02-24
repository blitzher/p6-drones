window.addEventListener("load", (doc, ev) => {

})

const videoElem = document.querySelector("#camera");
videoElem.addEventListener('timeupdate', () => {
    
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
        case "mapdata":
            console.log("Map NYI");
            break;
        default:
            console.error(`Unknown package type: ${package.type}`);
    }
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

const jmuxer = new JMuxer({
    node: videoElem,
    mode: 'video', /* available values are: both, audio and video */
    debug: true,
    fps: 30,
    noAudio: true,
    
});

/* Now feed media data using feed method. audio and video is buffer data and duration is in milliseconds */
