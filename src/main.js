import * as THREE from 'three';
import { createBalloon } from './baloon.js';
import { createDrone } from './drone.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Cena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2b2b2b);

const axesHelper = new THREE.AxesHelper(3);
scene.add(axesHelper);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Drone
const drone = createDrone({
    statusElement: document.getElementById("drone-status")
});
scene.add(drone.rig);
drone.bindInput();

//Ballons
const balloonHelpers = [];
const balloons = []; 
for (let i = 0; i < 5; i++) {
    const balloonData = createBalloon();
    balloonHelpers.push(...balloonData.helpers);
    balloonData.group.position.set(
        (Math.random() - 0.5) * 4, 
        2.5 + Math.random() * 2, 
        (Math.random() - 0.5) * 4
    );
    scene.add(balloonData.group);
    balloons.push(balloonData.group); 
}

// Camaras
const near = 0.1;
const far = 150;
const sceneBounds = new THREE.Box3();
const sceneCenter = new THREE.Vector3();
const sceneSize = new THREE.Vector3();
const cameraHelpers = [];
const cameraForward = new THREE.Vector3(0, 0, -1);
const mobileCameraDirection = new THREE.Vector3(0, -0.12, 1).normalize();

let activeCamera = null;
let helpersVisible = true;
let wireframeVisible = false;

sceneBounds.expandByObject(drone.rig);
balloons.forEach(balloon => {
    sceneBounds.expandByObject(balloon);
});
sceneBounds.getCenter(sceneCenter);
sceneBounds.getSize(sceneSize);

const maxSceneDimension = Math.max(sceneSize.x, sceneSize.y, sceneSize.z, 2.5);
const fixedCameraDistance = Math.max(maxSceneDimension * 1.05, 2.6);
const diagonalCameraPosition = sceneCenter.clone().add(
    new THREE.Vector3(fixedCameraDistance, fixedCameraDistance * 0.75, fixedCameraDistance)
);

function getAspect(){
    return window.innerWidth / window.innerHeight;
}

function getOrthographicViewSize(){
    return (maxSceneDimension * 1.35) / Math.min(getAspect(), 1);
}

function updateCameraProjection(camera){
    if(camera.isOrthographicCamera){
        const aspect = getAspect();
        const viewSize = getOrthographicViewSize();

        camera.left = -viewSize * aspect / 2;
        camera.right = viewSize * aspect / 2;
        camera.top = viewSize / 2;
        camera.bottom = -viewSize / 2;
    } else if(camera.isPerspectiveCamera){
        camera.aspect = getAspect();
    }

    camera.updateProjectionMatrix();
}

function createOrthographicCamera(name, position, up = new THREE.Vector3(0, 1, 0)){
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, near, far);
    camera.name = name;
    camera.position.copy(position);
    camera.up.copy(up);
    camera.lookAt(sceneCenter);
    updateCameraProjection(camera);
    scene.add(camera);
    return camera;
}

function createPerspectiveCamera(name, position, fov = 60){
    const camera = new THREE.PerspectiveCamera(fov, getAspect(), near, far);
    camera.name = name;
    camera.position.copy(position);
    camera.lookAt(sceneCenter);
    scene.add(camera);
    return camera;
}

const cameras = {
    top: createOrthographicCamera(
        "Camara topo",
        sceneCenter.clone().add(new THREE.Vector3(0, fixedCameraDistance, 0)),
        new THREE.Vector3(0, 0, -1)
    ),
    side: createOrthographicCamera(
        "Camara lateral",
        sceneCenter.clone().add(new THREE.Vector3(fixedCameraDistance, 0, 0))
    ),
    front: createOrthographicCamera(
        "Camara frontal",
        sceneCenter.clone().add(new THREE.Vector3(0, 0, fixedCameraDistance))
    ),
    fixedOrthographic: createOrthographicCamera(
        "Camara fixa ortografica",
        diagonalCameraPosition
    ),
    fixedPerspective: createPerspectiveCamera(
        "Camara fixa perspectiva",
        diagonalCameraPosition,
        50
    ),
    mobilePerspective: new THREE.PerspectiveCamera(65, getAspect(), 0.05, far)
};

cameras.mobilePerspective.name = "Camara movel perspectiva";
drone.rig.add(cameras.mobilePerspective);
cameras.mobilePerspective.position.set(fixedCameraDistance, fixedCameraDistance * 0.75, fixedCameraDistance);
cameras.mobilePerspective.lookAt(drone.rig.position);

Object.values(cameras).forEach((camera) => {
    updateCameraProjection(camera);

    const helper = new THREE.CameraHelper(camera);
    helper.visible = helpersVisible;
    scene.add(helper);
    cameraHelpers.push(helper);
});

activeCamera = cameras.top;

const cameraShortcuts = new Map([
    ["Digit1", cameras.top],
    ["Numpad1", cameras.top],
    ["Digit2", cameras.side],
    ["Numpad2", cameras.side],
    ["Digit3", cameras.front],
    ["Numpad3", cameras.front],
    ["Digit4", cameras.fixedOrthographic],
    ["Numpad4", cameras.fixedOrthographic],
    ["Digit5", cameras.fixedPerspective],
    ["Numpad5", cameras.fixedPerspective],
    ["Digit6", cameras.mobilePerspective],
    ["Numpad6", cameras.mobilePerspective]
]);

    const applyWireframe = (object3D) => {
        if (!object3D) return;
        object3D.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.wireframe = window.isWireframe;
            }
        });
    };

window.addEventListener("keydown", (event) => {
    const selectedCamera = cameraShortcuts.get(event.code);

    if(selectedCamera){
        activeCamera = selectedCamera;
        controls.enabled = (activeCamera === cameras.fixedPerspective);
        event.preventDefault();
        return;
    }

    if(event.code === "KeyH" && !event.repeat){
        helpersVisible = !helpersVisible;
        axesHelper.visible = helpersVisible;
        cameraHelpers.forEach((helper) => {
            helper.visible = helpersVisible;
        });
        if(drone.setDebugHelpersVisible) {
            drone.setDebugHelpersVisible(helpersVisible);
        }
        if (typeof balloonHelpers !== 'undefined') {
            balloonHelpers.forEach((helper) => {
                helper.visible = helpersVisible;
            });
        }
        const axesStatusElement = document.getElementById("axes-status");
        if(axesStatusElement) {
            axesStatusElement.textContent = helpersVisible ? "Eixos: ligados" : "Eixos: desligados";
        }
        event.preventDefault();
        return;
    }
    if (event.code === "Digit7" || event.code === "Numpad7") {
        if (typeof window.isWireframe === 'undefined') {
            window.isWireframe = false;
        }
        window.isWireframe = !window.isWireframe;

        // 1. Aplicar ao Drone (todas as suas peças)
        applyWireframe(drone.rig);
        // 2. Aplicar à Base/Pulseira
        if (typeof strapData !== 'undefined') {
            applyWireframe(strapData.group);
        }
        // 3. Aplicar a todos os Balões
        if (typeof balloons !== 'undefined') {
            balloons.forEach(balloon => applyWireframe(balloon));
        }
        event.preventDefault();
        return;
    }
});

window.addEventListener("resize", () => {
    Object.values(cameras).forEach(updateCameraProjection);
    cameraHelpers.forEach((helper) => helper.update());
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Loop de render
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    drone.update(delta, clock.elapsedTime);
    cameraHelpers.forEach((helper) => helper.update());

    renderer.render(scene, activeCamera);
}

animate();
