/* visuals/optokinetic.js */
/* Rôle: Gère la stimulation visuelle optocinétique, y compris la génération des sphères et leur rotation. */

import { stateManager } from '../utils/stateManager.js';
import { colorPalettes, lerpColor } from '../utils/colorPalettes.js';

// --- Private State ---
let sceneEl, spheresContainer, rigEl, cameraEl;
let currentPalette = colorPalettes.default;
let density = 150;
let animationFrameId;
let unsubscribeFromState = null;

let targetSpeedX = 0, targetSpeedY = 0, actualSpeedX = 0, actualSpeedY = 0;
const smoothingFactor = 1.5;
let rotationAxisX = new THREE.Vector3(1, 0, 0), rotationAxisY = new THREE.Vector3(0, 1, 0);

let isRegenerating = false;
let colorTransition = { isActive: false, duration: 500, progress: 0, startTime: 0, from: [], to: [] };
let autoCycleInterval = null;
let lastFrameTime = performance.now();
let frameCounter = 0;


// --- Sphere Generation Logic (from sphereGenerator.js) ---
const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle
const radius = 50;
const dispersionFactor = 8;
const baseSphereRadius = 0.8;
const minRandomRadius = baseSphereRadius * 0.5;
const maxRandomRadius = baseSphereRadius * 2.0;

function _generateSpheres(num, palette, initialOpacity = 1) {
    while (spheresContainer.firstChild) {
        spheresContainer.removeChild(spheresContainer.firstChild);
    }

    for (let i = 0; i < num; i++) {
        const y = 1 - (i / (num - 1)) * 2;
        const radiusAtY = Math.sqrt(1 - y * y);
        const theta = phi * i;

        let x = Math.cos(theta) * radiusAtY;
        let z = Math.sin(theta) * radiusAtY;

        const offsetX = (Math.random() - 0.5) * dispersionFactor;
        const offsetY = (Math.random() - 0.5) * dispersionFactor;
        const oz = (Math.random() - 0.5) * dispersionFactor;

        const randomRadius = minRandomRadius + (Math.random() * (maxRandomRadius - minRandomRadius));
        const color = palette[i % palette.length];

        const sphereGroup = document.createElement('a-entity');
        sphereGroup.setAttribute('geometry', `primitive: sphere; radius: ${randomRadius};`);
        sphereGroup.setAttribute('material', `color: ${color}; transparent: true; opacity: ${initialOpacity};`);
        sphereGroup.setAttribute('position', `${x * radius + offsetX} ${y * radius + offsetY} ${z * radius + oz}`);
        spheresContainer.appendChild(sphereGroup);
    }
}

function _fade(direction, callback) {
    const duration = 300;
    let startTime = null;
    const spheres = spheresContainer.children;

    function fadeAnimation(time) {
        if (!startTime) startTime = time;
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const opacity = direction === 'out' ? 1 - progress : progress;

        for (let i = 0; i < spheres.length; i++) {
            spheres[i].setAttribute('material', 'opacity', opacity);
        }

        if (progress < 1) {
            requestAnimationFrame(fadeAnimation);
        } else if (callback) {
            callback();
        }
    }
    requestAnimationFrame(fadeAnimation);
}


// --- Animation Logic (from main.js) ---
function _animate(time) {
    animationFrameId = requestAnimationFrame(_animate);
    frameCounter++;
    const dt = (time - lastFrameTime) / 1000;
    lastFrameTime = time;

    if (colorTransition.isActive) {
        const elapsed = time - colorTransition.startTime;
        colorTransition.progress = Math.min(elapsed / colorTransition.duration, 1);
        if (frameCounter % 3 === 0) _updateSphereColors();
        if (colorTransition.progress >= 1) {
            colorTransition.isActive = false;
            _updateSphereColors(true);
        }
    }

    if (isRegenerating) return;

    actualSpeedX += (targetSpeedX - actualSpeedX) * (1 - Math.exp(-dt * smoothingFactor));
    actualSpeedY += (targetSpeedY - actualSpeedY) * (1 - Math.exp(-dt * smoothingFactor));

    const r = rigEl.object3D;
    if (Math.abs(actualSpeedX) > 0.01) {
        const x = THREE.MathUtils.degToRad(actualSpeedX * dt);
        const dx = new THREE.Quaternion().setFromAxisAngle(rotationAxisX, x);
        r.quaternion.premultiply(dx);
        rotationAxisY.applyQuaternion(dx);
    }
    if (Math.abs(actualSpeedY) > 0.01) {
        const y = THREE.MathUtils.degToRad(actualSpeedY * dt);
        const dy = new THREE.Quaternion().setFromAxisAngle(rotationAxisY, y);
        r.quaternion.premultiply(dy);
        rotationAxisX.applyQuaternion(dy);
    }
    
    // Note: UI update is now handled by main.js
}

function _updateSphereColors() {
    const s = spheresContainer.children;
    for (let i = 0; i < s.length; i++) {
        const g = s[i];
        let c;
        if (colorTransition.isActive) {
            const fc = colorTransition.from[i % colorTransition.from.length];
            const tc = colorTransition.to[i % colorTransition.to.length];
            c = lerpColor(fc, tc, colorTransition.progress);
        } else {
            c = currentPalette[i % currentPalette.length];
        }
        g.setAttribute('material', 'color', c);
    }
}

function _startColorTransition(palette) {
    // Ensure the 'from' palette is always a valid array of colors
    colorTransition.from = currentPalette.map(c => c.color || c);

    colorTransition.to = palette;
    colorTransition.startTime = performance.now();
    colorTransition.isActive = true;
    currentPalette = palette;
}

function _startAutoColorCycle() {
    _stopAutoColorCycle();
    const paletteKeys = Object.keys(colorPalettes).filter(k => k !== 'default' && k !== 'none');
    let currentIndex = 0;
    autoCycleInterval = setInterval(() => {
        const nextPaletteKey = paletteKeys[currentIndex];
        _startColorTransition(colorPalettes[nextPaletteKey]);
        currentIndex = (currentIndex + 1) % paletteKeys.length;
    }, 5000);
}

function _stopAutoColorCycle() {
    if (autoCycleInterval) {
        clearInterval(autoCycleInterval);
        autoCycleInterval = null;
    }
}

function _updateRotationAxes() {
    rigEl.object3D.quaternion.identity();
    const cameraDirection = new THREE.Vector3();
    cameraEl.object3D.getWorldDirection(cameraDirection);
    rotationAxisY.set(0, 1, 0);
    rotationAxisX.crossVectors(cameraDirection, rotationAxisY).normalize();
}


// --- Public Interface ---
export const optokineticModule = {
    init(_sceneEl, _rigEl, _cameraEl, _spheresContainer) {
        sceneEl = _sceneEl;
        rigEl = _rigEl;
        cameraEl = _cameraEl;
        spheresContainer = _spheresContainer;

        // S'assurer qu'il n'existe pas d'abonnement précédent encore actif
        if (unsubscribeFromState) {
            unsubscribeFromState();
            unsubscribeFromState = null;
        }

        // S'abonner aux changements d'état
        unsubscribeFromState = stateManager.subscribe(this.onStateChange.bind(this));

        // Récupérer l'état initial pour la première génération
        const initialState = stateManager.getState();
        density = initialState.visual.density;
        currentPalette = colorPalettes[initialState.visual.palette] || colorPalettes.default;

        _generateSpheres(density, currentPalette);

        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        animationFrameId = requestAnimationFrame(_animate);
    },

    onStateChange(newState) {
        // Réagir aux changements de densité
        if (newState.visual.density !== density) {
            density = newState.visual.density;
            this.regenerate(); // La régénération se chargera du fade out/in
        }

        // Réagir aux changements de palette
        const newPaletteId = newState.visual.palette;
        const currentPaletteId = currentPalette.id || Object.keys(colorPalettes).find(key => colorPalettes[key] === currentPalette);

        if (newPaletteId !== currentPaletteId) {
            if (newPaletteId === 'none') {
                spheresContainer.setAttribute('visible', 'false');
                _stopAutoColorCycle();
            } else {
                spheresContainer.setAttribute('visible', 'true');
                if (newPaletteId === 'auto') {
                    _startAutoColorCycle();
                } else {
                    _stopAutoColorCycle();
                    const newPalette = colorPalettes[newPaletteId];
                    if (newPalette) {
                        _startColorTransition(newPalette);
                    }
                }
            }
        }

        // Réagir aux changements de vitesse
        this.setSpeed(newState.visual.speeds.h, newState.visual.speeds.v);
    },

    regenerate() {
        if (isRegenerating) return;
        isRegenerating = true;
        _fade('out', () => {
            _generateSpheres(density, currentPalette, 0);
            _updateRotationAxes();
            _fade('in', () => {
                isRegenerating = false;
            });
        });
    },

    setSpeed(h, v) {
        targetSpeedY = h; // horizontal speed rotates around Y axis
        targetSpeedX = v; // vertical speed rotates around X axis
    },
    
    getActualSpeed() {
        return { h: actualSpeedY, v: actualSpeedX };
    },

    setDensity(newDensity) {
        // DEPRECATED: La logique est maintenant dans onStateChange
    },

    setPalette(paletteId) {
        // DEPRECATED: La logique est maintenant dans onStateChange
    },

    cleanup() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        _stopAutoColorCycle();
        while (spheresContainer.firstChild) {
            spheresContainer.removeChild(spheresContainer.firstChild);
        }
        if (unsubscribeFromState) {
            unsubscribeFromState();
            unsubscribeFromState = null;
        }
    }
};
