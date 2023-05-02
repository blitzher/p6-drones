/*3d-map.js*/
import * as THREE from "../../libs/three.min.js";
import { GLTFLoader } from "../../libs/glfloader.js";
import { OrbitControls } from "../../libs/orbitcontrols.js";
import { droneState } from "../communication/communication.js";

/* Initalise GLTF loader */
const loader = new GLTFLoader();

const CAMERA_MODE = {
    ORBIT: 0,
    DRONE: 1,
};

const mapCanvas3D = $("#map");
const fov = 75;
const aspect = 4 / 3;
const near = 0.1;
const far = 1000;

const scene = new THREE.Scene();
const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
const droneMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
const cubes = [];
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas: mapCanvas3D,
});
const controls = new OrbitControls(camera, renderer.domElement);
controls.maxPolarAngle = Math.PI / 2 - 0.1;

let droneObject130, droneObject141, droneObject174, droneObject191;
let cameraMode = CAMERA_MODE.ORBIT;
let loadCachedFlag = false;

/* Add drone model to scene */
loader.load("../../resources/drone.glb", (gltf) => {
    /** @type {THREE.Object3D} */
    const obj = gltf.scene;
    obj.scale.set(10, 10, 10);
    obj.castShadow = true;
    /** @type {THREE.Mesh} */
    const mesh = obj.children[0];
    mesh.material = droneMaterial;
    obj.translateY(2);

    droneObject130 = obj;
    scene.add(droneObject130);

});
loader.load("../../resources/drone.glb", (gltf) => {
    /** @type {THREE.Object3D} */
    const obj = gltf.scene;
    obj.scale.set(10, 10, 10);
    obj.castShadow = true;
    /** @type {THREE.Mesh} */
    const mesh = obj.children[0];
    mesh.material = droneMaterial;
    obj.translateY(2);

    droneObject141 = obj;
    scene.add(droneObject141);

});
loader.load("../../resources/drone.glb", (gltf) => {
    /** @type {THREE.Object3D} */
    const obj = gltf.scene;
    obj.scale.set(10, 10, 10);
    obj.castShadow = true;
    /** @type {THREE.Mesh} */
    const mesh = obj.children[0];
    mesh.material = droneMaterial;
    obj.translateY(2);

    droneObject174 = obj;
    scene.add(droneObject174);

});
loader.load("../../resources/drone.glb", (gltf) => {
    /** @type {THREE.Object3D} */
    const obj = gltf.scene;
    obj.scale.set(10, 10, 10);
    obj.castShadow = true;
    /** @type {THREE.Mesh} */
    const mesh = obj.children[0];
    mesh.material = droneMaterial;
    obj.translateY(2);
    droneObject191 = obj;

    scene.add(droneObject191);
});

function render3DCube() {
    let time = 0;
    const cameraOffset = new THREE.Vector3(0, 100, 70);
    camera.position.x = cameraOffset.x;
    camera.position.y = cameraOffset.y;
    camera.position.z = cameraOffset.z;

    renderer.setPixelRatio(window.devicePixelRatio * 3);

    const amb = new THREE.AmbientLight();
    amb.intensity = 1;
    scene.add(amb);
    scene.add(new THREE.GridHelper(100, 100));

    const planeMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    //scene.add(plane);
    plane.lookAt(0, 1, 0);
    plane.translateZ(-5);

    function mainLoop() {
        time += 0.01; // convert time to seconds
        cubes.forEach((cube, ndx) => {
            const speed = 1 + ndx * 0.1;
            const rotation = speed * time;
            cube.rotation.x = rotation;
            cube.rotation.y = rotation;
        });

        /* Update camera and controls */
        cameraControls(controls);
        controls.update();

        renderer.render(scene, camera);
        requestAnimationFrame(mainLoop);
    }
    mainLoop();
}

/**
 * @param {OrbitControls} controls
 */
function cameraControls() {
    if (cameraMode == CAMERA_MODE.DRONE) {
        if (droneObject) {
            let { x, y, z } = droneObject.position;
            camera.position.set(x, y, z);
        }
    } else if (cameraMode == CAMERA_MODE.ORBIT) {
        if (loadCachedFlag) {
            camera.position.set(...Object.values(cachedCameraState.position));
            camera.rotation.set(cachedCameraState.rotation);
            loadCachedFlag = false;
        }

        /* Let orbit controls handle it :) */
    }
}

function setCameraMode(newMode) {
    cameraMode = newMode;
    controls.enabled = cameraMode == CAMERA_MODE.ORBIT;
    /* When entering orbit mode, load from cache */
    if (newMode == CAMERA_MODE.ORBIT) {
        loadCachedFlag = true;
    } else {
        Object.assign(cachedCameraState.position, camera.position);
        Object.assign(cachedCameraState.rotation, camera.rotation);
    }
}

function make3DCubeInstance(size, pos, color) {
    const geometry = new THREE.BoxGeometry(...Object.values(size));
    const material = new THREE.MeshPhongMaterial({ color });

    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    pos = { x: pos.x, y: pos.z, z: -pos.y };
    cube.position.set(...Object.values(pos));
    return cube;
}

/** @type {THREE.Line} */
let line130, line141, line174, line191;
function drawPathLine(points, droneID) {
    const material = new THREE.LineBasicMaterial({ color: 0xffffff });

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    if (droneID == "130") {

        line130 = new THREE.Line(geometry, material);
        scene.add(line130);
    }
    if (droneID == "141") {
        line141 = new THREE.Line(geometry, material);
        scene.add(line141);
    }
    if (droneID == "174") {
        line174 = new THREE.Line(geometry, material);
        scene.add(line174);
    }
    if (droneID == "191") {
        line191 = new THREE.Line(geometry, material);
        scene.add(line191);
    }
}

function clearPathLine(droneID) {
    // if (line) line.remove();
    if (droneID == "130") {
        line130.remove();
    }
    if (droneID == "141") {
        line141.remove();
    }
    if (droneID == "174") {
        line174.remove();
    }
    if (droneID == "191") {
        line191.remove();
    }
}

function clearCubes() {
    for (let cube of cubes) {
        cube.pop();
    }
}

function updateDronePosition(x, y, z, droneID) {
    if (droneID == "130") {
        droneObject130.position.set(x, z, -y);
    }
    if (droneID == "141") {
        droneObject141.position.set(x, z, -y);

    }
    if (droneID == "174") {
        droneObject174.position.set(x, z, -y);

    }
    if (droneID == "191") {
        droneObject191.position.set(x, z, -y);
    }
}

export default {
    render3DCube,
    clearPathLine,
    clearCubes,
    make3DCubeInstance,
    updateDronePosition,
    drawPathLine,
    CAMERA_MODE,
    setCameraMode,
};
