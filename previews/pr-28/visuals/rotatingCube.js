
/* visuals/rotatingCube.js */
/* Rôle: Gère une stimulation visuelle simple avec un cube en rotation. */

import { stateManager } from '../utils/stateManager.js';

// --- Private State ---
let sceneEl;
let cubeEl;
let animationFrameId;
let rotationSpeed = 0.5; // Vitesse de rotation en degrés par frame
let unsubscribeFromState = null;

// --- Core Logic ---

function _createCube() {
    cubeEl = document.createElement('a-box');
    cubeEl.setAttribute('position', '0 1.6 -4');
    cubeEl.setAttribute('color', '#4CC3D9');
    cubeEl.setAttribute('scale', '1 1 1');
    sceneEl.appendChild(cubeEl);
}

function _animate() {
    if (cubeEl) {
        cubeEl.object3D.rotation.y += THREE.MathUtils.degToRad(rotationSpeed);
        cubeEl.object3D.rotation.x += THREE.MathUtils.degToRad(rotationSpeed * 0.5);
    }
    animationFrameId = requestAnimationFrame(_animate);
}

// --- Public Interface ---
export const rotatingCubeModule = {
    init(_sceneEl, _rigEl, _cameraEl, _container) {
        sceneEl = _sceneEl;
        if (unsubscribeFromState) {
            unsubscribeFromState();
        }
        unsubscribeFromState = stateManager.subscribe(this.onStateChange.bind(this));
        _createCube();
        _animate();
    },

    onStateChange(newState) {
        if (newState.visual.speeds.t !== rotationSpeed) {
            this.setSpeed(newState.visual.speeds.t);
        }
    },

    cleanup() {
        if (unsubscribeFromState) {
            unsubscribeFromState();
            unsubscribeFromState = null;
        }
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        if (cubeEl && cubeEl.parentNode) {
            cubeEl.parentNode.removeChild(cubeEl);
        }
        cubeEl = null;
    },

    regenerate() {
        this.cleanup();
        this.init(sceneEl);
    },

    setSpeed(speed) {
        // La vitesse est un float de 0 à 10, on le mappe à une vitesse de rotation
        rotationSpeed = parseFloat(speed);
    },

    // Fonctions non utilisées mais requises par l'interface
    getActualSpeed() { return { h: 0, v: 0, t: 0 }; }, // Non pertinent ici
    setDensity(d) {},
    setPalette(p) {}
};
