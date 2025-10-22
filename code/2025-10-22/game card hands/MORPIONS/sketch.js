let paintLayer;
let lastPaintPosLeft = null;
let lastPaintPosRight = null;
const BRUSH_SIZE = 10; // pixels
const ERASER_SIZE = 140; // pixels
const PINCH_THRESHOLD_RATIO = 0.04; // relative to video width
// ajout du cadrage (2 lignes verticales, 2 lignes horizontales)
const GRID_LINES_X = 2;
const GRID_LINES_Y = 2;

// --- audio / son pour le pinch (index + pouce) ---
let audioCtx = null;
let leftOsc = null;
let rightOsc = null;
let leftGain = null;
let rightGain = null;
let leftPlaying = false;
let rightPlaying = false;

function ensureAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function startTone(hand) {
  ensureAudio();
  // resume context if suspended (browsers require a user gesture sometimes)
  if (audioCtx.state === 'suspended') audioCtx.resume();

  if (hand === 'left' && !leftPlaying) {
    leftOsc = audioCtx.createOscillator();
    leftGain = audioCtx.createGain();
    leftOsc.type = 'sine';
    leftOsc.frequency.value = 220; // A3 - lower tone for left
    leftGain.gain.setValueAtTime(0, audioCtx.currentTime);
    leftOsc.connect(leftGain);
    leftGain.connect(audioCtx.destination);
    leftOsc.start();
    // fade in
    leftGain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.02);
    leftPlaying = true;


  } else if (hand === 'right' && !rightPlaying) {
    rightOsc = audioCtx.createOscillator();
    rightGain = audioCtx.createGain();
    rightOsc.type = 'sine';
    rightOsc.frequency.value = 480; // A5 - higher tone for right
    rightGain.gain.setValueAtTime(0, audioCtx.currentTime);
    rightOsc.connect(rightGain);
    rightGain.connect(audioCtx.destination);
    rightOsc.start();
    // fade in
    rightGain.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 0.02);
    rightPlaying = true;
  }
}

function stopTone(hand) {
  if (!audioCtx) return;
  if (hand === 'left' && leftPlaying && leftGain && leftOsc) {
    // fade out then stop
    leftGain.gain.cancelScheduledValues(audioCtx.currentTime);
    leftGain.gain.linearRampToValueAtTime(0.0, audioCtx.currentTime + 0.05);
    // stop and clean after short delay
    setTimeout(() => {
      try { leftOsc.stop(); } catch(e) {}
      leftOsc.disconnect();
      leftGain.disconnect();
      leftOsc = null;
      leftGain = null;
      leftPlaying = false;
    }, 80);
  } else if (hand === 'right' && rightPlaying && rightGain && rightOsc) {
    rightGain.gain.cancelScheduledValues(audioCtx.currentTime);
    rightGain.gain.linearRampToValueAtTime(0.0, audioCtx.currentTime + 0.05);
    setTimeout(() => {
      try { rightOsc.stop(); } catch(e) {}
      rightOsc.disconnect();
      rightGain.disconnect();
      rightOsc = null;
      rightGain = null;
      rightPlaying = false;
    }, 80);
  }
}


function setup() {

  // full window canvas
  createCanvas(windowWidth, windowHeight);

  // create a persistent painting layer (keeps strokes between frames)
  paintLayer = createGraphics(windowWidth, windowHeight);
  paintLayer.clear();

  // initialize MediaPipe settings
  setupHands();
  // start camera using MediaPipeHands.js helper
  setupVideo();

}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  // preserve and scale the painting layer when window resizes
  let newLayer = createGraphics(windowWidth, windowHeight);
  newLayer.clear();
  newLayer.image(paintLayer, 0, 0, windowWidth, windowHeight);
  paintLayer = newLayer;
}


function draw() {
  // clear the canvas
  background(255);

  // if the video connection is ready
  if (isVideoReady()) {
    // draw the capture image
    image(videoElement, 0, 0);
  }

  // draw the persistent painting layer on top of the video
  image(paintLayer, 0, 0);

  // draw grid overlay sized to the video element
  if (isVideoReady()) {
    // video is drawn at 0,0 in this sketch — use its size for the grid
    drawGridToRect(GRID_LINES_X, GRID_LINES_Y, 0, 0, videoElement.width, videoElement.height);
  } else {
    // fallback to full window
    drawGridToRect(GRID_LINES_X, GRID_LINES_Y, 0, 0, width, height);
  }

  // use thicker lines for drawing hand connections
  strokeWeight(2);

  // make sure we have detections to draw
  if (detections) {

    // for each detected hand (use index to match handedness)
    for (let i = 0; i < detections.multiHandLandmarks.length; i++) {
      const hand = detections.multiHandLandmarks[i];

      // robustly get handedness label (various Mediapipe result shapes)
      const handednessInfo = detections.multiHandedness && detections.multiHandedness[i];
      let handLabel = 'Unknown';
      if (handednessInfo) {
        handLabel = handednessInfo.label || (handednessInfo.classification && handednesInfo.classification?.[0]?.label) || handLabel;
      }
      handLabel = String(handLabel).toLowerCase();

      // draw the index finger
      drawIndex(hand);
      // draw the thumb finger
      drawThumb(hand);
      // draw fingertip points
      //drawTips(hand);
      // draw connections
      //drawConnections(hand);
      // draw all landmarks
      //drawLandmarks(hand);

      // ----- Finger paint / erase logic -----
      // Use pinch (index tip + thumb tip close together) to act
      const indexMark = hand[8]; // index fingertip
      const thumbMark = hand[4]; // thumb fingertip
      if (indexMark && thumbMark) {
        // convert normalized coords to pixels
        const ix = indexMark.x * videoElement.width;
        const iy = indexMark.y * videoElement.height;
        const tx = thumbMark.x * videoElement.width;
        const ty = thumbMark.y * videoElement.height;

        const dx = ix - tx;
        const dy = iy - ty;
        const dist = Math.sqrt(dx*dx + dy*dy);

        // threshold based on video width to be resolution independent
        const threshold = Math.max(12, videoElement.width * PINCH_THRESHOLD_RATIO);

        if (dist < threshold) {
          // start tone for this hand when pinch begins
          if (handLabel.includes('left')) startTone('left');
          if (handLabel.includes('right')) startTone('right');

          if (handLabel.includes('left')) {
            // LEFT HAND = PAINT
            paintLayer.noStroke();
            paintLayer.fill(255, 0, 150, 220);
            if (lastPaintPosLeft) {
              paintLayer.stroke(255, 0, 150, 220);
              paintLayer.strokeWeight(BRUSH_SIZE * 0.8);
              paintLayer.line(lastPaintPosLeft.x, lastPaintPosLeft.y, ix, iy);
              paintLayer.noStroke();
            } else {
              paintLayer.ellipse(ix, iy, BRUSH_SIZE, BRUSH_SIZE);
            }
            lastPaintPosLeft = { x: ix, y: iy };
          } else if (handLabel.includes('right')) {
            // RIGHT HAND = ERASER
            // use erase() to remove from persistent layer
            paintLayer.erase(255, 255); // enable erase (alpha arguments optional)
            if (lastPaintPosRight) {
              paintLayer.strokeWeight(ERASER_SIZE);
              paintLayer.line(lastPaintPosRight.x, lastPaintPosRight.y, ix, iy);
            } else {
              paintLayer.ellipse(ix, iy, ERASER_SIZE, ERASER_SIZE);
            }
            paintLayer.noErase();
            lastPaintPosRight = { x: ix, y: iy };
          } else {
            // unknown handedness: default to paint (backwards-compatible)
            paintLayer.noStroke();
            paintLayer.fill(255, 0, 150, 220);
            if (lastPaintPosLeft) {
              paintLayer.stroke(255, 0, 150, 220);
              paintLayer.strokeWeight(BRUSH_SIZE * 0.8);
              paintLayer.line(lastPaintPosLeft.x, lastPaintPosLeft.y, ix, iy);
              paintLayer.noStroke();
            } else {
              paintLayer.ellipse(ix, iy, BRUSH_SIZE, BRUSH_SIZE);
            }
            lastPaintPosLeft = { x: ix, y: iy };
          }
        } else {
          // not pinching: reset last paint position(s) for this hand
          if (handLabel.includes('left') || handLabel === 'unknown') {
            lastPaintPosLeft = null;
            stopTone('left');
          }
          if (handLabel.includes('right') || handLabel === 'unknown') {
            lastPaintPosRight = null;
            stopTone('right');
          }
        }
      }

    } // end of hands loop

  } // end of if detections
  
} // end of draw


// only the index finger tip landmark
function drawIndex(landmarks) {

  // get the index fingertip landmark
  let mark = landmarks[FINGER_TIPS.index];

  noStroke();
  // set fill color for index fingertip
  fill(255, 0, 0);

  // adapt the coordinates (0..1) to video coordinates
  let x = mark.x * videoElement.width;
  let y = mark.y * videoElement.height;
  circle(x, y, 30);

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
  circle(x, y, 30);

}

function drawTips(landmarks) {

  noStroke();
  // set fill color for fingertips
  fill(255, 255, 0);

  // fingertip indices
  const tips = [4, 8, 12, 16, 20];

  for (let tipIndex of tips) {
    let mark = landmarks[tipIndex];
    // adapt the coordinates (0..1) to video coordinates
    let x = mark.x * videoElement.width;
    let y = mark.y * videoElement.height;
    circle(x, y, 10);
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
  stroke(255, 0, 0);

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

// dessine une grille avec `linesX` lignes verticales et `linesY` lignes horizontales
// à l'intérieur du rectangle (x,y,w,h) — utile pour caler la grille à la taille de videoElement
function drawGridToRect(linesX, linesY, x, y, w, h) {
  push();
  // semi-transparent grid style
  stroke(0, 0, 0, 120);
  // adapt stroke weight to rectangle size so lines look consistent
  const base = Math.min(w, h);
  strokeWeight(max(1, Math.floor(base * 0.01)));
  noFill();

  // vertical lines
  for (let i = 1; i <= linesX; i++) {
    const lx = x + (i * w) / (linesX + 1);
    line(lx, y, lx, y + h);
  }

  // horizontal lines
  for (let j = 1; j <= linesY; j++) {
    const ly = y + (j * h) / (linesY + 1);
    line(x, ly, x + w, ly);
  }
  pop();
}
