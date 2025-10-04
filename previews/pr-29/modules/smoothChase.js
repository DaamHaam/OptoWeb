// /modules/smoothChase.js
// Exercice : poursuite aléatoire avec trajectoire fluide autour de la position initiale du patient.
// Inspiré du fonctionnement général de handleExerciseChange et des modules existants (ex. targetPointer).

const COLOR_OPTIONS = [
    { label: 'Bleu', value: '#3B82F6' },
    { label: 'Vert', value: '#22C55E' },
    { label: 'Orange', value: '#F97316' },
    { label: 'Rose', value: '#EC4899' }
];

function computeDimmedColor(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const mix = (component) => Math.round(component * 0.35 + 0x44 * 0.65);
    return `#${mix(r).toString(16).padStart(2, '0')}${mix(g).toString(16).padStart(2, '0')}${mix(b).toString(16).padStart(2, '0')}`;
}

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
    colorOptions: COLOR_OPTIONS,
    activeColorIndex: 0,

    // --- Références DOM ---
    amplitudeSlider: null,
    amplitudeValueLabel: null,
    speedSlider: null,
    speedValueLabel: null,
    sizeSlider: null,
    sizeValueLabel: null,
    colorButtons: [],
    startButton: null,

    // --- État interne ---
    isActive: false,
    referenceQuaternion: null,
    originPosition: null,
    offset: null,
    velocity: null,
    targetVelocity: null,
    directionChangeInterval: 1.5,
    timeSinceDirectionChange: 0,
    targetRadius: 0.25,

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
        this.setActiveColorButton(this.activeColorIndex);
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

        this.offset = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        this.targetVelocity = new THREE.Vector3();
        this.timeSinceDirectionChange = 0;
        this.directionChangeInterval = 1 + Math.random();

        this.worldOffsetHelper = new THREE.Vector3();
        this.targetWorldHelper = new THREE.Vector3();
        this.localPositionHelper = new THREE.Vector3();
        this.pointerWorldHelper = new THREE.Vector3();

        this.createPointer();
        this.createTarget();
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
        this.offset = null;
        this.velocity = null;
        this.targetVelocity = null;
        this.timeSinceDirectionChange = 0;
        this.directionChangeInterval = 1.5;
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
        this.velocity.lerp(this.targetVelocity, smoothingFactor);
        this.offset.addScaledVector(this.velocity, deltaSeconds);

        const amplitude = this.amplitude;
        const offsetLength = this.offset.length();
        if (offsetLength > amplitude && offsetLength > 0) {
            this.offset.setLength(amplitude);
            const correctionDirection = this.offset.clone().multiplyScalar(-1).normalize();
            const correctionVelocity = correctionDirection.multiplyScalar(this.speed);
            const correctionFactor = 1 - Math.exp(-deltaSeconds * 6);
            this.velocity.lerp(correctionVelocity, correctionFactor);
        }

        const worldOffset = this.worldOffsetHelper;
        worldOffset.copy(this.offset).applyQuaternion(this.referenceQuaternion);

        const targetWorldPosition = this.targetWorldHelper;
        targetWorldPosition.copy(this.originPosition).add(worldOffset);

        const localPosition = this.localPositionHelper;
        localPosition.copy(targetWorldPosition);
        this.rigEl.object3D.worldToLocal(localPosition);

        this.targetEl.object3D.position.copy(localPosition);
        this.targetEl.object3D.matrixWorldNeedsUpdate = true;

        const pointerWorld = this.pointerWorldHelper;
        this.pointerEl.object3D.getWorldPosition(pointerWorld);
        this.targetEl.object3D.getWorldPosition(targetWorldPosition);
        const distance = pointerWorld.distanceTo(targetWorldPosition);
        const trackingThreshold = this.targetRadius + 0.05;
        this.updateTargetColor(distance <= trackingThreshold);
    },

    // --- Helpers internes ---
    renderSubmenu: function() {
        const colorButtonsHtml = this.colorOptions
            .map((color, index) => `
                <button
                    type="button"
                    class="smooth-chase-color"
                    data-color-index="${index}"
                    title="${color.label}"
                    style="background:${color.value};width:2.4rem;height:2.4rem;border-radius:999px;border:2px solid rgba(255,255,255,0.5);margin-right:0.5rem;"
                ></button>
            `)
            .join('');

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
            <div class="submenu-item smooth-chase-colors">
                <span>Couleur</span>
                <div class="smooth-chase-color-buttons" role="group" aria-label="Couleur de la cible">
                    ${colorButtonsHtml}
                </div>
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
        this.colorButtons = Array.from(this.exerciseSubmenu.querySelectorAll('.smooth-chase-color'));
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

        this.colorButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const index = Number(button.dataset.colorIndex);
                this.setActiveColorButton(index);
            });
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
        this.colorButtons.forEach((button) => {
            button.disabled = disabled;
        });
    },

    setActiveColorButton: function(index) {
        if (Number.isNaN(index) || index < 0 || index >= this.colorOptions.length) {
            return;
        }
        this.activeColorIndex = index;
        this.colorButtons.forEach((button, i) => {
            button.classList.toggle('is-active', i === index);
            button.setAttribute('aria-pressed', i === index ? 'true' : 'false');
            button.style.boxShadow = i === index
                ? '0 0 0 2px #ffffff, 0 0 0 4px rgba(0, 0, 0, 0.4)'
                : 'none';
        });
        if (this.targetEl) {
            this.updateTargetColor(true);
        }
    },

    updateTargetColor: function(isTracking) {
        if (!this.targetEl) {
            return;
        }
        const baseColor = this.colorOptions[this.activeColorIndex].value;
        const dimmedColor = computeDimmedColor(baseColor);
        this.targetEl.setAttribute('color', isTracking ? baseColor : dimmedColor);
    },

    pickNewDirection: function() {
        if (!this.targetVelocity) {
            this.targetVelocity = new THREE.Vector3();
        }
        const u = Math.random() * 2 - 1;
        const theta = Math.random() * Math.PI * 2;
        const sqrtOneMinusUSquared = Math.sqrt(Math.max(0, 1 - u * u));
        const direction = new THREE.Vector3(
            sqrtOneMinusUSquared * Math.cos(theta),
            u,
            sqrtOneMinusUSquared * Math.sin(theta)
        );
        this.targetVelocity.copy(direction.multiplyScalar(this.speed));
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
        this.targetEl.setAttribute('radius', this.targetRadius.toString());
        this.updateTargetColor(true);
        this.rigEl.appendChild(this.targetEl);

        if (this.originPosition) {
            const initialWorldPosition = this.targetWorldHelper || new THREE.Vector3();
            initialWorldPosition.copy(this.originPosition);
            const localPosition = this.localPositionHelper || new THREE.Vector3();
            localPosition.copy(initialWorldPosition);
            this.rigEl.object3D.worldToLocal(localPosition);
            this.targetEl.object3D.position.copy(localPosition);
            this.targetEl.object3D.matrixWorldNeedsUpdate = true;
        }
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
        this.colorButtons = [];
        this.startButton = null;
    }
};
