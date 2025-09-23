// /modules/targetPointer.js
export const exerciseModule = {
    // --- DOM Elements (passed from main.js) ---
    rigEl: null,
    cameraEl: null,
    exerciseSubmenu: null,

    // --- Helpers (passed from main.js) ---
    getHorizontalForwardQuaternion: null,

    // --- Internal State ---
    targetSizes: [0.1, 0.175, 0.25, 0.325, 0.4],
    currentTargetSizeIndex: 2, // Default to 'Moyenne'

    // --- Animation State ---
    movementType: 'none', // 'none', 'horizontal', 'vertical', 'lemniscate', 'lemniscate-vertical'
    animationTime: 0,
    referenceQuaternion: null, // Stores the rig's orientation when movement starts

    // Horizontal/Vertical settings
    amplitude: 20, // degrees
    speed: 0.2, // cycles per second

    // Lemniscate settings
    lemniscateSize: 1, // scale factor
    lemniscateSpeed: 0.5,
    lemniscateDirection: 1, // 1 for normal, -1 for reverse

    target: {
        element: null,
        toggle: function(rigEl, module) {
            if (this.element) {
                this.element.parentNode.removeChild(this.element);
                this.element = null;
            } else {
                this.element = document.createElement('a-ring');
                this.element.setAttribute('color', 'blue');

                const outerRadius = module.targetSizes[module.currentTargetSizeIndex];
                const innerRadius = outerRadius * 0.8;
                this.element.setAttribute('radius-inner', innerRadius);
                this.element.setAttribute('radius-outer', outerRadius);

                this.element.setAttribute('position', '0 1.6 -5');
                rigEl.appendChild(this.element);
            }
            const t = document.getElementById('target-toggle');
            if (t) t.checked = !!this.element;
        }
    },
    pointer: {
        element: null,
        toggle: function(cameraEl) {
            if (this.element) {
                this.element.parentNode.removeChild(this.element);
                this.element = null;
            } else {
                this.element = document.createElement('a-sphere');
                this.element.setAttribute('color', 'red');
                this.element.setAttribute('radius', '0.015');
                this.element.setAttribute('position', '0 0 -3.75');
                cameraEl.appendChild(this.element);
            }
            const p = document.getElementById('pointer-toggle');
            if (p) p.checked = !!this.element;
        }
    },

    updateTargetSize: function() {
        const slider = document.getElementById('target-size-slider');
        if (!slider) return;

        this.currentTargetSizeIndex = parseInt(slider.value, 10) - 1;
        const sizeValueLabel = document.getElementById('target-size-value');
        if (sizeValueLabel) {
            sizeValueLabel.textContent = parseInt(slider.value, 10);
        }

        if (this.target.element) {
            const newOuterRadius = this.targetSizes[this.currentTargetSizeIndex];
            const newInnerRadius = newOuterRadius * 0.8; // Maintain ratio
            this.target.element.setAttribute('radius-outer', newOuterRadius);
            this.target.element.setAttribute('radius-inner', newInnerRadius);
        }
    },

    init: function(helpers) {
        this.rigEl = helpers.rigEl;
        this.cameraEl = helpers.cameraEl;
        this.exerciseSubmenu = helpers.exerciseSubmenu;
        this.getHorizontalForwardQuaternion = helpers.getHorizontalForwardQuaternion;

        this.renderSubmenu();
        this.bindEvents();

        if (!this.target.element) {
            this.target.toggle(this.rigEl, this);
        }
        document.getElementById('target-toggle').checked = !!this.target.element;

        if (!this.pointer.element) {
            this.pointer.toggle(this.cameraEl);
        }
        document.getElementById('pointer-toggle').checked = !!this.pointer.element;

        this.recenter(helpers);
    },

    renderSubmenu: function() {
        this.exerciseSubmenu.innerHTML = `
            <div class="submenu-item"><label for="target-toggle">Afficher la cible (C)</label><input type="checkbox" id="target-toggle"></div>
            <div class="submenu-item"><label for="pointer-toggle">Afficher le pointeur (P)</label><input type="checkbox" id="pointer-toggle"></div>
            <div class="submenu-item">
                <label for="target-size-slider">Taille Cible</label>
                <input type="range" id="target-size-slider" min="1" max="5" value="${this.currentTargetSizeIndex + 1}">
                <span id="target-size-value">${this.currentTargetSizeIndex + 1}</span>
            </div>
            <hr>
            <div class="submenu-item">
                <label for="movement-type-select">Mouvement Cible</label>
                <select id="movement-type-select">
                    <option value="none" selected>Aucun</option>
                    <option value="horizontal">Horizontal</option>
                    <option value="vertical">Vertical</option>
                    <option value="lemniscate">∞</option>
                    <option value="lemniscate-vertical">8</option>
                </select>
            </div>
            <div id="movement-controls"></div>
        `;
        this.updateMovementControls();
    },

    updateMovementControls: function() {
        const controlsContainer = document.getElementById('movement-controls');
        let html = '';

        if (this.movementType === 'horizontal' || this.movementType === 'vertical') {
            html = `
                <div class="submenu-item">
                    <label for="amplitude-slider">Amplitude</label>
                    <input type="range" id="amplitude-slider" min="5" max="45" value="${this.amplitude}">
                    <span id="amplitude-value">${this.amplitude}°</span>
                </div>
                <div class="submenu-item">
                    <label for="speed-slider">Vitesse</label>
                    <input type="range" id="speed-slider" min="0.05" max="1" step="0.05" value="${this.speed}">
                    <span id="speed-value">${this.speed.toFixed(2)} Hz</span>
                </div>
            `;
        } else if (this.movementType === 'lemniscate' || this.movementType === 'lemniscate-vertical') {
            html = `
                <div class="submenu-item">
                    <label for="lemniscate-size-slider">Taille</label>
                    <input type="range" id="lemniscate-size-slider" min="0.2" max="2" step="0.1" value="${this.lemniscateSize}">
                    <span id="lemniscate-size-value">${this.lemniscateSize.toFixed(1)}</span>
                </div>
                <div class="submenu-item">
                    <label for="lemniscate-speed-slider">Vitesse</label>
                    <input type="range" id="lemniscate-speed-slider" min="0.1" max="1.5" step="0.05" value="${this.lemniscateSpeed}">
                    <span id="lemniscate-speed-value">${this.lemniscateSpeed.toFixed(2)} Hz</span>
                </div>
                <div class="submenu-item">
                    <label for="lemniscate-direction-toggle">Sens</label>
                    <button id="lemniscate-direction-toggle">${this.lemniscateDirection === 1 ? 'Normal' : 'Inversé'}</button>
                </div>
            `;
        }
        controlsContainer.innerHTML = html;
        this.bindMovementControlEvents();
    },

    bindEvents: function() {
        document.getElementById('target-toggle').addEventListener('change', () => this.target.toggle(this.rigEl, this));
        document.getElementById('pointer-toggle').addEventListener('change', () => this.pointer.toggle(this.cameraEl));
        document.getElementById('target-size-slider').addEventListener('input', () => this.updateTargetSize());
        
        document.getElementById('movement-type-select').addEventListener('change', (e) => {
            this.movementType = e.target.value;
            this.animationTime = 0;

            if (this.movementType !== 'none') {
                this.referenceQuaternion = this.rigEl.object3D.quaternion.clone();
            } else {
                this.referenceQuaternion = null;
                this.recenter({ getHorizontalForwardQuaternion: this.getHorizontalForwardQuaternion });
            }
            this.updateMovementControls();
        });
    },

    bindMovementControlEvents: function() {
        if (this.movementType === 'horizontal' || this.movementType === 'vertical') {
            const amplitudeSlider = document.getElementById('amplitude-slider');
            const speedSlider = document.getElementById('speed-slider');
            amplitudeSlider.addEventListener('input', (e) => {
                this.amplitude = parseFloat(e.target.value);
                document.getElementById('amplitude-value').textContent = `${this.amplitude}°`;
            });
            speedSlider.addEventListener('input', (e) => {
                this.speed = parseFloat(e.target.value);
                document.getElementById('speed-value').textContent = `${this.speed.toFixed(2)} Hz`;
            });
        } else if (this.movementType === 'lemniscate' || this.movementType === 'lemniscate-vertical') {
            const sizeSlider = document.getElementById('lemniscate-size-slider');
            const speedSlider = document.getElementById('lemniscate-speed-slider');
            const directionToggle = document.getElementById('lemniscate-direction-toggle');
            sizeSlider.addEventListener('input', (e) => {
                this.lemniscateSize = parseFloat(e.target.value);
                document.getElementById('lemniscate-size-value').textContent = this.lemniscateSize.toFixed(1);
            });
            speedSlider.addEventListener('input', (e) => {
                this.lemniscateSpeed = parseFloat(e.target.value);
                document.getElementById('lemniscate-speed-value').textContent = this.lemniscateSpeed.toFixed(2);
            });
            directionToggle.addEventListener('click', () => {
                this.lemniscateDirection *= -1;
                directionToggle.textContent = this.lemniscateDirection === 1 ? 'Normal' : 'Inversé';
            });
        }
    },

    cleanup: function() {
        this.movementType = 'none';
        this.referenceQuaternion = null;
        if (this.target.element) {
            this.target.toggle(this.rigEl, this);
        }
        if (this.pointer.element) {
            this.pointer.toggle(this.cameraEl);
        }
        this.exerciseSubmenu.innerHTML = '';
    },

    recenter: function(helpers) {
        this.getHorizontalForwardQuaternion = helpers.getHorizontalForwardQuaternion;
        const forwardQuaternion = this.getHorizontalForwardQuaternion();

        // Mettre à jour le quaternion de référence pour le mouvement
        this.referenceQuaternion = forwardQuaternion.clone();
        this.animationTime = 0; // Réinitialiser le temps pour que le cycle reparte du début

        // Si la cible est immobile, la repositionner manuellement
        if (this.movementType === 'none' && this.target.element) {
            const position = new THREE.Vector3(0, 1.6, -5);
            position.applyQuaternion(forwardQuaternion);
            this.target.element.setAttribute('position', position);
            this.target.element.object3D.setRotationFromQuaternion(forwardQuaternion);
        }
        // Si la cible est en mouvement, la fonction tick() la repositionnera automatiquement
        // au bon endroit grâce au nouveau referenceQuaternion et à l'animationTime réinitialisé.
    },

    tick: function(time, timeDelta) {
        if (this.movementType === 'none' || !this.target.element || !this.referenceQuaternion) return;

        this.animationTime += timeDelta / 1000;
        const t = this.animationTime;

        const forwardQuaternion = this.referenceQuaternion;
        const basePosition = new THREE.Vector3(0, 1.6, -5);
        
        switch (this.movementType) {
            case 'horizontal': {
                const angle = THREE.MathUtils.degToRad(this.amplitude) * Math.sin(t * this.speed * Math.PI * 2);
                const oscillationQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
                const finalRotation = forwardQuaternion.clone().multiply(oscillationQuaternion);
                const finalPosition = basePosition.clone().applyQuaternion(finalRotation);
                this.target.element.setAttribute('position', finalPosition);
                this.target.element.object3D.setRotationFromQuaternion(finalRotation);
                break;
            }
            case 'vertical': {
                const angle = THREE.MathUtils.degToRad(this.amplitude) * Math.sin(t * this.speed * Math.PI * 2);
                const rigRight = new THREE.Vector3(1, 0, 0).applyQuaternion(forwardQuaternion);
                const oscillationQuaternion = new THREE.Quaternion().setFromAxisAngle(rigRight, angle);
                const finalRotation = forwardQuaternion.clone().multiply(oscillationQuaternion);
                const finalPosition = basePosition.clone().applyQuaternion(finalRotation);
                this.target.element.setAttribute('position', finalPosition);
                this.target.element.object3D.setRotationFromQuaternion(finalRotation);
                break;
            }
            case 'lemniscate':
            case 'lemniscate-vertical': {
                const scale = this.lemniscateSize;
                const speed = this.lemniscateSpeed * this.lemniscateDirection;
                const cos_t = Math.cos(t * speed);
                const sin_t = Math.sin(t * speed);
                const sin_2t = Math.sin(2 * t * speed);

                let x = scale * cos_t;
                let y = scale * sin_2t / 2;

                if (this.movementType === 'lemniscate-vertical') {
                    [x, y] = [y, x];
                }
                
                const offset = new THREE.Vector3(x, y, 0);
                const finalPosition = basePosition.clone().applyQuaternion(forwardQuaternion).add(offset.applyQuaternion(forwardQuaternion));
                this.target.element.setAttribute('position', finalPosition);
                this.target.element.object3D.setRotationFromQuaternion(forwardQuaternion);
                break;
            }
        }
    },

    handleKey: function(key) {
        if (key === 'c') {
            this.target.toggle(this.rigEl, this);
        }
        if (key === 'p') {
            this.pointer.toggle(this.cameraEl);
        }
    }
};