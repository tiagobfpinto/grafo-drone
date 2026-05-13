import * as THREE from 'three';

const balloonMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    side: THREE.DoubleSide
});

const knotMaterial = new THREE.MeshBasicMaterial({
    color: 0xa83245,
    side: THREE.DoubleSide
});

const stringMaterial = new THREE.MeshBasicMaterial({
    color: 0xd7d0c8
});

// Mudámos os valores por defeito para garantir que fica Low-Poly (ex: widthSegments = 8)
export function createBalloon(radius = 0.35, widthSegments = 8, heightSegments = 6, stringSize = 1.2){
    const safeRadius = Math.max(radius, 0.05);
    const safeWidthSegments = Math.max(Math.floor(widthSegments), 3);
    const safeHeightSegments = Math.max(Math.floor(heightSegments), 2);
    const safeStringSize = Math.max(stringSize, 0);

    const balloon = new THREE.Group();
    const helpers = []; // Para guardarmos os eixos individuais

    // 1. Corpo (Esfera em vez de Cápsula, para respeitar o guião)
    const body = new THREE.Mesh(
        new THREE.SphereGeometry(safeRadius, safeWidthSegments, safeHeightSegments),
        balloonMaterial
    );
    const hBody = new THREE.AxesHelper(safeRadius * 1.5);
    body.add(hBody);
    helpers.push(hBody);

    // 2. Nó (Cone)
    const knotHeight = safeRadius * 0.28;
    const knot = new THREE.Mesh(
        new THREE.ConeGeometry(safeRadius * 0.2, knotHeight, safeWidthSegments),
        knotMaterial
    );
    knot.rotation.x = Math.PI;
    knot.position.y = -(safeRadius + knotHeight / 2 - 0.02); // Posição ajustada para a esfera
    
    const hKnot = new THREE.AxesHelper(safeRadius * 0.8);
    knot.add(hKnot);
    helpers.push(hKnot);

    balloon.add(body);
    balloon.add(knot);

    // 3. Fio (Cilindro)
    if(safeStringSize > 0){
        // 4 lados no cilindro para manter o estilo low-poly
        const string = new THREE.Mesh(
            new THREE.CylinderGeometry(safeRadius * 0.018, safeRadius * 0.018, safeStringSize, 4),
            stringMaterial
        );
        string.position.y = knot.position.y - knotHeight / 2 - safeStringSize / 2;
        
        const hString = new THREE.AxesHelper(safeRadius * 0.8);
        string.add(hString);
        helpers.push(hString);

        balloon.add(string);
    }

    // O teu colega devolvia só o 'balloon', mas precisamos de devolver os helpers também para a tecla H
    return {
        group: balloon,
        helpers: helpers
    };
}