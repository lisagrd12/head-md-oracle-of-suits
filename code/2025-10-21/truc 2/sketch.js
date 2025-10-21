let rand;
let colors = ["red", "green", "blue", "yellow", "purple", "orange", "cyan", "magenta"];
let planets = [];
let stars = [];
let moons = []; // Array to store moons
let satellite =[];  

function setup() {
  createCanvas(windowWidth, windowHeight);
  // create one satellite so it's visible immediately
  satellite.push(new Satellite(width * 0.8, height * 0.2));
}

function draw() {
  background(0, 0, 0);



  // Draw moons first to keep them behind stars and planets
  for (let moon of moons) {
    moon.draw(); }
  // remove dead moons
  moons = moons.filter(moon => millis() - moon.birth <= moon.lifespan);


  // Draw remaining planets
  for (let planet of planets) {
    planet.draw(); }
  // Remove dead planets
  planets = planets.filter(planet => !planet.isDead());

  // Draw stars
  for (let star of stars) {
    star.draw(); }

    // Draw satellite
    for (let sat of satellite) {
      sat.draw(); } 

}


// Add stars at random positions every second
setInterval(() => {
  let x = random(width);
  let y = random(height);
  let r = random(10, 20);
  let r2 = r / 2;
  let newStar = new Star(x, y, r, r2);
  stars.push(newStar);
}, 200);

// When the mouse is pressed, add a new planet at the mouse position
function mousePressed() {
if (random([0,1]) === 0) {
let newPlanet = new Planet(mouseX, mouseY);
    planets.push(newPlanet);
}
else {
    // Also add a moon slightly offset from the planet  
    let newMoon = new Moon(mouseX + 30, mouseY + 30);
    moons.push(newMoon);
}
}


