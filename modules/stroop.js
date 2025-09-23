
const DEFAULT_WORD_WIDTH = 6;
const MIN_WORD_WIDTH = 5;
const MAX_WORD_WIDTH = 18;
const STROOP_DISTANCE = 3;
const STROOP_VERTICAL_OFFSET = 0;

const stroopWords = [
    { word: 'ROUGE', color: '#FF0000' },
    { word: 'VERT', color: '#00FF00' },
    { word: 'BLEU', color: '#0000FF' },
    { word: 'JAUNE', color: '#FFFF00' }
];

let stroopInterval;
let textElement;
let rigEl = null;
let cameraEl = null;
let getHorizontalForwardQuaternion;
let getUserReferenceFrame = null;

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

function resolveFrame() {
    let quaternion = null;
    let anchor = null;

    if (getUserReferenceFrame) {
        const frame = getUserReferenceFrame();
        if (frame) {
            if (frame.quaternion) {
                quaternion = frame.quaternion.clone ? frame.quaternion.clone() : frame.quaternion;
            }
            if (frame.worldPosition && rigEl) {
                anchor = frame.worldPosition.clone();
                rigEl.object3D.worldToLocal(anchor);
            } else if (frame.position) {
                anchor = frame.position.clone ? frame.position.clone() : frame.position;
            }
        }
    }

    if (!quaternion && getHorizontalForwardQuaternion) {
        quaternion = getHorizontalForwardQuaternion();
    }

    if ((!anchor || typeof anchor.y !== 'number') && cameraEl && rigEl) {
        const cameraWorld = new THREE.Vector3();
        cameraEl.object3D.getWorldPosition(cameraWorld);
        anchor = cameraWorld.clone();
        rigEl.object3D.worldToLocal(anchor);
    }

    if (anchor && typeof anchor.y === 'number' && cameraEl && rigEl) {
        const cameraWorld = new THREE.Vector3();
        cameraEl.object3D.getWorldPosition(cameraWorld);
        const localCamera = cameraWorld.clone();
        rigEl.object3D.worldToLocal(localCamera);
        anchor.y = localCamera.y;
    }

    return { quaternion, anchor };
}

function positionElement() {
    if (!textElement) return;

    const { quaternion, anchor } = resolveFrame();
    if (!quaternion || !anchor) return;

    const position = new THREE.Vector3(0, STROOP_VERTICAL_OFFSET, -STROOP_DISTANCE);
    position.applyQuaternion(quaternion);
    position.add(anchor);

    textElement.setAttribute('position', `${position.x} ${position.y} ${position.z}`);
    textElement.object3D.setRotationFromQuaternion(quaternion);
}

export const exerciseModule = {
    init(helpers) {
        getHorizontalForwardQuaternion = helpers.getHorizontalForwardQuaternion;
        getUserReferenceFrame = helpers.getUserReferenceFrame || null;
        rigEl = helpers.rigEl || document.querySelector('#rig');
        cameraEl = helpers.cameraEl || document.querySelector('a-camera');

        // Create submenu
        const submenu = document.getElementById('exercise-submenu');
        submenu.innerHTML = `
            <div>
                <label for="stroop-speed-slider">Vitesse (sec)</label>
                <input type="range" id="stroop-speed-slider" min="1" max="5" value="2" step="0.5">
                <span id="stroop-speed-value">2s</span>
            </div>
            <div>
                <label for="stroop-size-slider">Taille du mot</label>
                <input type="range" id="stroop-size-slider" min="${MIN_WORD_WIDTH}" max="${MAX_WORD_WIDTH}" value="${DEFAULT_WORD_WIDTH}" step="0.5">
                <span id="stroop-size-value">100%</span>
            </div>
        `;

        // Create text element
        textElement = document.createElement('a-text');
        textElement.setAttribute('id', 'stroop-text');
        textElement.setAttribute('align', 'center');
        textElement.setAttribute('width', DEFAULT_WORD_WIDTH);
        rigEl.appendChild(textElement);

        positionElement();

        // Set initial state and start interval
        updateStroop();
        let speed = 2000;
        stroopInterval = setInterval(updateStroop, speed);

        // Event listeners for submenu controls
        const speedSlider = document.getElementById('stroop-speed-slider');
        const speedValue = document.getElementById('stroop-speed-value');
        const sizeSlider = document.getElementById('stroop-size-slider');
        const sizeValue = document.getElementById('stroop-size-value');

        const updateSize = (width) => {
            textElement.setAttribute('width', width);
            const percentage = Math.round((width / DEFAULT_WORD_WIDTH) * 100);
            sizeValue.textContent = `${percentage}%`;
        };

        updateSize(DEFAULT_WORD_WIDTH);

        speedSlider.addEventListener('input', (event) => {
            speed = event.target.value * 1000;
            speedValue.textContent = `${event.target.value}s`;
            clearInterval(stroopInterval);
            stroopInterval = setInterval(updateStroop, speed);
        });

        sizeSlider.addEventListener('input', (event) => {
            const newWidth = parseFloat(event.target.value);
            updateSize(newWidth);
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
        getUserReferenceFrame = null;
        rigEl = null;
        cameraEl = null;
    },

    recenter(helpers) {
        getHorizontalForwardQuaternion = helpers.getHorizontalForwardQuaternion;
        if (helpers.getUserReferenceFrame) {
            getUserReferenceFrame = helpers.getUserReferenceFrame;
        }
        positionElement();
    }
};
