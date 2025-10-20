/* /visuals/decor_heights.js */

const DENSITY_LEVELS = ['minimal', 'standard', 'rich', 'immersive'];

function isLevelAtLeast(currentLevel, requiredLevel) {
    return DENSITY_LEVELS.indexOf(currentLevel) >= DENSITY_LEVELS.indexOf(requiredLevel);
}

function createEntity(tagName, attributes = {}, parent) {
    const element = document.createElement(tagName);
    Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
    });
    if (parent) {
        parent.appendChild(element);
    }
    return element;
}

function addBaseStructures(root) {
    createEntity('a-entity', {
        geometry: 'primitive: circle; radius: 58; segments: 96',
        material: 'shader: flat; roughness: 0.8; color: #f0e3c0',
        rotation: '-90 0 0',
        position: '0 -1.2 -2'
    }, root);

    createEntity('a-entity', {
        geometry: 'primitive: torus; radius: 58; radiusTubular: 0.6; segmentsTubular: 32; segmentsRadial: 12',
        material: 'color: #d7c5a3; shader: flat; metalness: 0.05; roughness: 0.6',
        rotation: '90 0 0',
        position: '0 -1.45 -2'
    }, root);

    const terraces = [
        { radius: 25, y: -4, color: '#d3d9dc' },
        { radius: 18, y: -6.5, color: '#b9c6cf' },
        { radius: 12, y: -9, color: '#9fb3c4' }
    ];

    terraces.forEach((terrace) => {
        createEntity('a-cylinder', {
            radius: terrace.radius,
            height: '0.4',
            color: terrace.color,
            position: `0 ${terrace.y} -2`,
            material: 'shader: flat'
        }, root);
    });

    createEntity('a-cylinder', {
        radius: '6',
        height: '14',
        color: '#1f2a44',
        opacity: '0.85',
        position: '0 -8.5 -2',
        material: 'shader: flat'
    }, root);
}

function addCloseTowerRing(root, densityLevel) {
    const towerConfigs = [
        { x: 3.5, z: -5, height: 16, bodyColor: '#ff9a9e', accent: '#ffe5ec', glow: '#fff3e6', minDensity: 'minimal' },
        { x: -3.2, z: -5.2, height: 17, bodyColor: '#fad0c4', accent: '#ffeacb', glow: '#fffaf0', minDensity: 'minimal' },
        { x: 5.2, z: -2.5, height: 15, bodyColor: '#f6abb6', accent: '#ffd3e1', glow: '#ffeef5', minDensity: 'minimal' },
        { x: -5.4, z: -2.2, height: 15.5, bodyColor: '#ffb7c3', accent: '#ffe0ea', glow: '#fff3f8', minDensity: 'minimal' },
        { x: 2.2, z: -7, height: 18.5, bodyColor: '#c3bef0', accent: '#dfd7ff', glow: '#f5f2ff', minDensity: 'standard' },
        { x: -1.8, z: -7.4, height: 19, bodyColor: '#a3bffa', accent: '#cdd9ff', glow: '#f0f4ff', minDensity: 'standard' },
        { x: 6.2, z: 0.2, height: 14, bodyColor: '#f8b195', accent: '#ffd4b8', glow: '#fff1e6', minDensity: 'rich' },
        { x: -6.5, z: 0.4, height: 14.5, bodyColor: '#f67280', accent: '#ff9ba9', glow: '#ffdce3', minDensity: 'rich' },
        { x: 4.2, z: 2.2, height: 13.8, bodyColor: '#99c1de', accent: '#c1ddf1', glow: '#e8f5ff', minDensity: 'immersive' },
        { x: -4.4, z: 2.6, height: 14.2, bodyColor: '#9ad5ca', accent: '#c4ede1', glow: '#e7fff7', minDensity: 'immersive' }
    ];

    towerConfigs.forEach((tower, index) => {
        if (!isLevelAtLeast(densityLevel, tower.minDensity)) {
            return;
        }

        const group = createEntity('a-entity', {
            position: `${tower.x} -1.15 ${tower.z - 2}`
        }, root);

        createEntity('a-cylinder', {
            radius: '0.75',
            height: '1.2',
            color: '#3d4f6c',
            position: '0 0.6 0',
            material: 'shader: flat'
        }, group);

        createEntity('a-box', {
            width: '1.05',
            depth: '1.05',
            height: tower.height,
            position: `0 ${(tower.height / 2) + 1.2} 0`,
            color: tower.bodyColor,
            material: 'shader: flat; metalness: 0.12; roughness: 0.35'
        }, group);

        const ringRadius = 0.85;
        for (let i = 0; i < 3; i += 1) {
            const ringHeight = 2 + i * (tower.height / 3);
            createEntity('a-torus', {
                radius: ringRadius,
                radiusTubular: 0.06,
                material: `shader: flat; color: ${tower.accent}`,
                rotation: '90 0 0',
                position: `0 ${ringHeight + 1.2} 0`
            }, group);
        }

        createEntity('a-sphere', {
            radius: '0.9',
            color: tower.glow,
            material: 'shader: flat; opacity: 0.85',
            position: `0 ${tower.height + 1.7} 0`,
            animation__pulse: `property: scale; dir: alternate; dur: ${9000 + index * 650}; easing: easeInOutSine; loop: true; to: 1.1 1.18 1.1`
        }, group);
    });
}

function addHoveringWalkways(root, densityLevel) {
    if (!isLevelAtLeast(densityLevel, 'standard')) {
        return;
    }

    const walkwayConfigs = [
        { x: 0, y: 4.8, z: -4.6, width: 6, depth: 1.1, color: '#4a6fa3', minDensity: 'standard' },
        { x: 0, y: 7.5, z: -4.6, width: 5, depth: 0.8, color: '#547bb5', minDensity: 'rich' },
        { x: 0, y: 9.8, z: -4.6, width: 4, depth: 0.7, color: '#5f88c8', minDensity: 'immersive' }
    ];

    walkwayConfigs.forEach((walkway, index) => {
        if (!isLevelAtLeast(densityLevel, walkway.minDensity)) {
            return;
        }

        const platform = createEntity('a-box', {
            width: walkway.width,
            depth: walkway.depth,
            height: '0.12',
            position: `${walkway.x} ${walkway.y} ${walkway.z}`,
            color: walkway.color,
            material: 'shader: flat; metalness: 0.08; roughness: 0.45'
        }, root);

        createEntity('a-box', {
            width: walkway.width + 0.4,
            depth: '0.08',
            height: '0.4',
            position: `${walkway.x} ${walkway.y + 0.25} ${walkway.z + (walkway.depth / 2)}`,
            color: '#c4d7ff',
            material: 'shader: flat; opacity: 0.65'
        }, root);

        createEntity('a-box', {
            width: walkway.width + 0.4,
            depth: '0.08',
            height: '0.4',
            position: `${walkway.x} ${walkway.y + 0.25} ${walkway.z - (walkway.depth / 2)}`,
            color: '#c4d7ff',
            material: 'shader: flat; opacity: 0.65'
        }, root);

        platform.setAttribute('animation__hover', `property: position; dir: alternate; dur: ${12000 + index * 1600}; easing: easeInOutSine; loop: true; to: ${walkway.x} ${walkway.y + 0.4} ${walkway.z}`);
    });
}

function addArches(root, densityLevel) {
    if (!isLevelAtLeast(densityLevel, 'standard')) {
        return;
    }

    const archConfigs = [
        { x: 3.5, z: -4.6, height: 6.4, width: 3.2, color: '#aec5ff', accent: '#deecff', minDensity: 'standard' },
        { x: -3.5, z: -4.6, height: 6.1, width: 3.4, color: '#bcd3ff', accent: '#e4f1ff', minDensity: 'standard' },
        { x: 0, z: -7.8, height: 7.8, width: 4.5, color: '#9db4ff', accent: '#d4e2ff', minDensity: 'rich' },
        { x: 0, z: -1.2, height: 5.5, width: 3.6, color: '#c2b5ff', accent: '#ebe5ff', minDensity: 'immersive' }
    ];

    archConfigs.forEach((arch, index) => {
        if (!isLevelAtLeast(densityLevel, arch.minDensity)) {
            return;
        }

        const baseLeft = createEntity('a-cylinder', {
            radius: '0.28',
            height: arch.height,
            color: '#495e84',
            position: `${arch.x - arch.width / 2} ${(arch.height / 2) - 1.2} ${arch.z - 2}`,
            material: 'shader: flat'
        }, root);

        createEntity('a-cylinder', {
            radius: '0.28',
            height: arch.height,
            color: '#495e84',
            position: `${arch.x + arch.width / 2} ${(arch.height / 2) - 1.2} ${arch.z - 2}`,
            material: 'shader: flat'
        }, root);

        const archEl = createEntity('a-torus', {
            radius: arch.width / 2,
            radiusTubular: 0.18,
            material: `shader: flat; color: ${arch.color}`,
            rotation: '0 0 90',
            position: `${arch.x} ${(arch.height - 1.2)} ${arch.z - 2}`
        }, root);

        archEl.setAttribute('animation__glow', `property: material.color; dir: alternate; dur: ${9000 + index * 1000}; easing: easeInOutSine; loop: true; to: ${arch.accent}`);

        createEntity('a-sphere', {
            radius: '0.3',
            color: arch.accent,
            material: 'shader: flat; opacity: 0.9',
            position: `${arch.x} ${(arch.height - 1.2) + 0.2} ${arch.z - 2}`
        }, root);
    });
}

function addPillarClusters(root, densityLevel) {
    const pillarConfigurations = [
        { x: 12, z: -10, height: 24, width: 2.4, depth: 2.2, tone: '#6f84a3', accentColor: '#a2b9d8', baseColor: '#516482', glowColor: '#f0f6ff', minDensity: 'minimal' },
        { x: -18, z: -4, height: 28, width: 2.8, depth: 2.4, tone: '#5f7a9a', accentColor: '#97b0d3', baseColor: '#445b78', glowColor: '#e4efff', minDensity: 'minimal' },
        { x: 22, z: 12, height: 26, width: 2.2, depth: 2.8, tone: '#7d90ab', accentColor: '#b1c6e2', baseColor: '#586b88', glowColor: '#f6fbff', minDensity: 'standard' },
        { x: -10, z: 18, height: 22, width: 2.1, depth: 2.1, tone: '#6a809d', accentColor: '#9cb2d1', baseColor: '#4b5f7a', glowColor: '#eff4ff', minDensity: 'standard' },
        { x: 28, z: -22, height: 30, width: 2.6, depth: 2.4, tone: '#567190', accentColor: '#8ea7c9', baseColor: '#40526b', glowColor: '#e8f2ff', minDensity: 'rich' },
        { x: -26, z: -18, height: 32, width: 3.2, depth: 2.6, tone: '#4f6a88', accentColor: '#89a3c4', baseColor: '#384c63', glowColor: '#e2ecff', minDensity: 'rich' },
        { x: 16, z: 26, height: 36, width: 3.4, depth: 3.1, tone: '#627b99', accentColor: '#aac0dc', baseColor: '#495f7a', glowColor: '#f2f7ff', minDensity: 'immersive' },
        { x: -30, z: 24, height: 34, width: 2.9, depth: 3.5, tone: '#556f8d', accentColor: '#96b2d3', baseColor: '#3e5169', glowColor: '#e9f3ff', minDensity: 'immersive' },
        { x: 32, z: -6, height: 25, width: 2.5, depth: 3, tone: '#6d89a5', accentColor: '#a7bedc', baseColor: '#526680', glowColor: '#edf4ff', minDensity: 'immersive' },
        { x: -14, z: 32, height: 29, width: 2.3, depth: 2.6, tone: '#5c7694', accentColor: '#95afd0', baseColor: '#435875', glowColor: '#e6f0ff', minDensity: 'immersive' }
    ];

    pillarConfigurations.forEach((pillar, index) => {
        if (!isLevelAtLeast(densityLevel, pillar.minDensity)) {
            return;
        }

        const pillarGroup = createEntity('a-entity', {
            position: `${pillar.x} -1.2 ${pillar.z - 2}`
        }, root);

        createEntity('a-box', {
            width: pillar.width.toFixed(2),
            depth: pillar.depth.toFixed(2),
            height: pillar.height,
            color: pillar.tone,
            position: `0 ${pillar.height / 2} 0`,
            material: 'shader: flat'
        }, pillarGroup);

        createEntity('a-cylinder', {
            radius: (Math.max(pillar.width, pillar.depth) * 0.65).toFixed(2),
            height: '0.6',
            color: pillar.baseColor || '#607593',
            material: 'shader: flat',
            position: '0 0.3 0'
        }, pillarGroup);

        const accentHeights = pillar.accentRatios || [0.18, 0.42, 0.68, 0.92];
        accentHeights.forEach((ratio) => {
            createEntity('a-cylinder', {
                radius: (Math.max(pillar.width, pillar.depth) * (0.42 + ratio * 0.12)).toFixed(2),
                height: '0.2',
                color: pillar.accentColor || '#9fb6cf',
                material: 'shader: flat; opacity: 0.82',
                position: `0 ${pillar.height * ratio} 0`
            }, pillarGroup);
        });

        const ribWidth = Math.max(0.22, pillar.width * 0.22);
        const ribDepth = Math.max(0.22, pillar.depth * 0.22);
        const ribHeight = pillar.height * 0.7;
        const ribYOffset = pillar.height * 0.25 + ribHeight / 2;
        const surfaceInset = 0.04;
        const halfWidth = pillar.width / 2;
        const halfDepth = pillar.depth / 2;
        const ribOffsets = [
            { axis: 'x', direction: 1, width: ribWidth, depth: ribDepth * 0.6 },
            { axis: 'x', direction: -1, width: ribWidth, depth: ribDepth * 0.6 },
            { axis: 'z', direction: 1, width: ribDepth * 0.6, depth: ribDepth },
            { axis: 'z', direction: -1, width: ribDepth * 0.6, depth: ribDepth }
        ];

        ribOffsets.forEach((offset) => {
            const ribAttributes = {
                width: offset.width.toFixed(2),
                depth: offset.depth.toFixed(2),
                height: ribHeight.toFixed(2),
                color: '#4e6178',
                material: 'shader: flat; opacity: 0.7; side: double'
            };

            if (offset.axis === 'x') {
                const available = Math.max(0, halfWidth - offset.width / 2);
                const inset = Math.min(available, surfaceInset);
                const positionX = offset.direction * (available - inset);
                ribAttributes.position = `${positionX.toFixed(2)} ${ribYOffset.toFixed(2)} 0`;
            } else {
                const available = Math.max(0, halfDepth - offset.depth / 2);
                const inset = Math.min(available, surfaceInset);
                const positionZ = offset.direction * (available - inset);
                ribAttributes.position = `0 ${ribYOffset.toFixed(2)} ${positionZ.toFixed(2)}`;
            }

            createEntity('a-box', ribAttributes, pillarGroup);
        });

        createEntity('a-cylinder', {
            radius: (Math.max(pillar.width, pillar.depth) * 0.6).toFixed(2),
            height: '0.25',
            color: pillar.accentColor || '#d4e0f2',
            material: 'shader: flat; opacity: 0.9',
            position: `0 ${pillar.height - 0.25} 0`
        }, pillarGroup);

        createEntity('a-sphere', {
            radius: (Math.max(pillar.width, pillar.depth) * 0.35).toFixed(2),
            color: pillar.glowColor || '#e4ebf6',
            material: 'shader: flat; opacity: 0.95',
            position: `0 ${pillar.height + 0.5} 0`,
            animation__pulse: `property: scale; dir: alternate; dur: ${6000 + index * 800}; easing: easeInOutSine; loop: true; to: 1.08 1.12 1.08`
        }, pillarGroup);
    });
}

function addFloatingPlatforms(root, densityLevel) {
    if (!isLevelAtLeast(densityLevel, 'rich')) {
        return;
    }

    const floatingPlatforms = [
        { x: 6, y: -1, z: -10, scale: '2.4 0.12 2.4', hover: 0.4, phase: 0, color: '#c6d6e5' },
        { x: -8, y: -0.5, z: -14, scale: '1.8 0.1 1.8', hover: 0.25, phase: 2000, color: '#b5cade' },
        { x: 10, y: 1, z: 12, scale: '2 0.1 2', hover: 0.35, phase: 4000, color: '#c8dff5' },
        { x: -4, y: 1.5, z: 18, scale: '1.4 0.08 2.6', hover: 0.2, phase: 1500, color: '#bcd0e6' },
        { x: 12, y: 2.2, z: -6, scale: '1.6 0.12 1.6', hover: 0.28, phase: 3200, color: '#d0e2f6', minDensity: 'immersive' },
        { x: -12, y: 2.8, z: 10, scale: '1.9 0.1 2.4', hover: 0.3, phase: 3800, color: '#d6e8fb', minDensity: 'immersive' }
    ];

    floatingPlatforms.forEach((platform) => {
        if (platform.minDensity && !isLevelAtLeast(densityLevel, platform.minDensity)) {
            return;
        }

        const platformEl = createEntity('a-box', {
            color: platform.color,
            scale: platform.scale,
            position: `${platform.x} ${platform.y} ${platform.z}`,
            material: 'shader: flat'
        }, root);

        platformEl.setAttribute('animation__hover', `property: position; dir: alternate; dur: ${10000 + platform.phase}; easing: easeInOutSine; loop: true; to: ${platform.x} ${platform.y + platform.hover} ${platform.z}; delay: ${platform.phase}`);
    });
}

function addClouds(root, densityLevel) {
    const baseClouds = [
        { x: 8, y: 9, z: -12, scale: '3.2 1.4 1.4', delay: 0, drift: 3, minDensity: 'minimal' },
        { x: -10, y: 10, z: 14, scale: '2.7 1.2 1.2', delay: 2000, drift: 2, minDensity: 'minimal' },
        { x: -4, y: 8, z: -16, scale: '3.6 1.5 1.5', delay: 4000, drift: 4, minDensity: 'standard' },
        { x: 14, y: 11, z: 22, scale: '4.2 1.8 1.8', delay: 6000, drift: 5, minDensity: 'standard' },
        { x: 18, y: 12, z: -20, scale: '3.5 1.4 1.4', delay: 800, drift: 4, minDensity: 'rich' },
        { x: -20, y: 13, z: 26, scale: '3.8 1.6 1.6', delay: 2400, drift: 3.5, minDensity: 'rich' },
        { x: 6, y: 14, z: 30, scale: '4.6 1.8 1.8', delay: 5200, drift: 5.5, minDensity: 'immersive' },
        { x: -16, y: 15, z: -28, scale: '5 1.9 1.9', delay: 1000, drift: 3.5, minDensity: 'immersive' },
        { x: 18, y: 16, z: 30, scale: '5.2 1.9 1.9', delay: 2500, drift: 4.5, minDensity: 'immersive' },
        { x: 4, y: 14, z: 26, scale: '3.8 1.5 1.5', delay: 4200, drift: 3, minDensity: 'immersive' }
    ];

    baseClouds.forEach((cloud) => {
        if (!isLevelAtLeast(densityLevel, cloud.minDensity)) {
            return;
        }

        const cloudEl = createEntity('a-sphere', {
            color: '#ffffff',
            position: `${cloud.x} ${cloud.y} ${cloud.z}`,
            scale: cloud.scale,
            opacity: '0.85',
            material: 'shader: flat'
        }, root);

        cloudEl.setAttribute('animation__float', `property: position; dir: alternate; dur: ${12000 + cloud.delay}; easing: easeInOutSine; loop: true; to: ${cloud.x} ${cloud.y + 0.8} ${cloud.z}; delay: ${cloud.delay}`);
        cloudEl.setAttribute('animation__drift', `property: position; dir: alternate; dur: ${18000 + cloud.delay}; easing: easeInOutSine; loop: true; to: ${cloud.x + cloud.drift} ${cloud.y} ${cloud.z}; delay: ${cloud.delay / 2}`);
    });

    if (isLevelAtLeast(densityLevel, 'standard')) {
        const farCloudBands = [
            { y: 4, from: -25, to: 25, z: -35, width: 40, delay: 0 },
            { y: 9, from: 22, to: -18, z: 38, width: 36, delay: 4000 },
            { y: 12, from: -32, to: 32, z: -42, width: 48, delay: 2600, minDensity: 'immersive' }
        ];

        farCloudBands.forEach((band) => {
            if (band.minDensity && !isLevelAtLeast(densityLevel, band.minDensity)) {
                return;
            }
            createEntity('a-plane', {
                width: `${band.width}`,
                height: '6',
                material: 'shader: flat; color: #ffffff; opacity: 0.18; side: double',
                rotation: '0 0 0',
                position: `0 ${band.y} ${band.z}`,
                animation__wind: `property: position; dir: alternate; dur: 24000; easing: easeInOutSine; loop: true; to: ${band.to} ${band.y} ${band.z}; from: ${band.from} ${band.y} ${band.z}; delay: ${band.delay}`
            }, root);
        });
    }
}

function addWindTrails(root, densityLevel) {
    if (!isLevelAtLeast(densityLevel, 'standard')) {
        return;
    }

    const windTrails = [
        { position: '-12 2 -22', rotation: '0 10 0', length: 14, minDensity: 'standard' },
        { position: '16 3 28', rotation: '0 -20 0', length: 18, minDensity: 'standard' },
        { position: '8 6 -16', rotation: '0 15 0', length: 12, minDensity: 'rich' },
        { position: '-18 7 20', rotation: '0 -25 0', length: 16, minDensity: 'immersive' }
    ];

    windTrails.forEach((trail) => {
        if (!isLevelAtLeast(densityLevel, trail.minDensity)) {
            return;
        }

        createEntity('a-plane', {
            width: `${trail.length}`,
            height: '1.6',
            material: 'shader: flat; color: #b9ddff; opacity: 0.12; side: double',
            position: trail.position,
            rotation: trail.rotation,
            animation__pulse: 'property: material.opacity; dir: alternate; dur: 3500; easing: easeInOutSine; loop: true; to: 0.22'
        }, root);
    });
}

function addBalloons(root, densityLevel) {
    if (!isLevelAtLeast(densityLevel, 'rich')) {
        return;
    }

    const tetheredBalloons = [
        { x: 20, y: 15, z: -30, color: '#ffcf66', bob: 1.6, delay: 0, minDensity: 'rich' },
        { x: -24, y: 13, z: 34, color: '#8ed6ff', bob: 1.1, delay: 2200, minDensity: 'rich' },
        { x: 10, y: 18, z: 18, color: '#ff9eb5', bob: 1.8, delay: 1800, minDensity: 'immersive' },
        { x: -18, y: 17, z: -24, color: '#ffd3a4', bob: 1.4, delay: 1400, minDensity: 'immersive' }
    ];

    tetheredBalloons.forEach((balloon) => {
        if (!isLevelAtLeast(densityLevel, balloon.minDensity)) {
            return;
        }

        createEntity('a-sphere', {
            radius: '1.5',
            color: balloon.color,
            position: `${balloon.x} ${balloon.y} ${balloon.z}`,
            material: 'shader: flat; opacity: 0.95',
            animation__bob: `property: position; dir: alternate; dur: ${9000 + balloon.delay}; easing: easeInOutSine; loop: true; to: ${balloon.x} ${balloon.y + balloon.bob} ${balloon.z}; delay: ${balloon.delay}`
        }, root);

        createEntity('a-cylinder', {
            radius: '0.02',
            height: `${balloon.y + 3}`,
            color: '#f9f1d0',
            position: `${balloon.x} ${(balloon.y - 3) / 2} ${balloon.z}`,
            material: 'shader: flat; opacity: 0.6'
        }, root);
    });
}

function addTrees(root, densityLevel) {
    const stylizedTrees = [
        { x: 26, z: -14, trunkHeight: 3.2, canopyScale: '2.6 2.8 2.6', sway: 0.18, canopyColor: '#7ec87c', highlightColor: '#a8e0a2', minDensity: 'minimal' },
        { x: -28, z: -10, trunkHeight: 4, canopyScale: '3 3.4 3', sway: 0.24, canopyColor: '#6fc47a', highlightColor: '#97de9f', minDensity: 'minimal' },
        { x: 24, z: 18, trunkHeight: 3.6, canopyScale: '2.4 2.6 2.4', sway: 0.16, canopyColor: '#8cd290', highlightColor: '#b6e9b8', minDensity: 'standard' },
        { x: -22, z: 22, trunkHeight: 3.8, canopyScale: '2.8 3 2.8', sway: 0.2, canopyColor: '#75c080', highlightColor: '#a6e0ae', minDensity: 'standard' },
        { x: 30, z: 28, trunkHeight: 4.4, canopyScale: '2.2 2.4 2.2', sway: 0.14, canopyColor: '#82c88a', highlightColor: '#b2e3b7', minDensity: 'rich' },
        { x: -34, z: 18, trunkHeight: 4.8, canopyScale: '2.6 2.9 2.6', sway: 0.22, canopyColor: '#6abd78', highlightColor: '#9ddc9f', minDensity: 'rich' },
        { x: 20, z: -28, trunkHeight: 3.4, canopyScale: '2.3 2.5 2.3', sway: 0.17, canopyColor: '#78c684', highlightColor: '#a7e0b0', minDensity: 'immersive' },
        { x: -26, z: -24, trunkHeight: 4.2, canopyScale: '2.9 3.1 2.9', sway: 0.19, canopyColor: '#89ce92', highlightColor: '#bce8c1', minDensity: 'immersive' },
        { x: 16, z: 32, trunkHeight: 3.6, canopyScale: '2.4 2.5 2.4', sway: 0.21, canopyColor: '#7dd68f', highlightColor: '#adefc2', minDensity: 'immersive' },
        { x: -32, z: 30, trunkHeight: 4.6, canopyScale: '2.8 3.2 2.8', sway: 0.2, canopyColor: '#6ccb7c', highlightColor: '#99ecaf', minDensity: 'immersive' }
    ];

    stylizedTrees.forEach((tree, index) => {
        if (!isLevelAtLeast(densityLevel, tree.minDensity)) {
            return;
        }

        const treeGroup = createEntity('a-entity', {
            position: `${tree.x} -1.2 ${tree.z - 2}`
        }, root);

        createEntity('a-cylinder', {
            radius: '0.28',
            height: tree.trunkHeight,
            position: `0 ${tree.trunkHeight / 2} 0`,
            color: '#6b4f2c',
            material: 'shader: flat'
        }, treeGroup);

        const canopy = createEntity('a-sphere', {
            position: `0 ${tree.trunkHeight + 0.8} 0`,
            scale: tree.canopyScale,
            color: tree.canopyColor,
            material: 'shader: flat; roughness: 0.7'
        }, treeGroup);

        canopy.setAttribute('animation__sway', `property: rotation; dir: alternate; dur: ${6000 + index * 1200}; easing: easeInOutSine; loop: true; to: ${tree.sway * 60} ${tree.sway * 80} ${tree.sway * -40}`);

        createEntity('a-sphere', {
            position: `0 ${tree.trunkHeight + 0.8} 0`,
            scale: '1.2 0.8 1.2',
            color: tree.highlightColor,
            material: 'shader: flat; opacity: 0.4'
        }, treeGroup);
    });
}

function addMountainSilhouettes(root, densityLevel) {
    if (!isLevelAtLeast(densityLevel, 'standard')) {
        return;
    }

    const mountainConfigs = [
        { x: 18, z: -32, height: 18, radius: 9, color: '#7286a0', minDensity: 'standard' },
        { x: -22, z: -34, height: 19, radius: 10, color: '#6b7c96', minDensity: 'standard' },
        { x: 26, z: 36, height: 20, radius: 11, color: '#7088a8', minDensity: 'rich' },
        { x: -30, z: 32, height: 21, radius: 12, color: '#677d96', minDensity: 'rich' },
        { x: 8, z: 40, height: 17, radius: 8, color: '#8097b2', minDensity: 'rich' },
        { x: -8, z: -40, height: 22, radius: 10, color: '#647791', minDensity: 'immersive' },
        { x: 34, z: -28, height: 23, radius: 12, color: '#5f7087', minDensity: 'immersive' },
        { x: -36, z: 26, height: 24, radius: 13, color: '#5a6c82', minDensity: 'immersive' }
    ];

    mountainConfigs.forEach((mountain, index) => {
        if (!isLevelAtLeast(densityLevel, mountain.minDensity)) {
            return;
        }

        createEntity('a-entity', {
            geometry: `primitive: cone; radiusBottom: ${mountain.radius}; radiusTop: 0.5; height: ${mountain.height}`,
            position: `${mountain.x} ${(mountain.height / 2) - 2} ${mountain.z - 2}`,
            material: `shader: flat; color: ${mountain.color}; opacity: 0.85`
        }, root);

        createEntity('a-entity', {
            geometry: `primitive: cone; radiusBottom: ${mountain.radius * 0.6}; radiusTop: 0.2; height: ${mountain.height * 0.8}`,
            position: `${mountain.x + 2} ${(mountain.height * 0.8) / 2 - 1.8} ${mountain.z - 5}`,
            material: `shader: flat; color: #7f93ad; opacity: 0.75`
        }, root);

        if (isLevelAtLeast(densityLevel, 'immersive')) {
            createEntity('a-plane', {
                width: `${mountain.radius * 1.6}`,
                height: '1.2',
                position: `${mountain.x} ${(mountain.height / 2) + 1} ${mountain.z - 2}`,
                rotation: '0 0 0',
                material: 'shader: flat; color: #d9e6f5; opacity: 0.12',
                animation__shimmer: `property: material.opacity; dir: alternate; dur: ${7000 + index * 500}; easing: easeInOutSine; loop: true; to: 0.22`
            }, root);
        }
    });
}

function addSkyLanterns(root, densityLevel) {
    if (!isLevelAtLeast(densityLevel, 'immersive')) {
        return;
    }

    const lanternConfigs = [
        { x: 2, y: 12, z: -6, color: '#ffe08a', path: '2 12 -6, 3 14 -7, 2 13 -8' },
        { x: -3, y: 13, z: -5, color: '#ffd1ff', path: '-3 13 -5, -2 14 -6, -3 12 -7' },
        { x: 1, y: 11, z: -3, color: '#b5f0ff', path: '1 11 -3, 2 12 -2, 1 13 -1' }
    ];

    lanternConfigs.forEach((lantern, index) => {
        const lanternEl = createEntity('a-entity', {
            geometry: 'primitive: octahedron; radius: 0.4',
            position: `${lantern.x} ${lantern.y} ${lantern.z}`,
            material: `shader: flat; color: ${lantern.color}; opacity: 0.85`
        }, root);

        lanternEl.setAttribute('animation__float', `property: position; dir: alternate; dur: ${8000 + index * 1500}; easing: easeInOutSine; loop: true; to: ${lantern.path.split(', ')[1]}`);
        lanternEl.setAttribute('animation__twirl', `property: rotation; dir: alternate; dur: ${6000 + index * 700}; easing: easeInOutSine; loop: true; to: 0 ${180 + index * 60} 0`);
    });
}

export const heightsDecorModule = {

    decorRoot: null,
    sceneEl: null,
    originalFog: null,
    currentDensity: 'immersive',

    create(sceneEl, densityLevel = 'immersive') {
        this.sceneEl = sceneEl;
        this.currentDensity = DENSITY_LEVELS.includes(densityLevel) ? densityLevel : 'immersive';

        if (!this.originalFog) {
            const currentFog = sceneEl.getAttribute('fog');
            this.originalFog = currentFog ? { ...currentFog } : null;
        }

        this._rebuild();
    },

    updateDensity(newDensity) {
        if (!DENSITY_LEVELS.includes(newDensity)) {
            return;
        }

        if (this.currentDensity === newDensity) {
            return;
        }

        this.currentDensity = newDensity;
        if (this.sceneEl) {
            this._rebuild();
        }
    },

    _rebuild() {
        if (!this.sceneEl) {
            return;
        }

        if (this.decorRoot && this.decorRoot.parentNode) {
            this.decorRoot.parentNode.removeChild(this.decorRoot);
        }

        this.decorRoot = createEntity('a-entity', { id: 'heights-decor-root' });

        addBaseStructures(this.decorRoot);
        addCloseTowerRing(this.decorRoot, this.currentDensity);
        addHoveringWalkways(this.decorRoot, this.currentDensity);
        addArches(this.decorRoot, this.currentDensity);
        addPillarClusters(this.decorRoot, this.currentDensity);
        addFloatingPlatforms(this.decorRoot, this.currentDensity);
        addClouds(this.decorRoot, this.currentDensity);
        addWindTrails(this.decorRoot, this.currentDensity);
        addBalloons(this.decorRoot, this.currentDensity);
        addTrees(this.decorRoot, this.currentDensity);
        addMountainSilhouettes(this.decorRoot, this.currentDensity);
        addSkyLanterns(this.decorRoot, this.currentDensity);

        this.sceneEl.appendChild(this.decorRoot);
        this.sceneEl.setAttribute('fog', 'type: exponential; color: #d6ecff; density: 0.018');
    },

    cleanup() {
        if (this.decorRoot && this.decorRoot.parentNode) {
            this.decorRoot.parentNode.removeChild(this.decorRoot);
        }
        if (this.sceneEl) {
            if (this.originalFog) {
                this.sceneEl.setAttribute('fog', this.originalFog);
            } else {
                this.sceneEl.removeAttribute('fog');
            }
        }

        this.decorRoot = null;
        this.sceneEl = null;
        this.originalFog = null;
        this.currentDensity = 'immersive';
    }
};
