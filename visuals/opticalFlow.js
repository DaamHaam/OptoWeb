/* visuals/opticalFlow.js */
/* Rôle: Gère une stimulation visuelle de type flux optique (étoiles qui avancent). */

import { stateManager } from '../utils/stateManager.js';
import { colorPalettes } from '../utils/colorPalettes.js';

// --- Private State ---
let sceneEl, container, rigEl, cameraEl;
let targetSpeed = 0; // La vitesse que l'on veut atteindre
let currentSpeed = 0; // La vitesse actuelle des particules
const smoothingFactor = 0.05; // Contrôle la fluidité du mouvement (plus c'est petit, plus c'est fluide)
let density = 100;
let animationFrameId;
let stars = [];
let lastTime = 0; // Pour calculer le timeDelta
let selectedPaletteId = 'default';
let activePaletteColors = colorPalettes.default;
let autoPaletteInterval = null;
let autoPaletteIndex = 0;

const MIN_TOTAL_STARS = 30;
const AUTO_PALETTE_KEYS = Object.keys(colorPalettes);

const layerConfigs = [
    {
        key: 'near',
        weight: 0.28,
        speedFactor: 1.6,
        radiusRange: [0.18, 0.32],
        horizontalSpread: 22,
        verticalSpread: 16,
        depthRange: { near: -2.5, far: -18 },
        resetBuffer: 1.5,
        emissiveIntensity: 2.2
    },
    {
        key: 'mid',
        weight: 0.44,
        speedFactor: 1.0,
        radiusRange: [0.11, 0.22],
        horizontalSpread: 34,
        verticalSpread: 24,
        depthRange: { near: -16, far: -55 },
        resetBuffer: 2,
        emissiveIntensity: 1.8
    },
    {
        key: 'far',
        weight: 0.28,
        speedFactor: 0.55,
        radiusRange: [0.06, 0.15],
        horizontalSpread: 48,
        verticalSpread: 32,
        depthRange: { near: -45, far: -140 },
        resetBuffer: 3,
        emissiveIntensity: 1.3
    }
];

const tempPosition = new THREE.Vector3();
const tempQuaternion = new THREE.Quaternion();
const tempRigQuaternion = new THREE.Quaternion();
const tempEuler = new THREE.Euler();

// --- Helpers ---
function _getActivePaletteColors() {
    if (Array.isArray(activePaletteColors) && activePaletteColors.length > 0) {
        return activePaletteColors;
    }
    return ['#FFFFFF'];
}

function _randomInRange(min, max) {
    return min + Math.random() * (max - min);
}

function _pickRadius([min, max]) {
    return _randomInRange(min, max);
}

function _randomPositionForLayer(layer, direction = 0) {
    const { horizontalSpread, verticalSpread, depthRange } = layer;
    const minZ = Math.min(depthRange.near, depthRange.far);
    const maxZ = Math.max(depthRange.near, depthRange.far);
    let t;

    if (direction > 0) {
        // Défilement vers l'utilisateur: privilégier les profondeurs lointaines.
        t = Math.random() * 0.25;
    } else if (direction < 0) {
        // Défilement inverse: privilégier l'avant immédiat.
        t = 0.75 + Math.random() * 0.25;
    } else {
        // Génération initiale : garder les particules au loin pour éviter les apparitions trop proches.
        t = Math.random() * 0.35;
    }

    const z = minZ + (maxZ - minZ) * t;
    const x = (Math.random() - 0.5) * horizontalSpread;
    const y = (Math.random() - 0.5) * verticalSpread;

    return { x, y, z };
}

function _applyMaterial(starElement, color, intensity) {
    starElement.setAttribute(
        'material',
        `shader: flat; color: ${color}; emissive: ${color}; emissiveIntensity: ${intensity}`
    );
}

function _applyColorToStar(starData, forceNewIndex = false) {
    const colors = _getActivePaletteColors();
    const colorCount = colors.length;
    if (forceNewIndex || typeof starData.colorIndex !== 'number') {
        starData.colorIndex = Math.floor(Math.random() * colorCount);
    }
    const color = colors[starData.colorIndex % colorCount];
    _applyMaterial(starData.element, color, starData.layer.emissiveIntensity);
}

function _alignContainerToCamera() {
    if (!container || !cameraEl) {
        return;
    }

    cameraEl.object3D.getWorldPosition(tempPosition);
    container.object3D.position.copy(tempPosition);

    cameraEl.object3D.getWorldQuaternion(tempQuaternion);
    if (rigEl) {
        tempRigQuaternion.copy(rigEl.object3D.quaternion).invert();
        tempQuaternion.premultiply(tempRigQuaternion);
    }

    tempEuler.setFromQuaternion(tempQuaternion, 'YXZ');
    tempEuler.x = 0;
    tempEuler.z = 0;
    container.object3D.quaternion.setFromEuler(tempEuler);
}

function _stopAutoPalette() {
    if (autoPaletteInterval) {
        clearInterval(autoPaletteInterval);
        autoPaletteInterval = null;
    }
}

function _cycleAutoPalette() {
    if (!AUTO_PALETTE_KEYS.length) {
        activePaletteColors = ['#FFFFFF'];
        return;
    }

    const paletteKey = AUTO_PALETTE_KEYS[autoPaletteIndex % AUTO_PALETTE_KEYS.length];
    autoPaletteIndex = (autoPaletteIndex + 1) % AUTO_PALETTE_KEYS.length;
    const palette = colorPalettes[paletteKey];
    if (Array.isArray(palette) && palette.length > 0) {
        activePaletteColors = palette;
    } else {
        activePaletteColors = ['#FFFFFF'];
    }
    _applyPaletteToStars(true);
}

function _startAutoPalette() {
    _stopAutoPalette();
    autoPaletteIndex = 0;
    _cycleAutoPalette();
    autoPaletteInterval = setInterval(_cycleAutoPalette, 10000);
}

function _applyPaletteToStars(forceNewIndex = false) {
    const colors = _getActivePaletteColors();
    const colorCount = colors.length;
    if (colorCount === 0) {
        return;
    }
    for (const star of stars) {
        if (forceNewIndex) {
            star.colorIndex = Math.floor(Math.random() * colorCount);
        }
        star.colorIndex = star.colorIndex % colorCount;
        const color = colors[star.colorIndex];
        _applyMaterial(star.element, color, star.layer.emissiveIntensity);
    }
}

// --- Core Logic ---
function _createStar(layer) {
    const star = document.createElement('a-sphere');
    const radius = _pickRadius(layer.radiusRange);
    star.setAttribute('radius', radius);

    const initialPosition = _randomPositionForLayer(layer, 0);
    star.setAttribute('position', `${initialPosition.x} ${initialPosition.y} ${initialPosition.z}`);

    container.appendChild(star);

    const starData = {
        element: star,
        layer,
        speedFactor: layer.speedFactor,
        colorIndex: Math.floor(Math.random() * _getActivePaletteColors().length)
    };

    _applyColorToStar(starData);

    return starData;
}

function _resetStar(starData, direction = 0) {
    const { x, y, z } = _randomPositionForLayer(starData.layer, direction);
    starData.element.object3D.position.set(x, y, z);
    starData.element.setAttribute('position', `${x} ${y} ${z}`);
    _applyColorToStar(starData, true);
}

function _computeLayerCounts(total) {
    const counts = layerConfigs.map(layer => Math.floor(total * layer.weight));
    let assigned = counts.reduce((sum, value) => sum + value, 0);
    let remainder = total - assigned;
    let index = 0;
    while (remainder > 0) {
        counts[index % counts.length] += 1;
        remainder -= 1;
        index += 1;
    }
    // S'assure qu'il y a au moins une étoile par couche
    for (let i = 0; i < counts.length; i += 1) {
        if (counts[i] === 0) {
            counts[i] = 1;
        }
    }
    return counts;
}

function _generateStars() {
    if (!container) {
        return;
    }

    _alignContainerToCamera();

    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    stars = [];

    const totalStars = Math.max(MIN_TOTAL_STARS, density);
    const counts = _computeLayerCounts(totalStars);

    layerConfigs.forEach((layer, index) => {
        const count = counts[index];
        for (let i = 0; i < count; i += 1) {
            stars.push(_createStar(layer));
        }
    });

    _applyPaletteToStars();
}

// --- Animation Logic ---
function _animate(time) {
    if (lastTime === 0) {
        lastTime = time;
    }
    const timeDelta = time - lastTime;
    lastTime = time;

    currentSpeed += (targetSpeed - currentSpeed) * smoothingFactor;

    if (Math.abs(currentSpeed) < 0.01) {
        currentSpeed = 0;
    }

    if (currentSpeed !== 0 && timeDelta > 0) {
        const deltaSeconds = timeDelta / 1000;
        for (const starData of stars) {
            const position = starData.element.object3D.position;
            position.z += currentSpeed * deltaSeconds * starData.speedFactor;

            const { near, far } = starData.layer.depthRange;
            const nearLimit = Math.max(near, far) + starData.layer.resetBuffer;
            const farLimit = Math.min(near, far) - starData.layer.resetBuffer;

            if (currentSpeed >= 0 && position.z >= nearLimit) {
                _resetStar(starData, 1);
            } else if (currentSpeed < 0 && position.z <= farLimit) {
                _resetStar(starData, -1);
            }
        }
    }

    animationFrameId = requestAnimationFrame(_animate);
}

// --- Public Interface ---
export const opticalFlowModule = {
    init(_sceneEl, _rigEl, _cameraEl, _container) {
        sceneEl = _sceneEl;
        rigEl = _rigEl;
        cameraEl = _cameraEl;
        container = _container;

        _stopAutoPalette();
        selectedPaletteId = null;
        activePaletteColors = colorPalettes.default;

        stateManager.subscribe(this.onStateChange.bind(this));

        _generateStars();

        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        lastTime = 0; // Réinitialiser le temps pour le calcul du delta
        animationFrameId = requestAnimationFrame(_animate);
    },

    onStateChange(newState) {
        if (!newState || !newState.visual) {
            return;
        }

        const { visual } = newState;
        if (visual.speeds && typeof visual.speeds.t === 'number') {
            this.setSpeed(visual.speeds.t);
        }

        if (typeof visual.density === 'number' && visual.density !== density) {
            this.setDensity(visual.density);
        }

        if (visual.palette && visual.palette !== selectedPaletteId) {
            this.setPalette(visual.palette);
        }
    },

    regenerate() {
        _generateStars();
    },

    setSpeed(newSpeed) {
        targetSpeed = newSpeed;
    },

    getActualSpeed() {
        return { h: 0, v: 0, t: currentSpeed }; // Report speed back to UI
    },

    setDensity(newDensity) {
        density = newDensity;
        _generateStars();
    },

    setPalette(paletteId) {
        if (!paletteId) {
            return;
        }

        selectedPaletteId = paletteId;

        if (paletteId === 'auto') {
            _startAutoPalette();
            return;
        }

        _stopAutoPalette();
        const palette = colorPalettes[paletteId];
        if (Array.isArray(palette) && palette.length > 0) {
            activePaletteColors = palette;
        } else {
            activePaletteColors = ['#FFFFFF'];
        }
        _applyPaletteToStars(true);
    },

    cleanup() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        _stopAutoPalette();
        if (container) {
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
        }
        stars = [];
        currentSpeed = 0;
        targetSpeed = 0;
        lastTime = 0;
    }
};