# AGENTS.md — Guide pour agents (Codex & co.)

## Projet
- **Nom** : OptoWeb (A-Frame, site statique)
- **But** : scènes VR WebXR (A-Frame) servies en GitHub Pages

## Zones de travail
- **Code source** : racine du dépôt (ex. `index.html`, `main.js`, `components/`, `utils/`, `visuals/`, `modules/`, `icons/`)
- **À NE PAS MODIFIER** : branche `gh-pages` (réservée au déploiement)
- **Fichiers critiques** : `index.html`, `manifest.json`, `service-worker.js`
- **Chemins** : toujours **relatifs** (`./...`) pour GitHub Pages

## Versionnage (bump de version)
- Mettre à jour le titre et l'affichage de version dans `index.html` (balise `<title>`, `#version-display`, suffixes `?v=` pour CSS/JS).
- Adapter l'identifiant de cache dans `service-worker.js`.
- Vérifier les éventuelles références de version dans d'autres fichiers (ex. changelog, scripts d'intégration) et maintenir la cohérence.
