// /modules/goNoGo.js
export const exerciseModule = {
    // --- State ---
    isActive: false,
    score: 0,
    stimulusTimer: null,
    exerciseTimer: null,
    countdownInterval: null,
    spawnCenter: null,
    spawnHeight: 1.6,

    // --- DOM Elements (passed from main.js) ---
    rigEl: null,
    cameraEl: null,
    exerciseSubmenu: null,
    scoreElement: null,
    countdownElement: null,
    startButton: null,
    pointer: null,

    // --- Helpers (passed from main.js) ---
    getHorizontalForwardQuaternion: null,

    init: function(helpers) {
        // Store helpers and DOM elements
        this.rigEl = helpers.rigEl;
        this.cameraEl = helpers.cameraEl;
        this.exerciseSubmenu = helpers.exerciseSubmenu;
        this.getHorizontalForwardQuaternion = helpers.getHorizontalForwardQuaternion;

        // Create UI
        this.exerciseSubmenu.classList.add('submenu--go-nogo');
        this.exerciseSubmenu.innerHTML = `
            <div class="gonogo-grid">
                <div class="submenu-field">
                    <label for="go-nogo-duration">Durée exercice</label>
                    <select id="go-nogo-duration">
                        <option value="30">30s</option>
                        <option value="60">1m</option>
                        <option value="120">2m</option>
                        <option value="180">3m</option>
                        <option value="240">4m</option>
                        <option value="300">5m</option>
                    </select>
                </div>
                <div class="submenu-field">
                    <label for="go-nogo-stimulus-duration">Délai cible</label>
                    <select id="go-nogo-stimulus-duration">
                        <option value="2000">Lente (2s)</option>
                        <option value="1500" selected>Normale (1.5s)</option>
                        <option value="1000">Rapide (1s)</option>
                    </select>
                </div>
                <div class="submenu-field">
                    <label for="go-nogo-amplitude">Amplitude</label>
                    <select id="go-nogo-amplitude">
                        <option value="20">20°</option>
                        <option value="30">30°</option>
                        <option value="40">40°</option>
                    </select>
                </div>
                <div class="submenu-field">
                    <label for="gonogo-ratio">Ratio Go/No-Go</label>
                    <select id="gonogo-ratio">
                        <option value="0.8" selected>80% Go</option>
                        <option value="0.6">60% Go</option>
                        <option value="0.4">40% Go</option>
                        <option value="0.2">20% Go</option>
                    </select>
                </div>
                <div class="submenu-field submenu-field--wide">
                    <label for="gonogo-size">Taille Cibles</label>
                    <select id="gonogo-size">
                        <option value="0.15">Petite</option>
                        <option value="0.2" selected>Moyenne</option>
                        <option value="0.3">Grande</option>
                    </select>
                </div>
            </div>
            <div class="gonogo-status">
                <div class="status-tile">
                    <span class="status-label">Score</span>
                    <span id="go-nogo-score" class="status-value">0</span>
                </div>
                <div class="status-tile">
                    <span class="status-label">Temps restant</span>
                    <span id="go-nogo-countdown" class="status-value">--</span>
                </div>
            </div>
            <button id="go-nogo-start">Démarrer</button>`;

        // Get new DOM elements
        this.scoreElement = document.getElementById('go-nogo-score');
        this.countdownElement = document.getElementById('go-nogo-countdown');
        this.startButton = document.getElementById('go-nogo-start');

        // Add event listeners
        this.startButton.addEventListener('click', () => {
            if (this.isActive) { this.stop(); } else { this.start(); }
            this.startButton.blur();
        });

        const selects = this.exerciseSubmenu.querySelectorAll('select');
        selects.forEach(select => select.addEventListener('change', () => select.blur()));
    },

    cleanup: function() {
        this.stop();
        this.exerciseSubmenu.classList.remove('submenu--go-nogo');
        this.exerciseSubmenu.innerHTML = '';
    },

    start: function() {
        this.isActive = true;
        this.score = 0;
        this.updateScore();
        this.startButton.textContent = "Arrêter";
        this.exerciseSubmenu.querySelectorAll('select').forEach(s => s.disabled = true);

        this.spawnCenter = this.getHorizontalForwardQuaternion();
        this.spawnHeight = this.cameraEl.object3D.position.y;

        this.pointer = document.createElement('a-sphere');
        this.pointer.setAttribute('position', '0 0 -3.75');
        this.pointer.setAttribute('radius', '0.03');
        this.pointer.setAttribute('color', 'red');
        this.cameraEl.appendChild(this.pointer);
        this.cameraEl.setAttribute('raycaster', 'objects: .stimulus; far: 10;');

        const duration = document.getElementById('go-nogo-duration').value;
        this.startCountdown(duration);
        this.exerciseTimer = setTimeout(() => this.stop(), duration * 1000);
        this.scheduleNextStimulus();
    },

    stop: function() {
        this.isActive = false;
        this.spawnCenter = null;
        clearTimeout(this.stimulusTimer);
        clearTimeout(this.exerciseTimer);
        clearInterval(this.countdownInterval);
        if (this.pointer && this.pointer.parentNode) {
            this.pointer.parentNode.removeChild(this.pointer);
            this.pointer = null;
        }
        this.cameraEl.removeAttribute('raycaster');
        document.querySelectorAll('.stimulus').forEach(el => el.parentNode.removeChild(el));
        if (this.startButton) this.startButton.textContent = "Démarrer";
        if (this.countdownElement) this.countdownElement.textContent = "--";
        this.exerciseSubmenu.querySelectorAll('select').forEach(s => s.disabled = false);
    },

    startCountdown: function(seconds) {
        let remaining = seconds;
        this.countdownElement.textContent = `${remaining}s`;
        this.countdownInterval = setInterval(() => {
            remaining--;
            this.countdownElement.textContent = `${remaining}s`;
            if (remaining <= 0) {
                clearInterval(this.countdownInterval);
            }
        }, 1000);
    },

    scheduleNextStimulus: function() {
        if (!this.isActive) return;
        this.stimulusTimer = setTimeout(() => this.spawnStimulus(), 500 + Math.random() * 1000);
    },

    spawnStimulus: function() {
        if (!this.isActive || !this.spawnCenter) return;

        const ratio = parseFloat(document.getElementById('gonogo-ratio').value);
        const radius = parseFloat(document.getElementById('gonogo-size').value);
        const stimulusDuration = parseInt(document.getElementById('go-nogo-stimulus-duration').value, 10);

        const isGo = Math.random() < ratio;
        const color = isGo ? 'green' : 'red';
        const stimulus = document.createElement('a-sphere');
        stimulus.classList.add('stimulus');
        stimulus.setAttribute('color', color);
        stimulus.setAttribute('radius', radius);

        const amplitude = document.getElementById('go-nogo-amplitude').value;
        const angleY = (Math.random() - 0.5) * THREE.MathUtils.degToRad(amplitude);
        const angleX = (Math.random() - 0.5) * THREE.MathUtils.degToRad(amplitude);

        const position = new THREE.Vector3(0, 0, -4);
        const randomRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(angleX, angleY, 0, 'YXZ'));
        position.applyQuaternion(randomRotation);
        position.applyQuaternion(this.spawnCenter);
        position.y += this.spawnHeight;

        stimulus.setAttribute('position', position);
        this.rigEl.appendChild(stimulus);

        stimulus.addEventListener('raycaster-intersected', () => { if (this.isActive) this.onHit(stimulus, isGo); });
        setTimeout(() => { if (stimulus.parentNode) stimulus.parentNode.removeChild(stimulus); }, stimulusDuration);
        this.scheduleNextStimulus();
    },

    onHit: function(stimulus, isGo) {
        if (!stimulus.parentNode) return;
        this.updateScore(isGo ? 10 : -15);
        stimulus.setAttribute('animation', isGo ? 'property: scale; to: 1.5 1.5 1.5; dur: 100;' : 'property: components.material.material.color; type: color; from: red; to: white; dur: 200; loop: 2');
        setTimeout(() => { if(stimulus.parentNode) stimulus.parentNode.removeChild(stimulus); }, 200);
    },

    updateScore: function(change = 0) {
        this.score += change;
        if (this.scoreElement) this.scoreElement.textContent = this.score;
    },

    recenter: function(helpers) {
        this.getHorizontalForwardQuaternion = helpers.getHorizontalForwardQuaternion;
        if (this.isActive) {
            this.spawnCenter = this.getHorizontalForwardQuaternion();
        }
    }
};