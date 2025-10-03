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
let currentAltitude = 0;
let lastReportedAltitude = null;
let unsubscribeFromState = null;

const MIN_ALTITUDE = -5;
const MAX_ALTITUDE = 25;
const ALTITUDE_REPORT_THRESHOLD = 0.02;
let altitudeRangeEl = null;

function _reportAltitude(force = false) {
    if (!force && lastReportedAltitude !== null && Math.abs(currentAltitude - lastReportedAltitude) < ALTITUDE_REPORT_THRESHOLD) {
        return;
    }
    lastReportedAltitude = currentAltitude;
    stateManager.setState({ visual: { altitude: currentAltitude } });
}

function _syncAltitudeRangeLabel() {
    if (!altitudeRangeEl) {
        altitudeRangeEl = document.getElementById('height-altitude-range');
    }
    if (altitudeRangeEl) {
        altitudeRangeEl.textContent = `Plage: ${MIN_ALTITUDE.toFixed(0)} m à ${MAX_ALTITUDE.toFixed(0)} m`;
    }
}

// --- Core Logic ---
function _createElements() {
    // Conteneur principal de la plateforme et de ses éléments décoratifs
    platformEl = document.createElement('a-entity');
    platformEl.setAttribute('id', 'height-platform');
    platformEl.setAttribute('position', '0 0 -2');

    // Socle principal (base large)
    const baseEl = document.createElement('a-cylinder');
    baseEl.setAttribute('radius', '2.2');
    baseEl.setAttribute('height', '0.3');
    baseEl.setAttribute('color', '#2c3e50');
    baseEl.setAttribute('position', '0 -0.15 0');
    baseEl.setAttribute('segments-radial', '24');
    platformEl.appendChild(baseEl);

    // Plateau supérieur avec une teinte plus claire
    const topSurfaceEl = document.createElement('a-cylinder');
    topSurfaceEl.setAttribute('radius', '2');
    topSurfaceEl.setAttribute('height', '0.08');
    topSurfaceEl.setAttribute('color', '#4A90E2');
    topSurfaceEl.setAttribute('position', '0 0 0');
    topSurfaceEl.setAttribute('material', 'shader: flat; metalness: 0.1; roughness: 0.4');
    platformEl.appendChild(topSurfaceEl);

    // Marqueur central pour aider à se positionner
    const centerMarker = document.createElement('a-cylinder');
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

    stripeData.forEach((stripe) => {
        const stripeEl = document.createElement('a-box');
        stripeEl.setAttribute('depth', '0.2');
        stripeEl.setAttribute('height', '0.01');
        stripeEl.setAttribute('width', '0.5');
        stripeEl.setAttribute('color', '#d9e8ff');
        stripeEl.setAttribute('opacity', '0.9');
        stripeEl.setAttribute('position', `${stripe.x} 0.045 ${stripe.z}`);
        stripeEl.setAttribute('rotation', stripe.rotation);
        platformEl.appendChild(stripeEl);
    });

    // Potelets de sécurité aux quatre coins
    const postPositions = [
        { x: 1.5, z: 1.5 },
        { x: -1.5, z: 1.5 },
        { x: 1.5, z: -1.5 },
        { x: -1.5, z: -1.5 }
    ];

    postPositions.forEach((pos) => {
        const postEl = document.createElement('a-cylinder');
        postEl.setAttribute('radius', '0.05');
        postEl.setAttribute('height', '1.1');
        postEl.setAttribute('color', '#cfd9e8');
        postEl.setAttribute('position', `${pos.x} 0.55 ${pos.z}`);
        platformEl.appendChild(postEl);
    });

    // Rubans de sécurité semi-transparents
    const horizontalRails = [
        { position: '0 0.8 1.5', rotation: '0 0 0' },
        { position: '0 0.8 -1.5', rotation: '0 0 0' }
    ];

    horizontalRails.forEach((rail) => {
        const railEl = document.createElement('a-box');
        railEl.setAttribute('width', '3.2');
        railEl.setAttribute('height', '0.06');
        railEl.setAttribute('depth', '0.02');
        railEl.setAttribute('color', '#b3c4e0');
        railEl.setAttribute('opacity', '0.55');
        railEl.setAttribute('position', rail.position);
        railEl.setAttribute('rotation', rail.rotation);
        platformEl.appendChild(railEl);
    });

    const verticalRails = [
        { position: '1.5 0.8 0', rotation: '0 90 0' },
        { position: '-1.5 0.8 0', rotation: '0 90 0' }
    ];

    verticalRails.forEach((rail) => {
        const railEl = document.createElement('a-box');
        railEl.setAttribute('width', '3.2');
        railEl.setAttribute('height', '0.06');
        railEl.setAttribute('depth', '0.02');
        railEl.setAttribute('color', '#b3c4e0');
        railEl.setAttribute('opacity', '0.55');
        railEl.setAttribute('position', rail.position);
        railEl.setAttribute('rotation', rail.rotation);
        platformEl.appendChild(railEl);
    });

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
        const desiredY = rigEl.object3D.position.y + actualSpeed * dt; // Vitesse par seconde
        const clampedY = Math.min(MAX_ALTITUDE, Math.max(MIN_ALTITUDE, desiredY));

        if (clampedY !== desiredY) {
            actualSpeed = 0;
            targetSpeed = 0;
        }

        rigEl.object3D.position.y = clampedY;
        platformEl.object3D.position.y = clampedY;

        currentAltitude = clampedY;
        _reportAltitude();
    }

    if (rigEl) {
        const rigY = rigEl.object3D.position.y;
        if (Math.abs(actualSpeed) < 0.01 && Math.abs(currentAltitude - rigY) > 0.001) {
            currentAltitude = rigY;
            _reportAltitude(true);
        }
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
        }
        unsubscribeFromState = stateManager.subscribe(this.onStateChange.bind(this));

        // Créer le décor via son module dédié
        heightsDecorModule.create(sceneEl);

        skyEl = sceneEl.querySelector('#sky');
        if (skyEl) {
            skyEl.setAttribute('color', '#8dc6ff');
        }

        // Réinitialiser la position et la rotation du rig pour cet exercice.
        if (rigEl) {
            rigEl.object3D.position.set(0, 0, -2);
            rigEl.object3D.rotation.set(0, 0, 0);
        }

        _createElements();
        lastFrameTime = performance.now();
        currentAltitude = rigEl ? rigEl.object3D.position.y : 0;
        lastReportedAltitude = null;
        _syncAltitudeRangeLabel();
        _reportAltitude(true);

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
        if (unsubscribeFromState) {
            unsubscribeFromState();
            unsubscribeFromState = null;
        }
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
        currentAltitude = 0;
        lastReportedAltitude = null;
        // Réinitialiser la position du rig
        if(rigEl) {
            rigEl.object3D.position.y = 0;
        }
        if (altitudeRangeEl) {
            altitudeRangeEl.textContent = '';
        }
        altitudeRangeEl = null;
        stateManager.setState({ visual: { altitude: 0 } });
        if (skyEl) {
            skyEl.setAttribute('color', '#000000');
        }
        skyEl = null;
    },

    regenerate() {
        if(rigEl) {
            rigEl.object3D.position.y = 0;
            if(platformEl) platformEl.object3D.position.y = 0;
            actualSpeed = 0;
            targetSpeed = 0;
            currentAltitude = 0;
            lastReportedAltitude = null;
        }
        _syncAltitudeRangeLabel();
        _reportAltitude(true);
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