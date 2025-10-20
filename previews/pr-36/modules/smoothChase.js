// /modules/smoothChase.js
// Exercice : poursuite aléatoire avec trajectoire fluide sur un plan face à l'utilisateur.
// La cible reste toujours à la même distance le long de l'axe de vue et change de couleur
// (vert clair / rouge) selon que le pointeur la suit ou non.

const TARGET_COLOR_TRACKING = '#86EFAC';
const TARGET_COLOR_LOST = '#EF4444';

export const exerciseModule = {
    // --- DOM Elements (passés depuis main.js) ---
    rigEl: null,
    cameraEl: null,
    exerciseSubmenu: null,

    // --- Helpers (passés depuis main.js) ---
    getHorizontalForwardQuaternion: null,

    // --- Paramètres utilisateur ---
    amplitude: 2,
    speed: 0.75,
    targetSize: 0.25,
    targetDistance: 3.75, // distance fixe en profondeur (identique au pointeur)

    // --- Références DOM ---
    amplitudeSlider: null,
    amplitudeValueLabel: null,
    speedSlider: null,
    speedValueLabel: null,
    sizeSlider: null,
    sizeValueLabel: null,
    startButton: null,

    // --- État interne ---
    isActive: false,
    referenceQuaternion: null,
    originPosition: null,
    offset2D: null,
    velocity2D: null,
    targetVelocity2D: null,
    directionChangeInterval: 1.5,
    timeSinceDirectionChange: 0,
    targetRadius: 0.25,
    planeCenter: null,
    forwardVector: null,
    rightVector: null,
    upVector: null,

    // --- Entités A-Frame ---
    pointerEl: null,
    targetEl: null,

    // --- Vecteurs temporaires (évite de recréer à chaque tick) ---
    worldOffsetHelper: null,
    targetWorldHelper: null,
    localPositionHelper: null,
    pointerWorldHelper: null,

    init: function(helpers) {
        this.rigEl = helpers.rigEl;
        this.cameraEl = helpers.cameraEl;
        this.exerciseSubmenu = helpers.exerciseSubmenu;
        this.getHorizontalForwardQuaternion = helpers.getHorizontalForwardQuaternion;

        this.renderSubmenu();
        this.bindUIEvents();
        this.updateDisplayedValues();
    },

    cleanup: function() {
        this.stop();
        if (this.exerciseSubmenu) {
            this.exerciseSubmenu.innerHTML = '';
        }
        this.resetUIReferences();
    },

    recenter: function({ getHorizontalForwardQuaternion } = {}) {
        if (getHorizontalForwardQuaternion) {
            this.getHorizontalForwardQuaternion = getHorizontalForwardQuaternion;
        }
        if (!this.cameraEl || !this.getHorizontalForwardQuaternion) {
            return;
        }
        if (!this.referenceQuaternion) {
            this.referenceQuaternion = new THREE.Quaternion();
        }
        this.referenceQuaternion.copy(this.getHorizontalForwardQuaternion());

        if (!this.originPosition) {
            this.originPosition = new THREE.Vector3();
        }
        this.cameraEl.object3D.getWorldPosition(this.originPosition);

        this.refreshPlaneFrame();
        if (this.isActive) {
            this.updateTargetTransform();
        }
    },

    start: function() {
        if (this.isActive) {
            return;
        }
        this.isActive = true;

        this.amplitude = parseFloat(this.amplitudeSlider.value);
        this.speed = parseFloat(this.speedSlider.value);
        this.targetSize = parseFloat(this.sizeSlider.value);
        this.targetRadius = this.targetSize;

        this.recenter({ getHorizontalForwardQuaternion: this.getHorizontalForwardQuaternion });

        this.offset2D = new THREE.Vector2();
        this.velocity2D = new THREE.Vector2();
        this.targetVelocity2D = new THREE.Vector2();
        this.timeSinceDirectionChange = 0;
        this.directionChangeInterval = 1 + Math.random();

        this.worldOffsetHelper = new THREE.Vector3();
        this.targetWorldHelper = new THREE.Vector3();
        this.localPositionHelper = new THREE.Vector3();
        this.pointerWorldHelper = new THREE.Vector3();

        this.createPointer();
        this.createTarget();
        this.updateTargetTransform();
        this.pickNewDirection();
        this.setControlsDisabled(true);
        this.updateStartButtonLabel();
    },

    stop: function() {
        if (!this.isActive) {
            this.destroyPointer();
            this.destroyTarget();
            this.setControlsDisabled(false);
            this.updateStartButtonLabel();
            return;
        }

        this.isActive = false;
        this.destroyPointer();
        this.destroyTarget();
        this.referenceQuaternion = null;
        this.originPosition = null;
        this.offset2D = null;
        this.velocity2D = null;
        this.targetVelocity2D = null;
        this.timeSinceDirectionChange = 0;
        this.directionChangeInterval = 1.5;
        this.planeCenter = null;
        this.forwardVector = null;
        this.rightVector = null;
        this.upVector = null;
        this.setControlsDisabled(false);
        this.updateStartButtonLabel();
    },

    tick: function(time, timeDelta) {
        if (!this.isActive || !this.pointerEl || !this.targetEl || !this.referenceQuaternion || !this.originPosition) {
            return;
        }
        const deltaSeconds = timeDelta / 1000;
        if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {
            return;
        }

        this.timeSinceDirectionChange += deltaSeconds;
        if (this.timeSinceDirectionChange >= this.directionChangeInterval) {
            this.pickNewDirection();
        }

        const smoothingFactor = 1 - Math.exp(-deltaSeconds * 4);
        this.velocity2D.lerp(this.targetVelocity2D, smoothingFactor);
        this.offset2D.addScaledVector(this.velocity2D, deltaSeconds);

        const amplitude = this.amplitude;
        const offsetLength = this.offset2D.length();
        if (offsetLength > amplitude && offsetLength > 0) {
            this.offset2D.setLength(amplitude);
            const correctionDirection = this.offset2D.clone().multiplyScalar(-1).normalize();
            const correctionVelocity = correctionDirection.multiplyScalar(this.speed);
            const correctionFactor = 1 - Math.exp(-deltaSeconds * 6);
            this.velocity2D.lerp(correctionVelocity, correctionFactor);
        }

        this.updateTargetTransform();

        this.pointerEl.object3D.getWorldPosition(this.pointerWorldHelper);
        this.targetEl.object3D.getWorldPosition(this.targetWorldHelper);
        const distance = this.pointerWorldHelper.distanceTo(this.targetWorldHelper);
        const trackingThreshold = this.targetRadius + 0.05;
        this.updateTargetColor(distance <= trackingThreshold);
    },

    // --- Helpers internes ---
    renderSubmenu: function() {
        this.exerciseSubmenu.innerHTML = `
            <div class="submenu-item">
                <label for="smooth-chase-amplitude">Amplitude</label>
                <input type="range" id="smooth-chase-amplitude" min="0.5" max="4" step="0.1" value="${this.amplitude}">
                <span id="smooth-chase-amplitude-value"></span>
            </div>
            <div class="submenu-item">
                <label for="smooth-chase-speed">Vitesse</label>
                <input type="range" id="smooth-chase-speed" min="0.25" max="3" step="0.05" value="${this.speed}">
                <span id="smooth-chase-speed-value"></span>
            </div>
            <div class="submenu-item">
                <label for="smooth-chase-size">Taille cible</label>
                <input type="range" id="smooth-chase-size" min="0.1" max="0.4" step="0.01" value="${this.targetSize}">
                <span id="smooth-chase-size-value"></span>
            </div>
            <button type="button" id="smooth-chase-toggle">Démarrer</button>
        `;

        this.amplitudeSlider = document.getElementById('smooth-chase-amplitude');
        this.amplitudeValueLabel = document.getElementById('smooth-chase-amplitude-value');
        this.speedSlider = document.getElementById('smooth-chase-speed');
        this.speedValueLabel = document.getElementById('smooth-chase-speed-value');
        this.sizeSlider = document.getElementById('smooth-chase-size');
        this.sizeValueLabel = document.getElementById('smooth-chase-size-value');
        this.startButton = document.getElementById('smooth-chase-toggle');
    },

    bindUIEvents: function() {
        if (!this.exerciseSubmenu) {
            return;
        }
        this.amplitudeSlider.addEventListener('input', () => {
            this.amplitude = parseFloat(this.amplitudeSlider.value);
            this.updateAmplitudeLabel();
        });

        this.speedSlider.addEventListener('input', () => {
            this.speed = parseFloat(this.speedSlider.value);
            this.updateSpeedLabel();
        });

        this.sizeSlider.addEventListener('input', () => {
            this.targetSize = parseFloat(this.sizeSlider.value);
            this.targetRadius = this.targetSize;
            this.updateSizeLabel();
            if (this.targetEl) {
                this.targetEl.setAttribute('radius', this.targetRadius);
            }
        });

        this.startButton.addEventListener('click', () => {
            if (this.isActive) {
                this.stop();
            } else {
                this.start();
            }
            this.startButton.blur();
        });
    },

    updateDisplayedValues: function() {
        this.updateAmplitudeLabel();
        this.updateSpeedLabel();
        this.updateSizeLabel();
        this.updateStartButtonLabel();
    },

    updateAmplitudeLabel: function() {
        if (this.amplitudeValueLabel) {
            this.amplitudeValueLabel.textContent = `${this.amplitude.toFixed(1)} m`;
        }
    },

    updateSpeedLabel: function() {
        if (this.speedValueLabel) {
            this.speedValueLabel.textContent = `${this.speed.toFixed(2)} m/s`;
        }
    },

    updateSizeLabel: function() {
        if (this.sizeValueLabel) {
            this.sizeValueLabel.textContent = `${Math.round(this.targetSize * 100)} cm`;
        }
    },

    updateStartButtonLabel: function() {
        if (this.startButton) {
            this.startButton.textContent = this.isActive ? 'Arrêter' : 'Démarrer';
        }
    },

    setControlsDisabled: function(disabled) {
        if (this.amplitudeSlider) this.amplitudeSlider.disabled = disabled;
        if (this.speedSlider) this.speedSlider.disabled = disabled;
        if (this.sizeSlider) this.sizeSlider.disabled = disabled;
    },

    updateTargetColor: function(isTracking) {
        if (!this.targetEl) {
            return;
        }
        this.targetEl.setAttribute('color', isTracking ? TARGET_COLOR_TRACKING : TARGET_COLOR_LOST);
    },

    pickNewDirection: function() {
        if (!this.targetVelocity2D) {
            this.targetVelocity2D = new THREE.Vector2();
        }
        const theta = Math.random() * Math.PI * 2;
        this.targetVelocity2D.set(Math.cos(theta), Math.sin(theta)).multiplyScalar(this.speed);
        this.timeSinceDirectionChange = 0;
        this.directionChangeInterval = 1 + Math.random();
    },

    createPointer: function() {
        this.destroyPointer();
        this.pointerEl = document.createElement('a-sphere');
        this.pointerEl.setAttribute('color', 'red');
        this.pointerEl.setAttribute('radius', '0.03');
        this.pointerEl.setAttribute('position', '0 0 -3.75');
        this.cameraEl.appendChild(this.pointerEl);
    },

    destroyPointer: function() {
        if (this.pointerEl && this.pointerEl.parentNode) {
            this.pointerEl.parentNode.removeChild(this.pointerEl);
        }
        this.pointerEl = null;
    },

    createTarget: function() {
        this.destroyTarget();
        this.targetEl = document.createElement('a-sphere');
        this.targetEl.setAttribute('radius', this.targetRadius);
        this.updateTargetColor(true);
        this.rigEl.appendChild(this.targetEl);
    },

    destroyTarget: function() {
        if (this.targetEl && this.targetEl.parentNode) {
            this.targetEl.parentNode.removeChild(this.targetEl);
        }
        this.targetEl = null;
    },

    resetUIReferences: function() {
        this.amplitudeSlider = null;
        this.amplitudeValueLabel = null;
        this.speedSlider = null;
        this.speedValueLabel = null;
        this.sizeSlider = null;
        this.sizeValueLabel = null;
        this.startButton = null;
    },

    refreshPlaneFrame: function() {
        if (!this.referenceQuaternion || !this.originPosition) {
            return;
        }

        if (!this.forwardVector) this.forwardVector = new THREE.Vector3();
        if (!this.rightVector) this.rightVector = new THREE.Vector3();
        if (!this.upVector) this.upVector = new THREE.Vector3();
        if (!this.planeCenter) this.planeCenter = new THREE.Vector3();

        this.forwardVector.set(0, 0, -1).applyQuaternion(this.referenceQuaternion).normalize();
        this.rightVector.set(1, 0, 0).applyQuaternion(this.referenceQuaternion).normalize();
        this.upVector.set(0, 1, 0).applyQuaternion(this.referenceQuaternion).normalize();

        this.planeCenter.copy(this.originPosition).addScaledVector(this.forwardVector, this.targetDistance);
    },

    updateTargetTransform: function() {
        if (!this.targetEl || !this.rigEl) {
            return;
        }
        if (!this.offset2D) {
            return;
        }
        if (!this.planeCenter || !this.rightVector || !this.upVector) {
            this.refreshPlaneFrame();
            if (!this.planeCenter || !this.rightVector || !this.upVector) {
                return;
            }
        }

        if (!this.worldOffsetHelper) this.worldOffsetHelper = new THREE.Vector3();
        if (!this.targetWorldHelper) this.targetWorldHelper = new THREE.Vector3();
        if (!this.localPositionHelper) this.localPositionHelper = new THREE.Vector3();

        this.worldOffsetHelper.set(0, 0, 0);
        this.worldOffsetHelper.addScaledVector(this.rightVector, this.offset2D.x);
        this.worldOffsetHelper.addScaledVector(this.upVector, this.offset2D.y);

        this.targetWorldHelper.copy(this.planeCenter).add(this.worldOffsetHelper);

        this.localPositionHelper.copy(this.targetWorldHelper);
        this.rigEl.object3D.worldToLocal(this.localPositionHelper);

        this.targetEl.object3D.position.copy(this.localPositionHelper);
        this.targetEl.object3D.matrixWorldNeedsUpdate = true;
    }
};
