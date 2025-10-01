# Workflow de Développement - Application Modulaire (depuis v0.29 PWA)

Ce document décrit le workflow de développement pour l'application OPTO VR.

## 1. Checklist de Création d'une Nouvelle Version (Workflow PWA)

Pour créer une nouvelle version (ex: `v0.32` depuis `v0.31`), suivre **impérativement** toutes ces étapes :

1.  **Créer le Répertoire :**
    -   Créer un nouveau dossier pour la nouvelle version (ex: `v0.32`).
    -   Copier l'intégralité du contenu de la version précédente (ex: `v0.31`). **Cela inclut les fichiers PWA (`manifest.json`, `service-worker.js`) et le répertoire `icons/`.**

2.  **Mettre à jour `index.html` :**
    -   **Affichage Version :** Mettre à jour le contenu de la balise pour qu'il corresponde au nouveau numéro.
        ```html
        <div id="version-display">v0.32</div>
        ```
    -   **Invalidation du Cache (Cache Busting) :** Mettre à jour les numéros de version pour les fichiers CSS et JS.
        ```html
        <link rel="stylesheet" href="styles.css?v=0.32">
        <script type="module" src="main.js?v=0.32"></script>
        ```

3.  **Mettre à jour le Service Worker (ÉTAPE CRUCIALE POUR LA PWA) :**
    -   Ouvrir le fichier `service-worker.js`.
    -   Mettre à jour le numéro de version du cache. **C'est ce qui déclenche la mise à jour de l'application pour les utilisateurs.**
        ```javascript
        // AVANT
        const CACHE_NAME = 'opto-vr-cache-v0.31';
        // APRÈS
        const CACHE_NAME = 'opto-vr-cache-v0.32';
        ```

4.  **Mettre à jour le `CHANGELOG.md` :**
    -   Copier le `CHANGELOG.md` de la version précédente.
    -   Ajouter les nouvelles modifications en haut du fichier.

5.  **Copier les Scripts de Lancement :**
    -   S'assurer que `lancer_serveur.bat` est présent dans le nouveau répertoire.

## 2. Architecture Modulaire

L'application est entièrement modulaire. `main.js` est un **orchestrateur** qui charge dynamiquement des modules pour la **stimulation visuelle** et pour les **exercices**.

-   **Modules de Stimulation Visuelle (`/visuals/`)**
    -   Chaque module est autonome et gère son propre panneau de contrôle.
-   **Modules d'Exercices (`/modules/`)**
    -   Chaque module est autonome et gère son propre sous-menu.

Pour ajouter une nouvelle fonctionnalité, il suffit de créer le module et de l'ajouter dans `index.html`.

## 3. Guide : Ajouter une Nouvelle Stimulation Visuelle (Architecture robuste post-v0.40)

Voici la procédure fiable pour ajouter une nouvelle stimulation visuelle (ex: `tunnel`).

### Étape A : Créer le Fichier du Module (`/visuals/`)

1.  **Créez le Fichier :** Dans le dossier `/visuals/`, créez un nouveau fichier (ex: `visuals/tunnel.js`).

2.  **Structure du Module :** Ce fichier doit exporter un objet (ex: `tunnelModule`) qui respecte l'interface ci-dessous. **Important :** Même si une fonction n'est pas utilisée (ex: `setDensity`), elle doit être présente avec une implémentation vide pour assurer la compatibilité.

    ```javascript
    // Dans : /visuals/tunnel.js
    export const tunnelModule = {
        // Appelé 1x lors de l'activation du module
        init(sceneEl, rigEl, cameraEl, containerEl) { /* ... code d'initialisation ... */ },

        // Appelé pour nettoyer avant de changer de module
        cleanup() { /* ... supprimer les entités, arrêter les animations ... */ },

        // Appelé pour recréer/recentrer la scène visuelle
        regenerate() { /* ... code pour régénérer la scène ... */ },

        // --- Fonctions pour les contrôles (toutes requises) ---
        setSpeed(speed) { /* ... ajuster la vitesse ... */ },
        setDensity(density) { /* ... (laisser vide si non utilisé) ... */ },
        setPalette(paletteId) { /* ... (laisser vide si non utilisé) ... */ },

        // Doit retourner les vitesses actuelles pour l'affichage (si pertinent)
        getActualSpeed() { return { h: 0, v: 0, t: 0 }; }
    };
    ```

### Étape B : Mettre à jour `index.html`

1.  **Ajouter l'Option au Menu :** Dans le `<select id="visual-select">`, ajoutez une nouvelle `<option>`. La `value` doit être un identifiant unique (ex: `tunnel`).

    ```html
    <select id="visual-select">
        <option value="optokinetic">Optocinétique</option>
        <option value="opticalFlow">Flux Optique</option>
        <option value="rotatingCube">Cube Rotatif</option>
        <option value="tunnel">Tunnel</option> <!-- NOUVELLE LIGNE -->
    </select>
    ```

2.  **Créer le Groupe de Contrôles :**
    *   Dans la `div#controls`, juste avant le groupe du "Cube Rotatif" (ou le dernier existant), ajoutez un nouveau `div` pour votre module.
    *   **TRÈS IMPORTANT :**
        *   Donnez-lui un `id` unique (ex: `tunnel-controls`).
        *   Donnez-lui la classe `control-group`.
        *   Cachez-le par défaut avec `style="display: none;"`.
    *   À l'intérieur, ajoutez vos contrôles (`input`, `label`, etc.) en leur donnant la classe `control-item`.

    ```html
    <!-- Panneau de contrôle pour le Tunnel -->
    <div id="tunnel-controls" class="control-group" style="display: none;">
        <div class="control-item">
            <label for="tunnel-speed-slider">Vitesse Tunnel</label>
            <input type="range" id="tunnel-speed-slider" min="0" max="10" value="1">
            <span id="tunnel-speed-value">1</span>
        </div>
        <!-- Ajoutez d'autres contrôles ici si nécessaire -->
    </div>
    ```

### Étape C : Mettre à jour `main.js` (Simplifié)

1.  **Importer le Module :** En haut du fichier, ajoutez l'import pour votre nouveau module.
    ```javascript
    import { tunnelModule } from './visuals/tunnel.js'; // NOUVELLE LIGNE
    ```

2.  **Récupérer les Éléments du DOM :**
    *   Récupérez le **groupe de contrôles principal** que vous venez de créer.
    *   Récupérez chaque contrôle individuel (slider, etc.) dont vous avez besoin.

    ```javascript
    // ... autres éléments ...
    const tunnelControls = document.getElementById('tunnel-controls');
    const tunnelSpeedSlider = document.getElementById('tunnel-speed-slider');
    const tunnelSpeedValue = document.getElementById('tunnel-speed-value');
    ```

3.  **Enregistrer le Module :** Ajoutez votre module à l'objet `VisualModules`.
    ```javascript
    const VisualModules = {
        // ... autres modules
        rotatingCube: rotatingCubeModule,
        tunnel: tunnelModule // NOUVELLE LIGNE
    };
    ```

4.  **Gérer la Visibilité du Groupe :** Dans la fonction `updateUIVisibility`, ajoutez une seule ligne pour votre nouveau groupe.
    ```javascript
    function updateUIVisibility(moduleName) {
        // ... (code existant pour les autres groupes) ...
        rotatingCubeControls.style.display = (moduleName === 'rotatingCube') ? 'flex' : 'none';
        tunnelControls.style.display = (moduleName === 'tunnel') ? 'flex' : 'none'; // NOUVELLE LIGNE
    }
    ```

5.  **Initialiser et Gérer les Événements :**
    *   Dans `updateUIVisibility`, ajoutez un `if` pour initialiser votre module avec ses valeurs par défaut quand il devient actif.
    *   Plus bas, ajoutez les `addEventListener` pour vos nouveaux contrôles.

    ```javascript
    // Dans updateUIVisibility...
    if (moduleName === 'tunnel') {
        activeVisualModule.setSpeed(tunnelSpeedSlider.value);
    }

    // ... plus bas, à la fin des autres listeners ...
    tunnelSpeedSlider.addEventListener('input', (e) => {
        tunnelSpeedValue.textContent = e.target.value;
        if (activeVisualModule && visualSelect.value === 'tunnel') {
            activeVisualModule.setSpeed(e.target.value);
        }
    });
    ```


## 4. Guide : Ajouter un Nouvel Exercice

La procédure reste la même :
1.  Créer le fichier module (ex: `/modules/saccades.js`).
2.  Ajouter l'option dans le `<select>` de `index.html`.
3.  Mettre à jour les imports et l'enregistrement dans `main.js`.

## 5. Lancement de l'Application (Méthode Anti-Cache Obligatoire)

Pour éviter les problèmes de cache liés à la PWA, il est **impératif** d'utiliser le serveur anti-cache fourni.

1.  **Se Placer dans le Répertoire de la Version :**
    -   Ouvrez un terminal et naviguez jusqu'au dossier de la version à tester (ex: `cd v0.31`).

2.  **Lancer le Serveur Anti-Cache :**
    -   Exécutez la commande suivante pour démarrer le serveur en arrière-plan. Il se trouve à la racine du projet (d'où `../`).
        ```bash
        python3 ../serveur_no_cache.py 8000 &
        ```
    -   **Note :** Le `&` est crucial pour ne pas bloquer le terminal.

3.  **Accéder à l'Application :**
    -   Ouvrez votre navigateur et allez à l'adresse : `http://localhost:8000`.

### En cas de problème de cache persistant

Si une ancienne version s'affiche toujours :
1.  Désinscrivez le Service Worker et effacez les données du site via les Outils de Développement (Onglet "Application").
2.  Désinstallez l'application PWA de votre ordinateur et testez dans un onglet de navigateur standard.

---

# État Actuel de la Refactorisation (Gestion de l'État)

**Objectif Général :** Centraliser la gestion de l'état de l'application via le `stateManager` pour une architecture plus robuste, maintenable et évolutive.

**Progression :**

*   **v0.49 : Migration de la gestion de la palette de couleurs.**
    *   Le sélecteur de palette (`paletteSelect`) met à jour le `stateManager`.
    *   Le module `optokinetic` s'abonne au `stateManager` pour réagir aux changements de palette.
*   **v0.50 : Migration de la gestion des vitesses.**
    *   Les événements clavier et le slider du cube mettent à jour les vitesses dans le `stateManager`.
    *   Les modules `optokinetic`, `opticalFlow`, `rotatingCube`, et `heights` s'abonnent au `stateManager` pour réagir aux changements de vitesse.
*   **v0.50b : Correction des vitesses.**
    *   Correction d'un bug où les vitesses n'étaient pas correctement réinitialisées lors du changement de module.
*   **v0.53 : Migration de la sélection du module visuel actif.**
    *   Le `visualSelect` (menu déroulant des stimulations) met à jour la propriété `visual.activeModule` dans le `stateManager`.
    *   `main.js` s'abonne aux changements de `visual.activeModule` et appelle `setActiveVisualModule` en conséquence.
    *   Correction d'un bug critique de boucle infinie lié à une mauvaise compréhension du `stateManager.subscribe`.

**État Actuel :** La gestion des couleurs, des vitesses et la sélection du module visuel actif sont maintenant centralisées et gérées par le `stateManager`. L'application est fonctionnelle et stable à ce stade de la refactorisation.

# Prochaines Étapes de la Refactorisation

La logique est de continuer cette migration pour que tout l'état de l'application passe par le `stateManager`.

1.  **Migration de la sélection du module d'exercice actif :**
    *   Faire en sorte que le `exerciseSelect` mette à jour `exercise.activeModule` dans le `stateManager`.
    *   `main.js` réagira à ce changement pour charger/activer le bon module d'exercice.
2.  **Migration des autres contrôles UI :**
    *   Les autres sliders et contrôles (comme `densitySlider`, `ambianceControl`) devraient également mettre à jour le `stateManager` directement.
    *   Les modules concernés devraient s'abonner à ces changements.
3.  **Refactorisation de `updateSpeedDisplay` :**
    *   Cette fonction devrait lire les vitesses directement depuis le `stateManager` plutôt que de dépendre de `activeVisualModule.getActualSpeed()`.
4.  **Nettoyage et simplification des modules :**
    *   Une fois que tous les contrôles passent par le `stateManager`, les modules visuels et d'exercices pourront être simplifiés.
    *   Ils n'auront plus besoin de fonctions `setSpeed`, `setPalette`, etc., mais seulement d'une fonction `onStateChange` qui réagit aux changements pertinents de l'état global.

Ce document sera mis à jour à chaque étape majeure de la refactorisation.