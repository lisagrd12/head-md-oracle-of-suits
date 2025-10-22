// create an empty array named things
let things = []; 

function setup() {
//full  createCanvas
  createCanvas(windowWidth, windowHeight);}

function draw() {
  background(220);
  // drzw all the thing
  for (let i = 0; i < things.length; i++) {
    things[i].draw();
  }
}
