// create a moon
    
class Moon {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.color = color(random(colors));
    this.birth = millis(); // Store the creation time
    this.lifespan = 3000;  // Lifespan 
  }

  draw() {
    
    // Check if the moon should disappear
    if (millis() - this.birth > this.lifespan) {
      return; // Skip drawing if the lifespan has expired
    }

    // Draw the full moon
    noStroke();
    fill(this.color);
    ellipse(this.x, this.y, 50, 50);
    
    // Draw the shadow to create a crescent shape
    fill(0); // Black color for the shadow
    ellipse(this.x + 15, this.y, 45, 45); 
    // add a little wiggle to the moon's position
    this.x += random(-1, 1);
    this.y += random(-1, 1);
  }
}