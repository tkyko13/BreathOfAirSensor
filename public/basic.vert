attribute vec3 aPosition;

void main() {
  // 頂点の最終的な位置を設定
  gl_Position = vec4(aPosition, 1.0);
}