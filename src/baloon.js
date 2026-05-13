import * as THREE from 'three';

const balloonMaterial = new THREE.MeshBasicMaterial({
    color: 0xd94c66,
    side: THREE.DoubleSide
});

const knotMaterial = new THREE.MeshBasicMaterial({
    color: 0xa83245,
    side: THREE.DoubleSide
});

const stringMaterial = new THREE.MeshBasicMaterial({
    color: 0xd7d0c8
});

export function createBalloon(radius = 0.45, height = 0.8, capSegments = 8, radialSegments = 24, heightSegments = 1, stringSize = 1.2){
    const safeRadius = Math.max(radius, 0.05);
    const safeHeight = Math.max(height, 0.05);
    const safeCapSegments = Math.max(Math.floor(capSegments), 4);
    const safeRadialSegments = Math.max(Math.floor(radialSegments), 8);
    const safeHeightSegments = Math.max(Math.floor(heightSegments), 1);
    const safeStringSize = Math.max(stringSize, 0);

    const balloon = new THREE.Group();

    const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(
            safeRadius,
            safeHeight,
            safeCapSegments,
            safeRadialSegments,
            safeHeightSegments
        ),
        balloonMaterial
    );

    const knotHeight = safeRadius * 0.28;
    const knot = new THREE.Mesh(
        new THREE.ConeGeometry(safeRadius * 0.2, knotHeight, safeRadialSegments),
        knotMaterial
    );
    knot.rotation.x = Math.PI;
    knot.position.y = -(safeHeight / 2 + safeRadius + knotHeight / 2);

    balloon.add(body);
    balloon.add(knot);

    if(safeStringSize > 0){
        const string = new THREE.Mesh(
            new THREE.CylinderGeometry(safeRadius * 0.018, safeRadius * 0.018, safeStringSize, 8),
            stringMaterial
        );
        string.position.y = knot.position.y - knotHeight / 2 - safeStringSize / 2;
        balloon.add(string);
    }

    return balloon;
}

export { createBalloon as createBallon };
