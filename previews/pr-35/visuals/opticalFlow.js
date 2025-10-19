/* visuals/opticalFlow.js */
/* Rôle: Gère une stimulation visuelle de type flux optique (étoiles qui avancent). */

import { stateManager } from '../utils/stateManager.js';
import { colorPalettes } from '../utils/colorPalettes.js';

// --- Private State ---
let sceneEl, container, rigEl, cameraEl;
let targetSpeed = 0; // La vitesse que l'on veut atteindre
let currentSpeed = 0; // La vitesse actuelle des particules
const smoothingFactor = 0.12; // Contrôle la fluidité du mouvement (plus c'est petit, plus c'est fluide)
let density = 100;
let animationFrameId;
let stars = [];
let lastTime = 0; // Pour calculer le timeDelta
let selectedPaletteId = 'default';
let activePaletteColors = colorPalettes.default;
let autoPaletteInterval = null;
let autoPaletteIndex = 0;
let unsubscribeFromState = null;

const MIN_TOTAL_STARS = 30;
let autoPaletteKeys = [];

const layerConfigs = [
    {
        key: 'near',
        weight: 0.28,
        speedFactor: 1.5,
        radiusRange: [0.18, 0.32],
        horizontalSpread: 24,
        verticalSpread: 18,
        spawnDepth: { min: -260, max: -160 },
        frontSpawnDepth: { min: -60, max: -18 },
        frontLoadRatio: 0.4,
        recycleNear: 8.2,
        recycleFar: -260,
        spawnBiasPower: 3.2,
        fadeRange: { start: 1.2, end: 7.5 },
        emissiveIntensity: 2.2
    },
    {
        key: 'mid',
        weight: 0.44,
        speedFactor: 0.9,
        radiusRange: [0.11, 0.22],
        horizontalSpread: 36,
        verticalSpread: 26,
        spawnDepth: { min: -360, max: -240 },
        frontSpawnDepth: { min: -110, max: -40 },
        frontLoadRatio: 0.28,
        recycleNear: 9,
        recycleFar: -340,
        spawnBiasPower: 2.4,
        fadeRange: { start: 1.5, end: 8.4 },
        emissiveIntensity: 1.8
    },
    {
        key: 'far',
        weight: 0.28,
        speedFactor: 0.5,
        radiusRange: [0.06, 0.15],
        horizontalSpread: 50,
        verticalSpread: 34,
        spawnDepth: { min: -560, max: -360 },
        frontSpawnDepth: { min: -160, max: -70 },
        frontLoadRatio: 0.18,
        recycleNear: 10,
        recycleFar: -540,
        spawnBiasPower: 2.2,
        fadeRange: { start: 2, end: 9.5 },
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

function _clearContainerChildren() {
    if (!container) {
        return;
    }

    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    const object3D = container.object3D;
    if (object3D) {
        for (let i = object3D.children.length - 1; i >= 0; i -= 1) {
            object3D.remove(object3D.children[i]);
        }
    }
}

function _getSpawnRange(layer) {
    if (layer.spawnDepth && typeof layer.spawnDepth.min === 'number' && typeof layer.spawnDepth.max === 'number') {
        const min = Math.min(layer.spawnDepth.min, layer.spawnDepth.max);
        const max = Math.max(layer.spawnDepth.min, layer.spawnDepth.max);
        return { min, max };
    }

    if (layer.depthRange && typeof layer.depthRange.near === 'number' && typeof layer.depthRange.far === 'number') {
        const min = Math.min(layer.depthRange.near, layer.depthRange.far);
        const max = Math.max(layer.depthRange.near, layer.depthRange.far);
        return { min, max };
    }

    return { min: -20, max: -5 };
}

function _randomPositionForLayer(layer, direction = 0) {
    const { horizontalSpread, verticalSpread } = layer;
    const { min: minZ, max: maxZ } = _getSpawnRange(layer);

    const biasPower = direction < 0
        ? layer.backwardSpawnBiasPower || 1.2
        : layer.spawnBiasPower || 1.6;

    let randomValue = Math.random();
    if (direction < 0) {
        randomValue = 1 - Math.pow(1 - randomValue, biasPower);
    } else {
        randomValue = Math.pow(randomValue, biasPower);
    }

    const z = minZ + (maxZ - minZ) * randomValue;
    const x = (Math.random() - 0.5) * horizontalSpread;
    const y = (Math.random() - 0.5) * verticalSpread;

    return { x, y, z };
}

function _randomFrontPositionForLayer(layer) {
    const { horizontalSpread, verticalSpread, frontSpawnDepth } = layer;
    const spawnRange = frontSpawnDepth
        ? _getSpawnRange({ spawnDepth: frontSpawnDepth })
        : { min: -80, max: -20 };

    const z = _randomInRange(spawnRange.min, spawnRange.max);
    const x = (Math.random() - 0.5) * horizontalSpread * 0.65;
    const y = (Math.random() - 0.5) * verticalSpread * 0.65;

    return { x, y, z };
}

function _applyMaterial(starElement, color, intensity) {
    starElement.setAttribute(
        'material',
        `shader: flat; color: ${color}; emissive: ${color}; emissiveIntensity: ${intensity}; transparent: true; opacity: 1`
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

function _refreshAutoPaletteKeys() {
    autoPaletteKeys = Object.keys(colorPalettes)
        .filter((key) => key !== 'none' && Array.isArray(colorPalettes[key]) && colorPalettes[key].length > 0);

    const defaultIndex = autoPaletteKeys.indexOf('default');
    if (defaultIndex > -1 && autoPaletteKeys.length > 1) {
        autoPaletteKeys.splice(defaultIndex, 1);
        autoPaletteKeys.push('default');
    }
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
    autoPaletteKeys = [];
}

function _applyAutoPalette() {
    if (!autoPaletteKeys.length) {
        activePaletteColors = ['#FFFFFF'];
        _applyPaletteToStars(true);
        return;
    }

    const paletteKey = autoPaletteKeys[autoPaletteIndex % autoPaletteKeys.length];
    autoPaletteIndex = (autoPaletteIndex + 1) % autoPaletteKeys.length;
    const palette = colorPalettes[paletteKey];
    if (Array.isArray(palette) && palette.length > 0) {
        activePaletteColors = palette.slice();
    } else {
        activePaletteColors = ['#FFFFFF'];
    }
    _applyPaletteToStars(true);
}

function _startAutoPalette() {
    _stopAutoPalette();
    _refreshAutoPaletteKeys();
    autoPaletteIndex = 0;
    _applyAutoPalette();
    if (autoPaletteKeys.length) {
        autoPaletteInterval = setInterval(_applyAutoPalette, 10000);
    }
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
function _createStar(layer, initialPosition = null) {
    const star = document.createElement('a-sphere');
    const radius = _pickRadius(layer.radiusRange);
    star.setAttribute('radius', radius);

    const spawnPosition = initialPosition || _randomPositionForLayer(layer, 0);
    star.setAttribute('position', `${spawnPosition.x} ${spawnPosition.y} ${spawnPosition.z}`);

    container.appendChild(star);

    const starData = {
        element: star,
        layer,
        speedFactor: layer.speedFactor,
        colorIndex: Math.floor(Math.random() * _getActivePaletteColors().length),
        currentOpacity: 1
    };

    _applyColorToStar(starData);

    return starData;
}

function _resetStar(starData, direction = 0) {
    const { x, y, z } = _randomPositionForLayer(starData.layer, direction);
    starData.element.object3D.position.set(x, y, z);
    starData.element.setAttribute('position', `${x} ${y} ${z}`);
    if (starData.currentOpacity !== 1) {
        starData.element.setAttribute('material', 'opacity', 1);
        starData.currentOpacity = 1;
    }
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

    _clearContainerChildren();
    stars = [];

    const totalStars = Math.max(MIN_TOTAL_STARS, density);
    const counts = _computeLayerCounts(totalStars);

    layerConfigs.forEach((layer, index) => {
        const count = counts[index];
        const frontLoadRatio = Math.max(0, Math.min(1, layer.frontLoadRatio || 0));
        const frontCount = frontLoadRatio > 0
            ? Math.min(count, Math.max(1, Math.round(count * frontLoadRatio)))
            : 0;

        for (let i = 0; i < count; i += 1) {
            const shouldSpawnFront = i < frontCount;
            const spawnPosition = shouldSpawnFront ? _randomFrontPositionForLayer(layer) : null;
            stars.push(_createStar(layer, spawnPosition));
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

            if (currentSpeed >= 0) {
                const { fadeRange } = starData.layer;
                if (fadeRange && typeof fadeRange.start === 'number' && typeof fadeRange.end === 'number' && fadeRange.end > fadeRange.start) {
                    if (position.z >= fadeRange.start) {
                        const fadeProgress = (position.z - fadeRange.start) / (fadeRange.end - fadeRange.start);
                        const fadeFactor = Math.max(0, Math.min(1, 1 - fadeProgress));
                        const clamped = fadeFactor;
                        if (Math.abs(clamped - starData.currentOpacity) > 0.01) {
                            starData.element.setAttribute('material', 'opacity', clamped);
                            starData.currentOpacity = clamped;
                        }
                    } else if (starData.currentOpacity !== 1) {
                        starData.element.setAttribute('material', 'opacity', 1);
                        starData.currentOpacity = 1;
                    }
                } else if (starData.currentOpacity !== 1) {
                    starData.element.setAttribute('material', 'opacity', 1);
                    starData.currentOpacity = 1;
                }
            } else if (starData.currentOpacity !== 1) {
                starData.element.setAttribute('material', 'opacity', 1);
                starData.currentOpacity = 1;
            }

            const { min: spawnMin, max: spawnMax } = _getSpawnRange(starData.layer);
            const resetBuffer = typeof starData.layer.resetBuffer === 'number' ? starData.layer.resetBuffer : 0;
            const nearLimit = typeof starData.layer.recycleNear === 'number'
                ? starData.layer.recycleNear
                : spawnMax + resetBuffer;
            const farLimit = typeof starData.layer.recycleFar === 'number'
                ? starData.layer.recycleFar
                : spawnMin - resetBuffer;

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

        if (unsubscribeFromState) {
            unsubscribeFromState();
        }
        unsubscribeFromState = stateManager.subscribe(this.onStateChange.bind(this));

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

    recenter({ regenerate = false } = {}) {
        if (regenerate) {
            _generateStars();
            return;
        }

        _alignContainerToCamera();
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
        if (unsubscribeFromState) {
            unsubscribeFromState();
            unsubscribeFromState = null;
        }
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        _stopAutoPalette();
        if (container) {
            _clearContainerChildren();
        }
        stars = [];
        currentSpeed = 0;
        targetSpeed = 0;
        lastTime = 0;
    }
};