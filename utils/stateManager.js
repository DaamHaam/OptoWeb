/* /utils/stateManager.js */

// L'état initial de l'application. C'est la seule source de vérité.
const state = {
    visual: {
        activeModule: 'optokinetic', // Le module visuel actuellement sélectionné
        density: 100,             // Densité pour l'optocinétique
        palette: 'default',         // Ambiance de couleur
        altitude: 0,              // Altitude courante (utilisée par l'exercice Hauteurs)
        speeds: {
            h: 0,                 // Vitesse horizontale (optocinétique)
            v: 0,                 // Vitesse verticale (optocinétique)
            t: 0,                 // Vitesse de translation (flux optique)
            y: 0                  // Vitesse de montée/descente (hauteurs)
        }
    },
    exercise: {
        activeModule: 'none'      // Le module d'exercice actuellement sélectionné
        // ... d'autres états spécifiques aux exercices pourront être ajoutés ici
    }
};

// Liste des fonctions (callbacks) qui se sont abonnées aux changements d'état.
const subscribers = [];

/**
 * Le stateManager est un objet qui centralise l'état de l'application.
 * Il permet de s'abonner aux changements et de modifier l'état de manière contrôlée.
 */
export const stateManager = {
    /**
     * Permet à d'autres parties de l'application (modules, UI) de s'abonner aux changements de l'état.
     * @param {function} callback - La fonction à appeler chaque fois que l'état change.
     */
    subscribe(callback) {
        subscribers.push(callback);
        console.log(`Un nouveau module s'est abonné. Total abonnés: ${subscribers.length}`);

        let isActive = true;
        return () => {
            if (!isActive) {
                return;
            }
            isActive = false;
            const index = subscribers.indexOf(callback);
            if (index !== -1) {
                subscribers.splice(index, 1);
                console.log(`Un module s'est désabonné. Total abonnés: ${subscribers.length}`);
            }
        };
    },

    /**
     * Met à jour une partie de l'état et notifie tous les abonnés.
     * @param {object} newState - Un objet contenant les nouvelles valeurs à fusionner avec l'état actuel.
     */
    setState(newState) {
        // Fusionne l'ancien état avec le nouveau, en ne traitant que les clés fournies.
        if (newState.visual) {
            Object.assign(state.visual, newState.visual);
        }
        if (newState.exercise) {
            Object.assign(state.exercise, newState.exercise);
        }
        
        console.log("État mis à jour. Notification des abonnés...", state);
        
        // Appelle chaque fonction abonnée en lui passant le nouvel état complet.
        subscribers.forEach(callback => callback(state));
    },

    /**
     * Renvoie une copie de l'état actuel pour éviter les modifications directes.
     * @returns {object} L'état actuel de l'application.
     */
    getState() {
        return JSON.parse(JSON.stringify(state)); // Renvoie une copie profonde pour la sécurité
    }
};
