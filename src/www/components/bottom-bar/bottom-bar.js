/* Add event listener to camera toggle, that changes camera behaviour */
import map3d from "../3d-map/3d-map.js";
import communication from "../communication/communication.js";
function initBB() {
    const switchElem = $("#switch");

    /* Add event listener to toggle camera switch */
    switchElem.addEventListener("click", () => {
        const newCameraMode = switchElem.checked ? map3d.CAMERA_MODE.DRONE : map3d.CAMERA_MODE.ORBIT;

        map3d.setCameraMode(newCameraMode);
    });

    /* Add event listener to command input field */
    $("form").addEventListener("submit", (ev) => {
        ev.preventDefault();
        const ifield = $("#input-command");
        const cmd = ifield.value;
        ifield.value = "";
        communication.command(cmd);
        return false;
    });

    /* Add event listener to emergency stop button */
    $("#button").addEventListener("click", (ev) => {
        const emergencyStop = "stop";
        communication.command(emergencyStop);
        return false;
    });
}

export default {
    initialise: initBB,
};
