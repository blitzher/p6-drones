import { droneState } from "./communication.js";
import * as THREE from "three";

const mapCanvas3D = $("#map");
const fov = 75;
const aspect = 4 / 3;
const near = 0.1;
const far = 5;
const boxWidth = 1;
const boxHeight = 1;
const boxDepth = 1;

function cube3D() {
    const renderer = new THREE.WebGLRenderer({ antialias: true, mapCanvas3D });
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 2;
    const scene = new THREE.Scene();
    const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
    const material = new THREE.MeshPhongMaterial({ color: 0x44aa88 });
    const cube = new THREE.Mesh(geometry, material);

    scene.add(cube);

    renderer.render(scene);
}

export default {
    cube3D,
};
