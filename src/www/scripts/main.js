import communication from "./communication.js";
import rendering from "./rendering.js";

window.addEventListener("load", (doc, ev) => {
    rendering.initialise();
    communication.initialise();

    setInterval(() => {
        const markers = rendering.findMarkers();

        if (markers.length > 0)
            console.log(markers);
    }, 1000)

});
