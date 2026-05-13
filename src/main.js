import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


// Cena
const scene = new THREE.Scene();
const axesHelper = new THREE.AxesHelper(3);
scene.add(axesHelper);

// Camara
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.z = 5;

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

const droneStatusElement = document.getElementById("drone-status");
const axesStatusElement = document.getElementById("axes-status");

function updateDroneStatus(){
    if(!droneStatusElement){
        return;
    }

    droneStatusElement.textContent = droneLigado ? "Estado: ligado" : "Estado: desligado";
}
function updateAxesStatus(){
    if(!axesStatusElement){
        return;
    }

    axesStatusElement.textContent = axesVisiveis ? "Eixos: ligados" : "Eixos: desligados";
}

// Cubo
const geometry = new THREE.BoxGeometry(1, 1, 1);

const material = new THREE.MeshBasicMaterial({
  color: 0x8e8b99,
  wireframe: false
});

const droneBodyMaterial = new THREE.MeshBasicMaterial({
    color: 0x8e8b99,
    wireframe: false,
    side: THREE.DoubleSide
})

const bodyTrimMaterial = new THREE.MeshBasicMaterial({
    color: 0x4b4b55,
    wireframe: false,
    side: THREE.DoubleSide
})

const screenMaterial = new THREE.MeshBasicMaterial({
    color: 0x0a3148,
    wireframe: false,
    side: THREE.DoubleSide
})

const cameraMaterial = new THREE.MeshBasicMaterial({
    color: 0x1b1b22,
    wireframe: false
})

const lensMaterial = new THREE.MeshBasicMaterial({
    color: 0x061622,
    wireframe: false
})

const armMaterial = new THREE.MeshBasicMaterial({
    color: 0x55515f,
    wireframe: false
})

const turbineMaterial = new THREE.MeshBasicMaterial({
    color: 0x333333,
    wireframe: false,
    side: THREE.DoubleSide
})

const propellerMaterial = new THREE.MeshBasicMaterial({
    color: 0xbfc3cc,
    wireframe: false
})

const hubMaterial = new THREE.MeshBasicMaterial({
    color: 0x777777,
    wireframe: false
})

//tamanhos do drone
const comprimento_drone_body = 1;
const largura_drone_body = 0.7;
const altura_drone_body = 0.4;
const comprimento_braco = 0.56;
const espessura_braco = 0.075;
const encaixe_braco = 0.08;
const raio_turbina = 0.25;
const espessura_turbina = 0.05;
const afastamento_turbina = 0.08;
const comprimento_helice = 0.38;
const largura_helice = 0.055;
const espessura_helice = 0.012;
const raio_cilindro_helice = 0.018;
const raio_cubo_helice = 0.055;
const altura_cubo_helice = 0.035;

const droneRig = new THREE.Group();
const drone = new THREE.Group();
const droneBody = new THREE.Group();
const propellers = [];
const clock = new THREE.Clock();
const droneMovement = new THREE.Vector3();
const droneVelocity = new THREE.Vector3();
const localVelocity = new THREE.Vector3();
const inverseDroneRigQuaternion = new THREE.Quaternion();
let verticalVelocity = 0;
let yawVelocity = 0;
let droneLigado = true;
let axesVisiveis = true;
let propellerCurrentSpeed = 0;

function createChamferedBoxGeometry(width, height, depth, chamfer){
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const halfDepth = depth / 2;
    const c = Math.min(chamfer, halfWidth * 0.45, halfDepth * 0.45);
    const points = [
        [-halfWidth + c, -halfDepth],
        [halfWidth - c, -halfDepth],
        [halfWidth, -halfDepth + c],
        [halfWidth, halfDepth - c],
        [halfWidth - c, halfDepth],
        [-halfWidth + c, halfDepth],
        [-halfWidth, halfDepth - c],
        [-halfWidth, -halfDepth + c]
    ];

    const vertices = [];
    points.forEach(([x, z]) => vertices.push(x, -halfHeight, z));
    points.forEach(([x, z]) => vertices.push(x, halfHeight, z));

    const indices = [];
    for(let i = 0; i < points.length; i++){
        const next = (i + 1) % points.length;
        indices.push(i, next, i + points.length);
        indices.push(next, next + points.length, i + points.length);
    }

    for(let i = 1; i < points.length - 1; i++){
        indices.push(0, i, i + 1);
        indices.push(points.length, points.length + i + 1, points.length + i);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
}

const droneBodyMesh = new THREE.Mesh(
    createChamferedBoxGeometry(largura_drone_body, altura_drone_body, comprimento_drone_body, 0.12),
    droneBodyMaterial
)

const bodyTrimMesh = new THREE.Mesh(
    createChamferedBoxGeometry(largura_drone_body * 0.88, 0.025, comprimento_drone_body * 0.76, 0.08),
    bodyTrimMaterial
)
bodyTrimMesh.position.y = altura_drone_body / 2 + 0.012;

const screenMesh = new THREE.Mesh(
    createChamferedBoxGeometry(largura_drone_body * 0.58, 0.012, comprimento_drone_body * 0.46, 0.045),
    screenMaterial
)
screenMesh.position.y = altura_drone_body / 2 + 0.032;

const frontCameraHousing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 0.04, 32),
    cameraMaterial
)
frontCameraHousing.rotation.x = Math.PI / 2;
frontCameraHousing.position.set(0, 0, comprimento_drone_body / 2 + 0.015);

const frontCameraLens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.018, 32),
    lensMaterial
)
frontCameraLens.rotation.x = Math.PI / 2;
frontCameraLens.position.set(0, 0, comprimento_drone_body / 2 + 0.044);

//criar turbina
function createTurbine(radius, tubeRadius){
    const turbine = new THREE.Group();

    const turbineRing = new THREE.Mesh(
        createSuperTorusGeometry(radius, tubeRadius, 0.35, 1.0, 48, 12),
        turbineMaterial
    );

    turbineRing.rotation.x = Math.PI / 2;

    const propeller = createPropeller();

    turbine.add(turbineRing);
    turbine.add(propeller);
    return turbine;
}

function createPropeller(){
    const propeller = new THREE.Group();
    const bladeLength = (comprimento_helice - raio_cubo_helice * 1.6) / 2;
    const bladeOffset = raio_cubo_helice + bladeLength / 2;

    for(let i = 0; i < 4; i++){
        const bladePivot = new THREE.Group();
        bladePivot.rotation.y = i * Math.PI / 2;

        const blade = new THREE.Mesh(
            new THREE.CylinderGeometry(raio_cilindro_helice, raio_cilindro_helice, bladeLength, 16),
            propellerMaterial
        );
        blade.rotation.z = Math.PI / 2;
        blade.position.x = bladeOffset;

        bladePivot.add(blade);
        propeller.add(bladePivot);
    }

    const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(raio_cubo_helice, raio_cubo_helice, altura_cubo_helice, 32),
        hubMaterial
    );

    propeller.add(hub);
    propellers.push(propeller);

    return propeller;
}

function signedPower(value, exponent){
    return Math.sign(value) * Math.pow(Math.abs(value), exponent);
}

function createSuperTorusGeometry(majorRadius, minorRadius, ringExponent, tubeExponent, ringSegments, tubeSegments){
    const vertices = [];
    const indices = [];

    for(let i = 0; i <= ringSegments; i++){
        const u = (i / ringSegments) * Math.PI * 2;
        const cu = signedPower(Math.cos(u), ringExponent);
        const su = signedPower(Math.sin(u), ringExponent);

        for(let j = 0; j <= tubeSegments; j++){
            const v = (j / tubeSegments) * Math.PI * 2;
            const cv = signedPower(Math.cos(v), tubeExponent);
            const sv = signedPower(Math.sin(v), tubeExponent);

            const ringRadius = majorRadius + minorRadius * cv;
            const x = ringRadius * cu;
            const y = ringRadius * su;
            const z = minorRadius * sv;

            vertices.push(x, y, z);
        }
    }

    for(let i = 0; i < ringSegments; i++){
        for(let j = 0; j < tubeSegments; j++){
            const a = i * (tubeSegments + 1) + j;
            const b = (i + 1) * (tubeSegments + 1) + j;
            const c = (i + 1) * (tubeSegments + 1) + j + 1;
            const d = i * (tubeSegments + 1) + j + 1;

            indices.push(a, b, d);
            indices.push(b, c, d);
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
}

//create arm
function createArm(length, thickness, angle){
    const arm = new THREE.Group();

    arm.rotation.y = angle;

    const branch = new THREE.Mesh(
        new THREE.BoxGeometry(1,1,1),
        armMaterial
    );
    branch.position.set(length / 2, 0, 0);
    branch.scale.set(length, thickness, thickness);

    arm.add(branch);
    return arm;
}

function addTurbineToArm(arm){
    const turbineJoint = new THREE.Group();
    turbineJoint.position.x = comprimento_braco + raio_turbina - espessura_turbina + afastamento_turbina;

    const turbine = createTurbine(raio_turbina, espessura_turbina);
    turbine.rotation.y = Math.PI / 4;

    turbineJoint.add(turbine);
    arm.add(turbineJoint);
    return turbineJoint;
}

droneBody.add(droneBodyMesh);
droneBody.add(bodyTrimMesh);
droneBody.add(screenMesh);
droneBody.add(frontCameraHousing);
droneBody.add(frontCameraLens);









//arms
const frontRightArm = createArm(comprimento_braco, espessura_braco, -Math.PI / 4);
frontRightArm.position.set(largura_drone_body / 2 - encaixe_braco, 0, comprimento_drone_body / 2 - encaixe_braco);

const frontLeftArm = createArm(comprimento_braco, espessura_braco, -3 * Math.PI / 4);
frontLeftArm.position.set(-largura_drone_body / 2 + encaixe_braco, 0, comprimento_drone_body / 2 - encaixe_braco);

const backLeftArm = createArm(comprimento_braco, espessura_braco, 3 * Math.PI / 4);
backLeftArm.position.set(-largura_drone_body / 2 + encaixe_braco, 0, -comprimento_drone_body / 2 + encaixe_braco);

const backRightArm = createArm(comprimento_braco, espessura_braco, Math.PI / 4);
backRightArm.position.set(largura_drone_body / 2 - encaixe_braco, 0, -comprimento_drone_body / 2 + encaixe_braco);
//end arms


//turbines
addTurbineToArm(frontRightArm);
addTurbineToArm(frontLeftArm);
addTurbineToArm(backLeftArm);
addTurbineToArm(backRightArm);

drone.add(droneBody);
drone.add(frontRightArm);
drone.add(frontLeftArm);
drone.add(backLeftArm);
drone.add(backRightArm);
droneRig.add(drone);
scene.add(droneRig);

// --- TAREFA 3: BALÕES (Código Mínimo) ---
const balloonHelpers = [];
const balloonMat = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: false });

for (let i = 0; i < 4; i++) { // Pelo menos 4 balões
    const balloon = new THREE.Group();

    // 1. Corpo (Esfera low-poly)
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), balloonMat);
    
    // 2. Nó (Cone)
    const knot = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.1, 8), balloonMat);
    knot.position.y = -0.34; // Encostado à base da esfera
    
    // 3. Fio (Cilindro fininho)
    const string = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 1.2, 4), balloonMat);
    string.position.y = -0.99; // Abaixo do nó

    // Adicionar AxesHelper a cada peça
    const hBody = new THREE.AxesHelper(0.4); body.add(hBody);
    const hKnot = new THREE.AxesHelper(0.2); knot.add(hKnot);
    const hString = new THREE.AxesHelper(0.2); string.add(hString);
    balloonHelpers.push(hBody, hKnot, hString);

    // Juntar tudo no grupo do balão
    balloon.add(body, knot, string);

    // Posição aleatória (Y > 3 garante que fica acima do DroneWatch)
    balloon.position.set(
        (Math.random() - 0.5) * 8, // X aleatório
        3 + Math.random() * 3,     // Y aleatório alto
        (Math.random() - 0.5) * 8  // Z aleatório
    );
    scene.add(balloon);
}
// ----------------------------------------


//handle de controlos do drone 
const keys = {
    forward:false,
    backward:false,
    left:false,
    right:false,
    yawLeft:false,
    yawRight:false,
    up:false,
    down:false,
    showAxes: true
};

function setDroneKey(event, isPressed){
    let handled = true;

    switch(event.code){
        case "KeyW":
            keys.forward = isPressed;
            break;
        case "KeyS":
            keys.backward = isPressed;
            break;
        case "KeyA":
            keys.left = isPressed;
            break;
        case "KeyD":
            keys.right = isPressed;
            break;
        case "KeyQ":
            keys.yawLeft = isPressed;
            break;
        case "KeyE":
            keys.yawRight = isPressed;
            break;
        case "Space":
            keys.up = isPressed;
            break;
        case "ShiftLeft":
        case "ShiftRight":
            keys.down = isPressed;
            break;
        case "KeyR":
            if(isPressed){
                droneLigado = true;
                updateDroneStatus();
            }
            break;
        case "KeyF":
            if(isPressed){
                droneLigado = false;
                updateDroneStatus();
            }
            break;
        case "KeyH":
            if(isPressed){
                axesVisiveis = !axesVisiveis;
                
                // Aplicar a visibilidade ao helper principal
                axesHelper.visible = axesVisiveis;
                
                // Aplicar a visibilidade aos helpers dos balões (da Tarefa 3)
                balloonHelpers.forEach(h => h.visible = axesVisiveis);
                
                updateAxesStatus();
            }
            break;
        default:
            handled = false;
    }

    if(handled){
        event.preventDefault();
    }
}

window.addEventListener("keydown",(event)=>{
    setDroneKey(event, true);
});

window.addEventListener("keyup",(event)=>{
    setDroneKey(event, false);
});



// Loop de render
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const elapsedTime = clock.elapsedTime;
  const yawAcceleration = 5.2;
  const maxYawSpeed = 2.0;
  const yawDamping = 4.0;
  const movementAcceleration = 3.2;
  const maxHorizontalSpeed = 1.25;
  const horizontalDamping = 1.9;
  const altitudeAcceleration = 2.4;
  const maxVerticalSpeed = 0.95;
  const verticalDamping = 2.4;
  const maxPitch = 0.26;
  const maxRoll = 0.28;
  const yawRollAmount = 0.14;
  const tiltResponse = 5.5;
  const targetPropellerSpeed = droneLigado ? 22 : 0;
  propellerCurrentSpeed += (targetPropellerSpeed - propellerCurrentSpeed) * Math.min(delta * 5, 1);

  if (droneLigado) {
    const yawInput = Number(keys.yawLeft) - Number(keys.yawRight);
    yawVelocity += yawInput * yawAcceleration * delta;
    yawVelocity = THREE.MathUtils.clamp(yawVelocity, -maxYawSpeed, maxYawSpeed);

    droneMovement.set(
      Number(keys.right) - Number(keys.left),
      0,
      Number(keys.forward) - Number(keys.backward)
    );

    if (droneMovement.lengthSq() > 0) {
      droneMovement.normalize();
      droneMovement.applyQuaternion(droneRig.quaternion);
      droneVelocity.addScaledVector(droneMovement, movementAcceleration * delta);
    }

    const verticalInput = Number(keys.up) - Number(keys.down);
    verticalVelocity += verticalInput * altitudeAcceleration * delta;
  }

  yawVelocity *= Math.exp(-yawDamping * delta);
  droneRig.rotation.y += yawVelocity * delta;

  droneVelocity.multiplyScalar(Math.exp(-horizontalDamping * delta));
  if (droneVelocity.length() > maxHorizontalSpeed) {
    droneVelocity.setLength(maxHorizontalSpeed);
  }
  droneRig.position.addScaledVector(droneVelocity, delta);

  verticalVelocity *= Math.exp(-verticalDamping * delta);
  verticalVelocity = THREE.MathUtils.clamp(verticalVelocity, -maxVerticalSpeed, maxVerticalSpeed);
  droneRig.position.y += verticalVelocity * delta;
  if (droneRig.position.y < 0) {
    droneRig.position.y = 0;
    verticalVelocity = Math.max(verticalVelocity, 0);
  }

  inverseDroneRigQuaternion.copy(droneRig.quaternion).invert();
  localVelocity.copy(droneVelocity).applyQuaternion(inverseDroneRigQuaternion);

  const speedPitch = THREE.MathUtils.clamp(localVelocity.z / maxHorizontalSpeed, -1, 1);
  const speedRoll = THREE.MathUtils.clamp(localVelocity.x / maxHorizontalSpeed, -1, 1);
  const yawRoll = THREE.MathUtils.clamp(yawVelocity / maxYawSpeed, -1, 1);
  const targetPitch = speedPitch * maxPitch;
  const targetRoll = -speedRoll * maxRoll + yawRoll * yawRollAmount;
  const tiltAlpha = Math.min(tiltResponse * delta, 1);

  drone.rotation.x = THREE.MathUtils.lerp(drone.rotation.x, targetPitch, tiltAlpha);
  drone.rotation.z = THREE.MathUtils.lerp(drone.rotation.z, targetRoll, tiltAlpha);
  drone.position.y = droneLigado
    ? Math.sin(elapsedTime * 6.5) * 0.012 + Math.sin(elapsedTime * 13) * 0.004
    : THREE.MathUtils.lerp(drone.position.y, 0, tiltAlpha);

  propellers.forEach((propeller, index) => {
    const direction = index % 2 === 0 ? 1 : -1;
    propeller.rotation.y += propellerCurrentSpeed * delta * direction;
  });

  controls.update();
  renderer.render(scene, camera);
}

updateDroneStatus();
updateAxesStatus();
animate();
