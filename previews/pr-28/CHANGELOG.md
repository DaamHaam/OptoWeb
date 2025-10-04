## v0.80 (2025-10-17)

* Multiplication et diversification des pylônes du décor des hauteurs : hauteurs doublées en moyenne, variations de largeur/couleur et ajouts d'arbres supplémentaires pour enrichir l'horizon.
* Réglage plus fin de la vitesse verticale dans l'exercice des hauteurs (pas de 0,2 m/s) et suppression de l'instruction redondante dans l'interface.
* Mise à jour des références de version (interface et cache service worker) en 0.80.

## v0.79 (2025-10-16)

* Les trois couches du flux optique génèrent désormais toutes leurs particules très loin en amont et les laissent traverser l'utilisateur avant recyclage pour éviter toute apparition à bout portant.
* Ajout d'un fondu progressif proche de la caméra afin que les particules disparaissent en douceur une fois qu'elles ont dépassé le patient.
* Mise à jour des références de version (interface et cache service worker) en 0.79.

## v0.78 (2025-10-15)

* Refonte du flux optique pour une immersion immédiate : tunnel aligné sur la caméra, parallax multi-couches, palettes manuelles ou automatiques et purge complète avant régénération pour éviter le retour des sphères optocinétiques.
* Encadrement de l'exercice des hauteurs avec bornes d'altitude, affichage en temps réel et décor animé (piliers lumineux, nuages et vents lointains).
* Ajout de la désinscription des modules visuels inactifs via le `stateManager` et montée de version affichée/service worker en 0.78.

## v0.67 (2025-10-08)

* Remplacement des sphères A-Frame par un nuage instancié de halos billboarding avec shader additif pour réduire les draw calls.
* Portage de l'interpolation de palette directement dans le shader et simplification des mises à jour côté CPU.
* Incrément de la version affichée et du cache applicatif en 0.67.

## v0.66 (2025-10-01)

* Ajout d'un réglage de taille du mot dans le Stroop Test pour adapter l'exercice à l'utilisateur.
* Passage de la version affichée et du cache applicatif en 0.66.

## v0.64 (2025-09-24)

* Harmonisation visuelle des panneaux « Stimulation » et « Exercice » pour une présentation cohérente.
* Suppression de l'espace fantôme du sous-menu d'exercice lorsqu'aucune option n'est sélectionnée.

## v0.63 (2025-09-23)

* Mise à jour des métadonnées pour afficher la version 0.63 dans l'application et le service worker.

## v0.50b (2025-07-15)

- **Correction de Bug:** Les vitesses pour les modules Optocinétique et Flux Optique ne fonctionnaient plus.
- **Cause:** Un conflit existait entre l'ancienne méthode d'initialisation des vitesses (appel direct au module) et la nouvelle (via le `stateManager`). La fonction `setActiveVisualModule` n'avait pas été entièrement mise à jour.
- **Solution:**
  - La fonction `setActiveVisualModule` dans `main.js` a été refactorisée pour réinitialiser les vitesses exclusivement via le `stateManager`.
  - Les anciennes variables de vitesse inutilisées ont été supprimées de `main.js`.
  - Les modules `optokinetic` et `opticalFlow` ont été simplifiés pour accepter les nouvelles valeurs de vitesse sans condition, les rendant plus robustes.