import communication from "./communication.js";
import rendering from "./rendering.js";

window.addEventListener("load", (doc, ev) => {
    rendering.initialise();
    communication.initialise();

    setInterval(() => {
        const markers = rendering.findMarkers();
        let markerPos3D;

        if (markers.length > 0) {
            rendering.renderMarkers(markers);
            markers.forEach((element) => {
                markerPos3D = rendering.estimateMarkerPosition(element);
            });
            console.log(markerPos3D);
        }
    }, 1000);
});
