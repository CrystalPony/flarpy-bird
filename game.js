var cnv = document.getElementById('canvas');
cnv.addEventListener("mousedown", onInput);
cnv.addEventListener("mousemove", onMouseMove);
cnv.oncontextmenu = function () { return false; }
cnv.onselectstart = function () { return false; }
document.onkeypress = ((e) => {
	if (e.keyCode == 32) {
			e.preventDefault();
			onInput(e, true);
	}
});
document.onmousedown = ((e) => {
	if (e.button == 1) {
		return false;
	}
});

var ctx = cnv.getContext('2d');
ctx.font = "30px cmon_nearnormal";
textAlign("center");

const toLoad = 6;
var loaded = 0;
function onload() { loaded++; } 

var bg1 = new Image();
var bg2 = new Image();
var birdUp = new Image();
var birdDown = new Image();
var spike = new Image();
var egg = new Image();
var coinImage = new Image();
var restartButton = new Image();
var restartButtonPressed = new Image();
var submitButton = new Image();
var submitButtonPressed = new Image();
bg1.src = "images/background/layer-1.png";
bg2.src = "images/background/layer-2.png";
birdUp.src = "images/bird/frame-1.png";
birdDown.src = "images/bird/frame-2.png";
spike.src = "images/obstacles/spike.png";
egg.src = "images/egg.png";
coinImage.src = "images/arweave.png";
restartButton.src = "images/ui/restart-button.png";
restartButtonPressed.src = "images/ui/restart-button-pressed.png";
submitButton.src = "images/ui/submit-button.png";
submitButtonPressed.src = "images/ui/submit-button-pressed.png";

const startBirdX = 50;
const birdXAcceleration = 0.1;
const gravity = 0.03;
const jumpForce = -0.35;
const maxAcceleration = 15;

var bgWidth, bgPos1 = 0, bgPos2 = 0;
var birdX;
var birdY;
var birdTraveledX;
var eggTraveledX;
var birdAcceleration = 0;
var birdXSpeed = 0;
var spikeLowY;

bg1.onload = function() {
	bgWidth = bg1.width*(cnv.height/bg1.height);
	loaded++;
};
birdUp.onload = function() {
	initBirdPosition();
	loaded++;
};
spike.onload = function() {
	spikeLowY = cnv.height - spike.height / 2;
	loaded++;
};
bg2.onload = birdDown.onload = coinImage.onload = onload;

const startBackSpeed = 0.011;
const startForeSpeed = 0.088;
const foreAcceleration = 0.0000017;
const backAcceleration = 0.0000029;
const foreMaxSpeed = 0.26;
const backMaxSpeed = 0.17;

var backSpeed = startBackSpeed;
var foreSpeed = startForeSpeed;

var spikes = [];

const spikesGapX = 220;
const spikesGapY = 100;
const spikesDelay = 0;
const groundY = 400;
const eggGroundY = 420;
const skyY = 0;
const noobHelpX = 5;
const noobHelpY = 7;

var spikesSpawning = false;

var coins = [];

const coinSpawnChance = 0.1;
const coinSpawnIgnoreCount = 2;

var coinCurrentIgnoreCount = 0;

var gameStarted = false;
var gameOver = false;
var deathTime;

const fadeOutAlpha = 0.8
const fadeOutSpeed = 0.002;
const fadeInSpeed = 0.004;
const fadeOutDelay = 500;

var currentFadeOutAlpha = 0;

const startDelay = 500;

var startTime;
var lastTickTime = new Date();
var elapsed = 0;

const tapToStartMinX = -canvas.width / 2;

var tapToStartX = canvas.width / 2;

const flapAnimationDuration = 50;
const flapAnimationPreStartDuration = 60;

var flapAnimationStartTime = new Date();
var currentBirdSprite = birdUp;

var score = 0;
var lastScore;

const maxEggs = 100;
var eggs = [];

const restartButtonY = 350;
const submitButtonY = 420;
const buttonPressedAnimationDuration = 100;
const restartDelay = 800;

var mousePosition;
var restartButtonIsPressed = false;
var submitButtonIsPressed = false;
var buttonPressedTimer;
var restarting = false;

var submittingScore = false;
var scoreSubmitted = false;

function update(){
	let currentTickTime = new Date();
	elapsed = currentTickTime - lastTickTime;
	
	if (loaded == toLoad) {
		drawBgBack();
		drawSpikes();
		drawBgFront();
		drawEggs();
		drawCoins();
		drawBird();
		fadeOut();
		drawScore();
		drawGameStart();
		drawGameOver();
		
		accelerateGame();
		detectCollisions();
	}
	
	lastTickTime = currentTickTime;
	
	requestAnimationFrame(update);
}

function drawGameStart() {
	if (tapToStartX > tapToStartMinX) {
		ctx.font = "20px cmon_nearnormal";
		ctx.fillText("TAP TO START", tapToStartX, 370);
		ctx.font = "30px cmon_nearnormal";
		
		if (gameStarted) {
			tapToStartX -= foreSpeed * elapsed;
		}
	}
}

function drawScore() {
	ctx.fillStyle = "#000000";
	ctx.globalAlpha = 1 - (currentFadeOutAlpha * (1 / fadeOutAlpha));
	ctx.font = "20px cmon_nearnormal";
	textAlign("left");
	ctx.fillText(score, 20, 38);
	textAlign("center");
	ctx.font = "30px cmon_nearnormal";
	ctx.globalAlpha = 1;
}

function drawGameOver() {
	if (gameOver) {
		ctx.fillStyle = "#ffffff";
		ctx.globalAlpha = currentFadeOutAlpha * (1 / fadeOutAlpha);
		ctx.fillText("EGGED", cnv.width / 2, 100);
		if (score >= 10) {
			ctx.fillStyle = "#00ff00";
		} else if (score >= 20) {
			ctx.fillStyle = "#ff00ff";
		} else if (score >= 50) {
			ctx.fillStyle = "#ff8d10";
		} else {
			ctx.fillStyle = "#ffff00";
		}
		
		ctx.fillText(`YOU GOT ${lastScore}`, cnv.width / 2, cnv.height / 2 - 30);
		ctx.fillStyle = "#000000";
		
		if ((restartButtonIsPressed || submitButtonIsPressed) && new Date() - buttonPressedTimer > buttonPressedAnimationDuration) {
			restartButtonIsPressed = submitButtonIsPressed = false;
		}
		
		ctx.drawImage(restartButtonIsPressed ? restartButtonPressed : restartButton, (cnv.width - restartButton.width) / 2, restartButtonY);
		ctx.drawImage(submitButtonIsPressed ? submitButtonPressed : submitButton, (cnv.width - submitButton.width) / 2, submitButtonY);		
		
		ctx.globalAlpha = 1;
	}
}

function checkButtonPress(x, y, width, height) {
	if (mousePosition == null) {
		return false;
	}
	return (mousePosition[0] < x + width &&
		mousePosition[0] > x &&
		mousePosition[1] < y + height &&
		mousePosition[1] > y);
}

function fadeOut() {
	if (currentFadeOutAlpha > 0) {
		ctx.globalAlpha = currentFadeOutAlpha;
		ctx.fillRect(0, 0, cnv.width, cnv.height);
		ctx.globalAlpha = 1;
	}
	
	if (gameOver && new Date() - deathTime > fadeOutDelay) {
		if (!restarting && currentFadeOutAlpha < fadeOutAlpha) {
			currentFadeOutAlpha += fadeOutSpeed * elapsed;
			if (currentFadeOutAlpha > fadeOutAlpha) {
				currentFadeOutAlpha = fadeOutAlpha;
			}
		} else if (restarting && currentFadeOutAlpha > 0) {
			currentFadeOutAlpha -= fadeInSpeed * elapsed;
			if (currentFadeOutAlpha <= 0) {
				currentFadeOutAlpha = 0;
				gameOver = false;
			}
		}
	}
}

function accelerateGame() {
	if (!gameOver) {
		if (backSpeed < backMaxSpeed) {
			backSpeed += backAcceleration * elapsed;
			if (backSpeed > backMaxSpeed) {
				backSpeed = backMaxSpeed;
			}
		}
		if (foreSpeed < foreMaxSpeed) {
			foreSpeed += foreAcceleration * elapsed;
			if (foreSpeed > foreMaxSpeed) {
				foreSpeed = foreMaxSpeed;
			}
		}
	}
}

function detectCollisions() {
	if (gameOver) {
		if (birdY > eggGroundY) {
			birdY = eggGroundY;
		}
	} else {
		spikes.forEach(s => {
			if ((birdX < s[0] + spike.width - noobHelpX &&
				birdX + birdUp.width - noobHelpX > s[0] &&
				(birdY < s[1] + spike.height - noobHelpY &&
				birdY + birdUp.height - noobHelpY > s[1] ||
				birdY < s[1] - spike.height - spikesGapY + spike.height - noobHelpY &&
				birdY + birdUp.height - noobHelpY > s[1] - spike.height - spikesGapY)) ||
				birdY > groundY || birdY < skyY) {
					endTheGame();
				} else if (birdX > s[0] + spike.width && !s[3]) {
					score++;
					s[3] = true;
				}
		});
		
		let coinsToRemove = [];
		coins.forEach(c => {
			if (birdX < c[0] + coinImage.width &&
				birdX + birdUp.width > c[0] &&
				birdY < c[1] + coinImage.height &&
				birdY + birdUp.height > c[1]) {
					score++;
					coinsToRemove.push(c);
				}
		});
		
		coinsToRemove.forEach(c => {
			coins.splice(coinsToRemove.indexOf(c), 1);
		});
	}
}

function endTheGame() {
	currentBirdSprite = egg;
	birdAcceleration = jumpForce / 2;
	gameOver = true;
	lastScore = score;
	deathTime = new Date();
}

function drawCoins() {
	coins.forEach(c => drawCoin(c));
	
	if (coins.length > 0) {
		tryKillCoin(coins[0]);
	}
}

function tryKillCoin(coin) {
	if (coin[0] < -coinImage.width) {
		coins.shift();
	}
}

function drawCoin(c) {
	ctx.drawImage(coinImage, c[0], c[1]);	
	
	c[0] -= foreSpeed * elapsed;
}

function drawBird() {
	ctx.drawImage(currentBirdSprite, birdX, birdY);
	
	if (gameStarted) {
		if (currentBirdSprite == birdDown && new Date() - flapAnimationStartTime >= flapAnimationDuration) {
			currentBirdSprite = birdUp;
		}
		
		birdTraveledX += foreSpeed * elapsed;
		eggTraveledX += foreSpeed * elapsed;
	} else if (new Date() - flapAnimationStartTime >= flapAnimationPreStartDuration) {
		currentBirdSprite = currentBirdSprite == birdDown ? birdUp : birdDown;
		flapAnimationStartTime = new Date();
	}
	
	birdAcceleration = Math.max(Math.min(birdAcceleration, maxAcceleration), -maxAcceleration)
	birdY += birdAcceleration * elapsed;
	if (gameStarted && new Date() - startTime > startDelay || birdAcceleration) {
		birdAcceleration += gravity;
	}
	
	if (gameOver && !restarting) {
		birdX -= foreSpeed * elapsed * birdXSpeed;
		birdTraveledX -= foreSpeed * elapsed * birdXSpeed;
		if (birdXSpeed < 1) {
			birdXSpeed += birdXAcceleration;
			if (birdXSpeed > 1) {
				birdXSpeed = 1;
			}
		}
	}
}

function drawEggs() {
	if (gameStarted) {
		eggs.forEach((e) => {
			ctx.drawImage(egg, e + startBirdX - eggTraveledX, eggGroundY);
		});
	}
}

function drawBgBack(){
	ctx.drawImage(bg1, bgPos1, 0, bgWidth, cnv.height);	
	ctx.drawImage(bg1, bgPos1 + bgWidth, 0, bgWidth, cnv.height);
	
	bgPos1 -= backSpeed * elapsed;
	
	if (bgPos1 <= -bgWidth) {
		bgPos1 += bgWidth;
	}
}

function drawBgFront(){
	ctx.drawImage(bg2, bgPos2, 0, bgWidth, cnv.height);
	ctx.drawImage(bg2, bgPos2 + bgWidth, 0, bgWidth, cnv.height);

	bgPos2 -= foreSpeed * elapsed;
	
	if (bgPos2 <= -bgWidth) {
		bgPos2 += bgWidth;
	}
}

function drawSpikes() {
	if (!spikesSpawning) {
		if (gameStarted && new Date() - startTime >= spikesDelay) {
			spikesSpawning = true;
		}
	} else {
		
		if (spikes.length == 0) {
			spawnSpike();
		}
		
		spikes.forEach(s => updateSpike(s));
		trySpawnSpike(spikes[spikes.length - 1]);
		tryKillSpike(spikes[0]);
	}
}

function trySpawnSpike(s) {
	if (cnv.width - s[0] > spikesGapX && !s[2]) {
		s[2] = true;
		spawnSpike();
	} 
}

function tryKillSpike(s) {
	if (s[0] < -spike.width) {
		spikes.shift();
	}
}

function updateSpike(s) {
	ctx.drawImage(spike, s[0], s[1]);	
	mirrorImage(ctx, spike, s[0], s[1] - spike.height - spikesGapY, false, true);

	s[0] -= foreSpeed * elapsed;
}

function spawnSpike() {
	let yOffset = getRandomInt(-32, 125);
	let sp = [cnv.width, spikeLowY - yOffset];
	spikes.push(sp);
	
	trySpawnCoin(cnv.width);
}

function trySpawnCoin(spikeX) {
	if (coinCurrentIgnoreCount < coinSpawnIgnoreCount) {
		coinCurrentIgnoreCount++;
	} else if (Math.random() < coinSpawnChance) {
		let coin = [spikeX + (spike.width + spikesGapX - coinImage.width) / 2 + 5,
				getRandomInt(coinImage.width * 2, cnv.height - coinImage.width * 5)];
		coins.push(coin);
	}
}

function onInput(e, forceRestartButton = false) {
	if (!gameOver) {
		if (!gameStarted) {
			gameStarted = true;
			restarting = false;
			startTime = new Date();
		}
		birdAcceleration = jumpForce;
		currentBirdSprite = birdDown;
		flapAnimationStartTime = new Date();
	} else if (!restarting && !restartButtonIsPressed && !submitButtonIsPressed && new Date() - deathTime > restartDelay){
		if (forceRestartButton || checkButtonPress((cnv.width - restartButton.width) / 2, restartButtonY, restartButton.width, restartButton.height)) {
			eggs.push(birdTraveledX);
			
			restartButtonIsPressed = true;
			restarting = true;
			gameStarted = false;
			scoreSubmitted = false;
			
			score = 0;
			initBirdPosition();
			birdAcceleration = 0;
			birdXSpeed = 0;
			backSpeed = startBackSpeed;
			foreSpeed = startForeSpeed;
			spikesSpawning = false;
			coinCurrentIgnoreCount = 0;
			currentBirdSprite = birdUp;
			spikes = [];
			coins = [];
			tapToStartX = canvas.width / 2
			
		} else if (checkButtonPress((cnv.width - submitButton.width) / 2, submitButtonY, submitButton.width, submitButton.height)) {
			if (!submittingScore && !scoreSubmitted) {
				submitButtonIsPressed = true;
				
				submittingScore = true;
				submitScore(score, birdTraveledX, (result) => {
					scoreSubmitted = result;
					submittingScore = false;
				});
			}
		}
		
		if (restartButtonIsPressed || submitButtonIsPressed) {
			buttonPressedTimer = new Date();
		}
	}
	return false;
}

function onMouseMove(e) {
	mousePosition = [e.offsetX, e.offsetY];
}

function initBirdPosition() {
	birdX = startBirdX;
	birdY = (cnv.height - birdUp.height) / 2;
	birdTraveledX = eggTraveledX = 0;
}

function mirrorImage(ctx, image, x = 0, y = 0, horizontal = false, vertical = false){
    ctx.save();
    ctx.setTransform(
        horizontal ? -1 : 1, 0, // set the direction of x axis
        0, vertical ? -1 : 1,   // set the direction of y axis
        x + (horizontal ? image.width : 0), // set the x origin
        y + (vertical ? image.height : 0)   // set the y origin
    );
    ctx.drawImage(image,0,0);
    ctx.restore();
}

function getRandomInt(min, max) {
	return Math.floor(Math.random() * Math.floor(max - min)) + min;
}

function textAlign(p) {
	ctx.textAlign = p;
	ctx.textBaseline = p;
}

function getUnique(array, count) {
	var tmp = array.slice(array);
	var ret = [];
  
	for (var i = 0; i < Math.min(array.length, count); i++) {
		var index = Math.floor(Math.random() * tmp.length);
		var removed = tmp.splice(index, 1);
		
		ret.push(removed[0]);
	}
	return ret;  
}

function updateHighScores() {
	getHighScores().then((scores) => {
		let scores10 = [];
		let ids = [];
		for (let i = 0; i < scores.length; i++) {
			if (!ids.includes(scores[i].id) && !isNaN(scores[i].score)) {
				ids.push(scores[i].id);
				scores10.push(scores[i]);
				if (scores10.length == 10) {
					break
				}
			}	
		}
		document.getElementById("high-scores").innerHTML = scoresToHtml(scores10);
		document.getElementById("scores").innerHTML = scoresToHtml(scores);
		
		randomEggs = scores.filter(s => s.position);
		randomEggs = getUnique(randomEggs, maxEggs);
		randomEggs.forEach((e) => {
			try {
				eggs.push(parseFloat(e.position));
			} catch (e) { }
		});
	});
}

function scoresToHtml(scores) {
	let html = '';
	scores.forEach((item) => {
	   html += `<a href="https://viewblock.io/arweave/address/${item.id}" target="_blank">${item.id}</a> ${+item.score}<br><br>`;
	});
	return html;
}

function showScoresPage() {
	document.getElementById("game-elements").setAttribute("hidden", true);
	document.getElementById("scores-elements").removeAttribute("hidden");
}

function showGamePage() {
	document.getElementById("game-elements").removeAttribute("hidden");
	document.getElementById("scores-elements").setAttribute("hidden", true);
}
	
updateHighScores();
update();