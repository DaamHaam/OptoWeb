// /modules/targetPointer.js
const BASE_TARGET_DISTANCE = 4;
const POINTER_DISTANCE = BASE_TARGET_DISTANCE * 1.05;

export const exerciseModule = {
    // --- DOM Elements (passed from main.js) ---
    rigEl: null,
    cameraEl: null,
    exerciseSubmenu: null,

    // --- Helpers (passed from main.js) ---
    getHorizontalForwardQuaternion: null,
    getUserReferenceFrame: null,

    // --- Internal State ---
    targetSizes: [0.1, 0.175, 0.25, 0.325, 0.4],
    currentTargetSizeIndex: 2, // Default to 'Moyenne'
    anchorPosition: null,

    // --- Animation State ---
    movementType: 'none', // 'none', 'horizontal', 'vertical', 'lemniscate', 'lemniscate-vertical'
    animationTime: 0,
    referenceQuaternion: null, // Stores the rig's orientation when movement starts
    referenceFrame: null,
    baseDistance: BASE_TARGET_DISTANCE,
    pointerDistance: POINTER_DISTANCE,

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
                rigEl.appendChild(this.element);
                if (module && module.referenceQuaternion && module.anchorPosition) {
                    module.updateTargetTransform(module.referenceQuaternion);
                }
            }
            const t = document.getElementById('target-toggle');
            if (t) t.checked = !!this.element;
        }
    },
    pointer: {
        element: null,
        toggle: function(cameraEl, module) {
            if (this.element) {
                this.element.parentNode.removeChild(this.element);
                this.element = null;
            } else {
                this.element = document.createElement('a-sphere');
                this.element.setAttribute('color', 'red');
                this.element.setAttribute('radius', '0.015');
                const distance = module ? module.pointerDistance : 3.75;
                this.element.setAttribute('position', `0 0 -${distance}`);
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
        this.getUserReferenceFrame = helpers.getUserReferenceFrame || null;

        this.renderSubmenu();
        this.bindEvents();

        this.recenter(helpers);

        if (!this.target.element) {
            this.target.toggle(this.rigEl, this);
        } else {
            this.updateTargetTransform();
        }
        document.getElementById('target-toggle').checked = !!this.target.element;

        if (!this.pointer.element) {
            this.pointer.toggle(this.cameraEl, this);
        } else {
            this.pointer.element.setAttribute('position', `0 0 -${this.pointerDistance}`);
        }
        document.getElementById('pointer-toggle').checked = !!this.pointer.element;
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
        document.getElementById('pointer-toggle').addEventListener('change', () => this.pointer.toggle(this.cameraEl, this));
        document.getElementById('target-size-slider').addEventListener('input', () => this.updateTargetSize());
        
        document.getElementById('movement-type-select').addEventListener('change', (e) => {
            this.movementType = e.target.value;
            this.animationTime = 0;

            if (this.movementType !== 'none') {
                const frame = this.resolveReferenceFrame();
                this.referenceFrame = frame;
                this.referenceQuaternion = frame.quaternion.clone();
                this.anchorPosition = frame.position.clone();
            } else {
                this.referenceQuaternion = null;
                this.recenter({
                    getHorizontalForwardQuaternion: this.getHorizontalForwardQuaternion,
                    getUserReferenceFrame: this.getUserReferenceFrame
                });
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
            this.pointer.toggle(this.cameraEl, this);
        }
        this.exerciseSubmenu.innerHTML = '';
    },

    resolveReferenceFrame: function() {
        let quaternion = null;
        let position = null;
        let forward = null;

        if (this.getUserReferenceFrame) {
            const frame = this.getUserReferenceFrame();
            if (frame) {
                if (frame.quaternion) {
                    quaternion = frame.quaternion.clone ? frame.quaternion.clone() : frame.quaternion;
                }
                if (frame.position) {
                    position = frame.position.clone ? frame.position.clone() : frame.position;
                }
                if (frame.forward) {
                    forward = frame.forward.clone ? frame.forward.clone() : frame.forward;
                }
            }
        }

        if (!quaternion && this.getHorizontalForwardQuaternion) {
            quaternion = this.getHorizontalForwardQuaternion();
        }
        if (!position) {
            const cameraWorldPos = new THREE.Vector3();
            this.cameraEl.object3D.getWorldPosition(cameraWorldPos);
            position = cameraWorldPos.clone();
            this.rigEl.object3D.worldToLocal(position);
        }
        if (!forward) {
            forward = new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion).normalize();
        }

        return { quaternion, position, forward };
    },

    updateTargetTransform: function(rotationQuaternion = this.referenceQuaternion) {
        if (!this.target.element || !rotationQuaternion || !this.anchorPosition) return;
        const anchor = this.anchorPosition.clone();
        const offset = new THREE.Vector3(0, 0, -this.baseDistance).applyQuaternion(rotationQuaternion.clone());
        const position = anchor.add(offset);
        this.target.element.setAttribute('position', position);
        this.target.element.object3D.setRotationFromQuaternion(rotationQuaternion);
    },

    recenter: function(helpers) {
        if (helpers.getHorizontalForwardQuaternion) {
            this.getHorizontalForwardQuaternion = helpers.getHorizontalForwardQuaternion;
        }
        if (helpers.getUserReferenceFrame) {
            this.getUserReferenceFrame = helpers.getUserReferenceFrame;
        }

        const frame = this.resolveReferenceFrame();
        this.referenceFrame = frame;
        this.referenceQuaternion = frame.quaternion.clone();
        this.anchorPosition = frame.position.clone();
        this.animationTime = 0; // Réinitialiser le temps pour que le cycle reparte du début

        if (this.movementType === 'none') {
            this.updateTargetTransform(this.referenceQuaternion);
        }
        // Si la cible est en mouvement, la fonction tick() la repositionnera automatiquement
        // au bon endroit grâce au nouveau referenceQuaternion et à l'animationTime réinitialisé.
    },

    tick: function(time, timeDelta) {
        if (this.movementType === 'none' || !this.target.element || !this.referenceQuaternion || !this.anchorPosition) return;

        this.animationTime += timeDelta / 1000;
        const t = this.animationTime;

        const forwardQuaternion = this.referenceQuaternion;
        const baseVector = new THREE.Vector3(0, 0, -this.baseDistance);
        const anchor = this.anchorPosition.clone();

        switch (this.movementType) {
            case 'horizontal': {
                const angle = THREE.MathUtils.degToRad(this.amplitude) * Math.sin(t * this.speed * Math.PI * 2);
                const oscillationQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
                const finalRotation = forwardQuaternion.clone().multiply(oscillationQuaternion);
                const finalPosition = anchor.clone().add(baseVector.clone().applyQuaternion(finalRotation));
                this.target.element.setAttribute('position', finalPosition);
                this.target.element.object3D.setRotationFromQuaternion(finalRotation);
                break;
            }
            case 'vertical': {
                const angle = THREE.MathUtils.degToRad(this.amplitude) * Math.sin(t * this.speed * Math.PI * 2);
                const rigRight = new THREE.Vector3(1, 0, 0).applyQuaternion(forwardQuaternion);
                const oscillationQuaternion = new THREE.Quaternion().setFromAxisAngle(rigRight, angle);
                const finalRotation = forwardQuaternion.clone().multiply(oscillationQuaternion);
                const finalPosition = anchor.clone().add(baseVector.clone().applyQuaternion(finalRotation));
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
                const forwardOffset = baseVector.clone().applyQuaternion(forwardQuaternion);
                const finalPosition = anchor.clone().add(forwardOffset).add(offset.applyQuaternion(forwardQuaternion));
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
            this.pointer.toggle(this.cameraEl, this);
        }
    }
};
