# AGENTS.md — Guide pour agents (Codex & co.)

Document de référence unique pour les workflows Codex sur OptoWeb. Vous y trouverez les précautions générales, les zones sensibles et les procédures détaillées à suivre pour préparer des versions ou ajouter du contenu interactif.

## Checklist express
- Vérifier la branche courante (jamais `gh-pages`).
- Garder les chemins relatifs pour les assets (`./...`).
- Mettre à jour toutes les références de version ensemble (`index.html`, `service-worker.js`, `CHANGELOG.md`).
- Tester l’intégration d’un nouveau module (visuel ou exercice) dans `main.js` et l’UI.

## Sommaire
- [Projet](#projet)
- [Zones de travail](#zones-de-travail)
- [Procédures](#procédures)
  - [Préparer une version](#préparer-une-version)
  - [Ajouter une stimulation visuelle](#ajouter-une-stimulation-visuelle)
  - [Ajouter un exercice](#ajouter-un-exercice)

## Projet
- **Nom** : OptoWeb (A-Frame, site statique)
- **But** : scènes VR WebXR (A-Frame) servies en GitHub Pages

## Zones de travail
- **Code source** : racine du dépôt (ex. `index.html`, `main.js`, `components/`, `utils/`, `visuals/`, `modules/`, `icons/`)
- **À NE PAS MODIFIER** : branche `gh-pages` (réservée au déploiement)
- **Fichiers critiques** : `index.html`, `manifest.json`, `service-worker.js`
- **Chemins** : toujours **relatifs** (`./...`) pour GitHub Pages

## Procédures

### Préparer une version
1. **Mettre à jour `index.html`.**
   - Ajuster le contenu de la balise `<title>` avec le nouveau numéro de version.
   - Modifier le texte affiché dans `<div id="version-display">` pour qu'il corresponde à cette version.
   - Rafraîchir les suffixes d'invalidation du cache en mettant à jour les paramètres `?v=...` des liens vers `styles.css` et `main.js`.
2. **Mettre à jour `service-worker.js`.** Changer la valeur de la constante `CACHE_NAME` pour refléter la nouvelle version (ex. `opto-vr-cache-v0.XX`).
3. **Mettre à jour `CHANGELOG.md`.** Ajouter une entrée en tête de fichier décrivant les évolutions incluses dans la version, puis relire la section précédente pour vérifier la cohérence.

### Ajouter une stimulation visuelle
- Créer un nouveau fichier dans `visuals/` exportant l'objet du module et ses hooks (`init`, `cleanup`, contrôles nécessaires, etc.).
- Importer le module dans `main.js`, l'enregistrer dans la collection `VisualModules` et brancher les contrôles associés.
- Ajouter l'option correspondante dans le `<select id="visual-select">` ou insérer les éléments requis dans le DOM pour exposer ses contrôles.

### Ajouter un exercice
- Créer le module dans `modules/` avec l'API attendue par l'orchestrateur.
- L'importer dans `main.js`, l'ajouter à la structure des exercices et connecter les écouteurs pertinents.
- Mettre à jour le `<select>` ou les éléments du DOM qui rendent l'exercice accessible à l'utilisateur.
