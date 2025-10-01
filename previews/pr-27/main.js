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
    const opticalFlowDensitySlider = document.getElementById('optical-flow-density-slider');
    const horizontalSpeedValue = document.getElementById('horizontal-speed-value');
    const verticalSpeedValue = document.getElementById('vertical-speed-value');
    const translationSpeedValue = document.getElementById('translation-speed-value');
    const heightSpeedValue = document.getElementById('height-speed-value');
    const cubeSpeedSlider = document.getElementById('cube-speed-slider');
    const cubeSpeedValue = document.getElementById('cube-speed-value');
    const paletteSelect = document.getElementById('palette-select');
    const opticalFlowPaletteSelect = document.getElementById('optical-flow-palette-select');
    const recenterButton = document.getElementById('recenter-button');
    const vrMessage = document.getElementById('vr-message');
    const ambianceControl = document.getElementById('ambiance-control');
    const exerciseSelect = document.getElementById('exercise-select');
    const exerciseSubmenu = document.getElementById('exercise-submenu');
    const skyEl = document.getElementById('sky');
    const shortcutButton = document.getElementById('shortcut-button');
    const shortcutOverlay = document.getElementById('shortcut-overlay');
    const shortcutCloseButton = document.getElementById('shortcut-close');
    const uiPanelsContainer = document.querySelector('.ui-panels-container');
    const mobileTabbar = document.querySelector('.mobile-tabbar');
    const mobileTabButtons = mobileTabbar ? Array.from(mobileTabbar.querySelectorAll('[role="tab"]')) : [];
    const mobilePanelsToggle = document.getElementById('mobile-panels-toggle');
    const mobilePanelsToggleLabel = mobilePanelsToggle ? mobilePanelsToggle.querySelector('.mobile-tabbutton-label') : null;
    const mobileKeypad = document.getElementById('mobile-keypad');
    let mobilePanelsHandle = null;
    let areMobilePanelsHidden = false;
    const mobilePanels = {
        'visual-panel': document.getElementById('visual-panel'),
        'exercise-panel': document.getElementById('exercise-panel')
    };
    const mobileMediaQuery = window.matchMedia('(max-width: 768px)');
    let activeMobileTabId = 'visual-panel';

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

    const isShortcutOverlayOpen = () => !shortcutOverlay.hidden;

    const openShortcutOverlay = () => {
        if (isShortcutOverlayOpen()) {
            return;
        }
        shortcutOverlay.hidden = false;
        shortcutOverlay.setAttribute('aria-hidden', 'false');
        shortcutButton.setAttribute('aria-expanded', 'true');
        requestAnimationFrame(() => {
            shortcutCloseButton.focus();
        });
    };

    const closeShortcutOverlay = () => {
        if (!isShortcutOverlayOpen()) {
            return;
        }
        shortcutOverlay.hidden = true;
        shortcutOverlay.setAttribute('aria-hidden', 'true');
        shortcutButton.setAttribute('aria-expanded', 'false');
        shortcutButton.focus();
    };

    shortcutOverlay.setAttribute('aria-hidden', 'true');

    const ensureMobilePanelsHandle = () => {
        if (mobilePanelsHandle) {
            return mobilePanelsHandle;
        }
        const handleButton = document.createElement('button');
        handleButton.type = 'button';
        handleButton.id = 'mobile-panels-handle';
        handleButton.className = 'mobile-panels-handle';
        handleButton.textContent = 'Afficher les menus';
        handleButton.hidden = true;
        handleButton.setAttribute('aria-pressed', 'false');
        document.body.appendChild(handleButton);

        handleButton.addEventListener('click', () => {
            if (!mobileMediaQuery.matches) {
                return;
            }
            areMobilePanelsHidden = false;
            syncMobilePanelsHiddenState(true);
            focusActiveMobileTabButton();
        });

        mobilePanelsHandle = handleButton;
        return mobilePanelsHandle;
    };

    const focusActiveMobileTabButton = () => {
        if (!mobileMediaQuery.matches) {
            return;
        }
        const activeButton = mobileTabButtons.find((button) => button.dataset.target === activeMobileTabId);
        if (activeButton) {
            activeButton.focus();
        }
    };

    const syncMobilePanelsHiddenState = (isMobile) => {
        if (!uiPanelsContainer) {
            return;
        }

        if (!isMobile) {
            areMobilePanelsHidden = false;
            uiPanelsContainer.classList.remove('is-mobile-hidden');
            uiPanelsContainer.setAttribute('aria-hidden', 'false');
            if (mobilePanelsToggle) {
                mobilePanelsToggle.setAttribute('aria-pressed', 'false');
                if (mobilePanelsToggleLabel) {
                    mobilePanelsToggleLabel.textContent = 'Masquer';
                }
            }
            if (mobilePanelsHandle) {
                mobilePanelsHandle.hidden = true;
                mobilePanelsHandle.setAttribute('aria-pressed', 'false');
            }
            return;
        }

        uiPanelsContainer.classList.toggle('is-mobile-hidden', areMobilePanelsHidden);
        uiPanelsContainer.setAttribute('aria-hidden', areMobilePanelsHidden ? 'true' : 'false');

        if (mobilePanelsToggle) {
            mobilePanelsToggle.setAttribute('aria-pressed', areMobilePanelsHidden ? 'true' : 'false');
            if (mobilePanelsToggleLabel) {
                mobilePanelsToggleLabel.textContent = areMobilePanelsHidden ? 'Afficher' : 'Masquer';
            }
        }

        const handle = ensureMobilePanelsHandle();
        handle.hidden = !areMobilePanelsHidden;
        handle.setAttribute('aria-pressed', areMobilePanelsHidden ? 'true' : 'false');

        if (areMobilePanelsHidden) {
            requestAnimationFrame(() => {
                handle.focus();
            });
        }
    };

    const applyMobilePanelState = (isMobile) => {
        if (!mobileTabbar || !uiPanelsContainer) {
            return;
        }

        uiPanelsContainer.classList.toggle('is-mobile-tabs', isMobile);

        mobileTabButtons.forEach((button) => {
            const isActive = button.dataset.target === activeMobileTabId;
            button.classList.toggle('is-active', isMobile && isActive);
            button.setAttribute('aria-selected', isActive ? 'true' : 'false');
            button.setAttribute('tabindex', isMobile ? (isActive ? '0' : '-1') : '0');
        });

        Object.entries(mobilePanels).forEach(([panelId, panelEl]) => {
            if (!panelEl) {
                return;
            }
            const isActive = panelId === activeMobileTabId;
            panelEl.classList.toggle('is-active-mobile', isMobile && isActive);
            panelEl.setAttribute('aria-hidden', isMobile ? (isActive ? 'false' : 'true') : 'false');
        });

        syncMobilePanelsHiddenState(isMobile);
    };

    const setActiveMobileTab = (targetId) => {
        if (!mobilePanels[targetId]) {
            return;
        }
        activeMobileTabId = targetId;
        applyMobilePanelState(mobileMediaQuery.matches);
    };

    const handleMobileBreakpoint = (mqEvent) => {
        applyMobilePanelState(mqEvent.matches);
    };

    if (mobileTabbar && uiPanelsContainer) {
        applyMobilePanelState(mobileMediaQuery.matches);

        if (typeof mobileMediaQuery.addEventListener === 'function') {
            mobileMediaQuery.addEventListener('change', handleMobileBreakpoint);
        } else if (typeof mobileMediaQuery.addListener === 'function') {
            mobileMediaQuery.addListener(handleMobileBreakpoint);
        }

        mobileTabButtons.forEach((button) => {
            button.addEventListener('click', () => {
                setActiveMobileTab(button.dataset.target);
                button.blur();
            });

            button.addEventListener('keydown', (event) => {
                if (!mobileMediaQuery.matches) {
                    return;
                }
                const { key } = event;
                if (key !== 'ArrowLeft' && key !== 'ArrowRight' && key !== 'Home' && key !== 'End') {
                    return;
                }

                event.preventDefault();
                const currentIndex = mobileTabButtons.indexOf(button);
                let nextIndex = currentIndex;

                if (key === 'ArrowLeft') {
                    nextIndex = (currentIndex - 1 + mobileTabButtons.length) % mobileTabButtons.length;
                } else if (key === 'ArrowRight') {
                    nextIndex = (currentIndex + 1) % mobileTabButtons.length;
                } else if (key === 'Home') {
                    nextIndex = 0;
                } else if (key === 'End') {
                    nextIndex = mobileTabButtons.length - 1;
                }

                const nextButton = mobileTabButtons[nextIndex];
                if (nextButton) {
                    nextButton.focus();
                    setActiveMobileTab(nextButton.dataset.target);
                }
            });
        });
    }

    if (mobilePanelsToggle) {
        mobilePanelsToggle.addEventListener('click', () => {
            if (!mobileMediaQuery.matches) {
                return;
            }
            areMobilePanelsHidden = !areMobilePanelsHidden;
            syncMobilePanelsHiddenState(true);

            if (!areMobilePanelsHidden) {
                focusActiveMobileTabButton();
            }
        });
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

    const syncDensityControls = (value) => {
        if (densitySlider) {
            densitySlider.value = value;
        }
        if (opticalFlowDensitySlider) {
            opticalFlowDensitySlider.value = value;
        }
    };

    const updateDensityState = (value) => {
        const newDensity = parseInt(value, 10);
        if (Number.isNaN(newDensity)) {
            return;
        }
        syncDensityControls(newDensity);
        const currentState = stateManager.getState();
        stateManager.setState({
            visual: {
                ...currentState.visual,
                density: newDensity
            }
        });
    };

    if (densitySlider) {
        densitySlider.addEventListener('input', (e) => {
            updateDensityState(e.target.value);
        });

        densitySlider.addEventListener('change', (e) => {
            updateDensityState(e.target.value);
            e.target.blur();
        });
    }

    if (opticalFlowDensitySlider) {
        opticalFlowDensitySlider.addEventListener('input', (e) => {
            updateDensityState(e.target.value);
        });

        opticalFlowDensitySlider.addEventListener('change', (e) => {
            updateDensityState(e.target.value);
            e.target.blur();
        });
    }

    const syncPaletteControls = (value) => {
        if (paletteSelect && paletteSelect.value !== value) {
            paletteSelect.value = value;
        }
        if (opticalFlowPaletteSelect && opticalFlowPaletteSelect.value !== value) {
            opticalFlowPaletteSelect.value = value;
        }
    };

    const updatePaletteState = (value, target) => {
        if (!value) {
            return;
        }
        syncPaletteControls(value);
        const currentState = stateManager.getState();
        stateManager.setState({
            visual: {
                ...currentState.visual,
                palette: value
            }
        });
        if (target) {
            target.blur();
        }
    };

    if (paletteSelect) {
        paletteSelect.addEventListener('change', (e) => {
            updatePaletteState(e.target.value, e.target);
        });
    }

    if (opticalFlowPaletteSelect) {
        opticalFlowPaletteSelect.addEventListener('change', (e) => {
            updatePaletteState(e.target.value, e.target);
        });
    }

    recenterButton.addEventListener('click', (e) => {
        handleRecenter();
        e.target.blur();
    });

    shortcutButton.addEventListener('click', () => {
        if (isShortcutOverlayOpen()) {
            closeShortcutOverlay();
        } else {
            openShortcutOverlay();
        }
    });

    shortcutCloseButton.addEventListener('click', () => {
        closeShortcutOverlay();
    });

    shortcutOverlay.addEventListener('click', (event) => {
        if (event.target === shortcutOverlay) {
            closeShortcutOverlay();
        }
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

    const normalizeInputKey = (value) => {
        if (!value) {
            return '';
        }
        if (value === ' ' || value.toLowerCase() === 'space' || value.toLowerCase() === 'spacebar') {
            return ' ';
        }
        return value.toLowerCase();
    };

    const handleControlInput = (inputValue) => {
        const key = normalizeInputKey(inputValue);

        if (!key) {
            return;
        }

        if (isShortcutOverlayOpen()) {
            if (key === 'escape') {
                closeShortcutOverlay();
            }
            return;
        }

        if (key === 'escape') {
            return;
        }

        const moduleName = visualSelect.value;
        const currentState = stateManager.getState();
        let newSpeeds = { ...currentState.visual.speeds };
        let speedUpdated = false;

        if (activeVisualModule) {
            if (moduleName === 'optokinetic') {
                switch (key) {
                    case 'arrowup': newSpeeds.v += speedIncrement; speedUpdated = true; break;
                    case 'arrowdown': newSpeeds.v -= speedIncrement; speedUpdated = true; break;
                    case 'arrowleft': newSpeeds.h -= speedIncrement; speedUpdated = true; break;
                    case 'arrowright': newSpeeds.h += speedIncrement; speedUpdated = true; break;
                    case ' ': newSpeeds.h = 0; newSpeeds.v = 0; speedUpdated = true; break;
                    case 'i':
                        newSpeeds.h = -newSpeeds.h;
                        newSpeeds.v = -newSpeeds.v;
                        speedUpdated = true;
                        break;
                    default:
                        break;
                }
            } else if (moduleName === 'opticalFlow') {
                switch (key) {
                    case 'arrowup': newSpeeds.t += translationSpeedIncrement; speedUpdated = true; break;
                    case 'arrowdown': newSpeeds.t -= translationSpeedIncrement; speedUpdated = true; break;
                    case ' ': newSpeeds.t = 0; speedUpdated = true; break;
                    case 'i':
                        newSpeeds.t = -newSpeeds.t;
                        speedUpdated = true;
                        break;
                    default:
                        break;
                }
            } else if (moduleName === 'heights') {
                if (key === 'arrowup') {
                    newSpeeds.y = Math.min(5, newSpeeds.y + 0.5);
                    speedUpdated = true;
                } else if (key === 'arrowdown') {
                    newSpeeds.y = Math.max(-5, newSpeeds.y - 0.5);
                    speedUpdated = true;
                } else if (key === ' ') {
                    newSpeeds.y = 0;
                    speedUpdated = true;
                }
            }

            if (speedUpdated) {
                stateManager.setState({ visual: { ...currentState.visual, speeds: newSpeeds } });
            }

            if (key === 'r') {
                handleRecenter();
            }
        }

        if (activeExerciseModule && typeof activeExerciseModule.handleKey === 'function') {
            activeExerciseModule.handleKey(key);
        }
    };

    document.addEventListener('keydown', (event) => {
        handleControlInput(event.key);
    });

    if (mobileKeypad) {
        mobileKeypad.addEventListener('click', (event) => {
            const button = event.target.closest('.mobile-keypad-button');
            if (!button) {
                return;
            }

            const datasetKey = button.dataset.key;
            if (!datasetKey) {
                return;
            }

            handleControlInput(datasetKey);
            button.blur();
        });
    }

    sceneEl.addEventListener('enter-vr', () => {
        vrMessage.style.display = 'flex';
        handleRecenter(); 
    });

    sceneEl.addEventListener('exit-vr', () => { 
        vrMessage.style.display = 'none'; 
    });

    // --- Initialization ---
    function initialize() {
        const { visual } = stateManager.getState();
        syncDensityControls(visual.density);
        syncPaletteControls(visual.palette);

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