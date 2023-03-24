import communication from "../components/communication/communication.js";
import droneCam from "../components/drone-cam/drone-cam.js";
import environment3d from "../components/3d-map/3d-map.js";
import { initHoveringElement } from "../components/state-window/state-window.js";

window.addEventListener("load", (doc, ev) => {
    droneCam.initialise();
    communication.initialise();
    environment3d.render3DCube();
    initHoveringElement();

    setInterval(() => {
        const markers = droneCam.findMarkers();
        let markerPos3D;

        if (markers.length > 0) {
            droneCam.renderMarkers(markers);
            markers.forEach((element) => {
                markerPos3D = droneCam.estimateMarkerPosition(element);

                console.log(
                    `Absolute x:${Math.round(markerPos3D.absolute.x) / 10}cm y:${
                        Math.round(markerPos3D.absolute.y) / 10
                    }cm z:${Math.round(markerPos3D.absolute.z) / 10}cm`
                );

                console.log(
                    `Relative x:${Math.round(markerPos3D.relative.x) / 10}cm y:${
                        Math.round(markerPos3D.relative.y) / 10
                    }cm z:${Math.round(markerPos3D.relative.z) / 10}cm`
                );
            });
        }
    }, 1000);
});
