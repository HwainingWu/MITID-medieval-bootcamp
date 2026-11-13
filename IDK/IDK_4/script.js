let board;
let rgbLed;

let bodyPose;
let video;
let poses = [];

let lightState = "green";
let nextChange = 0;

let referencePose = null;
let movementThreshold = 20;
let caught = false;

async function setup() {
    createCanvas(700, 500);

    board = createBoard();
    createConnectButton(board);

    // RGB LED connected to PWM pins
    board.on("ready", function() {
        rgbLed = new five.Led.RGB({
            pins: {
                red: 11,
                green: 9,
                blue: 10
            }
        });

        if (lightState === "red") {
            rgbLed.color("#FF0000");
        } else {
            rgbLed.color("#00FF00");
        }
    });

    video = createCapture(VIDEO);
    video.size(700, 500);
    video.hide();

    bodyPose = await ml5.bodyPose();

    bodyPose.detectStart(video, function(results) {
        poses = results;
    });

    // First random interval
    nextChange = millis() + random(2000, 5000);
}

// Get the player's position
function getPlayerPosition() {
    if (poses.length === 0) return null;

    let p = poses[0];

    let nose = p.nose;
    let ls = p.left_shoulder;
    let rs = p.right_shoulder;

    if (!nose || !ls || !rs) return null;

    if (nose.confidence < 0.3 ||
        ls.confidence < 0.3 ||
        rs.confidence < 0.3) {
        return null;
    }

    return {
        nose: {x: nose.x, y: nose.y},
        left: {x: ls.x, y: ls.y},
        right: {x: rs.x, y: rs.y}
    };
}

function draw() {
    image(video, 0, 0);

    let now = millis();
    let currentPose = getPlayerPosition();

    // Change light at random intervals
    if (now >= nextChange) {

        if (lightState === "green") {
            lightState = "red";
            referencePose = currentPose;
            caught = false;

        } else {
            lightState = "green";
            referencePose = null;
            caught = false;
        }

        // Update RGB LED once
        if (rgbLed) {
            if (lightState === "red") {
                rgbLed.color("#FF0000");
            } else {
                rgbLed.color("#00FF00");
            }
        }

        nextChange = now + random(2000, 5000);
    }

    // Check movement during red light
    if (lightState === "red" && currentPose) {

        // First valid position becomes reference
        if (referencePose === null) {
            referencePose = currentPose;
        }

        let noseMove = dist(
            currentPose.nose.x,
            currentPose.nose.y,
            referencePose.nose.x,
            referencePose.nose.y
        );

        let leftMove = dist(
            currentPose.left.x,
            currentPose.left.y,
            referencePose.left.x,
            referencePose.left.y
        );

        let rightMove = dist(
            currentPose.right.x,
            currentPose.right.y,
            referencePose.right.x,
            referencePose.right.y
        );

        let movement = max(
            noseMove,
            leftMove,
            rightMove
        );

        if (movement > movementThreshold) {
            caught = true;
        }
    }

    // Red transparent overlay when caught
    if (lightState === "red" && caught) {
        noStroke();
        fill(255, 0, 0, 120);
        rect(0, 0, width, height);
    }

    // Display game status
    textSize(28);
    textStyle(BOLD);
    noStroke();

    if (lightState === "green") {
        fill("#00FF00");
        text("GREEN LIGHT - GO!", 20, 40);
    } else {
        fill("#FF0000");
        text("RED LIGHT - STOP!", 20, 40);
    }

    if (caught) {
        fill("#FFFFFF");
        text("YOU MOVED!", 20, 85);
    }
}

