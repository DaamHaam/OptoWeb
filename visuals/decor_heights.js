/* /visuals/decor_heights.js */

export const heightsDecorModule = {

    decorRoot: null,
    sceneEl: null,
    originalFog: null,

    /**
     * Crée un décor stylisé avec plusieurs plans et volumes pour suggérer la hauteur.
     * @param {Element} sceneEl - L'élément <a-scene>.
     */
    create(sceneEl) {
        if (this.decorRoot) {
            return;
        }

        this.sceneEl = sceneEl;

        const currentFog = sceneEl.getAttribute('fog');
        this.originalFog = currentFog ? { ...currentFog } : null;

        this.decorRoot = document.createElement('a-entity');
        this.decorRoot.setAttribute('id', 'heights-decor-root');

        // Plateau principal sous la plateforme
        const mainPlate = document.createElement('a-entity');
        mainPlate.setAttribute('geometry', 'primitive: circle; radius: 58; segments: 96');
        mainPlate.setAttribute('material', 'shader: flat; roughness: 0.8; color: #f0e3c0');
        mainPlate.setAttribute('rotation', '-90 0 0');
        mainPlate.setAttribute('position', '0 -1.2 -2');
        this.decorRoot.appendChild(mainPlate);

        const plateRim = document.createElement('a-entity');
        plateRim.setAttribute('geometry', 'primitive: torus; radius: 58; radiusTubular: 0.6; segmentsTubular: 32; segmentsRadial: 12');
        plateRim.setAttribute('material', 'color: #d7c5a3; shader: flat; metalness: 0.05; roughness: 0.6');
        plateRim.setAttribute('rotation', '90 0 0');
        plateRim.setAttribute('position', '0 -1.45 -2');
        this.decorRoot.appendChild(plateRim);

        // Terrasses inférieures pour créer de la profondeur
        const terraces = [
            { radius: 25, y: -4, color: '#d3d9dc' },
            { radius: 18, y: -6.5, color: '#b9c6cf' },
            { radius: 12, y: -9, color: '#9fb3c4' }
        ];

        terraces.forEach((terrace) => {
            const terraceEl = document.createElement('a-cylinder');
            terraceEl.setAttribute('radius', terrace.radius);
            terraceEl.setAttribute('height', '0.4');
            terraceEl.setAttribute('color', terrace.color);
            terraceEl.setAttribute('position', `0 ${terrace.y} -2`);
            terraceEl.setAttribute('material', 'shader: flat');
            this.decorRoot.appendChild(terraceEl);
        });

        // Puits central sombre pour accentuer la sensation de hauteur
        const depthWell = document.createElement('a-cylinder');
        depthWell.setAttribute('radius', '6');
        depthWell.setAttribute('height', '14');
        depthWell.setAttribute('color', '#1f2a44');
        depthWell.setAttribute('opacity', '0.85');
        depthWell.setAttribute('position', '0 -8.5 -2');
        depthWell.setAttribute('material', 'shader: flat');
        this.decorRoot.appendChild(depthWell);

        // Piliers stylisés placés à différentes distances
        const pillarPositions = [
            { x: 12, z: -10, height: 12, tone: '#7c8fa3' },
            { x: -15, z: -6, height: 16, tone: '#6e819a' },
            { x: 18, z: 8, height: 14, tone: '#899bb0' },
            { x: -9, z: 14, height: 10, tone: '#7388a0' },
            { x: 22, z: -18, height: 18, tone: '#5f738f' }
        ];

        pillarPositions.forEach((pillar, index) => {
            const pillarGroup = document.createElement('a-entity');
            pillarGroup.setAttribute('position', `${pillar.x} -1.2 ${pillar.z - 2}`);

            const pillarCore = document.createElement('a-box');
            pillarCore.setAttribute('width', '2');
            pillarCore.setAttribute('depth', '2');
            pillarCore.setAttribute('height', pillar.height);
            pillarCore.setAttribute('color', pillar.tone);
            pillarCore.setAttribute('position', `0 ${pillar.height / 2} 0`);
            pillarCore.setAttribute('material', 'shader: flat');
            pillarCore.setAttribute('animation__glow', `property: material.color; dir: alternate; dur: ${12000 + index * 1500}; easing: easeInOutSine; loop: true; to: #a0b6d0`);
            pillarGroup.appendChild(pillarCore);

            const baseEl = document.createElement('a-cylinder');
            baseEl.setAttribute('radius', '1.4');
            baseEl.setAttribute('height', '0.6');
            baseEl.setAttribute('color', '#607593');
            baseEl.setAttribute('material', 'shader: flat');
            baseEl.setAttribute('position', '0 0.3 0');
            pillarGroup.appendChild(baseEl);

            const accentHeights = [0.22, 0.55, 0.82];
            accentHeights.forEach((ratio) => {
                const accent = document.createElement('a-cylinder');
                accent.setAttribute('radius', '1.15');
                accent.setAttribute('height', '0.2');
                accent.setAttribute('color', '#9fb6cf');
                accent.setAttribute('material', 'shader: flat; opacity: 0.85');
                accent.setAttribute('position', `0 ${pillar.height * ratio} 0`);
                pillarGroup.appendChild(accent);
            });

            const ribOffsets = [
                { x: 0.95, z: 0 },
                { x: -0.95, z: 0 },
                { x: 0, z: 0.95 },
                { x: 0, z: -0.95 }
            ];

            ribOffsets.forEach((offset) => {
                const rib = document.createElement('a-box');
                rib.setAttribute('width', offset.x === 0 ? 0.28 : 0.18);
                rib.setAttribute('depth', offset.z === 0 ? 0.18 : 0.28);
                rib.setAttribute('height', pillar.height * 0.65);
                rib.setAttribute('color', '#4f637e');
                rib.setAttribute('opacity', '0.85');
                rib.setAttribute('material', 'shader: flat');
                rib.setAttribute('position', `${offset.x} ${(pillar.height * 0.65) / 2 + pillar.height * 0.2} ${offset.z}`);
                pillarGroup.appendChild(rib);
            });

            const capRing = document.createElement('a-cylinder');
            capRing.setAttribute('radius', '1.3');
            capRing.setAttribute('height', '0.25');
            capRing.setAttribute('color', '#d4e0f2');
            capRing.setAttribute('material', 'shader: flat; opacity: 0.9');
            capRing.setAttribute('position', `0 ${pillar.height - 0.25} 0`);
            pillarGroup.appendChild(capRing);

            const capGlow = document.createElement('a-sphere');
            capGlow.setAttribute('radius', '0.9');
            capGlow.setAttribute('color', '#e4ebf6');
            capGlow.setAttribute('material', 'shader: flat; opacity: 0.95');
            capGlow.setAttribute('position', `0 ${pillar.height + 0.5} 0`);
            capGlow.setAttribute('animation__pulse', 'property: scale; dir: alternate; dur: 6000; easing: easeInOutSine; loop: true; to: 1.05 1.15 1.05');
            pillarGroup.appendChild(capGlow);

            this.decorRoot.appendChild(pillarGroup);
        });

        // Plates-formes flottantes simples
        const floatingPlatforms = [
            { x: 6, y: -1, z: -10, scale: '2 0.1 2', hover: 0.4, phase: 0 },
            { x: -8, y: -0.5, z: -14, scale: '1.5 0.1 1.5', hover: 0.25, phase: 2000 },
            { x: 10, y: 1, z: 12, scale: '1.8 0.1 1.8', hover: 0.35, phase: 4000 },
            { x: -4, y: 1.5, z: 18, scale: '1.2 0.08 2.4', hover: 0.2, phase: 1500 }
        ];

        floatingPlatforms.forEach((platform) => {
            const platformEl = document.createElement('a-box');
            platformEl.setAttribute('color', '#c6d6e5');
            platformEl.setAttribute('scale', platform.scale);
            platformEl.setAttribute('position', `${platform.x} ${platform.y} ${platform.z}`);
            platformEl.setAttribute('material', 'shader: flat');
            platformEl.setAttribute('animation__hover', `property: position; dir: alternate; dur: ${10000 + platform.phase}; easing: easeInOutSine; loop: true; to: ${platform.x} ${platform.y + platform.hover} ${platform.z}; delay: ${platform.phase}`);
            this.decorRoot.appendChild(platformEl);
        });

        // Nuages stylisés très simples et animés lentement
        const cloudData = [
            { x: 8, y: 9, z: -12, scale: '3.2 1.4 1.4', delay: 0, drift: 3 },
            { x: -10, y: 10, z: 14, scale: '2.7 1.2 1.2', delay: 2000, drift: 2 },
            { x: -4, y: 8, z: -16, scale: '3.6 1.5 1.5', delay: 4000, drift: 4 },
            { x: 14, y: 11, z: 22, scale: '4.2 1.8 1.8', delay: 6000, drift: 5 }
        ];

        cloudData.forEach((cloud) => {
            const cloudEl = document.createElement('a-sphere');
            cloudEl.setAttribute('color', '#ffffff');
            cloudEl.setAttribute('position', `${cloud.x} ${cloud.y} ${cloud.z}`);
            cloudEl.setAttribute('scale', cloud.scale);
            cloudEl.setAttribute('opacity', '0.85');
            cloudEl.setAttribute('material', 'shader: flat');
            cloudEl.setAttribute('animation__float', `property: position; dir: alternate; dur: 12000; easing: easeInOutSine; loop: true; to: ${cloud.x} ${cloud.y + 0.8} ${cloud.z}; delay: ${cloud.delay}`);
            cloudEl.setAttribute('animation__drift', `property: position; dir: alternate; dur: ${18000 + cloud.delay}; easing: easeInOutSine; loop: true; to: ${cloud.x + cloud.drift} ${cloud.y} ${cloud.z}; delay: ${cloud.delay / 2}`);
            this.decorRoot.appendChild(cloudEl);
        });

        const upperClouds = [
            { x: -16, y: 15, z: -28, scale: '4.5 1.6 1.6', delay: 1000, drift: 3.5 },
            { x: 18, y: 16, z: 30, scale: '5.2 1.9 1.9', delay: 2500, drift: 4.5 },
            { x: 4, y: 14, z: 26, scale: '3.8 1.5 1.5', delay: 4200, drift: 3 }
        ];

        upperClouds.forEach((cloud) => {
            const highCloud = document.createElement('a-sphere');
            highCloud.setAttribute('color', '#ffffff');
            highCloud.setAttribute('position', `${cloud.x} ${cloud.y} ${cloud.z}`);
            highCloud.setAttribute('scale', cloud.scale);
            highCloud.setAttribute('opacity', '0.75');
            highCloud.setAttribute('material', 'shader: flat');
            highCloud.setAttribute('animation__float', `property: position; dir: alternate; dur: 16000; easing: easeInOutSine; loop: true; to: ${cloud.x} ${cloud.y + 1.2} ${cloud.z}; delay: ${cloud.delay}`);
            highCloud.setAttribute('animation__drift', `property: position; dir: alternate; dur: ${22000 + cloud.delay}; easing: easeInOutSine; loop: true; to: ${cloud.x - cloud.drift} ${cloud.y} ${cloud.z + cloud.drift}; delay: ${cloud.delay / 2}`);
            this.decorRoot.appendChild(highCloud);
        });

        // Bandes de nuages lointains pour suggérer un vent doux
        const farCloudBands = [
            { y: 4, from: -25, to: 25, z: -35, width: 40, delay: 0 },
            { y: 9, from: 22, to: -18, z: 38, width: 36, delay: 4000 }
        ];

        farCloudBands.forEach((band) => {
            const bandEl = document.createElement('a-plane');
            bandEl.setAttribute('width', `${band.width}`);
            bandEl.setAttribute('height', '6');
            bandEl.setAttribute('material', 'shader: flat; color: #ffffff; opacity: 0.18; side: double');
            bandEl.setAttribute('rotation', '0 0 0');
            bandEl.setAttribute('position', `0 ${band.y} ${band.z}`);
            bandEl.setAttribute('animation__wind', `property: position; dir: alternate; dur: 24000; easing: easeInOutSine; loop: true; to: ${band.to} ${band.y} ${band.z}; from: ${band.from} ${band.y} ${band.z}; delay: ${band.delay}`);
            this.decorRoot.appendChild(bandEl);
        });

        // Flux de vent lumineux pour dynamiser l'arrière-plan
        const windTrails = [
            { position: '-12 2 -22', rotation: '0 10 0', length: 14 },
            { position: '16 3 28', rotation: '0 -20 0', length: 18 }
        ];

        windTrails.forEach((trail) => {
            const trailEl = document.createElement('a-plane');
            trailEl.setAttribute('width', `${trail.length}`);
            trailEl.setAttribute('height', '1.6');
            trailEl.setAttribute('material', 'shader: flat; color: #b9ddff; opacity: 0.12; side: double');
            trailEl.setAttribute('position', trail.position);
            trailEl.setAttribute('rotation', trail.rotation);
            trailEl.setAttribute('animation__pulse', 'property: material.opacity; dir: alternate; dur: 3500; easing: easeInOutSine; loop: true; to: 0.22');
            this.decorRoot.appendChild(trailEl);
        });

        // Ballons d'altitude lointains pour renforcer la perception de verticalité
        const tetheredBalloons = [
            { x: 20, y: 15, z: -30, color: '#ffcf66', bob: 1.6, delay: 0 },
            { x: -24, y: 13, z: 34, color: '#8ed6ff', bob: 1.1, delay: 2200 }
        ];

        tetheredBalloons.forEach((balloon) => {
            const balloonEl = document.createElement('a-sphere');
            balloonEl.setAttribute('radius', '1.5');
            balloonEl.setAttribute('color', balloon.color);
            balloonEl.setAttribute('position', `${balloon.x} ${balloon.y} ${balloon.z}`);
            balloonEl.setAttribute('material', 'shader: flat; opacity: 0.95');
            balloonEl.setAttribute('animation__bob', `property: position; dir: alternate; dur: ${9000 + balloon.delay}; easing: easeInOutSine; loop: true; to: ${balloon.x} ${balloon.y + balloon.bob} ${balloon.z}; delay: ${balloon.delay}`);

            const tetherEl = document.createElement('a-cylinder');
            tetherEl.setAttribute('radius', '0.02');
            tetherEl.setAttribute('height', `${balloon.y + 3}`);
            tetherEl.setAttribute('color', '#f9f1d0');
            tetherEl.setAttribute('position', `${balloon.x} ${(balloon.y - 3) / 2} ${balloon.z}`);
            tetherEl.setAttribute('material', 'shader: flat; opacity: 0.6');

            this.decorRoot.appendChild(balloonEl);
            this.decorRoot.appendChild(tetherEl);
        });

        const stylizedTrees = [
            { x: 26, z: -14, trunkHeight: 3.2, canopyScale: '2.6 2.8 2.6', sway: 0.18 },
            { x: -28, z: -10, trunkHeight: 4, canopyScale: '3 3.4 3', sway: 0.24 },
            { x: 24, z: 18, trunkHeight: 3.6, canopyScale: '2.4 2.6 2.4', sway: 0.16 },
            { x: -22, z: 22, trunkHeight: 3.8, canopyScale: '2.8 3 2.8', sway: 0.2 }
        ];

        stylizedTrees.forEach((tree, index) => {
            const treeGroup = document.createElement('a-entity');
            treeGroup.setAttribute('position', `${tree.x} -1.2 ${tree.z - 2}`);

            const trunk = document.createElement('a-cylinder');
            trunk.setAttribute('radius', '0.28');
            trunk.setAttribute('height', tree.trunkHeight);
            trunk.setAttribute('position', `0 ${tree.trunkHeight / 2} 0`);
            trunk.setAttribute('color', '#6b4f2c');
            trunk.setAttribute('material', 'shader: flat');
            treeGroup.appendChild(trunk);

            const canopy = document.createElement('a-sphere');
            canopy.setAttribute('position', `0 ${tree.trunkHeight + 0.8} 0`);
            canopy.setAttribute('scale', tree.canopyScale);
            canopy.setAttribute('color', '#7ec87c');
            canopy.setAttribute('material', 'shader: flat; roughness: 0.7');
            canopy.setAttribute('animation__sway', `property: rotation; dir: alternate; dur: ${6000 + index * 1200}; easing: easeInOutSine; loop: true; to: ${tree.sway * 60} ${tree.sway * 80} ${tree.sway * -40}`);
            treeGroup.appendChild(canopy);

            const canopyHighlight = document.createElement('a-sphere');
            canopyHighlight.setAttribute('position', `0 ${tree.trunkHeight + 0.8} 0`);
            canopyHighlight.setAttribute('scale', '1.2 0.8 1.2');
            canopyHighlight.setAttribute('color', '#a8e0a2');
            canopyHighlight.setAttribute('material', 'shader: flat; opacity: 0.4');
            treeGroup.appendChild(canopyHighlight);

            this.decorRoot.appendChild(treeGroup);
        });

        sceneEl.appendChild(this.decorRoot);
        sceneEl.setAttribute('fog', 'type: exponential; color: #d6ecff; density: 0.018');
    },

    /**
     * Supprime le décor de la scène et restaure la configuration précédente.
     */
    cleanup() {
        if (this.decorRoot && this.decorRoot.parentNode) {
            this.decorRoot.parentNode.removeChild(this.decorRoot);
        }
        if (this.sceneEl) {
            if (this.originalFog) {
                this.sceneEl.setAttribute('fog', this.originalFog);
            } else {
                this.sceneEl.removeAttribute('fog');
            }
        }

        this.decorRoot = null;
        this.sceneEl = null;
        this.originalFog = null;
    }
};
