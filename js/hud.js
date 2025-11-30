function initHud() {
    hudWidth = window.innerWidth;
    hudHeight = window.innerHeight;

    cameraHud = new THREE.OrthographicCamera(
        -halfWidth,
        halfWidth,
        halfHeight,
        -halfHeight,
        0,
        1000);
    sceneHud = new THREE.Scene();
    hudCanvas = document.createElement('canvas');
    hudContext = hudCanvas.getContext('2d');
    hudCanvas.width = hudWidth;
    hudCanvas.height = hudHeight;

    hudTexture = new THREE.Texture(hudCanvas);
    const hudMaterial = new THREE.MeshBasicMaterial({ map: hudTexture });
    hudMaterial.transparent = true;
    hudMaterial.depthTest = false;

    const planeGeometry = new THREE.PlaneGeometry(gameWidth, gameHeight);
    const hudPlane = new THREE.Mesh(planeGeometry, hudMaterial);
    hudPlane.position.z = 500;
    sceneHud.add(hudPlane);
    
    // Setup multipliers overlay canvas
    multipliersCanvas = document.getElementById('multipliersCanvas');
    multipliersContext = multipliersCanvas.getContext('2d');
    multipliersCanvas.width = hudWidth;
    multipliersCanvas.height = hudHeight;
}

function renderHud() {
    hudContext.clearRect(0, 0, hudWidth, hudHeight);

    fillLeftInfoPanel();
    fillRightInfoPanel();
    fillMainPanel();

    drawMultipliers();

    hudTexture.needsUpdate = true;
    renderer.render(sceneHud, cameraHud);
}

function fillLeftInfoPanel() {
    hudContext.textAlign = 'left';
    hudContext.fillStyle = infoPanelTextColor;
    hudContext.font = "Normal " + infoPanelFontSize + "px Courier New";

    // Check if we're on mobile and adjust positioning to avoid top HUD
    const isMobile = window.innerWidth < 600;
    // Add extra offset on mobile to avoid the top HUD buttons
    const extraOffset = isMobile ? 0.08 : 0; // 0.08 is about the space the HUD buttons take

    hudContext.fillText(
        "SCORE".padEnd(7, " ") + currentScore.toString().padStart(4, "0"),
        hudWidth * infoPanelRelativeOffsetX,
        hudHeight * (infoPanelRelativeOffsetY + extraOffset + 0 * infoPanelRelativeOffsetYStep));
    hudContext.fillText(
        "TIME".padEnd(7, " ") + (currentTime / 59 | 0).toString().padStart(1, "0") + ":" + (currentTime % 59).toFixed(0).padStart(2, "0"),
        hudWidth * infoPanelRelativeOffsetX,
        hudHeight * (infoPanelRelativeOffsetY + extraOffset + 1 * infoPanelRelativeOffsetYStep));
    hudContext.fillText(
        "FUEL".padEnd(7, " ") + currentFuel.toFixed(0).padStart(4, "0"),
        hudWidth * infoPanelRelativeOffsetX,
        hudHeight * (infoPanelRelativeOffsetY + extraOffset + 2 * infoPanelRelativeOffsetYStep));
    if (isAlerted) {
        let fuelAlertText;
        if (hasFuel) {
            fuelAlertText = "LOW ON FUEL";
        }
        else {
            fuelAlertText = "OUT OF FUEL";
        }
        hudContext.fillText(
            fuelAlertText,
            hudWidth * infoPanelRelativeOffsetX,
            hudHeight * (infoPanelRelativeOffsetY + extraOffset + 3 * infoPanelRelativeOffsetYStep));
    }
}

function fillRightInfoPanel() {
    const isMobile = window.innerWidth < 600;
    // Add extra offset on mobile to avoid the top HUD buttons
    const extraOffset = isMobile ? 0.08 : 0; // 0.08 is about the space the HUD buttons take

    hudContext.textAlign = 'right';
    hudContext.fillStyle = infoPanelTextColor;
    hudContext.font = "Normal " + infoPanelFontSize + "px Courier New";

    // Always show altitude (critical info)
    hudContext.fillText(
        isMobile ? "ALT".padEnd(8, " ") : "ALTITUDE".padEnd(20, " ") + altitude.toFixed(0).padStart(4, "0"),
        hudWidth * (1 - infoPanelRelativeOffsetX),
        hudHeight * (infoPanelRelativeOffsetY + extraOffset + 0 * infoPanelRelativeOffsetYStep));

    // Show altitude value on next line for mobile
    if (isMobile) {
        hudContext.fillText(
            altitude.toFixed(0).padStart(4, "0"),
            hudWidth * (1 - infoPanelRelativeOffsetX),
            hudHeight * (infoPanelRelativeOffsetY + extraOffset + 0.5 * infoPanelRelativeOffsetYStep));
    }

    // Vertical speed (critical for landing)
    hudContext.fillText(
        isMobile ? "V-SPD".padEnd(8, " ") : "VERTICAL SPEED".padEnd(18, " ") + (-velocityY).toFixed(1).padStart(6, " "),
        hudWidth * (1 - infoPanelRelativeOffsetX),
        hudHeight * (infoPanelRelativeOffsetY + extraOffset + 1 * infoPanelRelativeOffsetYStep));

    if (isMobile) {
        hudContext.fillText(
            (-velocityY).toFixed(1).padStart(6, " "),
            hudWidth * (1 - infoPanelRelativeOffsetX),
            hudHeight * (infoPanelRelativeOffsetY + extraOffset + 1.5 * infoPanelRelativeOffsetYStep));
    }

    // Hide horizontal speed and rotation angle on very small screens
    if (!isMobile) {
        hudContext.fillText(
            "HORIZONTAL SPEED".padEnd(18, " ") + velocityX.toFixed(1).padStart(6, " "),
            hudWidth * (1 - infoPanelRelativeOffsetX),
            hudHeight * (infoPanelRelativeOffsetY + extraOffset + 2 * infoPanelRelativeOffsetYStep));
        hudContext.fillText(
            "ROTATION ANGLE".padEnd(18, " ") + (-lander.rotation.z * (180 / Math.PI)).toFixed(1).padStart(6, " "),
            hudWidth * (1 - infoPanelRelativeOffsetX),
            hudHeight * (infoPanelRelativeOffsetY + extraOffset + 3 * infoPanelRelativeOffsetYStep));
    }
}

function fillMainPanel() {
    hudContext.textAlign = 'center';

    // Check if we're on a small mobile screen
    const isMobile = window.innerWidth < 600;

    if (isGameOver) {
        hudContext.font = "Normal " + mainPanelFontSize + "px Courier New";
        hudContext.fillStyle = mainPanelTextColor;

        // On mobile, make the text more compact
        if (isMobile) {
            hudContext.fillText(
                "TAP TO PLAY",
                hudWidth * mainPanelRelativeOffsetX,
                hudHeight * (mainPanelRelativeOffsetY + 0 * mainPanelRelativeOffsetYStep));
        } else {
            hudContext.fillText(
                "PRESS ANY KEY TO PLAY",
                hudWidth * mainPanelRelativeOffsetX,
                hudHeight * (mainPanelRelativeOffsetY + 0 * mainPanelRelativeOffsetYStep));
            hudContext.fillText(
                "ARROW KEYS TO MOVE",
                hudWidth * mainPanelRelativeOffsetX,
                hudHeight * (mainPanelRelativeOffsetY + 1 * mainPanelRelativeOffsetYStep));
        }
    }
    else if (isBetweenRounds) {
        hudContext.font = "Normal " + statsPanelFontSize + "px Courier New";
        hudContext.fillStyle = statsPanelTextColor;

        let landingText, scoreText, fuelText, gameOverText;

        gameOverText = "";
        if (hasLanded) {
            // More compact landing messages for mobile
            landingText = isMobile ? (hasFuel ? "LANDED!" : "LANDED") : "SUCCESSFULLY LANDED";
            fuelText = isMobile ? (fuelChange >= 0 ? `+${fuelChange} FUEL` : `${fuelChange} FUEL`) : fuelChange.toFixed(0) + " FUEL UNITS GAINED";
            scoreText = isMobile ? `+${scoreChange}` : scoreChange + " POINTS GAINED";
        }
        else {
            // More compact crash messages for mobile
            if (crashInfo === "OUT OF BOUNDS") {
                landingText = isMobile ? "OUT OF BOUNDS" : "LANDER DESTROYED";
                scoreText = isMobile ? "OUT OF BOUNDS" : crashInfo;
            } else if (crashInfo === "TOO CLOSE TO EDGE OF TERRAIN") {
                landingText = isMobile ? "TOO CLOSE" : "LANDER DESTROYED";
                scoreText = isMobile ? "TOO CLOSE" : crashInfo;
            } else if (crashInfo === "CRASHED ON UNEVEN TERRAIN") {
                landingText = isMobile ? "CRASHED" : "LANDER DESTROYED";
                scoreText = isMobile ? "CRASHED" : crashInfo;
            } else if (crashInfo === "LANDING ANGLE WAS TOO HIGH") {
                landingText = isMobile ? "BAD ANGLE" : "LANDER DESTROYED";
                scoreText = isMobile ? "BAD ANGLE" : crashInfo;
            } else if (crashInfo === "LANDING VELOCITY WAS TOO HIGH") {
                landingText = isMobile ? "TOO FAST" : "LANDER DESTROYED";
                scoreText = isMobile ? "TOO FAST" : crashInfo;
            } else {
                landingText = isMobile ? "CRASHED" : "LANDER DESTROYED";
                scoreText = crashInfo;
            }

            fuelText = isMobile ? (fuelChange >= 0 ? `+${fuelChange} FUEL` : `${fuelChange} FUEL`) : fuelChange.toFixed(0) + " FUEL UNITS LOST";

            if (!hasFuel) {
                fuelText = isMobile ? "NO FUEL" : "OUT OF FUEL";
                gameOverText = isMobile ? "GAME OVER" : "GAME OVER";
            }
        }

        // Adjust positioning based on mobile state to save space
        let lineOffset = isMobile ? 0.7 : 1.0;
        let currentYStep = 0;

        hudContext.fillText(
            landingText,
            hudWidth * statsPanelRelativeOffsetX,
            hudHeight * (statsPanelRelativeOffsetY + currentYStep * statsPanelRelativeOffsetYStep));
        currentYStep += lineOffset;

        if (scoreText) {
            hudContext.fillText(
                scoreText,
                hudWidth * statsPanelRelativeOffsetX,
                hudHeight * (statsPanelRelativeOffsetY + currentYStep * statsPanelRelativeOffsetYStep));
            currentYStep += lineOffset;
        }

        if (fuelText) {
            hudContext.fillText(
                fuelText,
                hudWidth * statsPanelRelativeOffsetX,
                hudHeight * (statsPanelRelativeOffsetY + currentYStep * statsPanelRelativeOffsetYStep));
            currentYStep += lineOffset;
        }

        if (gameOverText) {
            hudContext.fillText(
                gameOverText,
                hudWidth * statsPanelRelativeOffsetX,
                hudHeight * (statsPanelRelativeOffsetY + currentYStep * statsPanelRelativeOffsetYStep));
        }
    }
}

function drawMultipliers() {
    if (isGameOver) return;
    
    // Clear the multipliers overlay
    multipliersContext.clearRect(0, 0, multipliersCanvas.width, multipliersCanvas.height);

    multipliersContext.textAlign = 'center';
    multipliersContext.fillStyle = multiplierFontColor;

    let fontSize = multiplierFontSize;
    if (isZoomed) fontSize *= zoom;
    multipliersContext.font = "Normal " + fontSize + "px Courier New";
    var i;
    for (i = 0; i < scoreMultipliers.length; i++) {
        let mul = scoreMultipliers[i];
        if (mul < 2) continue;

        let leftVector = lineSegments[i][0];
        let rightVector = lineSegments[i][1];
        let pointX, pointY;
        pointX = (leftVector.x + rightVector.x) / 2;
        pointY = leftVector.y;

        let hudPoint = worldToHudCoord(pointX, pointY);
        const text = "X" + mul;
        
        // Draw text
        multipliersContext.fillStyle = multiplierFontColor;
        multipliersContext.fillText(text, hudPoint[0], hudPoint[1] + fontSize);
    }
}

// Function to format large numbers in a compact way (e.g., 1.6m instead of full number)
function formatCompactNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'm';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    } else {
        return num.toFixed(1);
    }
}

// Function to format balance text for compact display
function formatBalanceText(balance) {
    // For very large numbers, use compact format
    if (balance >= 1000) {
        return formatCompactNumber(balance) + 'm00nad';
    } else {
        return balance.toFixed(1) + 'm00nad';
    }
}

function worldToHudCoord(wx, wy) {
    let hx, hy;

    if (isZoomed) {
        wx -= camera.position.x;
        wy -= camera.position.y;
        wx *= zoom;
        wy *= zoom;
    }

    hx = (wx / gameWidth + 0.5) * hudWidth;
    hy = (1 - (wy / gameHeight + 0.5)) * hudHeight;

    return [hx, hy];
}