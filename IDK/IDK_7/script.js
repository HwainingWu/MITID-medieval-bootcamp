
let board;
let buzzer;

let bodyPose;
let video;
let poses = [];

let previousWrist = null;
let previousTime = 0;

let handSpeed = 0;
let speedThreshold = 150;

let lastDetectionTime = 0;
let alarmOn = false;

async function setup() {
    createCanvas(700, 500);

    board = createBoard();
    createConnectButton(board);

    // Buzzer connected to D8
    board.on("ready", function() {
        buzzer = new five.Piezo(8);
    });

    // Webcam
    video = createCapture(VIDEO);
    video.size(700, 500);
    video.hide();

    // BodyPose
    bodyPose = await ml5.bodyPose();

    bodyPose.detectStart(video, function(results) {
        poses = results;
        updateHandSpeed();
    });
}

// Calculate hand movement speed
function updateHandSpeed() {

    if (poses.length === 0) {
        previousWrist = null;
        handSpeed = 0;
        return;
    }

    let wrist = poses[0].right_wrist;

    if (!wrist ||
        !Number.isFinite(wrist.x) ||
        !Number.isFinite(wrist.y) ||
        wrist.confidence < 0.2) {
        previousWrist = null;
        handSpeed = 0;
        return;
    }

    let currentTime = millis();
    lastDetectionTime = currentTime;

    if (previousWrist !== null) {

        // Calculate distance traveled
        let distance = dist(
            wrist.x, wrist.y,
            previousWrist.x, previousWrist.y
        );

        // Calculate time in seconds
        let time = (currentTime - previousTime) / 1000;

        if (time > 0 && time < 0.5) {
            let speed = distance / time;

            // Smooth the speed value
            handSpeed = handSpeed * 0.3 + speed * 0.7;
        } else {
            handSpeed = 0;
        }
    }

    // Save current position
    previousWrist = {
        x: wrist.x,
        y: wrist.y
    };

    previousTime = currentTime;
}

function draw() {
    image(video, 0, 0);

    // Prevent stale speed readings
    let currentSpeed = handSpeed;

    if (millis() - lastDetectionTime > 500) {
        currentSpeed = 0;
    }

    // Determine fast movement
    let movingFast = currentSpeed > speedThreshold;

    // Control buzzer only when state changes
    if (buzzer && movingFast !== alarmOn) {

        if (movingFast) {
            buzzer.tone(1000, 1000);
        } else {
            buzzer.noTone();
        }

        alarmOn = movingFast;
    }

    // Display wrist position
    if (poses.length > 0) {
        let wrist = poses[0].right_wrist;

        if (wrist && wrist.confidence >= 0.3) {
            fill("#FFFF00");
            noStroke();
            circle(wrist.x, wrist.y, 20);
        }
    }

    // Display speed
    fill("#FFFFFF");
    noStroke();
    textSize(22);

    text("Speed: " + Math.round(currentSpeed)
         + " px/s", 20, 35);

}
