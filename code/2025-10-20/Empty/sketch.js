/*
  Two scalloped (half-circle) lines that touch:
  - Upper line: bottom semicircles (0 -> PI)
  - Lower line: top semicircles (PI -> 0)
  Centers are vertically separated by exactly one diameter so the top of the
  lower semicircle touches the bottom of the upper semicircle.
  Responsive to window size.
*/

let cfg = {
  diameter: 60,       
  strokeRel: 0.06,
  hoverDistance: 30,   
  vibrationAmount: 2,  
  vibrationSpeed: 0.1,
  hoverColor: 'rgba(255, 105, 180, 0.5)'  // Pink color with 50% transparency
};

let time = 0;  // Add time variable for continuous vibration

// Add array to store circle positions
let circles = [];

// Add set to store colored circles
let coloredCircles = new Set();

function setup() {
  createCanvas(windowWidth, windowHeight);
  noFill();
  stroke(0);
  recalculatesStyle();
  loop(); // Enable continuous drawing for hover detection
}

function draw() {
  background(255);
  circles = []; // Reset circles array each frame

  let d = cfg.diameter;
  let spacing = d;
  let centerY = 0;
  let upperY = centerY - d * 0.5;
  let lowerY = centerY + d * 0.5;
  let startX = -d;
  let endX = width + d;

  for (let y = 0; y < height; y += d) {
    drawSideBySideScallops(startX, endX, upperY+y, d, false, 0);
    drawSideBySideScallops(startX+30, endX, lowerY-30+y, d, false, 0);
  }
  
  drawSideBySideScallops(startX, endX, upperY, d, false, 0);
  drawSideBySideScallops(startX+30, endX, lowerY-30, d, false, 0);

  time += cfg.vibrationSpeed;  // Update time for vibration
}

/*
  Draw semicircles side-by-side along a horizontal span.
  topArc = true -> draw top semicircle (PI -> 0)
  topArc = false -> draw bottom semicircle (0 -> PI)
*/
function drawSideBySideScallops(xStart, xEnd, y, diameter, topArc, xOffset) {
  strokeWeight(max(1, diameter * cfg.strokeRel));
  let spacing = diameter;
  let count = ceil((xEnd - xStart) / spacing) + 1;
  
  for (let i = 0; i <= count; i++) {
    let cx = xStart + i * spacing + xOffset;
    push();
    
    // Store circle position and check mouse distance
    let circleX = cx;
    let circleY = y;
    let circleKey = `${circleX},${circleY}`;
    circles.push({x: circleX, y: circleY});
    
    let d = dist(mouseX, mouseY, circleX, circleY);
    if (d < cfg.hoverDistance) {
      // Add vibration offset when mouse is near
      let vibX = random(-cfg.vibrationAmount, cfg.vibrationAmount) * sin(time);
      let vibY = random(-cfg.vibrationAmount, cfg.vibrationAmount) * cos(time);
      translate(cx + vibX, y + vibY);
      
      // Add this circle to colored set
      coloredCircles.add(circleKey);
      
      // Draw vibrating pink circle
      stroke(0);
      fill(cfg.hoverColor);
      circle(0, 0, diameter);
      noFill();
    } else {
      translate(cx, y);
      // Check if this circle should be colored
      if (coloredCircles.has(circleKey)) {
        fill(cfg.hoverColor);
      }
      // Draw semicircle (possibly colored)
      if (topArc) {
        arc(0, 0, diameter, diameter, PI, 0);
      } else {
        arc(0, 0, diameter, diameter, 0, PI);
      }
      noFill();
    }
    pop();
  }
}

// Add reset function if needed (e.g., on key press)
function keyPressed() {
  if (key === ' ') { // Press spacebar to reset
    coloredCircles.clear();
  }
}

function recalculatesStyle() {
  strokeWeight(max(1, cfg.diameter * cfg.strokeRel));
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  recalculatesStyle();
  redraw();
}