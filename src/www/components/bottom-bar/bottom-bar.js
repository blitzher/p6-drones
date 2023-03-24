/* Add event listener to camera toggle, that changes camera behaviour */
export function initBB() {
    let cachedCameraState = { position: {}, rotation: {} };
    const switchElem = $("#switch");

    /* Add event listener to toggle camera switch */
    switchElem.addEventListener("click", () => {
        const newCameraMode = switchElem.checked ? CAMERA_MODE_DRONE : CAMERA_MODE_ORBIT;
        /* When entering orbit mode, load from cache */
        if (newCameraMode == CAMERA_MODE_ORBIT) {
            loadCachedFlag = true;
        } else {
            Object.assign(cachedCameraState.position, camera.position);
            Object.assign(cachedCameraState.rotation, camera.rotation);
        }

        cameraMode = newCameraMode;
        controls.enabled = !switchElem.checked;
    });

    /* Add event listener to command input field */
    $("form").addEventListener("submit", (ev) => {
        ev.preventDefault();
        const ifield = $("#input-command");
        const cmd = ifield.value;
        ifield.value = "";
        command(ws, cmd);
        return false;
    });

    /* Add event listener to emergency stop button */
    $("#button").addEventListener("click", (ev) => {
        const emergencyStop = "stop";
        command(ws, emergencyStop);
        return false;
    });
}
