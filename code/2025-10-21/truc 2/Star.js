class Star {
  constructor(x, y, r, r2, n = 5) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.r2 = r2;
    this.n = n; // number of star points
    this.rand = random(-8, 8);
    this.rand2 = random(-8, 8);
  }

  draw() {
    push();
    translate(this.x, this.y);
    fill(random(0,200), 220, 20);
    beginShape();
    for (let i = 0; i < this.n; i++) {
      let angle = i * 360 / this.n;
      let x = this.r * sin(radians(angle));
      let y = this.r * cos(radians(angle));
      vertex(x, y);
      let x2 = this.r2 * sin(radians(angle + 360 / (2 * this.n)));
      let y2 = this.r2 * cos(radians(angle + 360 / (2 * this.n)));
      vertex(x2, y2);
    }

    endShape(CLOSE);
    pop();
    // move the star slightly on x and y
    this.x += this.rand;
    this.y += this.rand2;

    // add lign to the star
    stroke(255, 255, 0, 100);
    line(this.x, this.y, this.x - this.rand * 50, this.y - this.rand2 * 50);
    line(this.x, this.y, this.x - this.rand * 55, this.y - this.rand2 * 60);
    line(this.x, this.y, this.x - this.rand * 45, this.y - this.rand2 * 40);


  }
}