/**
 * Slot Machine variables
 */
const iconMap = ["image/1.png", "image/2.png", "image/3.png", "image/4.png", "image/5.png", "image/6.png", "image/7.png", "image/8.png"];
const iconWidth = 79;
const iconHeight = 79;
const numIcons = 8;
const timePerIcon = 100;

let slotReels = [];
let indexes = [0, 0, 0];
let isRolling = false;
let winState = null;
let winTimer = 0;
let iconImages = [];
let imagesLoaded = false;

// Hand gesture control
let previousHandY = null;
let handGestureActive = false;
let gestureThreshold = 50;
let canTrigger = true;

// Win probability system - 2 to 6 attempts to win
let attemptCount = 0;
let minAttempts = 2;
let maxAttempts = 6;
let targetAttempt = null;

// Confetti system
let confetti = [];

// AJOUTER cette variable globale en haut avec les autres
let showTutorial = true;

function preload() {
  for (let i = 0; i < numIcons; i++) {
    iconImages[i] = loadImage(iconMap[i]);
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  setupHands();
  setupVideo();

  for (let i = 0; i < 3; i++) {
    slotReels.push({
      position: 0,
      targetPosition: 0,
      velocity: 0,
      isAnimating: false,
      offset: i
    });
  }
  
  imagesLoaded = iconImages.every(img => img && img.width > 0);
  targetAttempt = floor(random(minAttempts, maxAttempts + 1));
  
  // Tutorial disparaît après 8 secondes
  setTimeout(() => {
    showTutorial = false;
  }, 8000);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  // Fond noir permanent
  background(0);

  // Dessiner la machine à sous sur fond noir
  drawSlotMachine();
  
  // Update and draw confetti
  updateConfetti();
  drawConfetti();

  // Check hand gestures for spin control (caméra cachée mais active)
  checkHandGestures();

  // Update slot machine reels animation
  updateReels();

  // Dessiner les landmarks de la main (optionnel - pour debug)
  strokeWeight(2);
  if (detections) {
    for (let hand of detections.multiHandLandmarks) {
      drawConnections(hand);
      drawLandmarks(hand);
      drawTips(hand);
      drawIndex(hand);
      drawThumb(hand);
    }
  }
  
  // TUTORIAL - Afficher au début du jeu
  if (showTutorial) {
    drawTutorial();
  }
}

// NOUVELLE FONCTION - Tutorial animé
function drawTutorial() {
  push();
  
  // Fond semi-transparent
  fill(0, 0, 0, 200);
  noStroke();
  rect(0, 0, width, height);
  
  let centerX = width / 2;
  let centerY = height / 2;
  
  // Animation main qui descend
  let handY = centerY - 100 + sin(frameCount * 0.1) * 60;
  let arrowY = handY + 80;
  
  // Dessiner la main (poing fermé)
  //drawHandGesture(centerX, handY);
  
  // Flèche vers le bas animée
  drawArrowDown(centerX, arrowY);
  
  // Texte explicatif
  fill(255);
  textSize(35);
  // text centered
  textAlign(CENTER, CENTER);
  text("Descendez votre main", centerX, centerY + 120);
  text("pour faire tourner la machine", centerX, centerY + 170);
  
  // Compteur fade out
  let timeLeft = 8 - floor(frameCount / 60);
  if (timeLeft > 0) {
  }
  pop();
}
// Dessiner un poing fermé stylisé
function drawHandGesture(x, y) {
  push();
  
  // Paume
  fill(255, 220, 177);
  stroke(100);
  strokeWeight(3);
  ellipse(x, y, 80, 100);
  
  // Pouce
  ellipse(x - 45, y - 10, 35, 50);
  
  // 4 doigts repliés
  for (let i = 0; i < 4; i++) {
    let fingerX = x - 30 + i * 20;
    let fingerY = y - 30;
    fill(255, 200, 160);
    rect(fingerX, fingerY, 15, 40, 8);
  }
  
  // Contour blanc brillant
  noFill();
  stroke(255, 255, 255, 180);
  strokeWeight(2);
  ellipse(x, y, 82, 102);
  
  pop();
}

// Dessiner flèche vers le bas animée
function drawArrowDown(x, y) {
  push();
  
  let pulse = sin(frameCount * 0.15) * 5;
  
  // Ligne
  stroke(0, 255, 0);
  strokeWeight(8);
  line(x, y, x, y + 80 + pulse);
  
  // Pointe
  fill(0, 255, 0);
  noStroke();
  triangle(
    x, y + 90 + pulse,
    x - 25, y + 60 + pulse,
    x + 25, y + 60 + pulse
  );
  
  // Lueur
  fill(0, 255, 0, 100);
  ellipse(x, y + 75 + pulse, 60, 60);
  
  pop();
}

function createConfetti() {
  for (let i = 0; i < 150; i++) {
    confetti.push({
      x: random(width),
      y: random(-height, 0),
      vx: random(-2, 2),
      vy: random(2, 5),
      rotation: random(TWO_PI),
      rotationSpeed: random(-0.2, 0.2),
      size: random(8, 15),
      color: color(random(255), random(255), random(255)),
      gravity: random(0.1, 0.3),
      life: 255
    });
  }
}

function updateConfetti() {
  for (let i = confetti.length - 1; i >= 0; i--) {
    let c = confetti[i];
    c.vy += c.gravity;
    c.x += c.vx;
    c.y += c.vy;
    c.rotation += c.rotationSpeed;
    c.life -= 1.5;
    
    if (c.y > height + 50 || c.life <= 0) {
      confetti.splice(i, 1);
    }
  }
}

function drawConfetti() {
  for (let c of confetti) {
    push();
    translate(c.x, c.y);
    rotate(c.rotation);
    
    let confettiColor = color(red(c.color), green(c.color), blue(c.color), c.life);
    fill(confettiColor);
    noStroke();
    rectMode(CENTER);
    rect(0, 0, c.size, c.size * 0.6);
    pop();
  }
}

function checkHandGestures() {
  if (detections && detections.multiHandLandmarks.length > 0) {
    let hand = detections.multiHandLandmarks[0];
    let wrist = hand[0];
    // CORRECTION: utiliser height au lieu de videoElement.height
    let currentHandY = wrist.y * height;
    
    if (previousHandY !== null && canTrigger && !isRolling) {
      let deltaY = currentHandY - previousHandY;
      
      if (deltaY > gestureThreshold) {
        // Cacher le tutorial dès le premier geste
        showTutorial = false;
        
        rollAll();
        canTrigger = false;
        setTimeout(() => {
          canTrigger = true;
          previousHandY = null;
        }, 2000);
      }
    }
    
    previousHandY = currentHandY;
    handGestureActive = true;
  } else {
    previousHandY = null;
    handGestureActive = false;
  }
}

function updateReels() {
  for (let reel of slotReels) {
    if (reel.isAnimating) {
      let distance = reel.targetPosition - reel.position;
      reel.velocity = distance * 0.15;
      reel.position += reel.velocity;
      
      if (abs(distance) < 0.5) {
        reel.position = reel.targetPosition;
        reel.velocity = 0;
        reel.isAnimating = false;
      }
    }
  }
  
  if (winState && frameCount % 20 === 0) {
    winTimer++;
    if (winTimer > 10) {
      winState = null;
      winTimer = 0;
    }
  }
}

function drawSlotMachine() {
  push();
  let centerX = width / 2;
  let centerY = height / 2;
  let scale = min(width / 400, height / 500);
  
  let reelWidth = iconWidth * scale;
  let reelHeight = (3 * iconHeight) * scale;
  let spacing = 15 * scale;
  let totalWidth = 3 * reelWidth + 2 * spacing;
  let startX = centerX - totalWidth / 2;
  
  // Fond machine OPAQUE (pas transparent)
  if (winState === "win2") {
    fill(255, 200 + sin(frameCount * 0.3) * 55, 0); // Orange vif pour jackpot
  } else if (winState === "win1") {
    fill(173, 216 + sin(frameCount * 0.3) * 39, 230); // Bleu pour gain partiel
  } else if (handGestureActive) {
    fill(50, 200, 50); // Vert foncé quand main détectée
  } else {
    fill(80, 80, 80); // Gris foncé normal
  }
  
  stroke(150);
  strokeWeight(5 * (scale / 2));
  let padding = 40 * scale;
  rect(startX - padding, centerY - reelHeight / 2 - padding, 
       totalWidth + padding * 2, reelHeight + padding * 2, 10);
  
  // Ombre en haut
  fill(0, 0, 0, 150);
  noStroke();
  rect(startX - padding, centerY - reelHeight / 2 - padding, 
       totalWidth + padding * 2, 15 * scale);
  
  for (let i = 0; i < 3; i++) {
    let x = startX + i * (reelWidth + spacing);
    drawReel(x, centerY - reelHeight / 2, reelWidth, reelHeight, i, scale);
  }
  pop();
}

function drawReel(x, y, w, h, index, scale) {
  push();
  fill(255);
  stroke(50);
  strokeWeight(3 * (scale / 2));
  rect(x, y, w, h, 5);
  
  noStroke();
  fill(0, 0, 0, 80);
  rect(x, y, w, h * 0.15);
  fill(0, 0, 0, 80);
  rect(x, y + h * 0.85, w, h * 0.15);
  
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(x + 4, y + 4, w - 8, h - 8);
  drawingContext.clip();
  
  let reel = slotReels[index];
  let currentIconPosition = reel.position / iconHeight;
  let baseIconIndex = floor(currentIconPosition);
  let offset = (currentIconPosition - baseIconIndex) * iconHeight;
  let iconScale = scale;
  let iconSpacing = iconHeight * iconScale;
  
  for (let i = -1; i <= 3; i++) {
    let iconIndex = (baseIconIndex + i + numIcons * 100) % numIcons;
    let yPos = y + h / 2 + (i * iconSpacing) - (offset * iconScale);
    let distFromCenter = abs(yPos - (y + h / 2));
    let opacity = map(distFromCenter, 0, h / 2, 255, 50, true);
    
    if (imagesLoaded && iconImages[iconIndex] && iconImages[iconIndex].width > 0) {
      push();
      imageMode(CENTER);
      tint(255, opacity);
      image(iconImages[iconIndex], x + w / 2, yPos, 
            iconWidth * iconScale * 0.9, iconHeight * iconScale * 0.9);
      pop();
    }
  }
  
  drawingContext.restore();
  noFill();
  stroke(0, 0, 0, 60);
  strokeWeight(5 * (scale / 2));
  rect(x + 4, y + 4, w - 8, h - 8, 5);
  pop();
}

function determineRiggedOutcome(currentAttempt) {
  if (currentAttempt === targetAttempt) {
    let winningIcon = floor(random(numIcons));
    return [winningIcon, winningIcon, winningIcon];
  } else if (currentAttempt === targetAttempt - 1) {
    let winningIcon = floor(random(numIcons));
    let differentIcon = floor(random(numIcons));
    while (differentIcon === winningIcon) {
      differentIcon = floor(random(numIcons));
    }
    let differentPos = floor(random(3));
    let result = [winningIcon, winningIcon, winningIcon];
    result[differentPos] = differentIcon;
    return result;
  } else {
    let icon1 = floor(random(numIcons));
    let icon2 = floor(random(numIcons));
    let icon3 = floor(random(numIcons));
    while (icon2 === icon1) icon2 = floor(random(numIcons));
    while (icon3 === icon1 || icon3 === icon2) icon3 = floor(random(numIcons));
    return [icon1, icon2, icon3];
  }
}

function roll(reelIndex, offset = 0, targetIcon = null) {
  return new Promise((resolve) => {
    let reel = slotReels[reelIndex];
    let delta;
    
    if (targetIcon !== null) {
      let currentIcon = round(reel.position / iconHeight) % numIcons;
      let iconDiff = (targetIcon - currentIcon + numIcons) % numIcons;
      delta = (offset + 2) * numIcons + iconDiff;
    } else {
      delta = (offset + 2) * numIcons + floor(random(numIcons));
    }
    
    setTimeout(() => {
      reel.isAnimating = true;
      reel.targetPosition = reel.position + delta * iconHeight;
      
      setTimeout(() => {
        let finalIconIndex = round(reel.targetPosition / iconHeight) % numIcons;
        reel.position = finalIconIndex * iconHeight;
        reel.targetPosition = reel.position;
        resolve(finalIconIndex);
      }, (8 + delta) * timePerIcon + offset * 150);
    }, offset * 150);
  });
}

function rollAll() {
  if (isRolling) return;
  isRolling = true;
  winState = null;
  attemptCount++;
  
  let targetIcons = determineRiggedOutcome(attemptCount);
  
  Promise.all([
    roll(0, 0, targetIcons[0]),
    roll(1, 1, targetIcons[1]),
    roll(2, 2, targetIcons[2])
  ]).then((deltas) => {
    deltas.forEach((delta, i) => {
      indexes[i] = delta;
    });
    isRolling = false;
    
    if (indexes[0] === indexes[1] && indexes[1] === indexes[2]) {
      winState = "win2";
      winTimer = 0;
      createConfetti();
      setTimeout(() => {
        attemptCount = 0;
        targetAttempt = floor(random(minAttempts, maxAttempts + 1));
      }, 5000);
    } else if (indexes[0] === indexes[1] || indexes[1] === indexes[2] || indexes[0] === indexes[2]) {
      winState = "win1";
      winTimer = 0;
    }
  });
}

// CORRIGER checkHandGestures - enlever videoElement.height
function checkHandGestures() {
  if (detections && detections.multiHandLandmarks.length > 0) {
    let hand = detections.multiHandLandmarks[0];
    let wrist = hand[0];
    // CORRECTION: utiliser height au lieu de videoElement.height
    let currentHandY = wrist.y * height;
    
    if (previousHandY !== null && canTrigger && !isRolling) {
      let deltaY = currentHandY - previousHandY;
      
      if (deltaY > gestureThreshold) {
        // Cacher le tutorial dès le premier geste
        showTutorial = false;
        
        rollAll();
        canTrigger = false;
        setTimeout(() => {
          canTrigger = true;
          previousHandY = null;
        }, 2000);
      }
    }
    
    previousHandY = currentHandY;
    handGestureActive = true;
  } else {
    previousHandY = null;
    handGestureActive = false;
  }
}

// CORRIGER toutes les fonctions draw - coordonnées directes
function drawIndex(landmarks) {
  let mark = landmarks[FINGER_TIPS.index];
  noStroke();
  fill(62,119,74);
  circle(mark.x * width, mark.y * height, 20);
}

function drawThumb(landmarks) {
  let mark = landmarks[FINGER_TIPS.thumb];
  noStroke();
  fill(62,119,74);
  circle(mark.x * width, mark.y * height, 20);
}

function drawTips(landmarks) {
  noStroke();
  fill(62,119,74);
  const tips = [4, 8, 12, 16, 20];
  for (let tipIndex of tips) {
    let mark = landmarks[tipIndex];
    circle(mark.x * width, mark.y * height, 10);
  }
}

function drawLandmarks(landmarks) {
  noStroke();
  fill(62,119,74);
  for (let mark of landmarks) {
    circle(mark.x * width, mark.y * height, 6);
  }
}

function drawConnections(landmarks) {
  stroke(62,119,74);
  strokeWeight(2);
  for (let connection of HAND_CONNECTIONS) {
    const a = landmarks[connection[0]];
    const b = landmarks[connection[1]];
    if (!a || !b) continue;
    line(a.x * width, a.y * height, b.x * width, b.y * height);
    //epaisseur 
    strokeWeight(12);
  }
}
