/*State-window.js*/
const stateinfodata = $("#stateinfo-data");

export function initHoveringElement() {
    let attached = false;
    const moveElem = $(".move-hover");
    const stateinfowindow = $("#stateinfo-window");
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
        console.log({ clientX: ev.clientX, clientY: ev.clientY, relativeX, relativeY });

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

    const hideShowInfoElem = $("#hide-show-info");
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
