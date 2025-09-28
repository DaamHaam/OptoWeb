/* visuals/heights.js */
/* Rôle: Gère la stimulation pour l'acclimatation à la hauteur. */

import { stateManager } from '../utils/stateManager.js';
import { heightsDecorModule } from './decor_heights.js';

// --- Private State ---
let sceneEl, rigEl;
let platformEl;
let skyEl;
let animationFrameId;
let actualSpeed = 0;
let targetSpeed = 0;
const smoothingFactor = 2.0; // Facteur de lissage pour une décélération douce
let lastFrameTime = 0;
let originalSkyColor = null;

const MIN_HEIGHT = 1;
const MIN_SCALE = 0.5;
const MAX_SCALE = 1;
const PLATFORM_BASE_RADIUS = 2.2;
const PLATFORM_TOP_RADIUS = 2.0;
const PLATFORM_GUARD_OFFSET = 1.5;
const PLATFORM_STRIPE_OFFSET = 0.9;
const PLATFORM_STRIPE_WIDTH = 0.5;
const PLATFORM_STRIPE_DEPTH = 0.2;
const PLATFORM_RAIL_WIDTH = 3.2;

let currentScale = 1;

let baseEl;
let topSurfaceEl;
let centerMarker;
let stripeEls = [];
let postEls = [];
let horizontalRailEls = [];
let verticalRailEls = [];

function _clampScale(scale) {
    if (Number.isNaN(scale)) {
        return currentScale;
    }
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

function _syncSpeedState(speedValue) {
    const currentState = stateManager.getState();
    if (!currentState.visual || !currentState.visual.speeds) {
        return;
    }

    const currentYSpeed = currentState.visual.speeds.y;
    if (currentYSpeed === speedValue) {
        return;
    }

    const updatedSpeeds = {
        ...currentState.visual.speeds,
        y: speedValue
    };

    stateManager.setState({
        visual: {
            ...currentState.visual,
            speeds: updatedSpeeds
        }
    });
}

function _applyPlatformScale() {
    if (!platformEl) {
        return;
    }

    const scale = currentScale;

    if (baseEl) {
        baseEl.setAttribute('radius', PLATFORM_BASE_RADIUS * scale);
    }
    if (topSurfaceEl) {
        topSurfaceEl.setAttribute('radius', PLATFORM_TOP_RADIUS * scale);
    }
    if (centerMarker) {
        centerMarker.setAttribute('radius', 0.35 * scale);
    }

    stripeEls.forEach((stripeEl, index) => {
        const axis = index < 2 ? 'z' : 'x';
        const offset = PLATFORM_STRIPE_OFFSET * scale;
        const width = PLATFORM_STRIPE_WIDTH * scale;
        const depth = PLATFORM_STRIPE_DEPTH * scale;

        stripeEl.setAttribute('width', width);
        stripeEl.setAttribute('depth', depth);

        if (axis === 'z') {
            const z = index === 0 ? offset : -offset;
            stripeEl.setAttribute('position', `0 0.045 ${z}`);
        } else {
            const x = index === 2 ? offset : -offset;
            stripeEl.setAttribute('position', `${x} 0.045 0`);
        }
    });

    postEls.forEach((postEl, index) => {
        const signX = index % 2 === 0 ? 1 : -1;
        const signZ = index < 2 ? 1 : -1;
        const x = PLATFORM_GUARD_OFFSET * scale * signX;
        const z = PLATFORM_GUARD_OFFSET * scale * signZ;
        postEl.setAttribute('radius', 0.05 * scale);
        postEl.setAttribute('position', `${x} 0.55 ${z}`);
    });

    horizontalRailEls.forEach((railEl, index) => {
        const z = (index === 0 ? 1 : -1) * PLATFORM_GUARD_OFFSET * scale;
        railEl.setAttribute('width', PLATFORM_RAIL_WIDTH * scale);
        railEl.setAttribute('position', `0 0.8 ${z}`);
    });

    verticalRailEls.forEach((railEl, index) => {
        const x = (index === 0 ? 1 : -1) * PLATFORM_GUARD_OFFSET * scale;
        railEl.setAttribute('width', PLATFORM_RAIL_WIDTH * scale);
        railEl.setAttribute('position', `${x} 0.8 0`);
    });
}

function _setHeight(newHeight) {
    if (!rigEl || !platformEl) {
        return;
    }

    rigEl.object3D.position.y = newHeight;
    platformEl.object3D.position.y = newHeight;
}

// --- Core Logic ---
function _createElements() {
    // Conteneur principal de la plateforme et de ses éléments décoratifs
    platformEl = document.createElement('a-entity');
    platformEl.setAttribute('id', 'height-platform');
    platformEl.setAttribute('position', '0 0 -2');

    // Socle principal (base large)
    baseEl = document.createElement('a-cylinder');
    baseEl.setAttribute('radius', '2.2');
    baseEl.setAttribute('height', '0.3');
    baseEl.setAttribute('color', '#2c3e50');
    baseEl.setAttribute('position', '0 -0.15 0');
    baseEl.setAttribute('segments-radial', '24');
    platformEl.appendChild(baseEl);

    // Plateau supérieur avec une teinte plus claire
    topSurfaceEl = document.createElement('a-cylinder');
    topSurfaceEl.setAttribute('radius', '2');
    topSurfaceEl.setAttribute('height', '0.08');
    topSurfaceEl.setAttribute('color', '#4A90E2');
    topSurfaceEl.setAttribute('position', '0 0 0');
    topSurfaceEl.setAttribute('material', 'shader: flat; metalness: 0.1; roughness: 0.4');
    platformEl.appendChild(topSurfaceEl);

    // Marqueur central pour aider à se positionner
    centerMarker = document.createElement('a-cylinder');
    centerMarker.setAttribute('radius', '0.35');
    centerMarker.setAttribute('height', '0.01');
    centerMarker.setAttribute('color', '#f8f9fa');
    centerMarker.setAttribute('position', '0 0.045 0');
    platformEl.appendChild(centerMarker);

    // Bandes directionnelles (N, S, E, O)
    const stripeData = [
        { x: 0, z: 0.9, rotation: '0 0 0' },
        { x: 0, z: -0.9, rotation: '0 0 0' },
        { x: 0.9, z: 0, rotation: '0 90 0' },
        { x: -0.9, z: 0, rotation: '0 90 0' }
    ];

    stripeEls = stripeData.map((stripe) => {
        const stripeEl = document.createElement('a-box');
        stripeEl.setAttribute('depth', '0.2');
        stripeEl.setAttribute('height', '0.01');
        stripeEl.setAttribute('width', '0.5');
        stripeEl.setAttribute('color', '#d9e8ff');
        stripeEl.setAttribute('opacity', '0.9');
        stripeEl.setAttribute('position', `${stripe.x} 0.045 ${stripe.z}`);
        stripeEl.setAttribute('rotation', stripe.rotation);
        platformEl.appendChild(stripeEl);
        return stripeEl;
    });

    // Potelets de sécurité aux quatre coins
    const postPositions = [
        { x: 1.5, z: 1.5 },
        { x: -1.5, z: 1.5 },
        { x: 1.5, z: -1.5 },
        { x: -1.5, z: -1.5 }
    ];

    postEls = postPositions.map((pos) => {
        const postEl = document.createElement('a-cylinder');
        postEl.setAttribute('radius', '0.05');
        postEl.setAttribute('height', '1.1');
        postEl.setAttribute('color', '#cfd9e8');
        postEl.setAttribute('position', `${pos.x} 0.55 ${pos.z}`);
        platformEl.appendChild(postEl);
        return postEl;
    });

    // Rubans de sécurité semi-transparents
    const horizontalRails = [
        { position: '0 0.8 1.5', rotation: '0 0 0' },
        { position: '0 0.8 -1.5', rotation: '0 0 0' }
    ];

    horizontalRailEls = horizontalRails.map((rail) => {
        const railEl = document.createElement('a-box');
        railEl.setAttribute('width', '3.2');
        railEl.setAttribute('height', '0.06');
        railEl.setAttribute('depth', '0.02');
        railEl.setAttribute('color', '#b3c4e0');
        railEl.setAttribute('opacity', '0.55');
        railEl.setAttribute('position', rail.position);
        railEl.setAttribute('rotation', rail.rotation);
        platformEl.appendChild(railEl);
        return railEl;
    });

    const verticalRails = [
        { position: '1.5 0.8 0', rotation: '0 90 0' },
        { position: '-1.5 0.8 0', rotation: '0 90 0' }
    ];

    verticalRailEls = verticalRails.map((rail) => {
        const railEl = document.createElement('a-box');
        railEl.setAttribute('width', '3.2');
        railEl.setAttribute('height', '0.06');
        railEl.setAttribute('depth', '0.02');
        railEl.setAttribute('color', '#b3c4e0');
        railEl.setAttribute('opacity', '0.55');
        railEl.setAttribute('position', rail.position);
        railEl.setAttribute('rotation', rail.rotation);
        platformEl.appendChild(railEl);
        return railEl;
    });

    sceneEl.appendChild(platformEl);

    _applyPlatformScale();
    _setHeight(MIN_HEIGHT);
}

function _animate(time) {
    const dt = (time - lastFrameTime) / 1000;
    lastFrameTime = time;

    // Lisser la vitesse actuelle vers la vitesse cible
    actualSpeed += (targetSpeed - actualSpeed) * (1 - Math.exp(-dt * smoothingFactor));

    // Arrêter le mouvement si la vitesse est négligeable
    if (Math.abs(actualSpeed) < 0.01) {
        actualSpeed = 0;
    }

    if (rigEl && platformEl && Math.abs(actualSpeed) > 0) {
        let newY = rigEl.object3D.position.y + actualSpeed * dt; // Vitesse par seconde

        if (newY < MIN_HEIGHT) {
            newY = MIN_HEIGHT;
            actualSpeed = 0;
            targetSpeed = 0;
            _syncSpeedState(0);
        }

        _setHeight(newY);
    }

    animationFrameId = requestAnimationFrame(_animate);
}

// --- Public Interface ---
export const heightsModule = {
    init(_sceneEl, _rigEl) {
        sceneEl = _sceneEl;
        rigEl = _rigEl;

        stateManager.subscribe(this.onStateChange.bind(this));

        // Créer le décor via son module dédié
        heightsDecorModule.create(sceneEl);

        skyEl = sceneEl.querySelector('#sky');
        if (skyEl) {
            originalSkyColor = skyEl.getAttribute('color');
            skyEl.setAttribute('color', '#8dc6ff');
        }

        // Réinitialiser la position et la rotation du rig pour cet exercice.
        if (rigEl) {
            rigEl.object3D.position.set(0, MIN_HEIGHT, -2);
            rigEl.object3D.rotation.set(0, 0, 0);
        }

        _createElements();
        lastFrameTime = performance.now();
        
        // Lancer correctement la boucle d'animation
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        animationFrameId = requestAnimationFrame(_animate);

        _syncSpeedState(0);
    },

    onStateChange(newState) {
        if (newState.visual.speeds.y !== targetSpeed) {
            this.setSpeed(newState.visual.speeds.y);
        }
    },

    cleanup() {
        // Nettoyer le décor via son module dédié
        heightsDecorModule.cleanup();

        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        if (platformEl && platformEl.parentNode) {
            platformEl.parentNode.removeChild(platformEl);
        }
        platformEl = null;
        baseEl = null;
        topSurfaceEl = null;
        centerMarker = null;
        stripeEls = [];
        postEls = [];
        horizontalRailEls = [];
        verticalRailEls = [];
        actualSpeed = 0;
        targetSpeed = 0;
        // Réinitialiser la position du rig
        if (rigEl) {
            rigEl.object3D.position.y = MIN_HEIGHT;
        }
        if (skyEl) {
            if (originalSkyColor) {
                skyEl.setAttribute('color', originalSkyColor);
            } else {
                skyEl.removeAttribute('color');
            }
        }
        skyEl = null;
        originalSkyColor = null;

        _syncSpeedState(0);
        animationFrameId = null;
    },

    regenerate() {
        if (rigEl) {
            rigEl.object3D.position.set(0, MIN_HEIGHT, -2);
            rigEl.object3D.rotation.set(0, 0, 0);
        }

        if (platformEl) {
            platformEl.object3D.position.set(0, MIN_HEIGHT, -2);
        }

        _setHeight(MIN_HEIGHT);
        actualSpeed = 0;
        targetSpeed = 0;
        _applyPlatformScale();
        _syncSpeedState(0);
    },

    // --- Fonctions pour les contrôles ---
    setSpeed(speed) {
        const parsedSpeed = parseFloat(speed);
        targetSpeed = Number.isNaN(parsedSpeed) ? 0 : parsedSpeed;
    },

    /**
     * Ajuste l'échelle de la plateforme de 0.5x à 1x.
     * À connecter à l'UI de l'exercice (slider ou boutons) pour permettre aux praticiens
     * d'adapter le diamètre du plateau selon la sensation recherchée.
     * @param {number|string} scale - Nouvelle échelle souhaitée.
     * @returns {number} L'échelle effectivement appliquée.
     */
    setPlatformScale(scale) {
        const clampedScale = _clampScale(parseFloat(scale));
        currentScale = clampedScale;
        _applyPlatformScale();
        return currentScale;
    },

    /**
     * Donne la valeur courante de l'échelle de plateforme pour synchroniser l'UI.
     * @returns {{ scale: number }} Objet contenant l'échelle actuelle.
     */
    getPlatformScale() {
        return { scale: currentScale };
    },

    // --- Fonctions non utilisées mais requises ---
    setDensity() {},
    setPalette() {},
    getActualSpeed() { return { v: actualSpeed }; }
};