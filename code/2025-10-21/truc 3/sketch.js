let circles = [];

class Circle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.diameter = 10;
  }

  move() {
    this.y += random(-2, 2);
    this.y = constrain(this.y, 0, height);
  }

  checkCollision(other) {
    let d = dist(this.x, this.y, other.x, other.y);
    return d < this.diameter;
  }

  display() {
    fill(255);
    noStroke();
    circle(this.x, height - this.y, this.diameter);
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  // Create initial circles
  for (let i = 0; i < 100; i++) {
    circles.push(new Circle(i * (width / 100), random(0, height)));
  }
}

function draw() {
  background(200, 20, 20);
  
  // Check for collisions and multiply
  for (let i = circles.length - 1; i >= 0; i--) {
    for (let j = i - 1; j >= 0; j--) {
      if (circles[i].checkCollision(circles[j])) {
        // Create a new circle at a random position between the two colliding circles
        let newX = (circles[i].x + circles[j].x) / 2 + random(-5, 5);
        let newY = (circles[i].y + circles[j].y) / 2 + random(-5, 5);
        if (circles.length < 300) { // Limit the maximum number of circles
          circles.push(new Circle(newX, newY));
        }
      }
    }
  }

  // Update and display all circles
  for (let circle of circles) {
    circle.move();
    circle.display();
  }
}
