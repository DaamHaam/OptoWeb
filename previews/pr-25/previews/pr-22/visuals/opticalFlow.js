/* visuals/opticalFlow.js */
/* Rôle: Gère une stimulation visuelle de type flux optique (étoiles qui avancent). */

import { stateManager } from '../utils/stateManager.js';

// --- Private State ---
let sceneEl, container;
let targetSpeed = 0; // La vitesse que l'on veut atteindre
let currentSpeed = 0; // La vitesse actuelle des particules
const smoothingFactor = 0.05; // Contrôle la fluidité du mouvement (plus c'est petit, plus c'est fluide)
let density = 100;
let animationFrameId;
let stars = [];
let lastTime = 0; // Pour calculer le timeDelta

// --- Core Logic ---
function _createStar() {
    const star = document.createElement('a-sphere');
    const radius = 0.08 + Math.random() * 0.07; // Rayon plus grand
    star.setAttribute('radius', radius);
    // Matériau émissif pour être visible sans lumière
    star.setAttribute('material', 'shader: flat; color: #FFF; emissive: #FFF; emissiveIntensity: 2');

    // Start away from the camera
    const x = (Math.random() - 0.5) * 50;
    const y = (Math.random() - 0.5) * 50;
    const z = -50 - Math.random() * 50; // Start far away
    star.setAttribute('position', `${x} ${y} ${z}`);
    
    container.appendChild(star);
    return { element: star, initialZ: z };
}

function _resetStar(starData) {
    const x = (Math.random() - 0.5) * 50;
    const y = (Math.random() - 0.5) * 50;
    const z = -50 - Math.random() * 50;
    starData.element.setAttribute('position', `${x} ${y} ${z}`);
}

function _generateStars() {
    // Clean up existing stars
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    stars = [];

    for (let i = 0; i < density; i++) {
        stars.push(_createStar());
    }
}

// --- Animation Logic ---
function _animate(time) {
    // On ne reçoit que 'time' de requestAnimationFrame. On calcule timeDelta manuellement.
    if (lastTime === 0) {
        lastTime = time;
    }
    const timeDelta = time - lastTime;
    lastTime = time;

    // Lissage de la vitesse
    currentSpeed += (targetSpeed - currentSpeed) * smoothingFactor;

    // Si la vitesse est très proche de zéro, on l'arrête complètement
    if (Math.abs(currentSpeed) < 0.01) {
        currentSpeed = 0;
    }

    // On ne met à jour que si la vitesse n'est pas nulle et que le temps a avancé
    if (currentSpeed !== 0 && timeDelta > 0) {
        const deltaSeconds = timeDelta / 1000; // Mouvement basé sur le temps réel écoulé
        const cameraPosition = sceneEl.camera.el.object3D.position;

        for (const starData of stars) {
            let pos = starData.element.getAttribute('position');
            
            // Vitesse (m/s) * temps (s) = distance (m)
            // Le '0.1' précédent rendait la vitesse perçue différente de la vitesse affichée.
            // On l'enlève pour une vitesse 1:1.
            pos.z += currentSpeed * deltaSeconds; 

            // If star is behind the camera, reset it
            if (pos.z > cameraPosition.z) {
                _resetStar(starData);
            } else {
                starData.element.setAttribute('position', pos);
            }
        }
    }

    animationFrameId = requestAnimationFrame(_animate);
}

// --- Public Interface ---
export const opticalFlowModule = {
    init(_sceneEl, _rigEl, _cameraEl, _container) {
        sceneEl = _sceneEl;
        container = _container;
        
        stateManager.subscribe(this.onStateChange.bind(this));

        _generateStars();

        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        lastTime = 0; // Réinitialiser le temps pour le calcul du delta
        animationFrameId = requestAnimationFrame(_animate);
    },

    onStateChange(newState) {
        this.setSpeed(newState.visual.speeds.t);
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
        // Not implemented for this simple module
        // All stars are white
    },

    cleanup() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        stars = [];
        currentSpeed = 0;
        targetSpeed = 0;
        lastTime = 0;
    }
};