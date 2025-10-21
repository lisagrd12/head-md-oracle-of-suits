class Satellite {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.angle = 0;
    this.centerW = 30;        // center rect width
    this.centerH = 60;        // center rect height
  this.sideW = 50;          // side rect width
    this.sideH = 20;          // side rect height
    this.sideGap = 15;        // gap between center and side rects
}
  draw() {
    push();
    translate(this.x, this.y);
    rotate(this.angle);
    rectMode(CENTER);
    fill(200);
    
   // center rectangle (vertical)
    rect(0, 0, this.centerW, this.centerH);
    // left rectangle
    rect(-this.centerW/3 - this.sideGap - this.sideW/3, 0, this.sideW, this.sideH);
    // right rectangle
    rect(this.centerW/3 + this.sideGap + this.sideW/3, 0, this.sideW, this.sideH);
    
    // antenna (on top)
    stroke(150);
    strokeWeight(2);
    line(0, -this.centerH/2, 0, -this.centerH/2 - 20);
    noStroke();
    pop();
    
    pop();
    this.angle += 0.05;
  }
}