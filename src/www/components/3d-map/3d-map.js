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
const cubes = [];
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas: mapCanvas3D,
});
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.maxPolarAngle = Math.PI / 2 - 0.1;

let cameraMode = CAMERA_MODE.ORBIT;
let loadCachedFlag = false;

const droneObjects = {};
const droneColours = {
    130: new THREE.Color(0xff, 0, 0) /* red */,
    141: new THREE.Color(0, 0xff, 0) /* green */,
    174: new THREE.Color(0xff, 0xff, 0) /* orange */,
    191: new THREE.Color(0xaa, 0, 0xff) /* purple */,
};
const droneLines = {};

/* Add drone model to scene */
// loader.load("../../resources/drone.glb", (gltf) => {
//     /** @type {THREE.Object3D} */
//     const obj = gltf.scene;
//     obj.scale.set(20, 20, 20);
//     obj.castShadow = true;
//     /** @type {THREE.Mesh} */
//     const mesh = obj.children[0];
//     mesh.material = droneMaterial;

//     droneObject130 = obj;
//     scene.add(droneObject130);
// });

let droneModelGeometry;
loader.load("../../resources/drone.glb", (gltf) => {
    console.info("Loaded drone model data...");
    droneModelGeometry = gltf.scene.children[0].geometry;
});

function addDroneOrUpdatePosition(droneId, droneYaw, position) {
    /* If model data is not yet loaded, don't do anything */
    if (droneModelGeometry == undefined) return;
    if (droneObjects[droneId] == undefined) {
        /** @type {THREE.Object3D} */
        const obj = new THREE.Mesh(
            droneModelGeometry,
            new THREE.MeshPhongMaterial({ color: droneColours[droneId] })
        );

        new THREE.MeshPhongMaterial();

        obj.position.set(position.x, position.z, -position.y);

        obj.setRotationFromEuler(new THREE.Euler(0, -droneYaw, 0));

        droneObjects[droneId] = obj;
        scene.add(obj);
    } else {
        droneObjects[droneId].position.set(position.x, position.z, -position.y);
        droneObjects[droneId].setRotationFromEuler(new THREE.Euler(0, -droneYaw, 0));
    }
}

function initialise() {
    let time = 0;
    const cameraOffset = new THREE.Vector3(0, 100, 70);
    camera.position.x = cameraOffset.x;
    camera.position.y = cameraOffset.y;
    camera.position.z = cameraOffset.z;
    renderer.setPixelRatio(window.devicePixelRatio * 3);

    // const mapWidth = dimensions.mapWidth;
    // const mapLength = dimensions.mapHeight;
    const mapWidth = 200;
    const mapLength = 200;
    const mapHeight = 200;
    const amb = new THREE.AmbientLight();
    amb.intensity = 1;
    scene.add(amb);
    scene.add(new THREE.GridHelper(1000, 100));

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
        cameraControls(orbitControls);
        orbitControls.update();

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
    orbitControls.enabled = cameraMode == CAMERA_MODE.ORBIT;
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

    pos = { x: pos.x, y: pos.z, z: pos.y };
    cube.position.set(...Object.values(pos));
    return cube;
}

function drawPathLine(points, droneId) {
    const material = new THREE.LineBasicMaterial({ color: 0xffffff });

    const mappedPoints = points.map((o) => {
        return { x: -o.x, y: o.z, z: o.y };
    });
    const geometry = new THREE.BufferGeometry().setFromPoints(mappedPoints);
    droneLines[droneId] = new THREE.Line(geometry, material);
    scene.add(droneLines[droneId]);
}

function clearPathLine(droneId) {
    // if (line) line.remove();
    const line = droneLines[droneId];
    if (line) line.remove();
}

function clearCubes() {
    for (let cube of cubes) {
        cube.pop();
    }
}

export default {
    initialise,
    clearPathLine,
    clearCubes,
    make3DCubeInstance,
    addDroneOrUpdatePosition,
    drawPathLine,
    CAMERA_MODE,
    setCameraMode,
};
