import * as THREE from 'three';

export function createStrap() {
    // Criamos um grupo para a base
    const baseGroup = new THREE.Group();
    baseGroup.name = "base-drone";
    baseGroup.position.set(0, -0.6, 0); // Posição fixa no cenário (spawn)

    const baseHelpers = [];

    // 1. A Pulseira (Torus Vertical e Achatado num Pulso)
    const strapGeometry = new THREE.TorusGeometry(0.75, 0.09, 6, 16);
    const strapMaterial = new THREE.MeshBasicMaterial({ color: 0x1a1a1a, wireframe: false });
    const strapMesh = new THREE.Mesh(strapGeometry, strapMaterial);
    
    // Rodamos e achatamos
    strapMesh.rotation.y = Math.PI / 2;
    strapMesh.scale.set(1.0, 0.6, 1.4); 
    baseGroup.add(strapMesh);

    // 2. A Estrutura de Pouso (Quadrado/Cubo Achatado)
    const padHeight = 0.08;
    const padGeometry = new THREE.BoxGeometry(0.8, padHeight, 0.8);
    const padMaterial = new THREE.MeshBasicMaterial({ color: 0x4a4a4a, wireframe: false });
    const padMesh = new THREE.Mesh(padGeometry, padMaterial);
    
    // Cálculo exato da altura para pousar em cima do torus
    const torusRadius = strapGeometry.parameters.radius;
    const torusTube = strapGeometry.parameters.tube;
    const torusHeightScale = strapMesh.scale.y;
    padMesh.position.y = (torusRadius + torusTube) * torusHeightScale + padHeight / 2;
    padMesh.position.y -= 0.02; // Embutido ligeiramente
    baseGroup.add(padMesh);

    // 3. Adicionar os AxesHelper a cada peça (Exigência do Guião)
    const hGroup = new THREE.AxesHelper(1.0);
    baseGroup.add(hGroup);
    baseHelpers.push(hGroup);

    const hStrap = new THREE.AxesHelper(0.8);
    strapMesh.add(hStrap);
    baseHelpers.push(hStrap);

    const hPad = new THREE.AxesHelper(0.6);
    padMesh.add(hPad);
    baseHelpers.push(hPad);

    // Devolve o grupo inteiro e os helpers para o main.js
    return {
        group: baseGroup,
        helpers: baseHelpers
    };
}