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
        const pillarConfigurations = [
            { x: 12, z: -10, height: 24, width: 2.4, depth: 2.2, tone: '#6f84a3', accentColor: '#a2b9d8', baseColor: '#516482', glowColor: '#f0f6ff' },
            { x: -18, z: -4, height: 28, width: 2.8, depth: 2.4, tone: '#5f7a9a', accentColor: '#97b0d3', baseColor: '#445b78', glowColor: '#e4efff' },
            { x: 22, z: 12, height: 26, width: 2.2, depth: 2.8, tone: '#7d90ab', accentColor: '#b1c6e2', baseColor: '#586b88', glowColor: '#f6fbff' },
            { x: -10, z: 18, height: 22, width: 2.1, depth: 2.1, tone: '#6a809d', accentColor: '#9cb2d1', baseColor: '#4b5f7a', glowColor: '#eff4ff' },
            { x: 28, z: -22, height: 30, width: 2.6, depth: 2.4, tone: '#567190', accentColor: '#8ea7c9', baseColor: '#40526b', glowColor: '#e8f2ff' },
            { x: -26, z: -18, height: 32, width: 3.2, depth: 2.6, tone: '#4f6a88', accentColor: '#89a3c4', baseColor: '#384c63', glowColor: '#e2ecff' },
            { x: 16, z: 26, height: 36, width: 3.4, depth: 3.1, tone: '#627b99', accentColor: '#aac0dc', baseColor: '#495f7a', glowColor: '#f2f7ff' },
            { x: -30, z: 24, height: 34, width: 2.9, depth: 3.5, tone: '#556f8d', accentColor: '#96b2d3', baseColor: '#3e5169', glowColor: '#e9f3ff' },
            { x: 32, z: -6, height: 25, width: 2.5, depth: 3, tone: '#6d89a5', accentColor: '#a7bedc', baseColor: '#526680', glowColor: '#edf4ff' },
            { x: -14, z: 32, height: 29, width: 2.3, depth: 2.6, tone: '#5c7694', accentColor: '#95afd0', baseColor: '#435875', glowColor: '#e6f0ff' }
        ];

        pillarConfigurations.forEach((pillar, index) => {
            const pillarGroup = document.createElement('a-entity');
            pillarGroup.setAttribute('position', `${pillar.x} -1.2 ${pillar.z - 2}`);

            const pillarCore = document.createElement('a-box');
            pillarCore.setAttribute('width', pillar.width.toFixed(2));
            pillarCore.setAttribute('depth', pillar.depth.toFixed(2));
            pillarCore.setAttribute('height', pillar.height);
            pillarCore.setAttribute('color', pillar.tone);
            pillarCore.setAttribute('position', `0 ${pillar.height / 2} 0`);
            pillarCore.setAttribute('material', 'shader: flat');
            pillarCore.setAttribute('animation__glow', `property: material.color; dir: alternate; dur: ${12000 + index * 1500}; easing: easeInOutSine; loop: true; to: #a0b6d0`);
            pillarGroup.appendChild(pillarCore);

            const baseEl = document.createElement('a-cylinder');
            const baseRadius = (Math.max(pillar.width, pillar.depth) * 0.65).toFixed(2);
            baseEl.setAttribute('radius', baseRadius);
            baseEl.setAttribute('height', '0.6');
            baseEl.setAttribute('color', pillar.baseColor || '#607593');
            baseEl.setAttribute('material', 'shader: flat');
            baseEl.setAttribute('position', '0 0.3 0');
            pillarGroup.appendChild(baseEl);

            const accentHeights = pillar.accentRatios || [0.18, 0.42, 0.68, 0.92];
            accentHeights.forEach((ratio) => {
                const accent = document.createElement('a-cylinder');
                const accentRadius = (Math.max(pillar.width, pillar.depth) * (0.42 + ratio * 0.12)).toFixed(2);
                accent.setAttribute('radius', accentRadius);
                accent.setAttribute('height', '0.2');
                accent.setAttribute('color', pillar.accentColor || '#9fb6cf');
                accent.setAttribute('material', 'shader: flat; opacity: 0.82');
                accent.setAttribute('position', `0 ${pillar.height * ratio} 0`);
                pillarGroup.appendChild(accent);
            });

            const halfWidth = pillar.width / 2;
            const halfDepth = pillar.depth / 2;
            const ribWidth = Math.max(0.22, pillar.width * 0.22);
            const ribDepth = Math.max(0.22, pillar.depth * 0.22);
            const ribHeight = pillar.height * 0.7;
            const ribYOffset = pillar.height * 0.25 + ribHeight / 2;
            const ribOffsets = [
                { x: halfWidth - ribWidth / 2, z: 0, width: ribWidth, depth: ribDepth * 0.6 },
                { x: -(halfWidth - ribWidth / 2), z: 0, width: ribWidth, depth: ribDepth * 0.6 },
                { x: 0, z: halfDepth - ribDepth / 2, width: ribDepth * 0.6, depth: ribDepth },
                { x: 0, z: -(halfDepth - ribDepth / 2), width: ribDepth * 0.6, depth: ribDepth }
            ];

            ribOffsets.forEach((offset) => {
                const rib = document.createElement('a-box');
                rib.setAttribute('width', offset.width.toFixed(2));
                rib.setAttribute('depth', offset.depth.toFixed(2));
                rib.setAttribute('height', ribHeight.toFixed(2));
                rib.setAttribute('color', '#4e6178');
                rib.setAttribute('material', 'shader: flat; opacity: 0.7');
                rib.setAttribute('position', `${offset.x.toFixed(2)} ${ribYOffset.toFixed(2)} ${offset.z.toFixed(2)}`);
                pillarGroup.appendChild(rib);
            });

            const capRing = document.createElement('a-cylinder');
            const capRadius = (Math.max(pillar.width, pillar.depth) * 0.6).toFixed(2);
            capRing.setAttribute('radius', capRadius);
            capRing.setAttribute('height', '0.25');
            capRing.setAttribute('color', pillar.accentColor || '#d4e0f2');
            capRing.setAttribute('material', 'shader: flat; opacity: 0.9');
            capRing.setAttribute('position', `0 ${pillar.height - 0.25} 0`);
            pillarGroup.appendChild(capRing);

            const capGlow = document.createElement('a-sphere');
            const glowRadius = (Math.max(pillar.width, pillar.depth) * 0.35).toFixed(2);
            capGlow.setAttribute('radius', glowRadius);
            capGlow.setAttribute('color', pillar.glowColor || '#e4ebf6');
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
            { x: 26, z: -14, trunkHeight: 3.2, canopyScale: '2.6 2.8 2.6', sway: 0.18, canopyColor: '#7ec87c', highlightColor: '#a8e0a2' },
            { x: -28, z: -10, trunkHeight: 4, canopyScale: '3 3.4 3', sway: 0.24, canopyColor: '#6fc47a', highlightColor: '#97de9f' },
            { x: 24, z: 18, trunkHeight: 3.6, canopyScale: '2.4 2.6 2.4', sway: 0.16, canopyColor: '#8cd290', highlightColor: '#b6e9b8' },
            { x: -22, z: 22, trunkHeight: 3.8, canopyScale: '2.8 3 2.8', sway: 0.2, canopyColor: '#75c080', highlightColor: '#a6e0ae' },
            { x: 30, z: 28, trunkHeight: 4.4, canopyScale: '2.2 2.4 2.2', sway: 0.14, canopyColor: '#82c88a', highlightColor: '#b2e3b7' },
            { x: -34, z: 18, trunkHeight: 4.8, canopyScale: '2.6 2.9 2.6', sway: 0.22, canopyColor: '#6abd78', highlightColor: '#9ddc9f' },
            { x: 20, z: -28, trunkHeight: 3.4, canopyScale: '2.3 2.5 2.3', sway: 0.17, canopyColor: '#78c684', highlightColor: '#a7e0b0' },
            { x: -26, z: -24, trunkHeight: 4.2, canopyScale: '2.9 3.1 2.9', sway: 0.19, canopyColor: '#89ce92', highlightColor: '#bce8c1' }
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
            canopy.setAttribute('color', tree.canopyColor);
            canopy.setAttribute('material', 'shader: flat; roughness: 0.7');
            canopy.setAttribute('animation__sway', `property: rotation; dir: alternate; dur: ${6000 + index * 1200}; easing: easeInOutSine; loop: true; to: ${tree.sway * 60} ${tree.sway * 80} ${tree.sway * -40}`);
            treeGroup.appendChild(canopy);

            const canopyHighlight = document.createElement('a-sphere');
            canopyHighlight.setAttribute('position', `0 ${tree.trunkHeight + 0.8} 0`);
            canopyHighlight.setAttribute('scale', '1.2 0.8 1.2');
            canopyHighlight.setAttribute('color', tree.highlightColor);
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
