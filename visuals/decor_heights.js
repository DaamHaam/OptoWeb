/* /visuals/decor_heights.js */

export const heightsDecorModule = {
    
    decorEntity: null,

    /**
     * Crée le décor (un simple plan jaune) et l'ajoute à la scène.
     * @param {Element} sceneEl - L'élément <a-scene>.
     */
    create(sceneEl) {
        if (this.decorEntity) {
            // Si le décor existe déjà, on ne fait rien.
            return;
        }
        
        this.decorEntity = document.createElement('a-plane');
        this.decorEntity.setAttribute('id', 'heights-decor-plane');
        this.decorEntity.setAttribute('color', 'yellow');
        this.decorEntity.setAttribute('height', '200');
        this.decorEntity.setAttribute('width', '200');
        this.decorEntity.setAttribute('rotation', '-90 0 0');
        this.decorEntity.setAttribute('position', '0 -1.1 -2'); // Positionné sous la plateforme
        
        sceneEl.appendChild(this.decorEntity);
    },

    /**
     * Supprime le décor de la scène.
     */
    cleanup() {
        if (this.decorEntity && this.decorEntity.parentNode) {
            this.decorEntity.parentNode.removeChild(this.decorEntity);
            this.decorEntity = null;
        }
    }
};
