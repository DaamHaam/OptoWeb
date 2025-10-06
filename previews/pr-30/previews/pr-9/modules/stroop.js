
const stroopWords = [
    { word: 'ROUGE', color: '#FF0000' },
    { word: 'VERT', color: '#00FF00' },
    { word: 'BLEU', color: '#0000FF' },
    { word: 'JAUNE', color: '#FFFF00' }
];

let stroopInterval;
let textElement;
let getHorizontalForwardQuaternion;

function getRandomItem(arr, exclude = null) {
    let item;
    do {
        item = arr[Math.floor(Math.random() * arr.length)];
    } while (item === exclude);
    return item;
}

function updateStroop() {
    if (!textElement) return;

    const wordItem = getRandomItem(stroopWords);
    const colorItem = getRandomItem(stroopWords, wordItem);

    textElement.setAttribute('value', wordItem.word);
    textElement.setAttribute('color', colorItem.color);
}

function positionElement() {
    if (!textElement || !getHorizontalForwardQuaternion) return;
    const forwardQuaternion = getHorizontalForwardQuaternion();
    const position = new THREE.Vector3(0, 1.4, -3);
    position.applyQuaternion(forwardQuaternion);
    textElement.setAttribute('position', position);
    textElement.object3D.setRotationFromQuaternion(forwardQuaternion);
}

export const exerciseModule = {
    init(helpers) {
        getHorizontalForwardQuaternion = helpers.getHorizontalForwardQuaternion;
        const rig = document.querySelector('#rig');

        // Create submenu
        const submenu = document.getElementById('exercise-submenu');
        submenu.innerHTML = `
            <div>
                <label for="stroop-speed-slider">Vitesse (sec)</label>
                <input type="range" id="stroop-speed-slider" min="1" max="5" value="2" step="0.5">
                <span id="stroop-speed-value">2s</span>
            </div>
        `;

        // Create text element
        textElement = document.createElement('a-text');
        textElement.setAttribute('id', 'stroop-text');
        textElement.setAttribute('align', 'center');
        textElement.setAttribute('width', '6');
        rig.appendChild(textElement);

        positionElement();

        // Set initial state and start interval
        updateStroop();
        let speed = 2000;
        stroopInterval = setInterval(updateStroop, speed);

        // Event listener for slider
        const speedSlider = document.getElementById('stroop-speed-slider');
        const speedValue = document.getElementById('stroop-speed-value');
        speedSlider.addEventListener('input', (event) => {
            speed = event.target.value * 1000;
            speedValue.textContent = `${event.target.value}s`;
            clearInterval(stroopInterval);
            stroopInterval = setInterval(updateStroop, speed);
        });
    },

    cleanup() {
        clearInterval(stroopInterval);
        if (textElement) {
            textElement.parentNode.removeChild(textElement);
            textElement = null;
        }
        document.getElementById('exercise-submenu').innerHTML = '';
        getHorizontalForwardQuaternion = null;
    },

    recenter(helpers) {
        getHorizontalForwardQuaternion = helpers.getHorizontalForwardQuaternion;
        positionElement();
    }
};
