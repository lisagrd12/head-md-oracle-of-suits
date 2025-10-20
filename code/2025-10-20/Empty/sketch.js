/*
  Two scalloped (half-circle) lines that touch:
  - Upper line: bottom semicircles (0 -> PI)
  - Lower line: top semicircles (PI -> 0)
  Centers are vertically separated by exactly one diameter so the top of the
  lower semicircle touches the bottom of the upper semicircle.
  Responsive to window size.
*/

let cfg = {
  diameter: 60,       // diameter of each semicircle
  strokeRel: 0.06     // stroke weight relative to diameter
};

function setup() {
  createCanvas(windowWidth, windowHeight);
  noFill();
  stroke(0);
  recalculatesStyle();
  noLoop();
}

function draw() {
  background(255);

  let d = cfg.diameter;
  let spacing = d; // centers side-by-side

  // center the touching pair vertically
  let centerY = 0;
  // place upper and lower so their centers differ by exactly d
  let upperY = centerY - d * 0.5;
  let lowerY = centerY + d * 0.5;

  // start slightly off-canvas for clean tiling
  let startX = -d;
  let endX = width + d;

  for (let y = 0; y < height; y += d) {
    drawSideBySideScallops(startX, endX, upperY+y, d, false, 0);

  // draw lower line (bottom semicircles - changed from top to bottom)
  drawSideBySideScallops(startX+30, endX, lowerY-30+y, d, false, 0);
    
  }
  // draw upper line (bottom semicircles) so their bottoms touch the lower tops
  drawSideBySideScallops(startX, endX, upperY, d, false, 0);

  // draw lower line (bottom semicircles - changed from top to bottom)
  drawSideBySideScallops(startX+30, endX, lowerY-30, d, false, 0);
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
    translate(cx, y);
    if (topArc) {
      arc(0, 0, diameter, diameter, PI, 0); // top semicircle
    } else {
      arc(0, 0, diameter, diameter, 0, PI); // bottom semicircle
    }
    pop();
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