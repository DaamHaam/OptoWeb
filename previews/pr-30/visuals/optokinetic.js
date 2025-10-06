/* visuals/optokinetic.js */
/* Rôle: Gère la stimulation visuelle optocinétique, y compris la génération des sphères et leur rotation. */

import { stateManager } from '../utils/stateManager.js';
import { colorPalettes } from '../utils/colorPalettes.js';

// --- Private State ---
let sceneEl, spheresContainer, rigEl, cameraEl;
let currentPaletteKey = 'default';
let currentPalette = colorPalettes.default;
let density = 150;
let animationFrameId;

let targetSpeedX = 0, targetSpeedY = 0, actualSpeedX = 0, actualSpeedY = 0;
const smoothingFactor = 1.5;
let rotationAxisX = new THREE.Vector3(1, 0, 0), rotationAxisY = new THREE.Vector3(0, 1, 0);

let isRegenerating = false;
let colorTransition = { isActive: false, duration: 500, startTime: 0, from: [], to: [] };
let autoCycleInterval = null;
let lastFrameTime = performance.now();
let frameCounter = 0;

let instancedMesh = null;
let instancedGeometry = null;
let instancedMaterial = null;
let haloTexture = null;
let fadeAnimationId = null;
const MAX_PALETTE_COLORS = 8;
let unsubscribeFromState = null;

const tempCameraQuat = new THREE.Quaternion();
const tempCameraRight = new THREE.Vector3(1, 0, 0);
const tempCameraUp = new THREE.Vector3(0, 1, 0);

const palettesUniformTemplate = Array.from({ length: MAX_PALETTE_COLORS }, () => new THREE.Color(0, 0, 0));


function _ensureHaloTexture() {
    if (haloTexture) return haloTexture;
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.6, 'rgba(255,255,255,0.4)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    haloTexture = new THREE.CanvasTexture(canvas);
    haloTexture.wrapS = haloTexture.wrapT = THREE.ClampToEdgeWrapping;
    haloTexture.magFilter = THREE.LinearFilter;
    haloTexture.minFilter = THREE.LinearMipMapLinearFilter;
    haloTexture.needsUpdate = true;
    return haloTexture;
}

function _createInstancedMaterial() {
    if (instancedMaterial) return instancedMaterial;
    instancedMaterial = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
            haloTexture: { value: _ensureHaloTexture() },
            globalOpacity: { value: 1.0 },
            mixFactor: { value: 0.0 },
            paletteFrom: { value: palettesUniformTemplate.map(color => color.clone()) },
            paletteTo: { value: palettesUniformTemplate.map(color => color.clone()) },
            paletteFromSize: { value: 1 },
            paletteToSize: { value: 1 },
            cameraRight: { value: new THREE.Vector3(1, 0, 0) },
            cameraUp: { value: new THREE.Vector3(0, 1, 0) }
        },
        vertexShader: /* glsl */`
            attribute vec3 instanceOffset;
            attribute float instanceScale;
            attribute float instancePaletteIndex;

            varying vec2 vUv;
            varying float vPaletteIndex;

            uniform vec3 cameraRight;
            uniform vec3 cameraUp;

            void main() {
                vec4 worldPosition = modelMatrix * vec4(instanceOffset, 1.0);
                vec3 billboardRight = cameraRight * instanceScale;
                vec3 billboardUp = cameraUp * instanceScale;
                vec3 displaced = worldPosition.xyz + (billboardRight * position.x) + (billboardUp * position.y);
                vec4 viewPosition = viewMatrix * vec4(displaced, 1.0);
                gl_Position = projectionMatrix * viewPosition;
                vUv = uv;
                vPaletteIndex = instancePaletteIndex;
            }
        `,
        fragmentShader: /* glsl */`
            uniform sampler2D haloTexture;
            uniform float globalOpacity;
            uniform float mixFactor;
            uniform vec3 paletteFrom[${MAX_PALETTE_COLORS}];
            uniform vec3 paletteTo[${MAX_PALETTE_COLORS}];
            uniform int paletteFromSize;
            uniform int paletteToSize;

            varying vec2 vUv;
            varying float vPaletteIndex;

            vec3 fetchColor(vec3 palette[${MAX_PALETTE_COLORS}], int paletteSize, int index) {
                if (paletteSize <= 0) {
                    return vec3(0.0);
                }
                int wrappedIndex = index % paletteSize;
                return palette[wrappedIndex];
            }

            void main() {
                int paletteIndex = int(vPaletteIndex + 0.5);
                vec3 colorFrom = fetchColor(paletteFrom, paletteFromSize, paletteIndex);
                vec3 colorTo = fetchColor(paletteTo, paletteToSize, paletteIndex);
                vec3 color = mix(colorFrom, colorTo, clamp(mixFactor, 0.0, 1.0));

                float halo = texture2D(haloTexture, vUv).r;
                float alpha = halo * globalOpacity;

                if (alpha <= 0.001) discard;

                gl_FragColor = vec4(color, alpha);
            }
        `
    });
    return instancedMaterial;
}

function _disposeInstancedResources() {
    if (fadeAnimationId) {
        cancelAnimationFrame(fadeAnimationId);
        fadeAnimationId = null;
    }
    if (instancedMesh && spheresContainer) {
        spheresContainer.object3D.remove(instancedMesh);
    }
    if (instancedGeometry) {
        instancedGeometry.dispose();
        instancedGeometry = null;
    }
    if (instancedMaterial) {
        instancedMaterial.dispose();
        instancedMaterial = null;
    }
    if (haloTexture) {
        haloTexture.dispose();
        haloTexture = null;
    }
    instancedMesh = null;
}

function _updatePaletteUniform(uniformName, palette) {
    if (!instancedMaterial) return;
    const uniform = instancedMaterial.uniforms[uniformName];
    const colors = palette.length > 0 ? palette : ['#000000'];
    uniform.value.forEach((color, index) => {
        const hex = colors[index % colors.length];
        color.set(hex);
    });
    instancedMaterial.uniforms[`${uniformName}Size`].value = palette.length;
}


// --- Sphere Generation Logic (from sphereGenerator.js) ---
const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle
const radius = 50;
const dispersionFactor = 8;
const baseSphereRadius = 0.8;
const minRandomRadius = baseSphereRadius * 0.5;
const maxRandomRadius = baseSphereRadius * 2.0;
const baseBillboardGeometry = new THREE.PlaneGeometry(1, 1, 1, 1);

function _generateSpheres(num, palette, initialOpacity = 1) {
    if (!spheresContainer) return;

    if (instancedMesh) {
        spheresContainer.object3D.remove(instancedMesh);
        instancedMesh = null;
    }

    if (instancedGeometry) {
        instancedGeometry.dispose();
        instancedGeometry = null;
    }

    instancedGeometry = new THREE.InstancedBufferGeometry();
    instancedGeometry.setIndex(baseBillboardGeometry.index);
    instancedGeometry.setAttribute('position', baseBillboardGeometry.attributes.position);
    instancedGeometry.setAttribute('uv', baseBillboardGeometry.attributes.uv);

    const offsets = new Float32Array(num * 3);
    const scales = new Float32Array(num);
    const paletteIndices = new Float32Array(num);

    for (let i = 0; i < num; i++) {
        const y = num > 1 ? 1 - (i / (num - 1)) * 2 : 0;
        const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
        const theta = phi * i;

        const x = Math.cos(theta) * radiusAtY;
        const z = Math.sin(theta) * radiusAtY;

        const offsetX = (Math.random() - 0.5) * dispersionFactor;
        const offsetY = (Math.random() - 0.5) * dispersionFactor;
        const oz = (Math.random() - 0.5) * dispersionFactor;

        const randomRadius = minRandomRadius + (Math.random() * (maxRandomRadius - minRandomRadius));

        offsets[i * 3 + 0] = x * radius + offsetX;
        offsets[i * 3 + 1] = y * radius + offsetY;
        offsets[i * 3 + 2] = z * radius + oz;
        scales[i] = randomRadius * 2.0;
        paletteIndices[i] = i;
    }

    instancedGeometry.setAttribute('instanceOffset', new THREE.InstancedBufferAttribute(offsets, 3));
    instancedGeometry.setAttribute('instanceScale', new THREE.InstancedBufferAttribute(scales, 1));
    instancedGeometry.setAttribute('instancePaletteIndex', new THREE.InstancedBufferAttribute(paletteIndices, 1));
    instancedGeometry.instanceCount = num;

    const material = _createInstancedMaterial();
    material.uniforms.globalOpacity.value = initialOpacity;

    _updatePaletteUniform('paletteFrom', palette);
    _updatePaletteUniform('paletteTo', palette);
    material.uniforms.mixFactor.value = 0.0;

    instancedMesh = new THREE.Mesh(instancedGeometry, material);
    instancedMesh.frustumCulled = false;
    spheresContainer.object3D.add(instancedMesh);
}

function _fade(direction, callback) {
    if (!instancedMaterial) {
        if (callback) callback();
        return;
    }

    if (fadeAnimationId) {
        cancelAnimationFrame(fadeAnimationId);
        fadeAnimationId = null;
    }

    const duration = 300;
    const startOpacity = instancedMaterial.uniforms.globalOpacity.value;
    const endOpacity = direction === 'out' ? 0 : 1;
    let startTime = null;

    function fadeAnimation(time) {
        if (!startTime) startTime = time;
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const opacity = THREE.MathUtils.lerp(startOpacity, endOpacity, progress);
        instancedMaterial.uniforms.globalOpacity.value = opacity;

        if (progress < 1) {
            fadeAnimationId = requestAnimationFrame(fadeAnimation);
        } else {
            fadeAnimationId = null;
            if (callback) callback();
        }
    }
    fadeAnimationId = requestAnimationFrame(fadeAnimation);
}


// --- Animation Logic (from main.js) ---
function _animate(time) {
    animationFrameId = requestAnimationFrame(_animate);
    frameCounter++;
    const dt = (time - lastFrameTime) / 1000;
    lastFrameTime = time;

    if (instancedMaterial && cameraEl) {
        cameraEl.object3D.getWorldQuaternion(tempCameraQuat);
        tempCameraRight.set(1, 0, 0).applyQuaternion(tempCameraQuat);
        tempCameraUp.set(0, 1, 0).applyQuaternion(tempCameraQuat);
        instancedMaterial.uniforms.cameraRight.value.copy(tempCameraRight);
        instancedMaterial.uniforms.cameraUp.value.copy(tempCameraUp);
    }

    if (colorTransition.isActive && instancedMaterial) {
        const elapsed = time - colorTransition.startTime;
        const progress = Math.min(elapsed / colorTransition.duration, 1);
        instancedMaterial.uniforms.mixFactor.value = progress;

        if (progress >= 1) {
            colorTransition.isActive = false;
            currentPalette = colorTransition.to;
            _updatePaletteUniform('paletteFrom', currentPalette);
            _updatePaletteUniform('paletteTo', currentPalette);
            instancedMaterial.uniforms.mixFactor.value = 0.0;
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

function _startColorTransition(palette) {
    if (!instancedMaterial) return;
    colorTransition.from = Array.isArray(currentPalette) ? [...currentPalette] : [];
    colorTransition.to = palette;
    colorTransition.startTime = performance.now();
    colorTransition.isActive = true;
    _updatePaletteUniform('paletteFrom', colorTransition.from);
    _updatePaletteUniform('paletteTo', palette);
    instancedMaterial.uniforms.mixFactor.value = 0.0;
}

function _startAutoColorCycle() {
    _stopAutoColorCycle();
    const paletteKeys = Object.keys(colorPalettes).filter(k => k !== 'default' && k !== 'none');
    if (paletteKeys.length === 0) return;
    let currentIndex = 0;
    const advancePalette = () => {
        const nextPaletteKey = paletteKeys[currentIndex];
        const nextPalette = colorPalettes[nextPaletteKey];
        if (nextPalette) {
            _startColorTransition(nextPalette);
        }
        currentIndex = (currentIndex + 1) % paletteKeys.length;
    };
    advancePalette();
    autoCycleInterval = setInterval(advancePalette, 5000);
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

        // S'abonner aux changements d'état
        if (unsubscribeFromState) {
            unsubscribeFromState();
        }
        unsubscribeFromState = stateManager.subscribe(this.onStateChange.bind(this));

        // Récupérer l'état initial pour la première génération
        const initialState = stateManager.getState();
        density = initialState.visual.density;
        currentPaletteKey = initialState.visual.palette || 'default';
        currentPalette = colorPalettes[currentPaletteKey] || colorPalettes.default;

        _generateSpheres(density, currentPalette);

        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        animationFrameId = requestAnimationFrame(_animate);

        if (currentPaletteKey === 'none') {
            spheresContainer.setAttribute('visible', 'false');
        } else if (currentPaletteKey === 'auto') {
            spheresContainer.setAttribute('visible', 'true');
            _startAutoColorCycle();
        }
    },

    onStateChange(newState) {
        // Réagir aux changements de densité
        if (newState.visual.density !== density) {
            density = newState.visual.density;
            this.regenerate(); // La régénération se chargera du fade out/in
        }

        // Réagir aux changements de palette
        const newPaletteId = newState.visual.palette;

        if (newPaletteId !== currentPaletteKey) {
            if (newPaletteId === 'none') {
                spheresContainer.setAttribute('visible', 'false');
                colorTransition.isActive = false;
                currentPalette = colorPalettes.none;
                currentPaletteKey = 'none';
                if (fadeAnimationId) {
                    cancelAnimationFrame(fadeAnimationId);
                    fadeAnimationId = null;
                }
                if (instancedMaterial) {
                    instancedMaterial.uniforms.globalOpacity.value = 0.0;
                    instancedMaterial.uniforms.mixFactor.value = 0.0;
                    _updatePaletteUniform('paletteFrom', currentPalette);
                    _updatePaletteUniform('paletteTo', currentPalette);
                }
                _stopAutoColorCycle();
            } else {
                spheresContainer.setAttribute('visible', 'true');
                if (instancedMaterial && instancedMaterial.uniforms.globalOpacity.value === 0) {
                    instancedMaterial.uniforms.globalOpacity.value = 1.0;
                }
                if (newPaletteId === 'auto') {
                    _startAutoColorCycle();
                    currentPaletteKey = 'auto';
                } else {
                    _stopAutoColorCycle();
                    const newPalette = colorPalettes[newPaletteId];
                    if (newPalette) {
                        _startColorTransition(newPalette);
                        currentPaletteKey = newPaletteId;
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
        if (unsubscribeFromState) {
            unsubscribeFromState();
            unsubscribeFromState = null;
        }
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        _stopAutoColorCycle();
        _disposeInstancedResources();
    }
};
