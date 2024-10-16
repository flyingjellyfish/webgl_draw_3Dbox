//初始化canvas
const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl");
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.0, 1.0, 1.0, 0.1);

//顶点着色器
const vertexShaderSource = `
    attribute vec4 apos;
    attribute vec4 acolor;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    varying lowp vec4 vColor;
    void main(void) {
        gl_Position = uProjectionMatrix * uModelViewMatrix * apos;
        vColor = acolor;
    }
`;

//片元着色器
const fragmentShaderSource = `
    varying lowp vec4 vColor;
    void main(void) {
        gl_FragColor = vColor;
    }
`;

//初始化着色器程序
function initShaderProgram(gl) {
  //创建着色器
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  //绑定着色器源码
  gl.shaderSource(vertexShader, vertexShaderSource);
  gl.shaderSource(fragmentShader, fragmentShaderSource);
  //编译着色器
  gl.compileShader(vertexShader);
  gl.compileShader(fragmentShader);
  //创建程序对象，连接指定的着色器
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  return shaderProgram;
}

var isDragging = false;
var prePos = { x: 0, y: 0 };
var rotation = { x: 0, y: 0 }; //旋转
var zoom = -6.0; //缩放
var translation = { x: 0, y: 0 }; //平移

//鼠标拖动旋转
canvas.addEventListener("mousedown", (event) => {
  isDragging = true;
  prePos = { x: event.clientX, y: event.clientY };
});

canvas.addEventListener("mousemove", (event) => {
  if (isDragging) {
    const deltaX = event.clientX - prePos.x;
    const deltaY = event.clientY - prePos.y;

    //更新旋转角度
    rotation.x += deltaY * 0.01;
    rotation.y += deltaX * 0.01;

    prePos = { x: event.clientX, y: event.clientY };
  }
});

canvas.addEventListener("mouseup", () => {
  isDragging = false;
});

//鼠标缩放
canvas.addEventListener("wheel", (event) => {
  zoom += event.deltaY * 0.01;
});

//键盘上下左右平移
window.addEventListener("keydown", (event) => {
  const key = event.key;
  switch (key) {
    case "ArrowUp":
      translation.y += 0.1;
      break;
    case "ArrowDown":
      translation.y -= 0.1;
      break;
    case "ArrowLeft":
      translation.x -= 0.1;
      break;
    case "ArrowRight":
      translation.x += 0.1;
      break;
  }
});

//立方体数据
const cubeVertices = new Float32Array([
  // 前
  -1.0,
  -1.0,
  1.0, // 0
  1.0,
  -1.0,
  1.0, // 1
  1.0,
  1.0,
  1.0, // 2
  -1.0,
  1.0,
  1.0, // 3
  // 后
  -1.0,
  -1.0,
  -1.0, // 4
  1.0,
  -1.0,
  -1.0, // 5
  1.0,
  1.0,
  -1.0, // 6
  -1.0,
  1.0,
  -1.0, // 7
]);

const cubeColors = new Float32Array([
  // 前
  1.0,
  0.0,
  0.0,
  1.0, //r
  0.0,
  1.0,
  0.0,
  1.0, //g
  0.0,
  0.0,
  1.0,
  1.0, //b
  1.0,
  0.0,
  0.0,
  1.0, //r
  // 后
  1.0,
  0.0,
  0.0,
  1.0, //r
  0.0,
  1.0,
  0.0,
  1.0, //g
  0.0,
  0.0,
  1.0,
  1.0, //b
  1.0,
  0.0,
  0.0,
  1.0, //r
]);

//顶点索引
const cubeIndices = new Uint16Array([
  0, 1, 2, 0, 2, 3,

  4, 5, 6, 4, 6, 7,

  3, 2, 6, 3, 6, 7,

  0, 1, 5, 0, 5, 4,

  1, 2, 6, 1, 6, 5,

  0, 3, 7, 0, 7, 4,
]);

//创建缓冲区并绑定数据
function initBuffers(gl) {
  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);

  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cubeColors, gl.DYNAMIC_DRAW);

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cubeIndices, gl.STATIC_DRAW);

  return { vertexBuffer, colorBuffer, indexBuffer };
}

function drawScene(gl, programInfo, buffers) {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  gl.useProgram(programInfo.program);
  // 创建投影矩阵和模型视图矩阵
  const fieldOfView = (45 * Math.PI) / 180;
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();
  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
  const modelViewMatrix = mat4.create();
  //缩放(控制z轴移动)
  mat4.translate(modelViewMatrix, modelViewMatrix, [
    translation.x,
    translation.y,
    zoom,
  ]);
  //旋转
  mat4.rotate(modelViewMatrix, modelViewMatrix, rotation.x, [1, 0, 0]); // x轴旋转
  mat4.rotate(modelViewMatrix, modelViewMatrix, rotation.y, [0, 1, 0]); // y轴旋转
  //设置着色器
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.projectionMatrix,
    false,
    projectionMatrix
  );
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelViewMatrix,
    false,
    modelViewMatrix
  );
  //绑定顶点缓冲区和索引缓冲区
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertexBuffer);
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexPosition,
    3,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.colorBuffer);
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexColor,
    4,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);

  gl.drawElements(gl.TRIANGLES, cubeIndices.length, gl.UNSIGNED_SHORT, 0);
}

function main() {
  const shaderProgram = initShaderProgram(gl);
  const buffers = initBuffers(gl);
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "apos"),
      vertexColor: gl.getAttribLocation(shaderProgram, "acolor"),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(
        shaderProgram,
        "uProjectionMatrix"
      ),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
    },
  };
  //颜色选择器
  document.getElementById("colorPicker").addEventListener("input", (event) => {
    const color = event.target.value;
    const rgba = hexToRgb(color);
    for (let i = 0; i < cubeColors.length; i += 4) {
      cubeColors[i] = rgba.r / 255;
      cubeColors[i + 1] = rgba.g / 255;
      cubeColors[i + 2] = rgba.b / 255;
      cubeColors[i + 3] = 1.0;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeColors, gl.DYNAMIC_DRAW);
  });
  //颜色转换
  function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255,
    };
  }
  function render() {
    drawScene(gl, programInfo, buffers);
    requestAnimationFrame(render);
  }
  render();
}

main();
