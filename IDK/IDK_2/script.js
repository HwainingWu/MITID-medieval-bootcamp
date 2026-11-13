
let board;
let buzzer;

let bodyPose;
let video;
let poses = [];

let lastUpdate = 0;

async function setup() {

    createCanvas(700, 500);

    // Connect Arduino
    board = createBoard();
    createConnectButton(board);

    // Initialize passive buzzer
    // Buzzer is connected to Pin 3
    board.on("ready", function() {

        console.log("Arduino connected!");

        buzzer = new five.Piezo(3);

        console.log("Buzzer ready!");

    });

    // Open webcam
    video = createCapture(VIDEO);
    video.size(700, 500);
    video.hide();

    // Load BodyPose model
    bodyPose = await ml5.bodyPose();

    // Start body detection
    bodyPose.detectStart(video, function(results) {
        poses = results;
    });

}

function draw() {

    // Show webcam
    image(video, 0, 0);

    fill(255, 0, 0);
    noStroke();
    textSize(20);

    // Check if a person is detected
    if (poses.length > 0) {

        let rs = poses[0].right_shoulder;
        let ls = poses[0].left_shoulder;

        // Check shoulder detection
        if (!rs || !ls) {

            if (buzzer) {
                buzzer.noTone();
            }

            return;
        }

        // Calculate distance between shoulders
        let distance = dist(
            rs.x, rs.y,
            ls.x, ls.y
        );

        // Convert distance into sound frequency
        // Closer = higher frequency
        // Farther = lower frequency
        let frequency = map(
            distance,
            40, 300,
            200, 900
        );

        frequency = constrain(frequency, 200, 900);
        frequency = Math.round(frequency);

        // Display distance and frequency
        text("Distance: " + Math.round(distance), 10, 30);
        text("Frequency: " + frequency + " Hz", 10, 60);

        // Play buzzer every 200 ms
        if (buzzer && millis() - lastUpdate >= 200) {

            buzzer.tone(frequency, 180);

            lastUpdate = millis();
        }

    } else {

        // No person detected
        text("No person detected", 10, 30);

        // Stop buzzer
        if (buzzer) {
            buzzer.noTone();
        }

    }

}
