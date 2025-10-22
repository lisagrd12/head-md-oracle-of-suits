// variables globales pour les sons
let son1, son2, son3, son4, son5, son6;

function preload() {
  // load sound library
  soundFormats('mp3', 'wav');
  // load all sound files
  son2 = loadSound('libraries/son-2-anto.mp3');
  son3 = loadSound('libraries/son-3-caca.mp3');
  son4 = loadSound('libraries/son-4-glouglou.mp3');
  son5 = loadSound('libraries/son-5-bijou.mp3');
  son6 = loadSound('libraries/son-6-victory.mp3');
  
  // augmenter le volume de tous les sons
  son2.setVolume(1.0);
  son3.setVolume(1.0);
  son4.setVolume(1.0);
  son5.setVolume(1.0);
  son6.setVolume(1.0);
}

function setup() {
  // full window canvas
  createCanvas(windowWidth, windowHeight);

  // initialize MediaPipe settings
  setupHands();
  // start camera using MediaPipeHands.js helper
  setupVideo();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  // clear the canvas
  background(255);

  // if the video connection is ready
  if (isVideoReady()) {
    // draw the capture image
    image(videoElement, 0, 0);
  }

  // use thicker lines for drawing hand connections
  strokeWeight(2);

  // make sure we have detections to draw
  if (detections) {

    // for each detected hand (use index to read handedness in parallel)
    for (let i = 0; i < detections.multiHandLandmarks.length; i++) {
      const hand = detections.multiHandLandmarks[i];

      // try several possible shapes for handedness info
      const handedObj = (detections.multiHandedness && detections.multiHandedness[i]) || {};
      const handLabel = handedObj.label || (handedObj.classification && handedObj.classification[0] && handedObj.classification[0].label) || 'Right';
      const handSide = handLabel.toLowerCase().includes('left') ? 'left' : 'right';

      // draw fingertip points
      drawTips(hand);

      // --- touch detection: thumb (4) and tips [8,12,16,20] ---
      const thumb = hand[4];
      if (thumb && videoElement) {
        const tips = [
          { id: 8, name: 'index' },
          { id: 12, name: 'middle' },
          { id: 16, name: 'ring' },
          { id: 20, name: 'pinky' }
        ];

        for (let tip of tips) {
          const mark = hand[tip.id];
          if (!mark) continue;
          const dx = (thumb.x - mark.x) * videoElement.width;
          const dy = (thumb.y - mark.y) * videoElement.height;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < TOUCH_THRESHOLD) {
            const key = `${handSide}_${tip.name}`;
            const t = millis();
            if ((t - (lastBeepTimes[key] || 0)) > BEEP_MIN_INTERVAL) {
              
              // jouer les sons spécifiques
              playSpecificSound(handSide, tip.name);
              
              lastBeepTimes[key] = t;
            }
          }

        } // end of tips loop

      } // end of if thumb && videoElement

    } // end of hands loop

  } // end of if detections
  
} // end of draw

// fonction pour jouer le bon son selon la main et le doigt
function playSpecificSound(handSide, finger) {
  let soundToPlay = null;
  let soundName = '';

  if (handSide === 'left') {
    switch(finger) {
      case 'index':
        soundToPlay = son4;
        soundName = 'son-4-glouglou';
        break;
      case 'middle':
        soundToPlay = son2;
        soundName = 'son-2-anto';
        break;
      case 'ring':
        soundToPlay = son3;
        soundName = 'son-3-caca';
        break;
      case 'pinky':
        soundToPlay = son6;
        soundName = 'son-6-victory';
        break;
    }
  } else if (handSide === 'right') {
    switch(finger) {
      case 'index':
        soundToPlay = son5;
        soundName = 'son-5-bijou';
        break;
      case 'middle':
        soundToPlay = son2;
        soundName = 'son-2-anto';
        break;
      case 'ring':
        soundToPlay = son3;
        soundName = 'son-3-caca';
        break;
      case 'pinky':
        soundToPlay = son6;
        soundName = 'son-6-victory';
        break;
    }
  }

  // jouer le son si il existe et est chargé
  if (soundToPlay && soundToPlay.isLoaded()) {
    // arrêter le son s'il joue déjà pour éviter la superposition
    if (soundToPlay.isPlaying()) {
      soundToPlay.stop();
    }
    // augmenter le volume avant de jouer
    soundToPlay.setVolume(2.0);
    soundToPlay.play();
    console.log(`Playing ${soundName} for ${handSide} ${finger}`);
  } else {
    console.log(`${soundName} not loaded yet`);
  }
}

// only the index finger tip landmark
function drawIndex(landmarks) {

  // get the index fingertip landmark
  let mark = landmarks[FINGER_TIPS.index];

  noStroke();
  // set fill color for index fingertip
  fill(0, 50, 50);

  // adapt the coordinates (0..1) to video coordinates
  let x = mark.x * videoElement.width;
  let y = mark.y * videoElement.height;
  circle(x, y, 50);

}

// draw the thumb finger tip landmark
function drawThumb(landmarks) {

  // get the thumb fingertip landmark
  let mark = landmarks[FINGER_TIPS.thumb];

  noStroke();
  // set fill color for thumb fingertip
  fill(255, 0, 0);

  // adapt the coordinates (0..1) to video coordinates
  let x = mark.x * videoElement.width;
  let y = mark.y * videoElement.height;
  circle(x, y, 50);

}

function drawTips(landmarks) {
  noStroke();
  // set fill color for fingertips
  fill(250, 250, 0);

  // fingertip indices
  const tips = [4, 8, 12, 16, 20];

  for (let tipIndex of tips) {
    let mark = landmarks[tipIndex];
    // adapt the coordinates (0..1) to video coordinates
    let x = mark.x * videoElement.width;
    let y = mark.y * videoElement.height;
    circle(x, y, 20);
  }
}

function drawLandmarks(landmarks) {
  noStroke();
  // set fill color for landmarks
  fill(255, 0, 0);

  for (let mark of landmarks) {
    // adapt the coordinates (0..1) to video coordinates
    let x = mark.x * videoElement.width;
    let y = mark.y * videoElement.height;
    circle(x, y, 6);
  }
}

function drawConnections(landmarks) {
  // set stroke color for connections
  stroke(0, 255, 0);

  // iterate through each connection
  for (let connection of HAND_CONNECTIONS) {
    // get the two landmarks to connect
    const a = landmarks[connection[0]];
    const b = landmarks[connection[1]];
    // skip if either landmark is missing
    if (!a || !b) continue;
    // landmarks are normalized [0..1], (x,y) with origin top-left
    let ax = a.x * videoElement.width;
    let ay = a.y * videoElement.height;
    let bx = b.x * videoElement.width;
    let by = b.y * videoElement.height;
    line(ax, ay, bx, by);
  }
}

// small audio + touch detection additions
let lastBeepTimes = {};           // store last play time per hand+finger
const BEEP_MIN_INTERVAL = 500;    // augmenté à 500ms pour éviter la répétition
const TOUCH_THRESHOLD = 40;       // px - distance under which thumb+finger count as "touch"

// frequency map for each finger and each hand side
const FREQUENCIES = {
  right: {
    index: 300,
    middle: 400,
    ring: 500,
    pinky: 600
  },
  left: {
    index: 700,
    middle: 800,
    ring: 900,
    pinky: 1000
  }
};

// simple WebAudio beep with pan and short envelope
function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playTone(freq = 440, pan = 0) {
  initAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const now = audioCtx.currentTime;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const panner = (audioCtx.createStereoPanner) ? audioCtx.createStereoPanner() : null;

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, now);

  // very short attack & release
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.25, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

  if (panner) {
    panner.pan.setValueAtTime(pan, now);
    osc.connect(gain);
    gain.connect(panner);
    panner.connect(audioCtx.destination);
  } else {
    osc.connect(gain);
    gain.connect(audioCtx.destination);
  }

  osc.start(now);
  osc.stop(now + 0.25);
}