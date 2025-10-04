# Workflow de développement – Environnement Codex

## Introduction
Codex prend en charge la préparation des pull requests et les déploiements de l'application OPTO VR. Le dépôt reste unique : aucune duplication de répertoires n'est requise et aucun script local spécifique n'est nécessaire pour publier les modifications.

## Préparer une version
1. **Mettre à jour `index.html`.**
   - Ajuster le contenu de la balise `<title>` avec le nouveau numéro de version.
   - Modifier le texte affiché dans `<div id="version-display">` pour qu'il corresponde à cette version.
   - Rafraîchir les suffixes d'invalidation du cache en mettant à jour les paramètres `?v=...` des liens vers `styles.css` et `main.js`.
2. **Mettre à jour `service-worker.js`.** Changer la valeur de la constante `CACHE_NAME` pour refléter la nouvelle version (ex. `opto-vr-cache-v0.XX`).
3. **Mettre à jour `CHANGELOG.md`.** Ajouter une entrée en tête de fichier décrivant les évolutions incluses dans la version, puis relire la section précédente pour vérifier la cohérence.

## Ajouter une stimulation visuelle
- Créer un nouveau fichier dans `visuals/` exportant l'objet du module et ses hooks (`init`, `cleanup`, contrôles nécessaires, etc.).
- Importer le module dans `main.js`, l'enregistrer dans la collection `VisualModules` et brancher les contrôles associés.
- Ajouter l'option correspondante dans le `<select id="visual-select">` ou insérer les éléments requis dans le DOM pour exposer ses contrôles.

## Ajouter un exercice
- Créer le module dans `modules/` avec l'API attendue par l'orchestrateur.
- L'importer dans `main.js`, l'ajouter à la structure des exercices et connecter les écouteurs pertinents.
- Mettre à jour le `<select>` ou les éléments du DOM qui rendent l'exercice accessible à l'utilisateur.
