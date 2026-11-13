let board;
let led;

// a variable to store the bodyPose model
let bodyPose;
// we create a variable to store the webcam data
let video;
// a variable to store the detected poses
let poses = [];

async function setup() {
    createCanvas(700, 500);
    board = createBoard();
    createConnectButton(board);

    led = new five.Led(3);

    video = createCapture(VIDEO);      // we open the webcam
    video.size(700, 500);
    video.hide();


    bodyPose = await ml5.bodyPose();
    // start the detection
    bodyPose.detectStart(video, function(results) {
        poses = results;
    });
    
}


function draw() {
    image(video, 0, 0);

    fill(255, 0, 0);
    noStroke();
    textSize(20);

    if (poses.length > 0) {

        let rs = poses[0].right_shoulder;
        let ls = poses[0].left_shoulder;

        if (!rs || !ls) {
            text("Shoulders not detected", 10, 30);
            return;
        }

        // Draw shoulder positions
        circle(rs.x, rs.y, 15);
        circle(ls.x, ls.y, 15);

        // Calculate shoulder distance
        let distance = dist(rs.x, rs.y, ls.x, ls.y);

        // Calculate brightness
        let bri = map(distance, 40, 500, 0, 255);
        bri = constrain(bri, 0, 255);

        // Display debugging information
        text("Right X: " + Math.round(rs.x), 10, 30);
        text("Left X: " + Math.round(ls.x), 10, 60);
        text("Distance: " + Math.round(distance), 10, 90);
        text("Brightness: " + Math.round(bri), 10, 120);

    } else {
        text("No person detected", 10, 30);
    }
}



