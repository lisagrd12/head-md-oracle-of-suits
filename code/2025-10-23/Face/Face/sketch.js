// the blendshapes we are going to track

let jawOpen = 0.0;
let drops = [];
let score = 0;
let happySong;
let gameWon = false;

class Drop {
  constructor() {
    this.x = random(width);
    this.y = -random(10, 200);
    this.r = random(6, 28);
    this.speed = random(1.5, 5);
    this.col = color(random(60, 255), random(60, 255), random(60, 255), 220);
  }
  
  update() {
    this.y += this.speed;
  }
  
  offscreen() {
    return this.y - this.r > height;
  }
  
  show() {
    noStroke();
    fill(this.col);
    ellipse(this.x, this.y, this.r * 2);
  }
}

function preload() {
  // Load the happy song - make sure you have a file called "happy.mp3" in your project folder
  happySong = loadSound('libraries/happy.mp3');
}

function setup() {
  // full window canvas
  createCanvas(windowWidth, windowHeight);
  // initialize MediaPipe
  setupFace();
  setupVideo();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

/** point-in-polygon (ray-casting) */
function pointInPolygon(x, y, polygon) {
  if (!polygon || polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > y) !== (yj > y)) &&
                      (x < (xj - xi) * (y - yi) / (yj - yi + 0.0000001) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/** distance from point to segment */
function pointToSegmentDist(px, py, x1, y1, x2, y2) {
  const A = px - x1, B = py - y1, C = x2 - x1, D = y2 - y1;
  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  let t = len_sq > 0 ? dot / len_sq : -1;
  t = Math.max(0, Math.min(1, t));
  const projx = x1 + t * C, projy = y1 + t * D;
  const dx = px - projx, dy = py - projy;
  return Math.sqrt(dx*dx + dy*dy);
}

/** collision entre cercle (drop) et polygone (bouche) */
function polygonCircleCollision(polygon, cx, cy, r) {
  if (!polygon || polygon.length < 3) return false;
  // center inside polygon?
  if (pointInPolygon(cx, cy, polygon)) return true;
  // distance to edges
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const d = pointToSegmentDist(cx, cy, polygon[j].x, polygon[j].y, polygon[i].x, polygon[i].y);
    if (d <= r) return true;
  }
  return false;
}

function draw() {

  // clear the canvas
  background(128);

  if (isVideoReady()) {
    // show video frame
    image(videoElement, 0, 0);
  }

  // spawn nouveaux ronds (contrôler la densité) - only if game not won
  if (!gameWon && random() < 0.12) {
    drops.push(new Drop());
  }

  // get detected faces
  let faces = getFaceLandmarks();
  
  jawOpen = getBlendshapeScore('jawOpen');

  // get mouth polygon for collision detection
  let mouth = getFeatureRings('FACE_LANDMARKS_LIPS');
  let innerLip = null;
  
  if (mouth && mouth.length > 1) {
    innerLip = mouth[1]; // inner lip polygon
  }

  // if jaw is open (threshold 0.5), eat drops that touch the inner mouth
  if (jawOpen > 0.5 && innerLip && innerLip.length >= 3) {
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      if (polygonCircleCollision(innerLip, d.x, d.y, d.r * 0.9)) {
        drops.splice(i, 1);
        score++;

        // Check if player won (score reached 5)
        if (score >= 5 && !gameWon) {
          gameWon = true;
          // Play the song automatically
          if (happySong.isLoaded()) {
            happySong.play();
          }
        }
      }
    }
  }

  // mettre à jour et dessiner les ronds
  for (let i = drops.length - 1; i >= 0; i--) {
    drops[i].update();
    drops[i].show();
    if (drops[i].offscreen()) {
      drops.splice(i, 1);
    }
  }

  // if we have at least one face
  if (faces && faces.length > 0) {
    drawMouth(faces[0]);
  }

  // draw blendshape values and score
  drawBlendshapeScores();
  
  // Draw victory message if game won
  if (gameWon) {
    fill(255, 215, 0);
    stroke(0);
    strokeWeight(3);
    textSize(48);
    textAlign(CENTER, CENTER);
    text("C'est ton anniversaire!", width / 2, height / 2);
    textSize(24);
  }
}

function drawBlendshapeScores() {
  fill(255);
  noStroke();
  textSize(16);
  textAlign(LEFT, BASELINE);

  text("jawOpen: " + jawOpen.toFixed(2), 10, height - 40);
  text("Score: " + score + " / 5", 10, height - 20);
}

function drawMouth() {

  let mouth = getFeatureRings('FACE_LANDMARKS_LIPS');
  // make sure we have mouth data
  if (!mouth) return;

  // set fill and stroke based on jawOpen value
  if (jawOpen > 0.5) {
    fill(random(0, 255), random(0, 255), random(0, 255), 64);
    stroke(random(0, 255), random(0, 255), random(0, 255));
  } else {
    stroke(255, 0, 0);
  }

  // there are two rings: outer lip and inner lip
  let outerLip = mouth[0];
  let innerLip = mouth[1];

  // draw outer lip
  beginShape();
  for (const p of outerLip) {
    vertex(p.x, p.y);
  }

  // draw inner lip as a hole
  beginContour();
  // we need to go backwards around the inner lip
  for (let j = innerLip.length - 1; j >= 0; j--) {
    const p = innerLip[j];
    vertex(p.x, p.y);
  }
  endContour();
  endShape(CLOSE);

  
  

  // fill inner mouth
  beginShape();
  for (const p of innerLip) {
    vertex(p.x, p.y);
  }
  endShape(CLOSE);

}

// Reset game when space is pressed
function keyPressed() {
  if (key === ' ' && gameWon) {
    score = 0;
    gameWon = false;
    drops = [];
    if (happySong.isPlaying()) {
      happySong.stop();
    }
  }
}


