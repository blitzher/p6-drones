import { droneState } from "./communication.js";
import * as THREE from "three";

const mapCanvas3D = $("#map");
const fov = 75;
const aspect = 4 / 3;
const near = 0.1;
const far = 10;
const boxWidth = 1;
const boxHeight = 1;
const boxDepth = 1;
const color = 0xffffff;
const intensity = 1;
const scene = new THREE.Scene();
const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
const cubes = [
    make3DCubeInstance(geometry, 0x44aa88, 0),
    make3DCubeInstance(geometry, 0x8844aa, -2),
    make3DCubeInstance(geometry, 0xaa8844, 2),
];

function render3DCube() {
    let time = 0;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 4;

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas: mapCanvas3D,
    });

    const light = new THREE.PointLight(color, intensity);
    light.position.set(0, 0, 4);
    scene.add(light);
    const amb = new THREE.AmbientLight();
    amb.intensity = 0.5;
    scene.add(amb);

    function animateCubes() {
        time += 0.01; // convert time to seconds
        cubes.forEach((cube, ndx) => {
            const speed = 1 + ndx * 0.1;
            const rotation = speed * time;
            cube.rotation.x = rotation;
            cube.rotation.y = rotation;
        });
        renderer.render(scene, camera);
        requestAnimationFrame(animateCubes);
    }
    animateCubes();
}

function make3DCubeInstance(geometry, color, x) {
    const material = new THREE.MeshPhongMaterial({ color });

    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    cube.position.x = x;

    return cube;
}

export default {
    render3DCube,
};
