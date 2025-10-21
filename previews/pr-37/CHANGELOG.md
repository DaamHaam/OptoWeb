## v0.89 (2025-10-24)

* Détection automatique de l'Oculus Quest avec affichage du statut dans la console et vitesse optocinétique initialisée à 5°/s pour faciliter les tests sur casque autonome.
* Remappage des contrôleurs : le clic du joystick droit passe à la stimulation suivante, les boutons B/X/Y et le joystick gauche restent disponibles avec un seuil réduit pour déclencher plus facilement les déplacements.
* Mise en double face des halos optocinétiques afin de vérifier l'affichage à 360° pendant l'investigation des soucis de billboard sur Quest.
* Mise à jour des références de version de l'application et du service worker en 0.89.

## v0.88 (2025-10-23)

* Horizon des hauteurs élargi avec un disque de sol plus vaste et des terrasses étagées plus larges pour accentuer la sensation de profondeur.
* Ajout de chaînes montagneuses lointaines plus hautes avec sommets enneigés et nouveaux reliefs visibles même en décor épuré.
* Meilleure répartition des éléments en mode épuré grâce à des tours, arbres et piliers supplémentaires autour de la plateforme.
* Nouveau sélecteur d'ambiance de couleur directement dans les réglages des hauteurs.

## v0.87 (2025-10-22)

* Harmonisation complète des couleurs des hauteurs avec les palettes optocinétiques et recoloration dynamique de la plateforme.
* Ajout de nouvelles tours proches/lointaines, de montagnes agrandies et d'éléments éloignés plus variés pour renforcer la sensation d'ascension.

## v0.86 (2025-10-22)

* Le flux optique affiche désormais un paquet de particules proches dès le lancement et ne recycle les points qu'une fois passés derrière l'utilisateur, pour que la direction soit immédiatement lisible.
* L'accélération lors des changements de vitesse du flux optique devient plus vive afin de répondre plus rapidement aux commandes.
* Le bouton « Recentrer » aligne le flux optique sur l'orientation actuelle du casque tout en conservant la vitesse du mouvement.
* Mise à jour des références de version (interface et cache service worker) en 0.86.

## v0.85 (2025-10-21)

* Refonte du mapping des manettes Oculus Touch : A et clic joystick droit recentrent, B stoppe la rotation et X/Y ajustent la vitesse verticale.
* Mise à jour des références de version (interface et cache service worker) en 0.85.

## v0.83 (2025-10-20)

* Ajout du mapping des manettes Oculus Touch : le joystick ajuste les vitesses de l'optocinétique et les boutons A/X recentrent tandis que B/Y arrêtent la rotation.
* Mise à jour des références de version (interface et cache service worker) en 0.83.

## v0.82 (2025-10-19)

* Ajout d'espaces tampons dans les panneaux mobiles pour que les curseurs, sélecteurs et boutons restent visibles au-dessus du bandeau de contrôle Recentrer.
* Retour à un défilement global des panneaux de stimulation/exercice sur smartphone avec davantage de marge basse pour atteindre l'intégralité des options.
* Mise à jour des références de version (interface et cache service worker) en 0.82.

## v0.81 (2025-10-18)

* Rétablissement du défilement sur mobile pour les panneaux Stimulation et Exercice afin d'accéder aux réglages des modules Flux optique et Hauteurs.
* Suppression de l'ancien exercice "Cube Rotatif" et retrait des contrôles/ressources associés.
* Mise à jour des références de version (interface et cache service worker) en 0.81.

## v0.80 (2025-10-17)

* Multiplication et diversification des pylônes du décor des hauteurs : hauteurs doublées en moyenne, variations de largeur/couleur et ajouts d'arbres supplémentaires pour enrichir l'horizon.
* Réglage plus fin de la vitesse verticale dans l'exercice des hauteurs (pas de 0,2 m/s) et suppression de l'instruction redondante dans l'interface.
* Mise à jour des références de version (interface et cache service worker) en 0.80.
* Correction du scintillement des renforts verticaux des pylônes en reculant légèrement leur géométrie pour éviter le z-fighting.
* Ajout d'un sélecteur dans les contrôles des hauteurs pour réduire la plateforme de moitié sans déplacer son centre.

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