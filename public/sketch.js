let capture;
let myShader;
let vertShader;
let fragCode;

let windData;

function preload() {
  // シェーダーファイルを読み込む
  // myShader = loadShader('basic.vert', 'basic.frag');

  // 頂点シェーダーは変更しないので事前に読み込む
  vertShader = `
    attribute vec3 aPosition;
    void main() {
      gl_Position = vec4(aPosition, 1.0);
    }
  `;
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  capture = createCapture(VIDEO);
  capture.hide();

  // 初期シェーダーを設定
  fragCode = `
    precision highp float;
    uniform vec2 u_resolution;
    uniform float u_time;
    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution.xy;
      vec3 color = vec3(uv.x, uv.y, sin(u_time) * 0.5 + 0.5);
      gl_FragColor = vec4(color, 1.0);
    }
  `;
  myShader = createShader(vertShader, fragCode);
  // シェーダーをセット
  shader(myShader);
  myShader.setUniform('u_resolution', [width, height]);
}

function draw() {
  background(220);

  //カメラからの映像はcaptureで利用できるが一旦getしてイメージとして扱うほうが軽量
  let img = capture.get();


  // カメラ映像から風向と風速を取得
  windData = getWindFromCamera(img);

  // デバッグ表示
  // 風向を矢印で表示
  // translate(-img.width / 2, -img.height / 2);
  // image(img, 0, 0);
  // push();
  // translate(windData.centerX, windData.centerY);
  // rotate(windData.angle);
  // stroke(255, 0, 0);
  // strokeWeight(2);
  // line(0, 0, windData.dist, 0);
  // line(windData.dist, 0, windData.dist - 10, -5);
  // line(windData.dist, 0, windData.dist - 10, 5);
  // pop();

  // 
  myShader.setUniform('u_time', millis() / 1000.0);
  // noStroke();
  rect(-width / 2, -height / 2, width, height);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

async function mouseClicked() {
  console.log("mouseClicked");

  const reply = await ollama("風の向きは " + degrees(windData.angle).toFixed(2) + " 度、風速は " + windData.dist.toFixed(2) + " です。これを元に風をイメージした色をシェーダーで表現してください。説明やコメントアウトは不要で、シェーダーコードだけを返してください。");

  console.log("Ollama reply:", reply);

  // シェーダーを切り替える
  // fragCode = `
  //   precision highp float;
  //   uniform vec2 u_resolution;
  //   uniform float u_time;
  //   void main() {
  //     vec3 color = vec3(0, 0, sin(u_time) * 0.5 + 0.5);
  //     gl_FragColor = vec4(color, 1.0);
  //   }
  // `;
  // myShader = createShader(vertShader, fragCode);
  // shader(myShader);
  // myShader.setUniform('u_resolution', [width, height]);
}

// カメラ映像から風光と風速を取得
function getWindFromCamera(img) {

  const centerX = img.width / 2;
  const centerY = img.height / 2;
  const stepSize = 10;
  const overThresholdRed = 200;
  const underThresholdBlue = 100;
  const underThresholdGreen = 100;
  // const colorThreshold = 350;

  let returnData = {
    angle: 0,
    dist: 0,
    centerX: centerX,
    centerY: centerY,
  };

  img.loadPixels();
  for (let y = 0; y < img.height; y += stepSize) {
    for (let x = 0; x < img.width; x += stepSize) {
      const index = (y * img.width + x) * 4;
      // if (y == centerX && x == centerY) {
      //   console.log(img.pixels[index]);
      // }
      // ピクセルの色を取得
      const r = img.pixels[index];
      const g = img.pixels[index + 1];
      const b = img.pixels[index + 2];
      const colorDist = dist(r, g, b, 255, 0, 0); // 赤色との距離

      // if (colorDist > colorThreshold) {
      if (r > overThresholdRed && g < underThresholdGreen && b < underThresholdBlue) {
        const d = dist(x, y, centerX, centerY);
        // 中心からの距離が最も遠い点を風向とする
        if (returnData.dist < d) {
          returnData.dist = d;
          returnData.angle = atan2(y - centerY, x - centerX);
        }
      }
    }
  }

  return returnData;
}

const conversationHistory = [];
async function ollama(message) {
  conversationHistory.push({ role: 'user', content: message });
  try {
    console.log('post');
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemma3', // 使用するモデルを指定
        messages: conversationHistory,
        stream: false,
      }),
    });
    console.log('response');
    const data = await response.json();
    const reply = data.message.content;
    conversationHistory.push({
      role: 'assistant', content: reply
    });
    return reply;
  } catch (error) {
    console.error('Error communicating with Ollama API:', error);
    return 'Error: Unable to get response from Ollama API.';
  }
}