/* visuals/heights.js */
/* Rôle: Gère la stimulation pour l'acclimatation à la hauteur. */

import { stateManager } from '../utils/stateManager.js';
import { heightsDecorModule } from './decor_heights.js';

// --- Private State ---
let sceneEl, rigEl;
let platformEl;
const platformElements = {
    base: null,
    top: null,
    marker: null,
    stripes: [],
    posts: [],
    rails: []
};
let skyEl;
let actualSpeed = 0;
let targetSpeed = 0;
const smoothingFactor = 2.0; // Facteur de lissage pour une décélération douce
let isTicking = false;
let lastTickTime = null;
let currentAltitude = 0;
let lastReportedAltitude = null;
let unsubscribeFromState = null;
let platformScale = 1;
let decorDensityLevel = 'immersive';
let currentPaletteKey = 'default';

const BASE_ALTITUDE = 1;
const MIN_ALTITUDE = BASE_ALTITUDE;
const MAX_ALTITUDE = 25;
const ALTITUDE_REPORT_THRESHOLD = 0.02;

function _reportAltitude(force = false) {
    if (!force && lastReportedAltitude !== null && Math.abs(currentAltitude - lastReportedAltitude) < ALTITUDE_REPORT_THRESHOLD) {
        return;
    }
    lastReportedAltitude = currentAltitude;
    stateManager.setState({ visual: { altitude: currentAltitude } });
}

// --- Core Logic ---
function _resetPlatformElements() {
    platformElements.base = null;
    platformElements.top = null;
    platformElements.marker = null;
    platformElements.stripes = [];
    platformElements.posts = [];
    platformElements.rails = [];
}

function _applyPlatformTheme() {
    if (!platformEl) {
        return;
    }

    const theme = heightsDecorModule.getCurrentTheme();

    if (platformElements.base) {
        platformElements.base.setAttribute('color', theme.platformBaseColor);
    }

    if (platformElements.top) {
        platformElements.top.setAttribute('color', theme.platformTopColor);
    }

    if (platformElements.marker) {
        platformElements.marker.setAttribute('color', theme.platformMarkerColor);
    }

    platformElements.stripes.forEach((stripe) => {
        stripe.setAttribute('color', theme.platformStripeColor);
    });

    platformElements.posts.forEach((post) => {
        post.setAttribute('color', theme.platformPostColor);
    });

    platformElements.rails.forEach((rail) => {
        rail.setAttribute('color', theme.platformRailColor);
    });

    if (skyEl) {
        skyEl.setAttribute('color', theme.skyColor);
    }
}

function _createElements() {
    // Conteneur principal de la plateforme et de ses éléments décoratifs
    platformEl = document.createElement('a-entity');
    platformEl.setAttribute('id', 'height-platform');
    platformEl.setAttribute('position', `0 ${BASE_ALTITUDE} -2`);

    _resetPlatformElements();
    const theme = heightsDecorModule.getCurrentTheme();

    // Socle principal (base large)
    const baseEl = document.createElement('a-cylinder');
    baseEl.setAttribute('radius', '2.2');
    baseEl.setAttribute('height', '0.3');
    baseEl.setAttribute('color', theme.platformBaseColor);
    baseEl.setAttribute('position', '0 -0.15 0');
    baseEl.setAttribute('segments-radial', '24');
    platformEl.appendChild(baseEl);
    platformElements.base = baseEl;

    // Plateau supérieur avec une teinte plus claire
    const topSurfaceEl = document.createElement('a-cylinder');
    topSurfaceEl.setAttribute('radius', '2');
    topSurfaceEl.setAttribute('height', '0.08');
    topSurfaceEl.setAttribute('color', theme.platformTopColor);
    topSurfaceEl.setAttribute('position', '0 0 0');
    topSurfaceEl.setAttribute('material', 'shader: flat; metalness: 0.1; roughness: 0.4');
    platformEl.appendChild(topSurfaceEl);
    platformElements.top = topSurfaceEl;

    // Marqueur central pour aider à se positionner
    const centerMarker = document.createElement('a-cylinder');
    centerMarker.setAttribute('radius', '0.35');
    centerMarker.setAttribute('height', '0.01');
    centerMarker.setAttribute('color', theme.platformMarkerColor);
    centerMarker.setAttribute('position', '0 0.045 0');
    platformEl.appendChild(centerMarker);
    platformElements.marker = centerMarker;

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
        stripeEl.setAttribute('color', theme.platformStripeColor);
        stripeEl.setAttribute('opacity', '0.9');
        stripeEl.setAttribute('position', `${stripe.x} 0.045 ${stripe.z}`);
        stripeEl.setAttribute('rotation', stripe.rotation);
        platformEl.appendChild(stripeEl);
        platformElements.stripes.push(stripeEl);
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
        postEl.setAttribute('color', theme.platformPostColor);
        postEl.setAttribute('position', `${pos.x} 0.55 ${pos.z}`);
        platformEl.appendChild(postEl);
        platformElements.posts.push(postEl);
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
        railEl.setAttribute('color', theme.platformRailColor);
        railEl.setAttribute('opacity', '0.55');
        railEl.setAttribute('position', rail.position);
        railEl.setAttribute('rotation', rail.rotation);
        platformEl.appendChild(railEl);
        platformElements.rails.push(railEl);
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
        railEl.setAttribute('color', theme.platformRailColor);
        railEl.setAttribute('opacity', '0.55');
        railEl.setAttribute('position', rail.position);
        railEl.setAttribute('rotation', rail.rotation);
        platformEl.appendChild(railEl);
        platformElements.rails.push(railEl);
    });

    sceneEl.appendChild(platformEl);
    _applyPlatformScale();
    _applyPlatformTheme();
}

function _applyPlatformScale() {
    if (!platformEl) {
        return;
    }

    platformEl.object3D.scale.set(platformScale, 1, platformScale);
}

function _updateFrame(time = performance.now(), timeDelta = 16.6667) {
    if (!isTicking) {
        return;
    }

    const deltaMs = (typeof timeDelta === 'number' && timeDelta > 0)
        ? timeDelta
        : (lastTickTime !== null ? time - lastTickTime : 16.6667);
    lastTickTime = time;
    const dt = Math.max(deltaMs, 0) / 1000;

    // Lisser la vitesse actuelle vers la vitesse cible
    actualSpeed += (targetSpeed - actualSpeed) * (1 - Math.exp(-dt * smoothingFactor));

    // Arrêter le mouvement si la vitesse est négligeable
    if (Math.abs(actualSpeed) < 0.01) {
        actualSpeed = 0;
    }

    if (rigEl && platformEl && Math.abs(actualSpeed) > 0 && dt > 0) {
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

        const { visual } = stateManager.getState();
        platformScale = visual.platformScale ?? platformScale;
        decorDensityLevel = visual.heightsDecorDensity ?? decorDensityLevel;
        currentPaletteKey = visual.palette ?? currentPaletteKey;

        // Créer le décor via son module dédié
        heightsDecorModule.create(sceneEl, decorDensityLevel, currentPaletteKey);

        skyEl = sceneEl.querySelector('#sky');

        // Réinitialiser la position et la rotation du rig pour cet exercice.
        if (rigEl) {
            rigEl.object3D.position.set(0, BASE_ALTITUDE, -2);
            rigEl.object3D.rotation.set(0, 0, 0);
        }

        _createElements();
        if (platformEl) {
            platformEl.object3D.position.y = BASE_ALTITUDE;
            _applyPlatformScale();
        }
        _applyPlatformTheme();
        lastTickTime = null;
        currentAltitude = rigEl ? rigEl.object3D.position.y : BASE_ALTITUDE;
        lastReportedAltitude = null;
        _reportAltitude(true);

        isTicking = true;
    },

    onStateChange(newState) {
        if (newState.visual.speeds.y !== targetSpeed) {
            this.setSpeed(newState.visual.speeds.y);
        }

        const desiredScale = newState.visual.platformScale ?? 1;
        if (Math.abs(desiredScale - platformScale) > 0.0001) {
            this.setPlatformScale(desiredScale);
        }

        const desiredDensity = newState.visual.heightsDecorDensity ?? decorDensityLevel;
        if (desiredDensity !== decorDensityLevel) {
            this.setDecorDensity(desiredDensity);
        }

        const desiredPalette = newState.visual.palette ?? currentPaletteKey;
        if (desiredPalette !== currentPaletteKey) {
            this.setPalette(desiredPalette);
        }
    },

    cleanup() {
        if (unsubscribeFromState) {
            unsubscribeFromState();
            unsubscribeFromState = null;
        }
        // Nettoyer le décor via son module dédié
        heightsDecorModule.cleanup();

        isTicking = false;
        lastTickTime = null;
        if (platformEl && platformEl.parentNode) {
            platformEl.parentNode.removeChild(platformEl);
        }
        platformEl = null;
        _resetPlatformElements();
        actualSpeed = 0;
        targetSpeed = 0;
        currentAltitude = 0;
        lastReportedAltitude = null;
        decorDensityLevel = 'immersive';
        currentPaletteKey = 'default';
        // Réinitialiser la position du rig
        if(rigEl) {
            rigEl.object3D.position.y = 0;
        }
        stateManager.setState({ visual: { altitude: 0 } });
        if (skyEl) {
            skyEl.setAttribute('color', '#000000');
        }
        skyEl = null;
    },

    regenerate() {
        if(rigEl) {
            rigEl.object3D.position.y = BASE_ALTITUDE;
            if(platformEl) platformEl.object3D.position.y = BASE_ALTITUDE;
            actualSpeed = 0;
            targetSpeed = 0;
            currentAltitude = BASE_ALTITUDE;
            lastReportedAltitude = null;
        }
        _reportAltitude(true);
    },

    tick(time, timeDelta) {
        _updateFrame(time, timeDelta);
    },

    // --- Fonctions pour les contrôles ---
    setSpeed(speed) {
        targetSpeed = parseFloat(speed);
    },

    setPlatformScale(scale) {
        if (typeof scale !== 'number' || Number.isNaN(scale)) {
            return;
        }

        const clampedScale = Math.max(0.25, Math.min(1.0, scale));
        if (Math.abs(clampedScale - platformScale) < 0.0001) {
            return;
        }

        platformScale = clampedScale;
        _applyPlatformScale();
    },

    setDecorDensity(densityLevel) {
        if (typeof densityLevel !== 'string') {
            return;
        }

        decorDensityLevel = densityLevel;
        heightsDecorModule.updateDensity(densityLevel);
        _applyPlatformTheme();
    },

    setPalette(paletteKey) {
        const normalizedKey = paletteKey === 'auto' ? 'default' : (paletteKey || 'default');
        currentPaletteKey = normalizedKey;
        heightsDecorModule.updatePalette(normalizedKey);
        _applyPlatformTheme();
    },

    // --- Fonctions non utilisées mais requises ---
    setDensity() {},
    getActualSpeed() { return { v: actualSpeed }; }
};
