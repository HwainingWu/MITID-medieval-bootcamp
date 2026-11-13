
let board;
let redLed;
let greenLed;

let bodyPose;
let video;
let poses = [];

let lastState = null;
let lastWrists = [null, null];
let highFiveThreshold = 120;
let holdUntil = 0;

async function setup() {
    createCanvas(700, 500);

    board = createBoard();
    createConnectButton(board);

    // Initialize LEDs
    board.on("ready", function() {
        redLed = new five.Led(3);
        greenLed = new five.Led(5);
    });

    video = createCapture(VIDEO);
    video.size(700, 500);
    video.hide();

    // BodyPose
    bodyPose = await ml5.bodyPose();

    bodyPose.detectStart(video, function(results) {
        poses = results;
    });
}

function getRightWrist(person, index) {
    let wrist = person.right_wrist;

    if (wrist &&
        Number.isFinite(wrist.x) &&
        Number.isFinite(wrist.y) &&
        wrist.confidence >= 0.3) {

        lastWrists[index] = {
            x: wrist.x,
            y: wrist.y,
            time: millis()
        };

        return wrist;
    }

    // Use last valid position for 300 ms
    let previous = lastWrists[index];

    if (previous && millis() - previous.time < 300) {
        return previous;
    }

    return null;
}


function draw() {
    image(video, 0, 0);

    textSize(20);
    noStroke();
    fill("#FFFFFF");

    text("People: " + poses.length, 10, 30);

    let highFive = false;

    if (poses.length >= 2) {

        let p1 = poses[0];
        let p2 = poses[1];

        let rw1 = getRightWrist(p1, 0);
        let rw2 = getRightWrist(p2, 1);

        // Show right elbows
        let re1 = p1.right_elbow;
        let re2 = p2.right_elbow;

        fill("#00FFFF");

        if (re1 && re1.confidence > 0.3) {
            circle(re1.x, re1.y, 15);
        }

        if (re2 && re2.confidence > 0.3) {
            circle(re2.x, re2.y, 15);
        }

        // Calculate wrist distance
        if (rw1 && rw2) {

            fill("#FFFF00");
            circle(rw1.x, rw1.y, 20);
            circle(rw2.x, rw2.y, 20);

            let distance = dist(
                rw1.x, rw1.y,
                rw2.x, rw2.y
            );

            fill("#FFFFFF");
            text("Distance: " + Math.round(distance),
                 10, 60);

            if (distance < highFiveThreshold) {
                highFive = true;
                holdUntil = millis() + 400;
            }

        } else {
            fill("#FFFFFF");
            text("Tracking wrists...", 10, 60);
        }

    } else {
        lastWrists = [null, null];
        text("Waiting for two people...", 10, 60);
    }

    // Keep green LED briefly after detection
    if (millis() < holdUntil) {
        highFive = true;
    }

    // Display status
    if (highFive) {
        fill("#00FF00");
        text("HIGH FIVE!", 10, 90);
    } else {
        fill("#FF0000");
        text("NO HIGH FIVE", 10, 90);
    }

    // Control LEDs
    if (redLed && greenLed &&
        highFive !== lastState) {

        if (highFive) {
            greenLed.on();
            redLed.off();
        } else {
            greenLed.off();
            redLed.on();
        }

        lastState = highFive;
    }
}
