let board;

let microphone;
let micValue = 0; // a global variable to store micro value

function setup() {
    createCanvas(700, 500);
    board = createBoard();
    createConnectButton(board);

    // we create the sensor object
    microphone = new five.Sensor("A0");

    // we listen to sensor values
    microphone.on("change", function(lastestValue){
        // on modification do stuff
        micValue = lastestValue;
    })
}

function draw() {
    background(200);

    // a circle that will get bigger when we scream
    circle(width/2, height/2, micValue);

}