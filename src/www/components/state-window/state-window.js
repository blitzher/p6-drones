/*State-window.js*/
let stateinfodata;
function initialise() {
    stateinfodata = $("#stateinfo-data");
    const stateinfowindow = $("#stateinfo-window");
    const moveElem = $("#move-hover");
    let attached = false;
    if (cookie && cookie.hovering) {
        stateinfowindow.style.left = cookie.hovering.newX;
        stateinfowindow.style.top = cookie.hovering.newY;
    } else {
        stateinfowindow.style.top = "600";
        stateinfowindow.style.left = "150";
    }
    stateinfowindow.style.display = "block";

    moveElem.addEventListener("mousedown", (ev) => {
        attached = true;

        const position = stateinfowindow.getClientRects()[0];
        const relativeX = ev.clientX - position.x;
        const relativeY = ev.clientY - position.y;
        console.log({
            clientX: ev.clientX,
            clientY: ev.clientY,
            relativeX,
            relativeY,
        });

        let newX, newY;
        const mousemove = (ev) => {
            [newX, newY] = [ev.clientX - relativeX, ev.clientY - relativeY];
            stateinfowindow.style.left = newX;
            stateinfowindow.style.top = newY;
        };

        const mouseup = (ev) => {
            attached = false;
            document.removeEventListener("mousemove", mousemove);
            cookie.hovering = { newX, newY };
            writeCookie();
        };

        moveElem.addEventListener("mouseup", mouseup);
        document.addEventListener("mousemove", mousemove);
    });

    const hideShowInfoElem = $("#toggle-state-window");
    hideShowInfoElem.addEventListener("mousedown", (ev) => {
        if (stateinfodata.style.display != "block") {
            stateinfodata.style.display = "block";
            hideShowInfoElem.innerHTML = "&#8593;";
        } else {
            stateinfodata.style.display = "none";
            hideShowInfoElem.innerHTML = "&#8595;";
        }
    });
}

function updateState(state) {
    let x = 0; // Math.round((state.position.x + state.instructedPos.x) / 2);
    let y = 0; //Math.round((state.position.y + state.instructedPos.y) / 2);
    let z = 0; //Math.round((state.position.z + state.instructedPos.z) / 2);

    let formattedData = `
    Pitch/Roll/Yaw: ${state.pitch}/${state.roll}/${state.yaw}<br>
    Battery: ${state.battery}%<br>
    Speed:<br>
	Position:<br>
	&nbsp;x: ${x}<br>
	&nbsp;y: ${y}<br>
	&nbsp;z: ${z}<br>
    InstructedPosition:<br>
	&nbsp;x: ${state.x}<br>
	&nbsp;y: ${state.y}<br>
	&nbsp;z: ${state.z}<br>
    Temperature:<br>
	&nbsp;low: ${state.temperature.low}<br>
	&nbsp;high: ${state.temperature.high}<br>
    Height: ${state.heigh}<br>
    TOF: ${state.tof}<br>
    Barometer: ${state.barometer}<br>
    Flight time: ${state.time}<br>
    Acceleration:<br>
	&nbsp;x: ${state.acceleration.x}<br>
	&nbsp;y: ${state.acceleration.y}<br>
	&nbsp;z: ${state.acceleration.z}<br>`;

    stateinfodata.innerHTML = formattedData;
}

export default {
    initialise,
    updateState,
};
