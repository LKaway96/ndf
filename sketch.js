// Hand Pose Detection with ml5.js
// https://thecodingtrain.com/tracks/ml5js-beginners-guide/ml5/hand-pose

let video;
let handPose;
let hands = [];
let circles = [];
let primes = [2, 3, 5, 7];
let caughtPrimes = [];
let lastSpawnTime = 0;
let spawnInterval = 1500; // 1.5秒
let gameClear = false;
let gameState = "intro"; // intro: 規則說明, play: 遊戲進行, over: 結束, clear: 過關

function preload() {
  // Initialize HandPose model with flipped video input
  handPose = ml5.handPose({ flipped: true });
}

function mousePressed() {
  console.log(hands);
}

function gotHands(results) {
  hands = results;
}

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO, { flipped: true });
  video.hide();

  // 產生10個圓形，x隨機，y在畫面上方
  for (let i = 0; i < 10; i++) {
    circles.push({
      x: random(40, width - 40),
      y: random(-400, -40),
      label: i
    });
  }

  // Start detecting hands
  handPose.detectStart(video, gotHands);

  circles = [];
  caughtPrimes = [];
  lastSpawnTime = millis();
  gameClear = false;
}

let maxCircles = 10;
let life = 3;
let gameOver = false;
let restartBtn = { x: 0, y: 0, w: 180, h: 60 };

function draw() {
  background(255);

  if (gameState === "intro") {
    // 規則說明頁
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(32);
    text("數字氣球質數手勢遊戲", width/2, 80);
    textSize(20);
    text(
      "規則：\n" +
      "1. 畫面會掉落數字氣球（0~9）。\n" +
      "2. 用兩手使指間牽起的紅線接住質數（2,3,5,7）。\n" +
      "3. 接到非質數或質數掉到底沒接到會扣血。\n" +
      "4. 生命值歸零遊戲結束，接到所有質數即過關。\n\n" +
      "請點擊畫面任意處開始遊戲！",
      width/2, height/2
    );
    return;
  }

  if (gameOver) {
    background(0, 150);
    fill(255, 0, 0);
    textAlign(CENTER, CENTER);
    textSize(48);
    text("Game Over", width / 2, height / 2 - 40);

    // 顯示重新開始按鈕
    restartBtn.x = width / 2 - restartBtn.w / 2;
    restartBtn.y = height / 2 + 20;
    fill(255);
    stroke(0);
    rect(restartBtn.x, restartBtn.y, restartBtn.w, restartBtn.h, 20);
    fill(0);
    noStroke();
    textSize(28);
    text("重新開始", width / 2, restartBtn.y + restartBtn.h / 2);
    return;
  }

  if (gameClear) {
    background(0, 150);
    fill(0, 255, 0);
    textAlign(CENTER, CENTER);
    textSize(48);
    text("恭喜過關", width / 2, height / 2 - 40);

    // 顯示重新開始按鈕
    restartBtn.x = width / 2 - restartBtn.w / 2;
    restartBtn.y = height / 2 + 20;
    fill(255);
    stroke(0);
    rect(restartBtn.x, restartBtn.y, restartBtn.w, restartBtn.h, 20);
    fill(0);
    noStroke();
    textSize(28);
    text("重新開始", width / 2, restartBtn.y + restartBtn.h / 2);
    return;
  }

  // 計算置中位置
  let x = (width - video.width) / 2;
  let y = (height - video.height) / 2;
  image(video, x, y, video.width, video.height);

  // 畫出手部關鍵點
  if (hands.length > 0) {
    for (let hand of hands) {
      if (hand.confidence > 0.1) {
        for (let i = 0; i < hand.keypoints.length; i++) {
          let keypoint = hand.keypoints[i];
          if (hand.handedness == "Left") {
            fill(255, 0, 255);
          } else {
            fill(255, 255, 0);
          }
          noStroke();
          circle(keypoint.x + x, keypoint.y + y, 16);
        }
      }
    }
  }

  // 如果同時偵測到兩隻手，畫紅線連接兩手食指
  if (hands.length >= 2) {
    let hand1 = hands[0];
    let hand2 = hands[1];
    if (
      hand1.confidence > 0.1 &&
      hand2.confidence > 0.1 &&
      hand1.keypoints.length > 8 &&
      hand2.keypoints.length > 8
    ) {
      let idx1 = hand1.keypoints[8];
      let idx2 = hand2.keypoints[8];
      stroke(255, 0, 0);
      strokeWeight(6);
      line(
        idx1.x + x,
        idx1.y + y,
        idx2.x + x,
        idx2.y + y
      );
      noStroke();
    }
  }

  // 畫生命值（左上角愛心icon）
  drawLife();

  // 依序每1.5秒產生一顆新圓球，直到10顆
  if (circles.length < maxCircles && millis() - lastSpawnTime > spawnInterval) {
    spawnCircle();
    lastSpawnTime = millis();
  }

  // 畫圓球與判斷
  for (let i = circles.length - 1; i >= 0; i--) {
    let c = circles[i];
    fill(0, 150, 255);
    noStroke();
    circle(c.x, c.y, 40);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(24);
    text(c.label, c.x, c.y);

    // 讓圓形往下掉
    c.y += 2;

    // 判斷是否被紅線接住
    if (hands.length >= 2 && isCircleCaughtByLine(c)) {
      if (primes.includes(c.label)) {
        if (!caughtPrimes.includes(c.label)) caughtPrimes.push(c.label);
        // 若接住所有質數就過關
        if (caughtPrimes.length === primes.length) gameClear = true;
      } else {
        // 接到非質數，扣血
        life--;
        if (life <= 0) gameOver = true;
      }
      // 重生圓球
      c.x = random(40, width - 40);
      c.y = random(-200, -40);
      circles.splice(i, 1); // 移除被接住的圓球
    } else if (c.y > height + 20) {
      // 掉到底部
      if (primes.includes(c.label)) {
        // 質數沒接到，扣血
        life--;
        if (life <= 0) gameOver = true;
      }
      // 重生圓球
      c.x = random(40, width - 40);
      c.y = random(-200, -40);
    }
  }


  // 左下角顯示已經被接到的質數
  let gotPrimes = primes.filter(p => caughtPrimes.includes(p));
  fill(0, 200, 0);
  textSize(20);
  textAlign(LEFT, BOTTOM);
  text("已接到質數: " + gotPrimes.join(" "), 20, height - 20);
}

// 判斷圓形是否被紅線接住
function isCircleCaughtByLine(circle) {
  let hand1 = hands[0];
  let hand2 = hands[1];
  let idx1 = hand1.keypoints[8];
  let idx2 = hands[1].keypoints[8];
  // 線段到圓心的最短距離
  let d = distToSegment(
    circle.x, circle.y,
    idx1.x, idx1.y,
    idx2.x, idx2.y
  );
  return d < 20; // 20為圓半徑
}

// 計算點到線段的最短距離
function distToSegment(px, py, x1, y1, x2, y2) {
  let l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  if (l2 === 0) return dist(px, py, x1, y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = max(0, min(1, t));
  return dist(px, py, x1 + t * (x2 - x1), y1 + t * (y2 - y1));
}

// 畫生命值
function drawLife() {
  for (let i = 0; i < life; i++) {
    fill(255, 0, 0);
    noStroke();
    // 畫愛心icon
    beginShape();
    vertex(30 + i * 40, 30);
    bezierVertex(30 + i * 40 - 10, 10, 30 + i * 40 - 30, 30, 30 + i * 40, 50);
    bezierVertex(30 + i * 40 + 30, 30, 30 + i * 40 + 10, 10, 30 + i * 40, 30);
    endShape(CLOSE);
  }
}

function mousePressed() {
  if (gameState === "intro") {
    gameState = "play";
    restartGame();
    return;
  }

  if (gameOver) {
    if (
      mouseX > restartBtn.x &&
      mouseX < restartBtn.x + restartBtn.w &&
      mouseY > restartBtn.y &&
      mouseY < restartBtn.y + restartBtn.h
    ) {
      restartGame();
    }
  }

  // 在過關畫面點擊重新開始
  if (gameClear) {
    if (
      mouseX > restartBtn.x &&
      mouseX < restartBtn.x + restartBtn.w &&
      mouseY > restartBtn.y &&
      mouseY < restartBtn.y + restartBtn.h
    ) {
      restartGame();
    }
  }
}

function restartGame() {
  life = 3;
  gameOver = false;
  gameClear = false;
  caughtPrimes = [];
  circles = [];
  lastSpawnTime = millis();
  gameState = "play";
  // 其餘初始化內容
}

// 產生不重疊的新圓球
function spawnCircle() {
  let tries = 0;
  let maxTries = 20;
  let newCircle;
  let primeNumbers = [2, 3, 5, 7];
  let nonPrimes = [0, 1, 4, 6, 8, 9];
  do {
    let x = random(40, width - 40);
    let y = -40;
    let isPrime = random() < 0.5;
    let label;
    if (isPrime) {
      // 只從還沒被接過的質數中選
      let remainPrimes = primeNumbers.filter(p => !caughtPrimes.includes(p));
      if (remainPrimes.length === 0) {
        // 如果都接過了，這次產生非質數
        label = random(nonPrimes);
      } else {
        label = random(remainPrimes);
      }
    } else {
      label = random(nonPrimes);
    }
    newCircle = { x, y, label };
    tries++;
  } while (isOverlapping(newCircle) && tries < maxTries);
  if (tries < maxTries) circles.push(newCircle);
}

// 檢查新圓球是否與現有圓球重疊
function isOverlapping(circle) {
  for (let c of circles) {
    if (dist(c.x, c.y, circle.x, circle.y) < 50) return true;
  }
  return false;
}


