/* utils/colorPalettes.js */
/* Rôle: Définit les palettes de couleurs et fournit des fonctions utilitaires pour la manipulation des couleurs. */

export const colorPalettes = {
    none: [],
    default: ['#FFFFFF'],
    forest: ['#2E4600', '#486B00', '#A3BC6D', '#D4ED91', '#79A5A6'],
    sunset: ['#FF5733', '#C70039', '#900C3F', '#581845', '#FFC300'],
    ocean: ['#003F5C', '#34657F', '#7FB5B5', '#E6F5F5', '#FF6F61'],
    retro: ['#FF00FF', '#00FFFF', '#FFFF00', '#FF9900', '#00FF00'],
    pastel: ['#A0C4FF', '#BDB2FF', '#FFADAD', '#FFD6A5', '#FDFFB6'],
    autumn: ['#A84E22', '#D48421', '#E6A00F', '#592B02', '#BF805F'],
    aurora: ['#00FF7F', '#7FFF00', '#00FA9A', '#40E0D0', '#8A2BE2'],
    volcanic: ['#FF4500', '#DC143C', '#FFD700', '#8B0000', '#2F4F4F'],
    cyberpunk: ['#00FFFF', '#FF00FF', '#00FF00', '#FFFF00', '#FF69B4']
};

export function lerpColor(c1, c2, t) {
    const f = parseInt(c1.slice(1), 16), o = parseInt(c2.slice(1), 16);
    const r = Math.round(((f >> 16) & 0xFF) * (1 - t) + ((o >> 16) & 0xFF) * t);
    const g = Math.round(((f >> 8) & 0xFF) * (1 - t) + ((o >> 8) & 0xFF) * t);
    const b = Math.round((f & 0xFF) * (1 - t) + (o & 0xFF) * t);
    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).padStart(6, '0')}`;
}