import communication from "../components/communication/communication.js";
import droneCam from "../components/drone-cam/drone-cam.js";
import map3d from "../components/3d-map/3d-map.js";
import bottomBar from "../components/bottom-bar/bottom-bar.js";

window.addEventListener("load", (doc, ev) => {
    communication.initialise();
    map3d.render3DCube();
    bottomBar.initialise();
    const camIds = droneCam.initialise();

    for (let id of camIds) {
        setInterval(() => {
            let markers = droneCam.findMarkers(id);

            let markerPos;

            if (markers != undefined && markers.length > 0) {
                markers = markers.filter(
                    (marker) => Math.abs(droneCam.estimateDistance(marker, id)) < 5000
                );
                droneCam.renderMarkers(markers, id);

                markers.forEach((marker) => {
                    markerPos = droneCam.estimateMarkerPosition(marker, id);

                    if (!markerPos.isValid) return;

                    communication.sendMarker(markerPos);

                    const [rx, ry, rz] = Object.values(markerPos.relative).map(
                        (v) => Math.round(v) / 10
                    );
                    const rd = Math.round(markerPos.dist) / 10;

                    console.log(
                        `Relative x:${rx}cm y:${ry}cm z:${rz}cm dist:${rd}cm id:${markerPos.id}`
                    );
                });
            }
        }, 250);
    }
});
