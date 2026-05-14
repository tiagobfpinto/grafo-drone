import * as THREE from 'three';

// Materiais
const droneBodyMaterial = new THREE.MeshBasicMaterial({
    color: 0xFF007F,
    wireframe: false
});

const bodyPanelMaterial = new THREE.MeshBasicMaterial({
    color: 0x3f444a,
    wireframe: false
});

const bodyTrimMaterial = new THREE.MeshBasicMaterial({
    color: 0x25292e,
    wireframe: false
});

const screenEdgeMaterial = new THREE.MeshBasicMaterial({
    color: 0x061018,
    wireframe: false
});

const screenFallbackMaterial = new THREE.MeshBasicMaterial({
    color: 0x0a3148,
    wireframe: false
});

const accentMaterial = new THREE.MeshBasicMaterial({
    color: 0xf08a12,
    wireframe: false
});

const screwMaterial = new THREE.MeshBasicMaterial({
    color: 0x1d2024,
    wireframe: false
});

const cameraMaterial = new THREE.MeshBasicMaterial({
    color: 0x1b1b22,
    wireframe: false
});

const lensMaterial = new THREE.MeshBasicMaterial({
    color: 0x061622,
    wireframe: false
});

const armMaterial = new THREE.MeshBasicMaterial({
    color: 0x55515f,
    wireframe: false
});

const armSlideMaterial = new THREE.MeshBasicMaterial({
    color: 0x343941,
    wireframe: false
});

const hingeMaterial = new THREE.MeshBasicMaterial({
    color: 0x22262b,
    wireframe: false
});

const turbineMaterial = new THREE.MeshBasicMaterial({
    color: 0x33383d,
    wireframe: false
});

const propellerMaterial = new THREE.MeshBasicMaterial({
    color: 0xbfc3cc,
    wireframe: false
});

const hubMaterial = new THREE.MeshBasicMaterial({
    color: 0x777777,
    wireframe: false
});

const buttonMaterial = new THREE.MeshBasicMaterial({
    color: 0x353b42,
    wireframe: false
});

const buttonInactiveColor = new THREE.Color(0x353b42);
const buttonActiveColor = new THREE.Color(0xf08a12);

// Tamanhos do DroneWatch
const bodyWidth = 0.92;
const bodyDepth = 1.14;
const bodyHeight = 0.28;
const bodyPanelHeight = 0.035;
const displayWidth = 0.66;
const displayDepth = 0.58;
const displayHeight = 0.024;
const armSocketInset = 0.09;
const armSocketLength = 0.2;
const armThickness = 0.075;
const sleeveLength = 0.34;
const slideLength = 0.38;
const slideRetractedOffset = -0.06;
const slideExpandedOffset = 0.68;
const rotorRadius = 0.25;
const rotorTubeRadius = 0.045;
const rotorGap = 0.14;
const propellerLength = 0.38;
const propellerBladeWidth = 0.07;
const propellerBladeThickness = 0.018;
const propellerHubRadius = 0.055;
const propellerHubHeight = 0.07;

function addDebugHelper(object, debugHelpers, size = 0.22){
    const helper = new THREE.AxesHelper(size);
    object.add(helper);
    debugHelpers.push(helper);
    return helper;
}

function createDashboardTexture(){
    if(typeof document === "undefined"){
        return {
            material: screenFallbackMaterial,
            update: () => {}
        };
    }

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;

    const context = canvas.getContext("2d");
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.MeshBasicMaterial({
        map: texture,
        wireframe: false
    });

    function drawStatusLine(label, value, y, color = "#f5f7f8"){
        context.fillStyle = "#8fa0aa";
        context.font = "24px Arial";
        context.fillText(label, 72, y);

        context.fillStyle = color;
        context.font = "28px Arial";
        context.fillText(value, 190, y);
    }

    function update(telemetry){
        const now = new Date();
        const time = now.toLocaleTimeString("pt-PT", {
            hour: "2-digit",
            minute: "2-digit"
        });
        const speed = Math.round(telemetry.speed * 24);
        const altitude = Math.max(0, Math.round(telemetry.altitude * 10));
        const battery = telemetry.ligado ? 82 : 81;
        const modeText = telemetry.ligado ? "DRONE MODE ACTIVE" : "DRONE STANDBY";
        const armsText = telemetry.armExtension > 0.75
            ? "ARMS: DEPLOYED"
            : telemetry.armExtension < 0.25
                ? "ARMS: STOWED"
                : "ARMS: MOVING";

        context.fillStyle = "#071016";
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.strokeStyle = "#21333d";
        context.lineWidth = 8;
        context.strokeRect(28, 28, 456, 456);

        context.strokeStyle = "#f08a12";
        context.lineWidth = 3;
        context.strokeRect(46, 46, 420, 420);

        context.fillStyle = "#dfe7e9";
        context.font = "bold 34px Arial";
        context.fillText(time, 316, 86);

        context.fillStyle = "#8fff61";
        context.fillRect(416, 66, 32, 18);
        context.strokeStyle = "#f5f7f8";
        context.lineWidth = 3;
        context.strokeRect(410, 60, 46, 30);

        drawStatusLine("ALT:", `${altitude}m`, 160);
        drawStatusLine("SPD:", `${speed}km/h`, 205);
        drawStatusLine("BATT:", `${battery}%`, 250);
        drawStatusLine("GPS:", "06", 295);

        context.fillStyle = telemetry.ligado ? "#72ff45" : "#f0b12f";
        context.font = "bold 30px Arial";
        context.fillText(modeText, 74, 366);

        context.fillStyle = "#dfe7e9";
        context.font = "bold 26px Arial";
        context.fillText(armsText, 118, 414);

        context.strokeStyle = "#60d33d";
        context.lineWidth = 5;
        context.beginPath();
        context.moveTo(430, 145);
        context.lineTo(430, 300);
        context.stroke();

        texture.needsUpdate = true;
    }

    update({
        altitude: 0,
        speed: 0,
        ligado: true,
        armExtension: 1
    });

    return {
        material,
        update
    };
}

function createPropeller(propellers, debugHelpers){
    const propeller = new THREE.Group();
    propeller.name = "propeller";

    const bladeLength = (propellerLength - propellerHubRadius * 1.5) / 2;
    const bladeOffset = propellerHubRadius + bladeLength / 2;

    for(let i = 0; i < 4; i++){
        const bladePivot = new THREE.Group();
        bladePivot.rotation.y = i * Math.PI / 2;

        const blade = new THREE.Mesh(
            new THREE.BoxGeometry(bladeLength, propellerBladeThickness, propellerBladeWidth),
            propellerMaterial
        );
        blade.position.x = bladeOffset;
        blade.rotation.z = i % 2 === 0 ? 0.08 : -0.08;

        bladePivot.add(blade);
        propeller.add(bladePivot);
    }

    const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(propellerHubRadius, propellerHubRadius, propellerHubHeight, 16),
        hubMaterial
    );
    hub.position.y = propellerHubHeight / 2;

    const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(propellerHubRadius * 0.72, propellerHubRadius * 0.72, 0.024, 16),
        accentMaterial
    );
    cap.position.y = propellerHubHeight + 0.017;

    propeller.add(hub);
    propeller.add(cap);
    propellers.push(propeller);
    addDebugHelper(propeller, debugHelpers, 0.14);

    return propeller;
}

function createTurbine(propellers, debugHelpers, labelIndex){
    const turbine = new THREE.Group();
    turbine.name = `rotor-${labelIndex}`;

    const turbineRing = new THREE.Mesh(
        new THREE.TorusGeometry(rotorRadius, rotorTubeRadius, 4, 8),
        turbineMaterial
    );
    turbineRing.rotation.x = Math.PI / 2;
    turbineRing.scale.set(1.08, 1, 1.08);

    const guardInset = new THREE.Mesh(
        new THREE.TorusGeometry(rotorRadius * 0.82, rotorTubeRadius * 0.22, 4, 8),
        bodyTrimMaterial
    );
    guardInset.rotation.x = Math.PI / 2;
    guardInset.position.y = 0.004;

    const label = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.045, 0.01, 16),
        accentMaterial
    );
    label.rotation.x = Math.PI / 2;
    label.position.set(0, -0.02, rotorRadius + rotorTubeRadius * 1.1);

    const mast = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.06, 0.16, 16),
        hingeMaterial
    );
    mast.position.y = -0.05;

    const propeller = createPropeller(propellers, debugHelpers);
    propeller.position.y = 0.02;

    turbine.add(turbineRing);
    turbine.add(guardInset);
    turbine.add(label);
    turbine.add(mast);
    turbine.add(propeller);
    addDebugHelper(turbine, debugHelpers, 0.18);

    return turbine;
}

function createDeployableArm(config, propellers, debugHelpers){
    const arm = new THREE.Group();
    arm.name = config.name;
    arm.position.copy(config.position);
    arm.rotation.y = config.angle;

    const socket = new THREE.Mesh(
        new THREE.BoxGeometry(armSocketLength, armThickness * 1.35, armThickness * 1.5),
        bodyPanelMaterial
    );
    socket.position.x = armSocketLength / 2;

    const hinge = new THREE.Mesh(
        new THREE.CylinderGeometry(armThickness * 0.62, armThickness * 0.62, armThickness * 1.7, 16),
        hingeMaterial
    );
    hinge.position.x = armSocketLength + armThickness * 0.2;

    const sleeve = new THREE.Mesh(
        new THREE.BoxGeometry(sleeveLength, armThickness, armThickness),
        armMaterial
    );
    sleeve.position.x = armSocketLength + sleeveLength / 2;

    const slideGroup = new THREE.Group();
    slideGroup.position.x = armSocketLength + slideRetractedOffset;

    const slide = new THREE.Mesh(
        new THREE.BoxGeometry(slideLength, armThickness * 0.72, armThickness * 0.72),
        armSlideMaterial
    );
    slide.position.x = slideLength / 2;

    const railTop = new THREE.Mesh(
        new THREE.BoxGeometry(slideLength * 0.9, armThickness * 0.18, armThickness * 0.18),
        bodyTrimMaterial
    );
    railTop.position.set(slideLength / 2, armThickness * 0.45, armThickness * 0.45);

    const railBottom = railTop.clone();
    railBottom.position.z = -armThickness * 0.45;

    const rotorJoint = new THREE.Mesh(
        new THREE.CylinderGeometry(armThickness * 0.55, armThickness * 0.55, armThickness * 1.45, 16),
        hingeMaterial
    );
    rotorJoint.position.x = slideLength + rotorGap * 0.45;

    const turbine = createTurbine(propellers, debugHelpers, config.labelIndex);
    turbine.position.x = slideLength + rotorGap + rotorRadius * 0.28;

    slideGroup.add(slide);
    slideGroup.add(railTop);
    slideGroup.add(railBottom);
    slideGroup.add(rotorJoint);
    slideGroup.add(turbine);

    arm.add(socket);
    arm.add(hinge);
    arm.add(sleeve);
    arm.add(slideGroup);
    addDebugHelper(arm, debugHelpers, 0.18);

    return {
        root: arm,
        slideGroup,
        baseAngle: config.angle,
        foldOffset: config.foldOffset
    };
}

function createDisplayAssembly(debugHelpers){
    const displayAssembly = new THREE.Group();
    displayAssembly.name = "dashboard-display";
    displayAssembly.position.y = bodyHeight / 2 + bodyPanelHeight + displayHeight / 2;
    displayAssembly.rotation.x = -0.08;

    const dashboard = createDashboardTexture();
    const screenMesh = new THREE.Mesh(
        new THREE.BoxGeometry(displayWidth, displayHeight, displayDepth),
        [
            screenEdgeMaterial,
            screenEdgeMaterial,
            dashboard.material,
            screenEdgeMaterial,
            screenEdgeMaterial,
            screenEdgeMaterial
        ]
    );

    const frameThickness = 0.045;
    const frameHeight = displayHeight * 1.5;
    const topFrame = new THREE.Mesh(
        new THREE.BoxGeometry(displayWidth + frameThickness * 2, frameHeight, frameThickness),
        bodyTrimMaterial
    );
    topFrame.position.z = displayDepth / 2 + frameThickness / 2;

    const bottomFrame = topFrame.clone();
    bottomFrame.position.z = -displayDepth / 2 - frameThickness / 2;

    const leftFrame = new THREE.Mesh(
        new THREE.BoxGeometry(frameThickness, frameHeight, displayDepth + frameThickness * 2),
        bodyTrimMaterial
    );
    leftFrame.position.x = -displayWidth / 2 - frameThickness / 2;

    const rightFrame = leftFrame.clone();
    rightFrame.position.x = displayWidth / 2 + frameThickness / 2;

    displayAssembly.add(screenMesh);
    displayAssembly.add(topFrame);
    displayAssembly.add(bottomFrame);
    displayAssembly.add(leftFrame);
    displayAssembly.add(rightFrame);

    const screwPositions = [
        [-displayWidth / 2 - 0.02, displayDepth / 2 + 0.02],
        [displayWidth / 2 + 0.02, displayDepth / 2 + 0.02],
        [-displayWidth / 2 - 0.02, -displayDepth / 2 - 0.02],
        [displayWidth / 2 + 0.02, -displayDepth / 2 - 0.02]
    ];

    screwPositions.forEach(([x, z]) => {
        const screw = new THREE.Mesh(
            new THREE.CylinderGeometry(0.024, 0.024, 0.012, 12),
            screwMaterial
        );
        screw.position.set(x, frameHeight / 2 + 0.003, z);
        displayAssembly.add(screw);
    });

    addDebugHelper(displayAssembly, debugHelpers, 0.16);

    return {
        group: displayAssembly,
        updateDashboard: dashboard.update
    };
}

function createBottomButton(debugHelpers){
    const buttonGroup = new THREE.Group();
    buttonGroup.name = "takeoff-button";
    buttonGroup.position.set(0, bodyHeight / 2 + 0.005, -bodyDepth / 2 - 0.02);

    const buttonBase = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.095, 0.045),
        buttonMaterial
    );

    const grille = new THREE.Mesh(
        new THREE.BoxGeometry(0.34, 0.015, 0.052),
        bodyTrimMaterial
    );
    grille.position.y = 0.03;

    const lowerGroove = grille.clone();
    lowerGroove.position.y = -0.005;

    buttonGroup.add(buttonBase);
    buttonGroup.add(grille);
    buttonGroup.add(lowerGroove);
    addDebugHelper(buttonGroup, debugHelpers, 0.14);

    return buttonGroup;
}

function buildDroneBody(debugHelpers){
    const droneBody = new THREE.Group();
    droneBody.name = "smartwatch-body";

    const droneBodyMesh = new THREE.Mesh(
        new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyDepth),
        droneBodyMaterial
    );

    const upperPanel = new THREE.Mesh(
        new THREE.BoxGeometry(bodyWidth * 0.86, bodyPanelHeight, bodyDepth * 0.82),
        bodyPanelMaterial
    );
    upperPanel.position.y = bodyHeight / 2 + bodyPanelHeight / 2;

    const leftGuard = new THREE.Mesh(
        new THREE.BoxGeometry(0.09, bodyHeight * 0.95, bodyDepth * 0.72),
        bodyTrimMaterial
    );
    leftGuard.position.x = -bodyWidth / 2 - 0.02;

    const rightGuard = leftGuard.clone();
    rightGuard.position.x = bodyWidth / 2 + 0.02;

    const frontCameraGroup = new THREE.Group();
    frontCameraGroup.name = "front-camera";

    const frontCameraHousing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 0.04, 32),
        cameraMaterial
    );
    frontCameraHousing.rotation.x = Math.PI / 2;
    frontCameraHousing.position.set(0, 0, bodyDepth / 2 + 0.015);

    const frontCameraLens = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.018, 32),
        lensMaterial
    );
    frontCameraLens.rotation.x = Math.PI / 2;
    frontCameraLens.position.set(0, 0, bodyDepth / 2 + 0.044);

    frontCameraGroup.add(frontCameraHousing);
    frontCameraGroup.add(frontCameraLens);

    const display = createDisplayAssembly(debugHelpers);
    const bottomButton = createBottomButton(debugHelpers);

    droneBody.add(droneBodyMesh);
    droneBody.add(upperPanel);
    droneBody.add(leftGuard);
    droneBody.add(rightGuard);
    droneBody.add(display.group);
    droneBody.add(frontCameraGroup);
    droneBody.add(bottomButton);

    addDebugHelper(droneBody, debugHelpers, 0.22);
    addDebugHelper(frontCameraGroup, debugHelpers, 0.12);

    return {
        group: droneBody,
        bottomButton,
        updateDashboard: display.updateDashboard
    };
}

export function createDrone(options = {}){
    const statusElement = options.statusElement || null;

    const propellers = [];
    const debugHelpers = [];
    const deployableArms = [];
    const droneRig = new THREE.Group();
    const drone = new THREE.Group();
    const mobileCameraMount = new THREE.Group();
    mobileCameraMount.position.set(0, bodyHeight / 2 + 0.22, bodyDepth / 2 + 0.06);

    const body = buildDroneBody(debugHelpers);
    drone.add(body.group);
    drone.add(mobileCameraMount);

    const armConfigs = [
        {
            name: "front-right-arm",
            labelIndex: 2,
            position: new THREE.Vector3(bodyWidth / 2 - armSocketInset, 0, bodyDepth / 2 - armSocketInset),
            angle: -Math.PI / 4,
            foldOffset: 0.15
        },
        {
            name: "front-left-arm",
            labelIndex: 4,
            position: new THREE.Vector3(-bodyWidth / 2 + armSocketInset, 0, bodyDepth / 2 - armSocketInset),
            angle: -3 * Math.PI / 4,
            foldOffset: -0.15
        },
        {
            name: "back-left-arm",
            labelIndex: 1,
            position: new THREE.Vector3(-bodyWidth / 2 + armSocketInset, 0, -bodyDepth / 2 + armSocketInset),
            angle: 3 * Math.PI / 4,
            foldOffset: 0.15
        },
        {
            name: "back-right-arm",
            labelIndex: 3,
            position: new THREE.Vector3(bodyWidth / 2 - armSocketInset, 0, -bodyDepth / 2 + armSocketInset),
            angle: Math.PI / 4,
            foldOffset: -0.15
        }
    ];

    armConfigs.forEach((config) => {
        const deployableArm = createDeployableArm(config, propellers, debugHelpers);
        deployableArms.push(deployableArm);
        drone.add(deployableArm.root);
    });

    droneRig.add(drone);
    addDebugHelper(droneRig, debugHelpers, 0.28);

    const keys = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        yawLeft: false,
        yawRight: false,
        up: false,
        down: false
    };

    const droneMovement = new THREE.Vector3();
    const droneVelocity = new THREE.Vector3();
    const localVelocity = new THREE.Vector3();
    const inverseDroneRigQuaternion = new THREE.Quaternion();
    let verticalVelocity = 0;
    let yawVelocity = 0;
    let ligado = true;
    let armsExpanded = true;
    let armExtension = 1;
    let propellerCurrentSpeed = 0;
    let dashboardAccumulator = 1;

    function getTelemetry(){
        return {
            altitude: droneRig.position.y,
            speed: droneVelocity.length(),
            verticalSpeed: verticalVelocity,
            yawSpeed: yawVelocity,
            ligado,
            armsExpanded,
            armExtension
        };
    }

    function updateStatus(){
        if(!statusElement) return;
        const droneState = ligado ? "ligado" : "desligado";
        const armState = armsExpanded ? "expandidos" : "retraidos";
        statusElement.textContent = `Estado: ${droneState} | Bracos: ${armState}`;
    }

    function updateArmTransforms(){
        deployableArms.forEach((arm) => {
            arm.slideGroup.position.x = THREE.MathUtils.lerp(
                armSocketLength + slideRetractedOffset,
                armSocketLength + slideExpandedOffset,
                armExtension
            );
            arm.root.rotation.y = THREE.MathUtils.lerp(
                arm.baseAngle + arm.foldOffset,
                arm.baseAngle,
                armExtension
            );
        });

        buttonMaterial.color.lerpColors(buttonInactiveColor, buttonActiveColor, armExtension);
        body.bottomButton.position.y = bodyHeight / 2 + 0.005 + armExtension * 0.018;
    }

    function toggleArms(){
        armsExpanded = !armsExpanded;
        updateStatus();
    }

    function setDebugHelpersVisible(visible){
        debugHelpers.forEach((helper) => {
            helper.visible = visible;
        });
    }

    function setKey(event, isPressed){
        let handled = true;

        switch(event.code){
            case "KeyW": keys.forward = isPressed; break;
            case "KeyS": keys.backward = isPressed; break;
            case "KeyA": keys.left = isPressed; break;
            case "KeyD": keys.right = isPressed; break;
            case "KeyQ": keys.yawLeft = isPressed; break;
            case "KeyE": keys.yawRight = isPressed; break;
            case "Space": keys.up = isPressed; break;
            case "ShiftLeft":
            case "ShiftRight":
                keys.down = isPressed;
                break;
            case "KeyT":
                if(isPressed && !event.repeat){
                    toggleArms();
                }
                break;
            case "KeyR":
                if(isPressed){
                    ligado = true;
                    updateStatus();
                }
                break;
            case "KeyF":
                if(isPressed){
                    ligado = false;
                    updateStatus();
                }
                break;
            default:
                handled = false;
        }

        if(handled){
            event.preventDefault();
        }
    }

    function bindInput(target = window){
        target.addEventListener("keydown", (event) => setKey(event, true));
        target.addEventListener("keyup", (event) => setKey(event, false));
        updateStatus();
    }

    function update(delta, elapsedTime){
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
        const targetPropellerSpeed = ligado ? 22 : 0;
        const armTarget = armsExpanded ? 1 : 0;

        armExtension = THREE.MathUtils.damp(armExtension, armTarget, 7, delta);
        updateArmTransforms();

        propellerCurrentSpeed += (targetPropellerSpeed - propellerCurrentSpeed) * Math.min(delta * 5, 1);

        if(ligado){
            const yawInput = Number(keys.yawLeft) - Number(keys.yawRight);
            yawVelocity += yawInput * yawAcceleration * delta;
            yawVelocity = THREE.MathUtils.clamp(yawVelocity, -maxYawSpeed, maxYawSpeed);

            droneMovement.set(
                Number(keys.right) - Number(keys.left),
                0,
                Number(keys.forward) - Number(keys.backward)
            );

            if(droneMovement.lengthSq() > 0){
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
        if(droneVelocity.length() > maxHorizontalSpeed){
            droneVelocity.setLength(maxHorizontalSpeed);
        }
        droneRig.position.addScaledVector(droneVelocity, delta);

        verticalVelocity *= Math.exp(-verticalDamping * delta);
        verticalVelocity = THREE.MathUtils.clamp(verticalVelocity, -maxVerticalSpeed, maxVerticalSpeed);
        droneRig.position.y += verticalVelocity * delta;
        if(droneRig.position.y < 0){
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
        drone.position.y = ligado
            ? Math.sin(elapsedTime * 6.5) * 0.012 + Math.sin(elapsedTime * 13) * 0.004
            : THREE.MathUtils.lerp(drone.position.y, 0, tiltAlpha);

        propellers.forEach((propeller, index) => {
            const direction = index % 2 === 0 ? 1 : -1;
            propeller.rotation.y += propellerCurrentSpeed * delta * direction;
        });

        dashboardAccumulator += delta;
        if(dashboardAccumulator >= 0.15){
            dashboardAccumulator = 0;
            body.updateDashboard(getTelemetry());
        }
    }

    updateArmTransforms();

    return {
        rig: droneRig,
        mobileCameraMount,
        debugHelpers,
        update,
        bindInput,
        toggleArms,
        setDebugHelpersVisible,
        getTelemetry,
        get ligado(){ return ligado; },
        get armsExpanded(){ return armsExpanded; }
    };
}
