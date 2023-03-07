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

                console.log(
                    `Absolute x:${
                        Math.round(markerPos3D.absolute.x) / 10
                    }cm y:${Math.round(markerPos3D.absolute.y) / 10}cm z:${
                        Math.round(markerPos3D.absolute.z) / 10
                    }cm`
                );

                console.log(
                    `Relative x:${
                        Math.round(markerPos3D.relative.x) / 10
                    }cm y:${Math.round(markerPos3D.relative.y) / 10}cm z:${
                        Math.round(markerPos3D.relative.z) / 10
                    }cm`
                );
            });
        }
    }, 1000);
});
