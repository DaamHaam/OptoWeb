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
        this.originalFog = sceneEl.getAttribute('fog');

        this.decorRoot = document.createElement('a-entity');
        this.decorRoot.setAttribute('id', 'heights-decor-root');

        // Plateau principal sous la plateforme
        const mainPlate = document.createElement('a-circle');
        mainPlate.setAttribute('radius', '60');
        mainPlate.setAttribute('color', '#f0e3c0');
        mainPlate.setAttribute('rotation', '-90 0 0');
        mainPlate.setAttribute('position', '0 -1.2 -2');
        mainPlate.setAttribute('material', 'shader: flat; roughness: 0.8');
        this.decorRoot.appendChild(mainPlate);

        const plateRim = document.createElement('a-ring');
        plateRim.setAttribute('radius-inner', '48');
        plateRim.setAttribute('radius-outer', '60');
        plateRim.setAttribute('color', '#d7c5a3');
        plateRim.setAttribute('rotation', '-90 0 0');
        plateRim.setAttribute('position', '0 -1.19 -2');
        plateRim.setAttribute('material', 'shader: flat');
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
            { x: 12, z: -10, height: 12 },
            { x: -15, z: -6, height: 16 },
            { x: 18, z: 8, height: 14 },
            { x: -9, z: 14, height: 10 }
        ];

        pillarPositions.forEach((pillar) => {
            const pillarEl = document.createElement('a-box');
            pillarEl.setAttribute('width', '2');
            pillarEl.setAttribute('depth', '2');
            pillarEl.setAttribute('height', pillar.height);
            pillarEl.setAttribute('color', '#7c8fa3');
            pillarEl.setAttribute('position', `${pillar.x} ${pillar.height / 2 - 1.2} ${pillar.z - 2}`);
            pillarEl.setAttribute('material', 'shader: flat');
            this.decorRoot.appendChild(pillarEl);
        });

        // Plates-formes flottantes simples
        const floatingPlatforms = [
            { x: 6, y: -1, z: -10, scale: '2 0.1 2' },
            { x: -8, y: -0.5, z: -14, scale: '1.5 0.1 1.5' },
            { x: 10, y: 1, z: 12, scale: '1.8 0.1 1.8' }
        ];

        floatingPlatforms.forEach((platform) => {
            const platformEl = document.createElement('a-box');
            platformEl.setAttribute('color', '#c6d6e5');
            platformEl.setAttribute('scale', platform.scale);
            platformEl.setAttribute('position', `${platform.x} ${platform.y} ${platform.z}`);
            platformEl.setAttribute('material', 'shader: flat');
            this.decorRoot.appendChild(platformEl);
        });

        // Nuages stylisés très simples et animés lentement
        const cloudData = [
            { x: 8, y: 6, z: -12, scale: '3 1.4 1.4', delay: 0 },
            { x: -10, y: 7, z: 14, scale: '2.5 1.2 1.2', delay: 2000 },
            { x: -4, y: 5, z: -16, scale: '3.4 1.5 1.5', delay: 4000 }
        ];

        cloudData.forEach((cloud) => {
            const cloudEl = document.createElement('a-sphere');
            cloudEl.setAttribute('color', '#ffffff');
            cloudEl.setAttribute('position', `${cloud.x} ${cloud.y} ${cloud.z}`);
            cloudEl.setAttribute('scale', cloud.scale);
            cloudEl.setAttribute('opacity', '0.85');
            cloudEl.setAttribute('material', 'shader: flat');
            cloudEl.setAttribute('animation__float', `property: position; dir: alternate; dur: 12000; easing: easeInOutSine; loop: true; to: ${cloud.x} ${cloud.y + 0.8} ${cloud.z}; delay: ${cloud.delay}`);
            this.decorRoot.appendChild(cloudEl);
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
