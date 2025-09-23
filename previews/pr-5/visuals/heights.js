/* visuals/heights.js */
/* Rôle: Gère la stimulation pour l'acclimatation à la hauteur. */

import { stateManager } from '../utils/stateManager.js';
import { heightsDecorModule } from './decor_heights.js';

// --- Private State ---
let sceneEl, rigEl;
let platformEl;
let animationFrameId;
let actualSpeed = 0;
let targetSpeed = 0;
const smoothingFactor = 2.0; // Facteur de lissage pour une décélération douce
let lastFrameTime = 0;
let unsubscribeFromState = null;

// --- Core Logic ---
function _createElements() {
    // La plateforme sur laquelle le patient se tient
    platformEl = document.createElement('a-plane');
    platformEl.setAttribute('id', 'height-platform');
    platformEl.setAttribute('position', '0 0 -2');
    platformEl.setAttribute('rotation', '-90 0 0');
    platformEl.setAttribute('width', '4');
    platformEl.setAttribute('height', '4');
    platformEl.setAttribute('color', '#4A90E2'); // Bleu corporate
    platformEl.setAttribute('material', { shader: 'flat' });
    sceneEl.appendChild(platformEl);
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
        const newY = rigEl.object3D.position.y + actualSpeed * dt; // Vitesse par seconde
        rigEl.object3D.position.y = newY;
        platformEl.object3D.position.y = newY;
    }
    
    animationFrameId = requestAnimationFrame(_animate);
}

// --- Public Interface ---
export const heightsModule = {
    init(_sceneEl, _rigEl) {
        sceneEl = _sceneEl;
        rigEl = _rigEl;

        if (unsubscribeFromState) {
            unsubscribeFromState();
            unsubscribeFromState = null;
        }

        unsubscribeFromState = stateManager.subscribe(this.onStateChange.bind(this));

        // Créer le décor via son module dédié
        heightsDecorModule.create(sceneEl);

        // Réinitialiser la position et la rotation du rig pour cet exercice.
        if (rigEl) {
            rigEl.object3D.position.set(0, 0, -2);
            rigEl.object3D.rotation.set(0, 0, 0);
        }

        _createElements();
        lastFrameTime = performance.now();
        
        // Lancer correctement la boucle d'animation
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        animationFrameId = requestAnimationFrame(_animate);
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
        actualSpeed = 0;
        targetSpeed = 0;
        // Réinitialiser la position du rig
        if (rigEl) {
            rigEl.object3D.position.y = 0;
        }
        if (unsubscribeFromState) {
            unsubscribeFromState();
            unsubscribeFromState = null;
        }
    },

    regenerate() {
        if (rigEl) {
            rigEl.object3D.position.y = 0;
            if (platformEl) platformEl.object3D.position.y = 0;
            actualSpeed = 0;
            targetSpeed = 0;
        }
    },

    // --- Fonctions pour les contrôles ---
    setSpeed(speed) {
        targetSpeed = parseFloat(speed);
    },
    
    // --- Fonctions non utilisées mais requises ---
    setDensity() {},
    setPalette() {},
    getActualSpeed() { return { v: actualSpeed }; }
};
