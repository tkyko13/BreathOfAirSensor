// 浮動小数点数の精度を設定
precision highp float;

// p5.jsから受け取る変数
uniform vec2 u_resolution;
uniform float u_time;

void main() {
  // ピクセルの座標を0.0から1.0の範囲に正規化
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  
  // 時間を使って色を変化させる
  vec3 color = vec3(uv.x, uv.y, sin(u_time) * 0.5 + 0.5);
  
  // 最終的なピクセルの色を出力
  gl_FragColor = vec4(color, 1.0);
}