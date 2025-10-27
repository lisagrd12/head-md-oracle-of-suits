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

  // decrease hit cooldown
  const dtSec = deltaTime ? deltaTime / 1000.0 : 0.016;
  if (hitCooldown > 0) hitCooldown = max(0, hitCooldown - dtSec);

  // si la vidéo est prête, dessine-la en premier
  if (isVideoReady()) {
    image(videoElement, 0, 0);
  }

  // use thicker lines for drawing hand connections
  strokeWeight(2);

  // make sure we have detections to draw
  if (detections) {

    // iterate hands with index so we can read handedness
    for (let i = 0; i < detections.multiHandLandmarks.length; i++) {
      let hand = detections.multiHandLandmarks[i];

      // get handedness label if available (expects MediaPipe result shape)
      let handedness = 'Right';
      if (
        detections.multiHandedness &&
        detections.multiHandedness[i] &&
        detections.multiHandedness[i].classification &&
        detections.multiHandedness[i].classification[0]
      ) {
        handedness = detections.multiHandedness[i].classification[0].label;
      }

      // draw the index finger
      drawIndex(hand);
      // draw the thumb finger
      drawThumb(hand);
      // draw fingertip points
      drawTips(hand);
      // draw connections
      drawConnections(hand);
      // draw all landmarks
      drawLandmarks(hand);

      // handle throw input & sword logic for right hand
      if (handedness === 'Right') {

        // compute some useful points in pixel coordinates
        const ix = hand[8].x * videoElement.width;
        const iy = hand[8].y * videoElement.height;
        const tx = hand[4].x * videoElement.width;
        const ty = hand[4].y * videoElement.height;
        const mx = hand[12].x * videoElement.width;
        const my = hand[12].y * videoElement.height;

        // palm center (same method as drawSword)
        const palmIndices = [0, 5, 9, 13, 17];
        let px = 0, py = 0;
        for (let idx of palmIndices) {
          px += hand[idx].x * videoElement.width;
          py += hand[idx].y * videoElement.height;
        }
        px /= palmIndices.length;
        py /= palmIndices.length;

        // pinch distance between index tip and thumb tip
        const pinchDist = dist(ix, iy, tx, ty);

        // prime when pinch is closed
        if (!swordState.thrown && pinchDist < PINCH_CLOSE) {
          swordState.primed = true;
        }

        // if primed and user opens pinch -> launch
        if (!swordState.thrown && swordState.primed && pinchDist > PINCH_OPEN) {
          // compute throw direction from palm toward (index+middle) average
          const targetX = (ix + mx) / 2;
          const targetY = (iy + my) / 2;
          let dir = createVector(targetX - px, targetY - py);
          if (dir.mag() < 1) dir = createVector(1, 0);
          dir.normalize();

          // reference distance to scale speed (wrist to mid-finger)
          const wristX = hand[0].x * videoElement.width;
          const wristY = hand[0].y * videoElement.height;
          const reference = dist(wristX, wristY, (mx + ix) / 2, (my + iy) / 2);

          // init thrown state
          swordState.attached = false;
          swordState.primed = false;
          swordState.thrown = true;
          swordState.returning = false;
          swordState.pos = createVector(px, py);
          swordState.vel = dir.mult(max(8, reference * 0.2)); // tweak multiplier for speed
          swordState.spin = random(-0.6, 0.6);
          swordState.angle = atan2(swordState.vel.y, swordState.vel.x);
          swordState.timeSinceThrow = 0;
        }

        // allow manual recall: if sword is thrown and palm gets near sword -> reattach
        if (swordState.thrown) {
          if (swordState.pos && dist(swordState.pos.x, swordState.pos.y, px, py) < 80) {
            // attach back
            swordState.attached = true;
            swordState.thrown = false;
            swordState.returning = false;
            swordState.pos = null;
            swordState.vel = null;
            swordState.angle = 0;
            swordState.spin = 0;
            swordState.timeSinceThrow = 0;
          }
        }

        // call drawSword with hand landmarks to allow attachment when available
        drawSword(hand);
      } else {
        // for non-right hands, still draw default sword if needed
        drawSword(hand);
      }

    } // end of hands loop

  } // end of if detections

  // --- draw score LAST so it's visible above the video ---
  push();
  noStroke();
  fill(0, 160);
  rect(width/2 - 160, 8, 320, 30, 6);
  fill(255);
  textSize(16);
  textAlign(CENTER, CENTER);
  text(`Right: ${score.Right}   —   Left: ${score.Left}`, width/2, 22);
  pop();

} // end of draw


// only the index finger tip landmark
function drawIndex(landmarks) {

  // get the index fingertip landmark
  let mark = landmarks[FINGER_TIPS.index];

  noStroke();
  // set fill color for index fingertip
  fill(0, 255, 255);

  // adapt the coordinates (0..1) to video coordinates
  let x = mark.x * videoElement.width;
  let y = mark.y * videoElement.height;
  circle(x, y, 20);

}


// draw the thumb finger tip landmark
function drawThumb(landmarks) {

  // get the thumb fingertip landmark
  let mark = landmarks[FINGER_TIPS.thumb];

  noStroke();
  // set fill color for thumb fingertip
  fill(255, 255, 0);

  // adapt the coordinates (0..1) to video coordinates
  let x = mark.x * videoElement.width;
  let y = mark.y * videoElement.height;
  circle(x, y, 20);

}

function drawTips(landmarks) {

  noStroke();
  // set fill color for fingertips
  fill(0, 0, 255);

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

// NEW: background music (place medieval.mp3 at c:\Users\girau\Downloads\Hands\Hands\libraries\medieval.mp3)
let ambientSound = null;
let musicEnabled = false;
const MUSIC_PATH = 'libraries/medieval.mp3';

function preload() {
  // ensure p5.sound is loaded in your HTML; load the file from libraries folder
  soundFormats('mp3');
  ambientSound = loadSound(MUSIC_PATH, () => {
    ambientSound.setLoop(true);
    ambientSound.setVolume(0.5);
  }, (err) => {
    console.warn('Failed to load ambient sound:', MUSIC_PATH, err);
  });
}

// user gesture required by browsers to start audio — click/tap canvas or press "M"
function startAmbient() {
  if (!ambientSound) return;
  if (getAudioContext && getAudioContext().state !== 'running') {
    // resume audio context on first user gesture
    getAudioContext().resume().then(() => {
      if (!ambientSound.isPlaying()) ambientSound.loop();
      musicEnabled = true;
    });
  } else {
    if (!ambientSound.isPlaying()) ambientSound.loop();
    musicEnabled = true;
  }
}

function mousePressed() {
  // start music on first click
  startAmbient();
}

function keyPressed() {
  // toggle music with M key
  if (key === 'm' || key === 'M') {
    if (!ambientSound) return;
    if (ambientSound.isPlaying()) {
      ambientSound.pause();
      musicEnabled = false;
    } else {
      startAmbient();
    }
  }
}

// new globals for sword throw logic
let swordState = {
  attached: true,    // true = attached to right hand
  primed: false,     // true while pinch is held (pre-throw)
  thrown: false,     // true while sword is in flight
  returning: false,  // true while sword is homing back
  pos: null,         // p5.Vector position when thrown
  vel: null,         // p5.Vector velocity when thrown
  angle: 0,
  spin: 0,
  timeSinceThrow: 0,
  owner: 'Right',     // default owner is Right hand
  bladeLen: 0,
  tipOffset: 0
};

// thresholds (pixels)
const PINCH_CLOSE = 30;
const PINCH_OPEN = 60;
const THROW_AUTORETURN_TIME = 2.0; // seconds before auto-return

// modified: draw a sword attached to the palm of the detected right hand,
//            and render/update it when thrown
function drawSword(landmarks) {
  // compute palm center as average of wrist and MCP joints
  const palmIndices = [0, 5, 9, 13, 17];
  let px = 0, py = 0;
  for (let idx of palmIndices) {
    px += landmarks[idx].x * videoElement.width;
    py += landmarks[idx].y * videoElement.height;
  }
  px /= palmIndices.length;
  py /= palmIndices.length;

  // direction: average between index tip and middle tip
  const ix = landmarks[8].x * videoElement.width;
  const iy = landmarks[8].y * videoElement.height;
  const mx = landmarks[12].x * videoElement.width;
  const my = landmarks[12].y * videoElement.height;
  const dirX = (ix + mx) / 2 - px;
  const dirY = (iy + my) / 2 - py;

  // angle to rotate the sword so it points outward from the palm
  const handAngle = atan2(dirY, dirX);

  // reference distance to scale sword size (wrist to middle tip)
  const wristX = landmarks[0].x * videoElement.width;
  const wristY = landmarks[0].y * videoElement.height;
  const reference = dist(wristX, wristY, (mx + ix) / 2, (my + iy) / 2);

  // sword dimensions (tweak multipliers to taste)
  const handleLen = max(12, reference * 0.8);
  const bladeLen = max(40, reference * 2.0);
  const bladeW = max(6, reference * 0.12);
  const tipOffsetLocal = bladeLen + bladeW * 1.4; // local offset from sword origin to tip

  // store blade length & tip offset so collision checks can use them
  swordState.bladeLen = bladeLen;
  swordState.tipOffset = tipOffsetLocal;

  // update thrown sword physics if in flight
  if (swordState.thrown && swordState.pos && swordState.vel) {
    // time step
    const dt = deltaTime ? deltaTime / 1000.0 : 0.016;
    swordState.timeSinceThrow += dt;

    // simple gravity
    const gravity = createVector(0, 300 * dt); // scaled to pixels/sec^2
    swordState.vel.add(gravity);

    // update position
    swordState.pos.add(p5.Vector.mult(swordState.vel, dt * 60)); // normalize by framerate approx

    // rotation follows velocity + spin
    swordState.angle = atan2(swordState.vel.y, swordState.vel.x) + swordState.spin * (swordState.timeSinceThrow + 0.2);

    // auto-return after timeout
    if (!swordState.returning && swordState.timeSinceThrow > THROW_AUTORETURN_TIME) {
      swordState.returning = true;
    }

    // if returning, steer toward current palm
    if (swordState.returning) {
      const target = createVector(px, py);
      const toTarget = p5.Vector.sub(target, swordState.pos);
      const distToPalm = toTarget.mag();
      if (distToPalm > 8) {
        toTarget.normalize();
        // faster homing speed
        swordState.vel = p5.Vector.lerp(swordState.vel, toTarget.mult(max(6, reference * 0.2)), 0.2);
      } else {
        // attach when close (safety)
        swordState.attached = true;
        swordState.thrown = false;
        swordState.returning = false;
        swordState.pos = null;
        swordState.vel = null;
        swordState.angle = 0;
        swordState.spin = 0;
        swordState.timeSinceThrow = 0;
      }
    }

    // --- COLLISION: check tip against opponent hands when sword is in flight ---
    if (detections && hitCooldown <= 0) {
      // compute tip world position
      const tipDir = p5.Vector.fromAngle(swordState.angle);
      const tipWorld = p5.Vector.add(swordState.pos.copy(), tipDir.mult(swordState.tipOffset));

      // iterate detected hands and test landmarks
      for (let h = 0; h < (detections.multiHandLandmarks || []).length; h++) {
        // determine handedness label for this hand
        let otherLabel = null;
        if (detections.multiHandedness && detections.multiHandedness[h] && detections.multiHandedness[h].classification && detections.multiHandedness[h].classification[0]) {
          otherLabel = detections.multiHandedness[h].classification[0].label;
        }
        // skip if same side as sword owner
        if (otherLabel === swordState.owner) continue;

        const otherLandmarks = detections.multiHandLandmarks[h];
        // test all landmarks (you can restrict to fingertips if desired)
        for (let lm of otherLandmarks) {
          const lx = lm.x * videoElement.width;
          const ly = lm.y * videoElement.height;
          if (dist(tipWorld.x, tipWorld.y, lx, ly) < HIT_RADIUS) {
            // register hit for owner
            if (swordState.owner && score[swordState.owner] !== undefined) {
              score[swordState.owner] += 1;
            }
            // start cooldown and make sword return
            hitCooldown = HIT_COOLDOWN_TIME;
            swordState.returning = true;
            // optionally attach quicker when hit
            swordState.timeSinceThrow = THROW_AUTORETURN_TIME + 0.1;
            break;
          }
        }
        if (hitCooldown > 0) break;
      }
    }

    // draw thrown sword at its world position
    push();
    translate(swordState.pos.x, swordState.pos.y);
    rotate(swordState.angle);

    noStroke();
    // handle (grip)
    fill(80, 40, 20);
    rect(-handleLen, -bladeW * 0.8, handleLen, bladeW * 1.6, 4);

    // guard
    fill(150, 110, 30);
    rect(-6, -bladeW * 1.2, 12, bladeW * 2.4, 3);

    // blade main body
    fill(200);
    rect(0, -bladeW * 0.45, bladeLen, bladeW * 0.9);

    // lighter edge
    fill(240);
    rect(bladeLen * 0.4, -bladeW * 0.2, bladeLen * 0.6, bladeW * 0.4);

    // tip
    fill(220);
    triangle(bladeLen, -bladeW, bladeLen + bladeW * 1.4, 0, bladeLen, bladeW);

    // subtle outline
    stroke(40, 40, 40, 120);
    strokeWeight(1);
    noFill();
    line(0, -bladeW * 0.45, bladeLen + bladeW * 1.2, 0);
    line(0, bladeW * 0.45, bladeLen + bladeW * 1.2, 0);

    pop();

    return;
  }

  // if attached (default): draw at palm and keep state position updated
  if (swordState.attached) {
    swordState.pos = createVector(px, py);
    swordState.angle = handAngle;
  }

  push();
  translate(px, py);
  rotate(handAngle);

  noStroke();
  // handle (grip) behind the palm
  fill(80, 40, 20);
  rect(-handleLen, -bladeW * 0.8, handleLen, bladeW * 1.6, 4);

  // guard
  fill(150, 110, 30);
  rect(-6, -bladeW * 1.2, 12, bladeW * 2.4, 3);

  // blade main body
  fill(200);
  rect(0, -bladeW * 0.45, bladeLen, bladeW * 0.9);

  // lighter edge
  fill(240);
  rect(bladeLen * 0.4, -bladeW * 0.2, bladeLen * 0.6, bladeW * 0.4);

  // tip
  fill(220);
  triangle(bladeLen, -bladeW, bladeLen + bladeW * 1.4, 0, bladeLen, bladeW);

  // subtle outline
  stroke(40, 40, 40, 120);
  strokeWeight(1);
  noFill();
  // outline blade
  line(0, -bladeW * 0.45, bladeLen + bladeW * 1.2, 0);
  line(0, bladeW * 0.45, bladeLen + bladeW * 1.2, 0);

  pop();
}

// scoring / hit globals (fix ReferenceError)
let score = { Right: 0, Left: 0 };
let hitCooldown = 0; // seconds remaining before next hit can count
const HIT_COOLDOWN_TIME = 0.5; // seconds
const HIT_RADIUS = 24; // pixels threshold for tip touching a hand
