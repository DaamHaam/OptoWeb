/* main.js */
/* Rôle: Point d'entrée logique de l'application. Gère l'initialisation de l'interface utilisateur et la communication avec les modules (visuel, exercices). */

import { stateManager } from './utils/stateManager.js';
import { optokineticModule } from './visuals/optokinetic.js';
import { opticalFlowModule } from './visuals/opticalFlow.js';
import { rotatingCubeModule } from './visuals/rotatingCube.js';
import { heightsModule } from './visuals/heights.js';

// --- A-Frame Component for Exercise Ticking ---
AFRAME.registerComponent('exercise-ticker', {
    init: function () {
        this.activeExerciseModule = null;
    },
    tick: function (time, timeDelta) {
        if (this.activeExerciseModule && typeof this.activeExerciseModule.tick === 'function') {
            this.activeExerciseModule.tick(time, timeDelta);
        }
    },
    setActiveExercise: function (module) {
        this.activeExerciseModule = module;
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const sceneEl = document.querySelector('a-scene');
    const rigEl = document.getElementById('rig');
    const cameraEl = document.querySelector('a-camera');
    const spheresContainer = document.getElementById('spheres');
    const visualSelect = document.getElementById('visual-select');
    const visualSubmenu = document.getElementById('visual-submenu');
    const densitySlider = document.getElementById('density-slider');
    const horizontalSpeedValue = document.getElementById('horizontal-speed-value');
    const verticalSpeedValue = document.getElementById('vertical-speed-value');
    const translationSpeedValue = document.getElementById('translation-speed-value');
    const heightSpeedValue = document.getElementById('height-speed-value');
    const cubeSpeedSlider = document.getElementById('cube-speed-slider');
    const cubeSpeedValue = document.getElementById('cube-speed-value');
    const paletteSelect = document.getElementById('palette-select');
    const recenterButton = document.getElementById('recenter-button');
    const vrMessage = document.getElementById('vr-message');
    const ambianceControl = document.getElementById('ambiance-control');
    const exerciseSelect = document.getElementById('exercise-select');
    const exerciseSubmenu = document.getElementById('exercise-submenu');
    const skyEl = document.getElementById('sky');

    // --- State Variables ---
    let activeExerciseModule = null;
    let activeVisualModule = null;
    const speedIncrement = 1;
    const translationSpeedIncrement = 0.5;

    const VisualModules = {
        none: null,
        optokinetic: optokineticModule,
        opticalFlow: opticalFlowModule,
        rotatingCube: rotatingCubeModule,
        heights: heightsModule
    };

    // --- Core Functions ---

    function updateUIVisibility(moduleName) {
        // Gère la visibilité des contrôles spécifiques à chaque module.
        // Cache DOM elements
    const optokineticControls = document.getElementById('optokinetic-controls');
    const opticalFlowControls = document.getElementById('optical-flow-controls');
    const rotatingCubeControls = document.getElementById('rotating-cube-controls');
    const heightsControls = document.getElementById('heights-controls');


        optokineticControls.style.display = (moduleName === 'optokinetic') ? 'flex' : 'none';
        opticalFlowControls.style.display = (moduleName === 'opticalFlow') ? 'flex' : 'none';
        rotatingCubeControls.style.display = (moduleName === 'rotatingCube') ? 'flex' : 'none';
        heightsControls.style.display = (moduleName === 'heights') ? 'flex' : 'none';

        const shouldDisplaySubmenu = moduleName && moduleName !== 'none';
        visualSubmenu.style.display = shouldDisplaySubmenu ? '' : 'none';
    }

    function setActiveVisualModule(moduleName) {
        if (activeVisualModule && typeof activeVisualModule.cleanup === 'function') {
            activeVisualModule.cleanup();
        }

        activeVisualModule = VisualModules[moduleName] || null;
        updateUIVisibility(moduleName);

        const currentState = stateManager.getState();
        const baseVisualState = {
            ...currentState.visual,
            activeModule: moduleName,
            speeds: { h: 0, v: 0, t: 0, y: 0 }
        };

        if (!activeVisualModule) {
            if (skyEl) {
                skyEl.setAttribute('color', '#000000');
            }
            horizontalSpeedValue.textContent = '0';
            verticalSpeedValue.textContent = '0';
            translationSpeedValue.textContent = '0.0';
            heightSpeedValue.textContent = '0.0';
            stateManager.setState({ visual: baseVisualState });
            return;
        }

        if (typeof activeVisualModule.init === 'function') {
            activeVisualModule.init(sceneEl, rigEl, cameraEl, spheresContainer);
        }

        let newSpeeds = { h: 0, v: 0, t: 0, y: 0 };
        if (moduleName === 'rotatingCube') {
            newSpeeds.t = parseFloat(cubeSpeedSlider.value);
        }

        stateManager.setState({
            visual: {
                ...baseVisualState,
                speeds: newSpeeds
            }
        });
    }

    function getHorizontalForwardQuaternion() {
        const cameraQuaternion = new THREE.Quaternion();
        cameraEl.object3D.getWorldQuaternion(cameraQuaternion);
        const rigQuaternion = rigEl.object3D.quaternion.clone();
        const invRigQuaternion = rigQuaternion.invert();
        cameraQuaternion.premultiply(invRigQuaternion);
        const euler = new THREE.Euler().setFromQuaternion(cameraQuaternion, 'YXZ');
        euler.x = 0;
        euler.z = 0;
        return new THREE.Quaternion().setFromEuler(euler);
    }

    function handleRecenter() {
        if (activeVisualModule && typeof activeVisualModule.regenerate === 'function') {
            activeVisualModule.regenerate();
        }
        if (activeExerciseModule && typeof activeExerciseModule.recenter === 'function') {
            activeExerciseModule.recenter({ getHorizontalForwardQuaternion });
        }
    }

    async function handleExerciseChange(moduleName) {
        // 1. Cleanup the previous exercise
        if (activeExerciseModule && typeof activeExerciseModule.cleanup === 'function') {
            activeExerciseModule.cleanup();
        }
        activeExerciseModule = null;
        exerciseSubmenu.innerHTML = ''; // Clear submenu immediately

        // 2. If 'none' is selected, we're done
        if (moduleName === 'none') {
            exerciseSelect.value = 'none';
            return;
        }

        // 3. Load the new module dynamically
        try {
            const module = await import(`./modules/${moduleName}.js`);
            activeExerciseModule = module.exerciseModule; // Assuming all modules export 'exerciseModule'
        } catch (error) {
            console.error(`Failed to load exercise module: ${moduleName}`, error);
            return;
        }

        // 4. Initialize the new exercise
        if (activeExerciseModule && typeof activeExerciseModule.init === 'function') {
            activeExerciseModule.init({
                rigEl,
                cameraEl,
                exerciseSubmenu,
                getHorizontalForwardQuaternion
            });
        }

        // 5. Pass the module to the ticker component
        sceneEl.components['exercise-ticker'].setActiveExercise(activeExerciseModule);
        
        // 6. Ensure the dropdown is synchronized
        exerciseSelect.value = moduleName;
    }
    
    function updateSpeedDisplay() {
        const moduleName = visualSelect.value;
        const { visual: { speeds } } = stateManager.getState();

        if (moduleName === 'optokinetic') {
            horizontalSpeedValue.textContent = Math.round(speeds.h);
            verticalSpeedValue.textContent = Math.round(speeds.v);
        } else if (moduleName === 'opticalFlow') {
            translationSpeedValue.textContent = Number(speeds.t).toFixed(1);
        } else if (moduleName === 'heights') {
            heightSpeedValue.textContent = Number(speeds.y).toFixed(1);
        }

        requestAnimationFrame(updateSpeedDisplay);
    }

    // --- Event Listeners ---
    visualSelect.addEventListener('change', (e) => {
        setActiveVisualModule(e.target.value);
        e.target.blur();
    });

    exerciseSelect.addEventListener('change', (e) => { 
        handleExerciseChange(e.target.value); 
        e.target.blur();
    });

    const updateDensityState = (value) => {
        const newDensity = parseInt(value, 10);
        const currentState = stateManager.getState();
        stateManager.setState({
            visual: {
                ...currentState.visual,
                density: newDensity
            }
        });
    };

    densitySlider.addEventListener('input', (e) => {
        updateDensityState(e.target.value);
    });

    densitySlider.addEventListener('change', (e) => {
        updateDensityState(e.target.value);
        e.target.blur();
    });

    paletteSelect.addEventListener('change', (e) => {
        const newPalette = e.target.value;
        const currentState = stateManager.getState();
        stateManager.setState({
            visual: {
                ...currentState.visual,
                palette: newPalette
            }
        });
        e.target.blur();
    });

    recenterButton.addEventListener('click', (e) => {
        handleRecenter();
        e.target.blur();
    });

    cubeSpeedSlider.addEventListener('input', (e) => { 
        cubeSpeedValue.textContent = e.target.value; 
        const newSpeed = parseFloat(e.target.value);
        const currentState = stateManager.getState();
        stateManager.setState({ 
            visual: { 
                ...currentState.visual, 
                speeds: { ...currentState.visual.speeds, t: newSpeed } 
            } 
        });
    });

    cubeSpeedSlider.addEventListener('change', (e) => {
        e.target.blur();
    });

    const blurActiveRange = () => {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.matches('input[type="range"]')) {
            activeElement.blur();
        }
    };

    document.addEventListener('change', (event) => {
        if (event.target && event.target.matches('input[type="range"]')) {
            event.target.blur();
        }
    }, true);

    document.addEventListener('pointerup', blurActiveRange);
    document.addEventListener('touchend', blurActiveRange);
    document.addEventListener('mouseup', blurActiveRange);

    document.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        const moduleName = visualSelect.value;
        const currentState = stateManager.getState();
        let newSpeeds = { ...currentState.visual.speeds };

        if (activeVisualModule) {
            if (moduleName === 'optokinetic') {
                switch (key) {
                    case 'arrowup': newSpeeds.v += speedIncrement; break;
                    case 'arrowdown': newSpeeds.v -= speedIncrement; break;
                    case 'arrowleft': newSpeeds.h -= speedIncrement; break;
                    case 'arrowright': newSpeeds.h += speedIncrement; break;
                    case ' ': newSpeeds.h = 0; newSpeeds.v = 0; break;
                }
            } else if (moduleName === 'opticalFlow') {
                switch (key) {
                    case 'arrowup': newSpeeds.t += translationSpeedIncrement; break;
                    case 'arrowdown': newSpeeds.t -= translationSpeedIncrement; break;
                    case ' ': newSpeeds.t = 0; break;
                }
            } else if (moduleName === 'heights') {
                if (key === 'arrowup') {
                    newSpeeds.y = Math.min(5, newSpeeds.y + 0.5);
                } else if (key === 'arrowdown') {
                    newSpeeds.y = Math.max(-5, newSpeeds.y - 0.5);
                } else if (key === ' ') { // Espace
                    newSpeeds.y = 0;
                }
            }

            stateManager.setState({ visual: { ...currentState.visual, speeds: newSpeeds } });

            if (key === 'r') {
                handleRecenter();
            }
        }

        // Exercise module controls
        if (activeExerciseModule && typeof activeExerciseModule.handleKey === 'function') {
            activeExerciseModule.handleKey(key);
        }
    });

    sceneEl.addEventListener('enter-vr', () => {
        vrMessage.style.display = 'flex';
        handleRecenter(); 
    });

    sceneEl.addEventListener('exit-vr', () => { 
        vrMessage.style.display = 'none'; 
    });

    // --- Initialization ---
    function initialize() {
        setActiveVisualModule(visualSelect.value); // This will also call updateUIVisibility
        
        if (cameraEl.hasLoaded) {
            handleRecenter();
        } else {
            cameraEl.addEventListener('loaded', handleRecenter);
        }

        // Load the default exercise
        handleExerciseChange(exerciseSelect.value);
        
        requestAnimationFrame(updateSpeedDisplay);
    }

    initialize();
});