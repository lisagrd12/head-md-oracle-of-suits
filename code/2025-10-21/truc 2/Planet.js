class Planet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.birth = millis(); // Store creation time
    this.lifespan = 5000;  // 5000 milliseconds 
    this.alpha = 255;      // For fade out effect
    this.color = color(random(colors));
  }

  draw() {
    // Calculate remaining life
    let age = millis() - this.birth;
    let remaining = this.lifespan - age;
    
    // Fade out in last second
    if (remaining < 1000) {
      this.alpha = map(remaining, 0, 1000, 0, 255);
    }

    // Draw planet with current alpha
    stroke(50, 80, 200, this.alpha);
    fill(color (this.color))
    ellipse(this.x, this.y, 80, 80);
    noFill();
    stroke(200, 150, 50, this.alpha);
    ellipse(this.x, this.y, 100, 50);
    
    // wiggle the planet
    this.x += random(-1, 1);
    this.y += random(-1, 1);
  }
  isDead() {
    return millis() - this.birth > this.lifespan;
  }
}
