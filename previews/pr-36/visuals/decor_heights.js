/* /visuals/decor_heights.js */

import { colorPalettes, lerpColor } from '../utils/colorPalettes.js';

const DENSITY_LEVELS = ['minimal', 'standard', 'rich', 'immersive'];

const CLOSE_TOWER_CONFIGS = [
    { x: 3.2, z: -5.2, height: 18, baseRadius: 0.75, width: 1.1, depth: 1.05, minDensity: 'minimal' },
    { x: -3.0, z: -5.4, height: 19, baseRadius: 0.75, width: 1.05, depth: 1.05, minDensity: 'minimal' },
    { x: 4.8, z: -2.8, height: 17, baseRadius: 0.72, width: 0.95, depth: 1.0, minDensity: 'minimal' },
    { x: -5.1, z: -2.6, height: 17.5, baseRadius: 0.72, width: 1.0, depth: 1.05, minDensity: 'minimal' },
    { x: 2.4, z: -6.8, height: 20, baseRadius: 0.82, width: 1.15, depth: 1.15, minDensity: 'standard' },
    { x: -2.2, z: -7.2, height: 21, baseRadius: 0.85, width: 1.2, depth: 1.2, minDensity: 'standard' },
    { x: 0.8, z: -3.6, height: 22, baseRadius: 0.9, width: 1.35, depth: 1.1, minDensity: 'rich' },
    { x: -0.9, z: -3.4, height: 23, baseRadius: 0.92, width: 1.35, depth: 1.15, minDensity: 'rich' },
    { x: 5.9, z: 0.6, height: 18, baseRadius: 0.7, width: 1.05, depth: 0.95, minDensity: 'rich' },
    { x: -6.2, z: 0.8, height: 18.5, baseRadius: 0.7, width: 1.0, depth: 1.0, minDensity: 'rich' },
    { x: 3.8, z: 2.4, height: 17.5, baseRadius: 0.68, width: 0.95, depth: 1.0, minDensity: 'immersive' },
    { x: -4.0, z: 2.8, height: 18, baseRadius: 0.68, width: 0.98, depth: 1.0, minDensity: 'immersive' }
];

const MEGA_TOWER_CONFIGS = [
    { x: 10, z: -14, height: 30, baseRadius: 1.1, width: 1.8, depth: 1.8, minDensity: 'standard' },
    { x: -12, z: -16, height: 32, baseRadius: 1.15, width: 1.9, depth: 1.9, minDensity: 'standard' },
    { x: 14, z: 12, height: 34, baseRadius: 1.2, width: 2.1, depth: 2.2, minDensity: 'rich' },
    { x: -16, z: 10, height: 33, baseRadius: 1.2, width: 2.0, depth: 2.3, minDensity: 'rich' },
    { x: 20, z: -6, height: 36, baseRadius: 1.3, width: 2.4, depth: 2.3, minDensity: 'immersive' },
    { x: -22, z: -4, height: 38, baseRadius: 1.35, width: 2.6, depth: 2.5, minDensity: 'immersive' },
    { x: 18, z: 18, height: 32, baseRadius: 1.25, width: 2.2, depth: 2.1, minDensity: 'immersive' }
];

const WALKWAY_CONFIGS = [
    { x: 0, y: 4.8, z: -4.6, width: 6, depth: 1.1, hover: 0.4, minDensity: 'standard' },
    { x: 0, y: 7.5, z: -4.6, width: 5, depth: 0.8, hover: 0.32, minDensity: 'rich' },
    { x: 0, y: 9.8, z: -4.6, width: 4, depth: 0.7, hover: 0.26, minDensity: 'immersive' }
];

const ARCH_CONFIGS = [
    { x: 3.5, z: -5.4, height: 6.6, width: 3.2, minDensity: 'standard' },
    { x: -3.5, z: -5.4, height: 6.3, width: 3.4, minDensity: 'standard' },
    { x: 0, z: -8.2, height: 7.8, width: 4.5, minDensity: 'rich' },
    { x: 0, z: -10.6, height: 8.4, width: 4.2, minDensity: 'immersive' }
];

const PILLAR_CONFIGS = [
    { x: 12, z: -10, height: 24, width: 2.4, depth: 2.2, minDensity: 'minimal' },
    { x: -18, z: -4, height: 28, width: 2.8, depth: 2.4, minDensity: 'minimal' },
    { x: 22, z: 12, height: 26, width: 2.2, depth: 2.8, minDensity: 'standard' },
    { x: -10, z: 18, height: 22, width: 2.1, depth: 2.1, minDensity: 'standard' },
    { x: 28, z: -22, height: 30, width: 2.6, depth: 2.4, minDensity: 'rich' },
    { x: -26, z: -18, height: 32, width: 3.2, depth: 2.6, minDensity: 'rich' },
    { x: 16, z: 26, height: 36, width: 3.4, depth: 3.1, minDensity: 'immersive' },
    { x: -30, z: 24, height: 34, width: 2.9, depth: 3.5, minDensity: 'immersive' },
    { x: 32, z: -6, height: 25, width: 2.5, depth: 3.0, minDensity: 'immersive' },
    { x: -14, z: 32, height: 29, width: 2.3, depth: 2.6, minDensity: 'immersive' }
];

const FLOATING_PLATFORM_CONFIGS = [
    { x: 6, y: -1, z: -10, scale: '2.4 0.12 2.4', hover: 0.4, delay: 0, minDensity: 'rich' },
    { x: -8, y: -0.5, z: -14, scale: '1.8 0.1 1.8', hover: 0.25, delay: 2000, minDensity: 'rich' },
    { x: 10, y: 1, z: 12, scale: '2 0.1 2', hover: 0.35, delay: 4000, minDensity: 'rich' },
    { x: -4, y: 1.5, z: 18, scale: '1.4 0.08 2.6', hover: 0.2, delay: 1500, minDensity: 'rich' },
    { x: 12, y: 2.2, z: -6, scale: '1.6 0.12 1.6', hover: 0.28, delay: 3200, minDensity: 'immersive' },
    { x: -12, y: 2.8, z: 10, scale: '1.9 0.1 2.4', hover: 0.3, delay: 3800, minDensity: 'immersive' }
];

const CLOUD_CONFIGS = [
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

const FAR_CLOUD_BANDS = [
    { y: 4, from: -25, to: 25, z: -35, width: 40, delay: 0, minDensity: 'standard' },
    { y: 9, from: 22, to: -18, z: 38, width: 36, delay: 4000, minDensity: 'standard' },
    { y: 12, from: -32, to: 32, z: -42, width: 48, delay: 2600, minDensity: 'immersive' }
];

const WIND_TRAIL_CONFIGS = [
    { position: '-12 2 -22', rotation: '0 10 0', length: 14, minDensity: 'standard' },
    { position: '16 3 28', rotation: '0 -20 0', length: 18, minDensity: 'standard' },
    { position: '8 6 -16', rotation: '0 15 0', length: 12, minDensity: 'rich' },
    { position: '-18 7 20', rotation: '0 -25 0', length: 16, minDensity: 'immersive' }
];

const BALLOON_CONFIGS = [
    { x: 20, y: 15, z: -30, bob: 1.6, delay: 0, minDensity: 'rich' },
    { x: -24, y: 13, z: 34, bob: 1.1, delay: 2200, minDensity: 'rich' },
    { x: 10, y: 18, z: 18, bob: 1.8, delay: 1800, minDensity: 'immersive' },
    { x: -18, y: 17, z: -24, bob: 1.4, delay: 1400, minDensity: 'immersive' }
];

const TREE_CONFIGS = [
    { x: 26, z: -14, trunkHeight: 3.2, canopyScale: '2.6 2.8 2.6', sway: 0.18, minDensity: 'minimal' },
    { x: -28, z: -10, trunkHeight: 4, canopyScale: '3 3.4 3', sway: 0.24, minDensity: 'minimal' },
    { x: 24, z: 18, trunkHeight: 3.6, canopyScale: '2.4 2.6 2.4', sway: 0.16, minDensity: 'standard' },
    { x: -22, z: 22, trunkHeight: 3.8, canopyScale: '2.8 3 2.8', sway: 0.2, minDensity: 'standard' },
    { x: 30, z: 28, trunkHeight: 4.4, canopyScale: '2.2 2.4 2.2', sway: 0.14, minDensity: 'rich' },
    { x: -34, z: 18, trunkHeight: 4.8, canopyScale: '2.6 2.9 2.6', sway: 0.22, minDensity: 'rich' },
    { x: 20, z: -28, trunkHeight: 3.4, canopyScale: '2.3 2.5 2.3', sway: 0.17, minDensity: 'immersive' },
    { x: -26, z: -24, trunkHeight: 4.2, canopyScale: '2.9 3.1 2.9', sway: 0.19, minDensity: 'immersive' },
    { x: 16, z: 32, trunkHeight: 3.6, canopyScale: '2.4 2.5 2.4', sway: 0.21, minDensity: 'immersive' },
    { x: -32, z: 30, trunkHeight: 4.6, canopyScale: '2.8 3.2 2.8', sway: 0.2, minDensity: 'immersive' }
];

const MOUNTAIN_CONFIGS = [
    { x: 18, z: -32, height: 22, radius: 12, minDensity: 'standard' },
    { x: -14, z: -36, height: 26, radius: 13, minDensity: 'standard' },
    { x: 26, z: 40, height: 28, radius: 14, minDensity: 'rich' },
    { x: -30, z: 36, height: 30, radius: 16, minDensity: 'rich' },
    { x: 10, z: 48, height: 24, radius: 11, minDensity: 'rich' },
    { x: -6, z: -46, height: 30, radius: 14, minDensity: 'immersive' },
    { x: 36, z: -32, height: 32, radius: 15, minDensity: 'immersive' },
    { x: -38, z: 30, height: 34, radius: 16, minDensity: 'immersive' },
    { x: 42, z: 44, height: 36, radius: 18, minDensity: 'immersive' }
];

const LANTERN_CONFIGS = [
    { x: 2, y: 12, z: -6, path: '2 12 -6, 3 14 -7, 2 13 -8' },
    { x: -3, y: 13, z: -5, path: '-3 13 -5, -2 14 -6, -3 12 -7' },
    { x: 1, y: 11, z: -3, path: '1 11 -3, 2 12 -2, 1 13 -1' }
];

function clamp01(value) {
    return Math.max(0, Math.min(1, value));
}

function mixColors(colorA, colorB, amount) {
    return lerpColor(colorA, colorB, clamp01(amount));
}

function lighten(color, amount) {
    return mixColors(color, '#ffffff', amount);
}

function darken(color, amount) {
    return mixColors(color, '#000000', amount);
}

function getDefaultTheme() {
    return {
        skyColor: '#8dc6ff',
        fogColor: '#d6ecff',
        groundPlaneColor: '#f0e3c0',
        groundRingColor: '#d7c5a3',
        terracesColors: ['#d3d9dc', '#b9c6cf', '#9fb3c4'],
        coreColumnColor: '#1f2a44',
        platformBaseColor: '#2c3e50',
        platformTopColor: '#4a90e2',
        platformMarkerColor: '#f8f9fa',
        platformStripeColor: '#d9e8ff',
        platformPostColor: '#cfd9e8',
        platformRailColor: '#b3c4e0',
        towerBaseColor: '#3d4f6c',
        towerBodyColors: ['#ff9a9e', '#fad0c4', '#f6abb6', '#ffb7c3', '#c3bef0', '#a3bffa', '#f8b195', '#f67280', '#99c1de', '#9ad5ca'],
        towerAccentColors: ['#ffe5ec', '#ffeacb', '#ffd3e1', '#ffe0ea', '#dfd7ff', '#cdd9ff', '#ffd4b8', '#ff9ba9', '#c1ddf1', '#c4ede1'],
        towerGlowColors: ['#fff3e6', '#fffaf0', '#ffeef5', '#fff3f8', '#f5f2ff', '#f0f4ff', '#fff1e6', '#ffdce3', '#e8f5ff', '#e7fff7'],
        walkwayDeckColors: ['#4a6fa3', '#547bb5', '#5f88c8'],
        walkwayGuardColor: '#c4d7ff',
        archBaseColor: '#495e84',
        archRingColors: ['#aec5ff', '#bcd3ff', '#9db4ff', '#c2b5ff'],
        archAccentColors: ['#deecff', '#e4f1ff', '#d4e2ff', '#ebe5ff'],
        pillarBaseColor: '#516482',
        pillarBodyColors: ['#6f84a3', '#5f7a9a', '#7d90ab', '#6a809d', '#567190', '#4f6a88', '#627b99', '#556f8d', '#6d89a5', '#5c7694'],
        pillarAccentColors: ['#a2b9d8', '#97b0d3', '#b1c6e2', '#9cb2d1', '#8ea7c9', '#89a3c4', '#aac0dc', '#96b2d3', '#a7bedc', '#95afd0'],
        pillarGlowColor: '#f0f6ff',
        floatingPlatformColors: ['#c6d6e5', '#b5cade', '#c8dff5', '#bcd0e6', '#d0e2f6', '#d6e8fb'],
        cloudColor: '#ffffff',
        cloudBandColor: '#d9e6f5',
        windColor: '#b9ddff',
        balloonColors: ['#ffcf66', '#8ed6ff', '#ff9eb5', '#ffd3a4'],
        treeTrunkColor: '#6b4f2c',
        treeCanopyColors: ['#7ec87c', '#6fc47a', '#8cd290', '#75c080', '#82c88a', '#6abd78', '#78c684', '#89ce92', '#7dd68f', '#6ccb7c'],
        treeHighlightColors: ['#a8e0a2', '#97de9f', '#b6e9b8', '#a6e0ae', '#b2e3b7', '#9ddc9f', '#a7e0b0', '#bce8c1', '#adefc2', '#99ecaf'],
        mountainMainColors: ['#7286a0', '#6b7c96', '#7088a8', '#677d96', '#8097b2', '#647791', '#5f7087', '#5a6c82', '#6d7c95'],
        mountainSecondaryColors: ['#7f93ad', '#7a8fa8', '#7d9ab4', '#7489a1', '#8499b7', '#72839b'],
        mountainHighlightColor: '#d9e6f5',
        lanternColors: ['#ffe08a', '#ffd1ff', '#b5f0ff']
    };
}

function getMonochromeTheme() {
    const theme = getDefaultTheme();
    const base = '#1f1f1f';
    const light = '#e0e0e0';
    const mid = '#808080';
    const accent = '#b0b0b0';
    const highlight = '#f5f5f5';

    theme.skyColor = '#0a0a0a';
    theme.fogColor = '#0f0f0f';
    theme.groundPlaneColor = mixColors(base, light, 0.2);
    theme.groundRingColor = mixColors(base, light, 0.25);
    theme.terracesColors = [mixColors(base, light, 0.35), mixColors(base, light, 0.45), mixColors(base, light, 0.55)];
    theme.coreColumnColor = mixColors(base, '#000000', 0.6);
    theme.platformBaseColor = mixColors(base, '#000000', 0.4);
    theme.platformTopColor = mixColors(mid, light, 0.2);
    theme.platformMarkerColor = highlight;
    theme.platformStripeColor = mixColors(accent, highlight, 0.5);
    theme.platformPostColor = mixColors(base, light, 0.35);
    theme.platformRailColor = mixColors(accent, highlight, 0.4);
    theme.towerBaseColor = mixColors(base, '#000000', 0.5);
    theme.towerBodyColors = [mixColors(base, accent, 0.25), mixColors(base, accent, 0.35), mixColors(base, accent, 0.45), mixColors(base, accent, 0.55)];
    theme.towerAccentColors = theme.towerBodyColors.map(color => mixColors(color, highlight, 0.4));
    theme.towerGlowColors = theme.towerAccentColors.map(color => mixColors(color, highlight, 0.5));
    theme.walkwayDeckColors = [mixColors(base, mid, 0.4), mixColors(base, mid, 0.3), mixColors(base, mid, 0.2)];
    theme.walkwayGuardColor = mixColors(accent, highlight, 0.4);
    theme.archBaseColor = mixColors(base, '#000000', 0.55);
    theme.archRingColors = [mixColors(base, mid, 0.3), mixColors(base, mid, 0.4), mixColors(base, mid, 0.5), mixColors(base, mid, 0.6)];
    theme.archAccentColors = theme.archRingColors.map(color => mixColors(color, highlight, 0.35));
    theme.pillarBaseColor = mixColors(base, '#000000', 0.5);
    theme.pillarBodyColors = [mixColors(base, mid, 0.35), mixColors(base, mid, 0.4), mixColors(base, mid, 0.45), mixColors(base, mid, 0.5)];
    theme.pillarAccentColors = theme.pillarBodyColors.map(color => mixColors(color, highlight, 0.35));
    theme.pillarGlowColor = mixColors(accent, highlight, 0.6);
    theme.floatingPlatformColors = [mixColors(base, mid, 0.4), mixColors(base, mid, 0.5), mixColors(base, mid, 0.6)];
    theme.cloudColor = mixColors(mid, highlight, 0.6);
    theme.cloudBandColor = mixColors(mid, highlight, 0.4);
    theme.windColor = mixColors(mid, highlight, 0.45);
    theme.balloonColors = [mixColors(base, accent, 0.5), mixColors(mid, light, 0.5), mixColors(accent, highlight, 0.5)];
    theme.treeTrunkColor = mixColors(base, '#3a2a1a', 0.6);
    theme.treeCanopyColors = [mixColors(base, mid, 0.5), mixColors(base, mid, 0.55), mixColors(base, mid, 0.6)];
    theme.treeHighlightColors = theme.treeCanopyColors.map(color => mixColors(color, highlight, 0.35));
    theme.mountainMainColors = [mixColors(base, mid, 0.45), mixColors(base, mid, 0.5), mixColors(base, mid, 0.55)];
    theme.mountainSecondaryColors = [mixColors(base, mid, 0.35), mixColors(base, mid, 0.4)];
    theme.mountainHighlightColor = mixColors(accent, highlight, 0.5);
    theme.lanternColors = [mixColors(accent, highlight, 0.5), mixColors(mid, highlight, 0.5), mixColors(base, accent, 0.5)];

    return theme;
}

function buildThemeFromPalette(palette) {
    const theme = getDefaultTheme();
    if (!Array.isArray(palette) || palette.length === 0) {
        return theme;
    }

    const safePalette = palette.filter(Boolean);
    if (safePalette.length === 0) {
        return theme;
    }

    const getColor = (index) => safePalette[index % safePalette.length];
    const base = getColor(0);
    const accent = getColor(1);
    const tertiary = getColor(2);
    const quaternary = getColor(3);
    const quinary = getColor(4);

    theme.skyColor = lighten(quinary, 0.75);
    theme.fogColor = lighten(quinary, 0.88);
    theme.groundPlaneColor = lighten(base, 0.65);
    theme.groundRingColor = lighten(base, 0.45);
    theme.terracesColors = [lighten(base, 0.75), lighten(accent, 0.62), lighten(tertiary, 0.52)];
    theme.coreColumnColor = darken(base, 0.55);

    theme.platformBaseColor = darken(base, 0.5);
    theme.platformTopColor = lighten(accent, 0.35);
    theme.platformMarkerColor = lighten(quinary, 0.9);
    theme.platformStripeColor = lighten(quinary, 0.85);
    theme.platformPostColor = lighten(base, 0.7);
    theme.platformRailColor = lighten(quinary, 0.75);

    const towerBase = darken(base, 0.6);
    theme.towerBaseColor = towerBase;
    theme.towerBodyColors = [
        lighten(accent, 0.35),
        lighten(accent, 0.5),
        lighten(tertiary, 0.35),
        lighten(tertiary, 0.5),
        lighten(quinary, 0.35),
        lighten(quinary, 0.5)
    ];
    theme.towerAccentColors = theme.towerBodyColors.map(color => lighten(color, 0.3));
    theme.towerGlowColors = theme.towerAccentColors.map(color => lighten(color, 0.35));

    theme.walkwayDeckColors = [
        darken(tertiary, 0.35),
        darken(tertiary, 0.25),
        darken(quaternary, 0.25)
    ];
    theme.walkwayGuardColor = lighten(quinary, 0.82);

    theme.archBaseColor = darken(base, 0.45);
    theme.archRingColors = [
        lighten(accent, 0.6),
        lighten(tertiary, 0.6),
        lighten(quinary, 0.6),
        lighten(quaternary, 0.6)
    ];
    theme.archAccentColors = theme.archRingColors.map(color => lighten(color, 0.25));

    theme.pillarBaseColor = darken(base, 0.55);
    theme.pillarBodyColors = [
        darken(accent, 0.2),
        darken(tertiary, 0.2),
        darken(quinary, 0.2),
        darken(quaternary, 0.2)
    ];
    theme.pillarAccentColors = theme.pillarBodyColors.map(color => lighten(color, 0.5));
    theme.pillarGlowColor = lighten(quinary, 0.92);

    theme.floatingPlatformColors = [
        lighten(base, 0.7),
        lighten(accent, 0.7),
        lighten(tertiary, 0.7),
        lighten(quinary, 0.7)
    ];

    theme.cloudColor = lighten(quinary, 0.92);
    theme.cloudBandColor = lighten(quinary, 0.85);
    theme.windColor = lighten(quinary, 0.88);

    theme.balloonColors = [
        lighten(accent, 0.75),
        lighten(tertiary, 0.75),
        lighten(quinary, 0.75),
        lighten(quaternary, 0.75)
    ];

    theme.treeTrunkColor = mixColors(darken(base, 0.7), '#5a3a1a', 0.55);
    theme.treeCanopyColors = [
        lighten(accent, 0.4),
        lighten(tertiary, 0.4),
        lighten(quinary, 0.4)
    ];
    theme.treeHighlightColors = theme.treeCanopyColors.map(color => lighten(color, 0.25));

    theme.mountainMainColors = [
        darken(base, 0.25),
        darken(accent, 0.25),
        darken(tertiary, 0.3)
    ];
    theme.mountainSecondaryColors = [
        darken(quinary, 0.2),
        darken(quaternary, 0.25)
    ];
    theme.mountainHighlightColor = lighten(quinary, 0.7);

    theme.lanternColors = [
        lighten(accent, 0.85),
        lighten(quinary, 0.85),
        lighten(tertiary, 0.85)
    ];

    return theme;
}

function getThemeForPalette(paletteKey) {
    if (paletteKey === 'none') {
        return getMonochromeTheme();
    }

    if (paletteKey === 'default' || paletteKey === 'auto' || !paletteKey) {
        return getDefaultTheme();
    }

    const palette = colorPalettes[paletteKey];
    if (!palette || palette.length === 0) {
        return getDefaultTheme();
    }

    return buildThemeFromPalette(palette);
}

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

function selectColor(colors, index) {
    if (!Array.isArray(colors) || colors.length === 0) {
        return '#ffffff';
    }
    return colors[index % colors.length];
}

function addBaseStructures(root, theme) {
    createEntity('a-entity', {
        geometry: 'primitive: circle; radius: 58; segments: 96',
        material: `shader: flat; roughness: 0.8; color: ${theme.groundPlaneColor}`,
        rotation: '-90 0 0',
        position: '0 -1.2 -2'
    }, root);

    createEntity('a-entity', {
        geometry: 'primitive: torus; radius: 58; radiusTubular: 0.6; segmentsTubular: 32; segmentsRadial: 12',
        material: `color: ${theme.groundRingColor}; shader: flat; metalness: 0.05; roughness: 0.6`,
        rotation: '90 0 0',
        position: '0 -1.45 -2'
    }, root);

    theme.terracesColors.forEach((color, index) => {
        const radius = [25, 18, 12][index] || 10;
        const y = [-4, -6.5, -9][index] || -11;
        createEntity('a-cylinder', {
            radius: radius.toString(),
            height: '0.4',
            color,
            position: `0 ${y} -2`,
            material: 'shader: flat'
        }, root);
    });

    createEntity('a-cylinder', {
        radius: '6',
        height: '14',
        color: theme.coreColumnColor,
        opacity: '0.85',
        position: '0 -8.5 -2',
        material: 'shader: flat'
    }, root);
}

function addCloseTowerRing(root, densityLevel, theme) {
    CLOSE_TOWER_CONFIGS.forEach((tower, index) => {
        if (!isLevelAtLeast(densityLevel, tower.minDensity)) {
            return;
        }

        const group = createEntity('a-entity', {
            position: `${tower.x} -1.15 ${tower.z - 2}`
        }, root);

        createEntity('a-cylinder', {
            radius: tower.baseRadius.toString(),
            height: '1.2',
            color: theme.towerBaseColor,
            position: '0 0.6 0',
            material: 'shader: flat'
        }, group);

        const bodyColor = selectColor(theme.towerBodyColors, index);
        createEntity('a-box', {
            width: tower.width.toString(),
            depth: tower.depth.toString(),
            height: tower.height,
            position: `0 ${(tower.height / 2) + 1.2} 0`,
            color: bodyColor,
            material: 'shader: flat; metalness: 0.12; roughness: 0.35'
        }, group);

        const accentColor = selectColor(theme.towerAccentColors, index);
        for (let i = 0; i < 3; i += 1) {
            const ringHeight = 2 + i * (tower.height / 3);
            createEntity('a-torus', {
                radius: (tower.width * 0.5 + 0.3).toFixed(2),
                radiusTubular: 0.06,
                material: `shader: flat; color: ${accentColor}`,
                rotation: '90 0 0',
                position: `0 ${ringHeight + 1.2} 0`
            }, group);
        }

        const glowColor = selectColor(theme.towerGlowColors, index);
        createEntity('a-sphere', {
            radius: '0.9',
            color: glowColor,
            material: 'shader: flat; opacity: 0.85',
            position: `0 ${tower.height + 1.7} 0`,
            animation__pulse: `property: scale; dir: alternate; dur: ${9000 + index * 650}; easing: easeInOutSine; loop: true; to: 1.1 1.18 1.1`
        }, group);
    });
}

function addMegaTowers(root, densityLevel, theme) {
    MEGA_TOWER_CONFIGS.forEach((tower, index) => {
        if (!isLevelAtLeast(densityLevel, tower.minDensity)) {
            return;
        }

        const group = createEntity('a-entity', {
            position: `${tower.x} -1.1 ${tower.z - 2}`
        }, root);

        createEntity('a-cylinder', {
            radius: tower.baseRadius.toString(),
            height: '1.4',
            color: theme.towerBaseColor,
            position: '0 0.7 0',
            material: 'shader: flat'
        }, group);

        const bodyColor = selectColor(theme.towerBodyColors, index + CLOSE_TOWER_CONFIGS.length);
        createEntity('a-box', {
            width: tower.width.toString(),
            depth: tower.depth.toString(),
            height: tower.height,
            position: `0 ${(tower.height / 2) + 1.4} 0`,
            color: bodyColor,
            material: 'shader: flat; metalness: 0.16; roughness: 0.38'
        }, group);

        const accentColor = selectColor(theme.towerAccentColors, index + 2);
        for (let i = 0; i < 4; i += 1) {
            const ringHeight = 3 + i * (tower.height / 4.5);
            createEntity('a-torus', {
                radius: (tower.width * 0.55 + 0.45).toFixed(2),
                radiusTubular: 0.08,
                material: `shader: flat; color: ${accentColor}`,
                rotation: '90 0 0',
                position: `0 ${ringHeight + 1.4} 0`
            }, group);
        }

        const glowColor = selectColor(theme.towerGlowColors, index + 2);
        createEntity('a-entity', {
            geometry: 'primitive: cone; radiusBottom: 0.7; radiusTop: 0.1; height: 2.2',
            position: `0 ${tower.height + 2.6} 0`,
            material: `shader: flat; color: ${glowColor}; opacity: 0.85`
        }, group);
    });
}

function addHoveringWalkways(root, densityLevel, theme) {
    WALKWAY_CONFIGS.forEach((walkway, index) => {
        if (!isLevelAtLeast(densityLevel, walkway.minDensity)) {
            return;
        }

        const color = selectColor(theme.walkwayDeckColors, index);
        const platform = createEntity('a-box', {
            width: walkway.width,
            depth: walkway.depth,
            height: '0.12',
            position: `${walkway.x} ${walkway.y} ${walkway.z}`,
            color,
            material: 'shader: flat; metalness: 0.08; roughness: 0.45'
        }, root);

        createEntity('a-box', {
            width: walkway.width + 0.4,
            depth: '0.08',
            height: '0.4',
            position: `${walkway.x} ${walkway.y + 0.25} ${walkway.z + (walkway.depth / 2)}`,
            color: theme.walkwayGuardColor,
            material: 'shader: flat; opacity: 0.65'
        }, root);

        createEntity('a-box', {
            width: walkway.width + 0.4,
            depth: '0.08',
            height: '0.4',
            position: `${walkway.x} ${walkway.y + 0.25} ${walkway.z - (walkway.depth / 2)}`,
            color: theme.walkwayGuardColor,
            material: 'shader: flat; opacity: 0.65'
        }, root);

        platform.setAttribute('animation__hover', `property: position; dir: alternate; dur: ${12000 + index * 1600}; easing: easeInOutSine; loop: true; to: ${walkway.x} ${walkway.y + walkway.hover} ${walkway.z}`);
    });
}

function addArches(root, densityLevel, theme) {
    ARCH_CONFIGS.forEach((arch, index) => {
        if (!isLevelAtLeast(densityLevel, arch.minDensity)) {
            return;
        }

        const baseColor = theme.archBaseColor;
        const ringColor = selectColor(theme.archRingColors, index);
        const accentColor = selectColor(theme.archAccentColors, index);

        createEntity('a-cylinder', {
            radius: '0.28',
            height: arch.height,
            color: baseColor,
            position: `${arch.x - arch.width / 2} ${(arch.height / 2) - 1.2} ${arch.z - 2}`,
            material: 'shader: flat'
        }, root);

        createEntity('a-cylinder', {
            radius: '0.28',
            height: arch.height,
            color: baseColor,
            position: `${arch.x + arch.width / 2} ${(arch.height / 2) - 1.2} ${arch.z - 2}`,
            material: 'shader: flat'
        }, root);

        const archEl = createEntity('a-torus', {
            radius: arch.width / 2,
            radiusTubular: 0.18,
            material: `shader: flat; color: ${ringColor}`,
            rotation: '0 0 90',
            position: `${arch.x} ${(arch.height - 1.2)} ${arch.z - 2}`
        }, root);

        archEl.setAttribute('animation__glow', `property: material.color; dir: alternate; dur: ${9000 + index * 1000}; easing: easeInOutSine; loop: true; to: ${accentColor}`);

        createEntity('a-sphere', {
            radius: '0.3',
            color: accentColor,
            material: 'shader: flat; opacity: 0.9',
            position: `${arch.x} ${(arch.height - 1.2) + 0.2} ${arch.z - 2}`
        }, root);
    });
}

function addPillarClusters(root, densityLevel, theme) {
    PILLAR_CONFIGS.forEach((pillar, index) => {
        if (!isLevelAtLeast(densityLevel, pillar.minDensity)) {
            return;
        }

        const bodyColor = selectColor(theme.pillarBodyColors, index);
        const accentColor = selectColor(theme.pillarAccentColors, index);
        const baseColor = darken(theme.pillarBaseColor, 0.05 * (index % 3));
        const glowColor = theme.pillarGlowColor;

        const pillarGroup = createEntity('a-entity', {
            position: `${pillar.x} -1.2 ${pillar.z - 2}`
        }, root);

        createEntity('a-box', {
            width: pillar.width,
            depth: pillar.depth,
            height: pillar.height,
            position: `0 ${pillar.height / 2} 0`,
            color: bodyColor,
            material: 'shader: flat; metalness: 0.18; roughness: 0.45'
        }, pillarGroup);

        createEntity('a-box', {
            width: (pillar.width * 0.6).toFixed(2),
            depth: (pillar.depth * 0.6).toFixed(2),
            height: (pillar.height * 0.5).toFixed(2),
            position: `0 ${(pillar.height * 0.5) / 2 + pillar.height * 0.25} 0`,
            color: accentColor,
            material: 'shader: flat; opacity: 0.9'
        }, pillarGroup);

        createEntity('a-box', {
            width: (pillar.width * 0.9).toFixed(2),
            depth: (pillar.depth * 0.9).toFixed(2),
            height: '0.4',
            position: `0 ${pillar.height + 0.2} 0`,
            color: baseColor,
            material: 'shader: flat; metalness: 0.25; roughness: 0.3'
        }, pillarGroup);

        createEntity('a-sphere', {
            radius: (Math.max(pillar.width, pillar.depth) * 0.35).toFixed(2),
            color: glowColor,
            material: 'shader: flat; opacity: 0.95',
            position: `0 ${pillar.height + 0.5} 0`,
            animation__pulse: `property: scale; dir: alternate; dur: ${6000 + index * 800}; easing: easeInOutSine; loop: true; to: 1.08 1.12 1.08`
        }, pillarGroup);
    });
}

function addFloatingPlatforms(root, densityLevel, theme) {
    FLOATING_PLATFORM_CONFIGS.forEach((platform, index) => {
        if (!isLevelAtLeast(densityLevel, platform.minDensity)) {
            return;
        }

        const color = selectColor(theme.floatingPlatformColors, index);
        const platformEl = createEntity('a-box', {
            color,
            scale: platform.scale,
            position: `${platform.x} ${platform.y} ${platform.z}`,
            material: 'shader: flat'
        }, root);

        platformEl.setAttribute('animation__hover', `property: position; dir: alternate; dur: ${10000 + platform.delay}; easing: easeInOutSine; loop: true; to: ${platform.x} ${platform.y + platform.hover} ${platform.z}; delay: ${platform.delay}`);
    });
}

function addClouds(root, densityLevel, theme) {
    CLOUD_CONFIGS.forEach((cloud, index) => {
        if (!isLevelAtLeast(densityLevel, cloud.minDensity)) {
            return;
        }

        const cloudEl = createEntity('a-sphere', {
            color: theme.cloudColor,
            position: `${cloud.x} ${cloud.y} ${cloud.z}`,
            scale: cloud.scale,
            opacity: '0.85',
            material: 'shader: flat'
        }, root);

        cloudEl.setAttribute('animation__float', `property: position; dir: alternate; dur: ${12000 + cloud.delay}; easing: easeInOutSine; loop: true; to: ${cloud.x} ${cloud.y + 0.8} ${cloud.z}; delay: ${cloud.delay}`);
        cloudEl.setAttribute('animation__drift', `property: position; dir: alternate; dur: ${18000 + cloud.delay}; easing: easeInOutSine; loop: true; to: ${cloud.x + cloud.drift} ${cloud.y} ${cloud.z}; delay: ${cloud.delay / 2}`);
    });

    FAR_CLOUD_BANDS.forEach((band) => {
        if (band.minDensity && !isLevelAtLeast(densityLevel, band.minDensity)) {
            return;
        }

        createEntity('a-plane', {
            width: `${band.width}`,
            height: '6',
            material: `shader: flat; color: ${theme.cloudBandColor}; opacity: 0.18; side: double`,
            rotation: '0 0 0',
            position: `0 ${band.y} ${band.z}`,
            animation__wind: `property: position; dir: alternate; dur: 24000; easing: easeInOutSine; loop: true; to: ${band.to} ${band.y} ${band.z}; from: ${band.from} ${band.y} ${band.z}; delay: ${band.delay}`
        }, root);
    });
}

function addWindTrails(root, densityLevel, theme) {
    WIND_TRAIL_CONFIGS.forEach((trail) => {
        if (!isLevelAtLeast(densityLevel, trail.minDensity)) {
            return;
        }

        createEntity('a-plane', {
            width: `${trail.length}`,
            height: '1.6',
            material: `shader: flat; color: ${theme.windColor}; opacity: 0.12; side: double`,
            position: trail.position,
            rotation: trail.rotation,
            animation__pulse: 'property: material.opacity; dir: alternate; dur: 3500; easing: easeInOutSine; loop: true; to: 0.22'
        }, root);
    });
}

function addBalloons(root, densityLevel, theme) {
    BALLOON_CONFIGS.forEach((balloon, index) => {
        if (!isLevelAtLeast(densityLevel, balloon.minDensity)) {
            return;
        }

        const color = selectColor(theme.balloonColors, index);
        createEntity('a-sphere', {
            radius: '1.5',
            color,
            position: `${balloon.x} ${balloon.y} ${balloon.z}`,
            material: 'shader: flat; opacity: 0.95',
            animation__bob: `property: position; dir: alternate; dur: ${9000 + balloon.delay}; easing: easeInOutSine; loop: true; to: ${balloon.x} ${balloon.y + balloon.bob} ${balloon.z}; delay: ${balloon.delay}`
        }, root);

        createEntity('a-cylinder', {
            radius: '0.02',
            height: `${balloon.y + 3}`,
            color: lighten(theme.balloonColors[0] || '#ffffff', 0.2),
            position: `${balloon.x} ${(balloon.y - 3) / 2} ${balloon.z}`,
            material: 'shader: flat; opacity: 0.6'
        }, root);
    });
}

function addTrees(root, densityLevel, theme) {
    TREE_CONFIGS.forEach((tree, index) => {
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
            color: theme.treeTrunkColor,
            material: 'shader: flat'
        }, treeGroup);

        const canopyColor = selectColor(theme.treeCanopyColors, index);
        const canopy = createEntity('a-sphere', {
            position: `0 ${tree.trunkHeight + 0.8} 0`,
            scale: tree.canopyScale,
            color: canopyColor,
            material: 'shader: flat; roughness: 0.7'
        }, treeGroup);

        canopy.setAttribute('animation__sway', `property: rotation; dir: alternate; dur: ${6000 + index * 1200}; easing: easeInOutSine; loop: true; to: ${tree.sway * 60} ${tree.sway * 80} ${tree.sway * -40}`);

        const highlightColor = selectColor(theme.treeHighlightColors, index);
        createEntity('a-sphere', {
            position: `0 ${tree.trunkHeight + 0.8} 0`,
            scale: '1.2 0.8 1.2',
            color: highlightColor,
            material: 'shader: flat; opacity: 0.4'
        }, treeGroup);
    });
}

function addMountainSilhouettes(root, densityLevel, theme) {
    MOUNTAIN_CONFIGS.forEach((mountain, index) => {
        if (!isLevelAtLeast(densityLevel, mountain.minDensity)) {
            return;
        }

        const mainColor = selectColor(theme.mountainMainColors, index);
        const secondaryColor = selectColor(theme.mountainSecondaryColors, index);
        const highlightColor = theme.mountainHighlightColor;

        createEntity('a-entity', {
            geometry: `primitive: cone; radiusBottom: ${mountain.radius}; radiusTop: 0.5; height: ${mountain.height}`,
            position: `${mountain.x} ${(mountain.height / 2) - 2} ${mountain.z - 2}`,
            material: `shader: flat; color: ${mainColor}; opacity: 0.85`
        }, root);

        createEntity('a-entity', {
            geometry: `primitive: cone; radiusBottom: ${(mountain.radius * 0.6).toFixed(2)}; radiusTop: 0.2; height: ${(mountain.height * 0.8).toFixed(2)}`,
            position: `${mountain.x + 2} ${(mountain.height * 0.8) / 2 - 1.8} ${mountain.z - 5}`,
            material: `shader: flat; color: ${secondaryColor}; opacity: 0.78`
        }, root);

        if (isLevelAtLeast(densityLevel, 'immersive')) {
            createEntity('a-plane', {
                width: `${(mountain.radius * 1.6).toFixed(2)}`,
                height: '1.2',
                position: `${mountain.x} ${(mountain.height / 2) + 1} ${mountain.z - 2}`,
                rotation: '0 0 0',
                material: `shader: flat; color: ${highlightColor}; opacity: 0.12`,
                animation__shimmer: `property: material.opacity; dir: alternate; dur: ${7000 + index * 500}; easing: easeInOutSine; loop: true; to: 0.22`
            }, root);
        }
    });
}

function addSkyLanterns(root, densityLevel, theme) {
    if (!isLevelAtLeast(densityLevel, 'immersive')) {
        return;
    }

    LANTERN_CONFIGS.forEach((lantern, index) => {
        const color = selectColor(theme.lanternColors, index);
        const lanternEl = createEntity('a-entity', {
            geometry: 'primitive: octahedron; radius: 0.4',
            position: `${lantern.x} ${lantern.y} ${lantern.z}`,
            material: `shader: flat; color: ${color}; opacity: 0.85`
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
    currentPalette: 'default',
    currentTheme: getDefaultTheme(),

    create(sceneEl, densityLevel = 'immersive', paletteKey = 'default') {
        this.sceneEl = sceneEl;
        this.currentDensity = DENSITY_LEVELS.includes(densityLevel) ? densityLevel : 'immersive';
        this.currentPalette = paletteKey || 'default';

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

    updatePalette(paletteKey) {
        const normalizedKey = paletteKey === 'auto' ? 'default' : (paletteKey || 'default');
        if (this.currentPalette === normalizedKey) {
            return;
        }
        this.currentPalette = normalizedKey;
        if (this.sceneEl) {
            this._rebuild();
        }
    },

    getCurrentTheme() {
        return this.currentTheme || getDefaultTheme();
    },

    _rebuild() {
        if (!this.sceneEl) {
            return;
        }

        if (this.decorRoot && this.decorRoot.parentNode) {
            this.decorRoot.parentNode.removeChild(this.decorRoot);
        }

        this.currentTheme = getThemeForPalette(this.currentPalette);
        this.decorRoot = createEntity('a-entity', { id: 'heights-decor-root' });

        addBaseStructures(this.decorRoot, this.currentTheme);
        addCloseTowerRing(this.decorRoot, this.currentDensity, this.currentTheme);
        addMegaTowers(this.decorRoot, this.currentDensity, this.currentTheme);
        addHoveringWalkways(this.decorRoot, this.currentDensity, this.currentTheme);
        addArches(this.decorRoot, this.currentDensity, this.currentTheme);
        addPillarClusters(this.decorRoot, this.currentDensity, this.currentTheme);
        addFloatingPlatforms(this.decorRoot, this.currentDensity, this.currentTheme);
        addClouds(this.decorRoot, this.currentDensity, this.currentTheme);
        addWindTrails(this.decorRoot, this.currentDensity, this.currentTheme);
        addBalloons(this.decorRoot, this.currentDensity, this.currentTheme);
        addTrees(this.decorRoot, this.currentDensity, this.currentTheme);
        addMountainSilhouettes(this.decorRoot, this.currentDensity, this.currentTheme);
        addSkyLanterns(this.decorRoot, this.currentDensity, this.currentTheme);

        this.sceneEl.appendChild(this.decorRoot);
        this.sceneEl.setAttribute('fog', `type: exponential; color: ${this.currentTheme.fogColor}; density: 0.018`);
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
        this.currentPalette = 'default';
        this.currentTheme = getDefaultTheme();
    }
};
