// ColoredPoint.js (c) 2012 matsuda
// used ai to help me with this on the animal creation
// Vertex shader program

var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_GlobalTranslateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_GlobalTranslateMatrix * u_ModelMatrix * a_Position;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`

  let canvas, gl;
  let a_Position, u_FragColor, u_ModelMatrix, u_GlobalRotateMatrix, u_GlobalTranslateMatrix;
  
  let g_animationActive = true;
  let g_animationShift = false;
  
  let g_cameraAngleX = 30.0, g_cameraAngleY = 30.0, g_cameraAngleZ = 0.0;
  let g_deltaX = 0, g_deltaY = 0;
  
  let g_headAngle = [0.0, 0.0, 0.0];
  let g_flAngle = -30.0, g_frAngle = -30.0, g_flLowerAngle = 70.0, g_frLowerAngle = 70.0;
  let g_blAngle = 20.0, g_brAngle = 20.0, g_blLowerAngle = -40.0, g_brLowerAngle = -40.0;
  let g_flFootAngle = 0.0, g_frFootAngle = 0.0, g_blFootAngle = 0.0, g_brFootAngle = 0.0;
  
  let g_startTime = performance.now() / 1000.0;
  let g_seconds = 0;


function setUpWebGL() {
  canvas = document.getElementById('canvas');
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if(!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if(!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  u_GlobalTranslateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalTranslateMatrix');
  if(!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_GlobalTranslateMatrix');
    return;
  }

  let x = new Matrix4();
  
  gl.uniformMatrix4fv(u_ModelMatrix, false, x.elements);
}

function addActionListeners() {
  // button events
  document.getElementById('toggle-animation').onclick = function() {g_animationActive = !g_animationActive;};
  document.getElementById('toggle-shift').onclick = function() {g_animationShift = !g_animationShift;};
  
  // slider events
  document.getElementById('front-left-leg-upper-slider').addEventListener('mousemove', function() {g_flAngle = this.value; renderAllShapes();});
  document.getElementById('front-left-leg-lower-slider').addEventListener('mousemove', function() {g_flLowerAngle = this.value; renderAllShapes();});

  document.getElementById('cam-angle-x').addEventListener('mousemove', function() {g_cameraAngleX = this.value; renderAllShapes();});
  document.getElementById('cam-angle-y').addEventListener('mousemove', function() {g_cameraAngleY = this.value; renderAllShapes();});
  document.getElementById('cam-angle-z').addEventListener('mousemove', function() {g_cameraAngleZ = this.value; renderAllShapes();});

  document.getElementById('h-slider-x').addEventListener('mousemove', function() {g_headAngle[0] = this.value; renderAllShapes();});
  document.getElementById('h-slider-y').addEventListener('mousemove', function() {g_headAngle[1] = this.value; renderAllShapes();});
  document.getElementById('h-slider-z').addEventListener('mousemove', function() {g_headAngle[2] = this.value; renderAllShapes();});

  document.getElementById('display-container').addEventListener('click', function(ev) {
    if(ev.shiftKey) {
      g_animationShift = !g_animationShift;
    }
  });

  canvas.onmousemove = function(ev) {
    let [x, y] = convertMouseToEventCoords(ev);
    if(ev.buttons == 1) {
      g_cameraAngleY -= (x - g_deltaX) * 120;
      g_cameraAngleX -= (y - g_deltaY) * 120;
      g_deltaX = x;
      g_deltaY = y;
    } else {
      g_deltaX = x;
      g_deltaY = y;
    }
  }
}


function convertMouseToEventCoords(ev) {
  var x = ev.clientX;
  var y = ev.clientY;
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return([x, y]);
}

function renderScene() {
  var startTime = performance.now();

  // Camera transforms
  let rotMat = new Matrix4().rotate(-g_cameraAngleX, 1, 0, 0);
  rotMat.rotate(g_cameraAngleY, 0, 1, 0);
  rotMat.rotate(g_cameraAngleZ, 0, 0, 1);
  let transMat = new Matrix4().translate(0, 0, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, rotMat.elements);
  gl.uniformMatrix4fv(u_GlobalTranslateMatrix, false, transMat.elements);

  // Animal part objects
  let animal = {
    torso: new Cube(),
    neck: new Cube(),
    head: new Cube(),
    muzzle: new Cube(),
    nostrilL: new Cube(),
    nostrilR: new Cube(),
    mouthTop: new Cube(),
    mouthBot: new Cube(),
    eyeL: new Cube(),
    eyeR: new Cube(),
    tongue: new Cube(),
    earL: new HalfPyramid(),
    earR: new HalfPyramid(),
    legFL: [new Cube(), new Cube(), new Cube()],
    legFR: [new Cube(), new Cube(), new Cube()],
    legBL: [new Cube(), new Cube(), new Cube()],
    legBR: [new Cube(), new Cube(), new Cube()]
  };

  // Animation and angles
  let anim = {
    neck: [g_headAngle[0], g_headAngle[1], g_headAngle[2]],
    legFL: { upper: g_flAngle, lower: g_flLowerAngle, foot: g_flFootAngle },
    legFR: { upper: g_frAngle, lower: g_frLowerAngle, foot: g_frFootAngle },
    legBL: { upper: g_blAngle, lower: g_blLowerAngle, foot: g_blFootAngle },
    legBR: { upper: g_brAngle, lower: g_brLowerAngle, foot: g_brFootAngle }
  };
  const speed = 5, distLow = 15, distUp = 20, neckWobble = 5;

  if (g_animationActive) {
    anim.legFL.upper = g_flAngle + distUp * Math.sin(g_seconds * speed);
    anim.legFL.lower = g_flLowerAngle - 30 + distLow * Math.sin(g_seconds * speed);
    anim.legFR.upper = g_frAngle + distUp * Math.sin(g_seconds * speed + Math.PI);
    anim.legFR.lower = g_frLowerAngle - 30 + distLow * Math.sin(g_seconds * speed + Math.PI);
    anim.legBL.upper = g_blAngle + 0.75 * distUp * Math.sin(g_seconds * speed + Math.PI);
    anim.legBR.upper = g_brAngle + 0.75 * distUp * Math.sin(g_seconds * speed);
    anim.legBL.lower = g_blLowerAngle + distLow * Math.sin(g_seconds * speed + Math.PI);
    anim.legBR.lower = g_brLowerAngle + distLow * Math.sin(g_seconds * speed);
    anim.neck[2] = g_headAngle[2] + neckWobble * Math.sin(g_seconds * 5);
    anim.neck[0] = g_headAngle[0] + neckWobble * Math.cos(g_seconds * 5);
    anim.legFL.foot = 20 * Math.sin(g_seconds * speed + Math.PI / 2);
    anim.legFR.foot = 20 * Math.sin(g_seconds * speed + Math.PI + Math.PI / 2);
    anim.legBL.foot = 20 * Math.sin(g_seconds * speed + Math.PI + Math.PI / 2);
    anim.legBR.foot = 20 * Math.sin(g_seconds * speed + Math.PI / 2);
  }

  // Clear canvas
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Torso
  animal.torso.color = [0.60, 0.50, 0.30, 1.0];
  animal.torso.matrix.scale(0.3, 0.5, 0.75);
  animal.torso.matrix.translate(-0.5, -0.5, -0.3);
  animal.torso.render();

  // Neck
  animal.neck.color = [0.60, 0.50, 0.30, 1.0];
  animal.neck.matrix.translate(0, -0.05, -0.35);
  animal.neck.matrix.rotate(-40, 1, 0, 0);
  animal.neck.matrix.rotate(anim.neck[0], 1, 0, 0);
  animal.neck.matrix.rotate(anim.neck[1], 0, 1, 0);
  animal.neck.matrix.rotate(anim.neck[2], 0, 0, 1);
  let neckMat = new Matrix4(animal.neck.matrix);
  animal.neck.matrix.scale(0.19, 0.5, 0.3);
  animal.neck.matrix.translate(-0.5, -0.5, 0);
  animal.neck.render();

  // Head
  animal.head.color = [0.60, 0.50, 0.30, 1.0];
  animal.head.matrix = neckMat;
  animal.head.matrix.translate(-0.12, 0.25, -0.05);
  animal.head.matrix.rotate(40, 1, 0, 0);
  let headMat = new Matrix4(animal.head.matrix);
  animal.head.matrix.scale(0.25, 0.25, 0.3);
  animal.head.render();

  // Ears
  animal.earL.color = [0.38, 0.28, 0.18, 1.0];
  animal.earL.matrix = new Matrix4(headMat);
  animal.earL.matrix.translate(0.2, 0.3, 0.2);
  animal.earL.matrix.rotate(15, 0, 1, 0);
  animal.earL.matrix.scale(0.1, 0.1, 0.1);
  animal.earL.render();

  animal.earR.color = [0.38, 0.28, 0.18, 1.0];
  animal.earR.matrix = new Matrix4(headMat);
  animal.earR.matrix.translate(0.05, 0.3, 0.2);
  animal.earR.matrix.rotate(155, 0, 1, 0);
  animal.earR.matrix.scale(0.1, 0.1, -0.1);
  animal.earR.render();

  // Eyes
  animal.eyeL.color = [1.0, 1.0, 1.0, 1.0];
  animal.eyeL.matrix = new Matrix4(headMat);
  animal.eyeL.matrix.translate(0.23, 0.15, 0.02);
  animal.eyeL.matrix.scale(0.05, 0.06, 0.06);
  animal.eyeL.render();

  animal.eyeL.color = [0.0, 0.0, 0.0, 1.0];
  animal.eyeL.matrix = new Matrix4(headMat);
  animal.eyeL.matrix.translate(0.24, 0.16, 0.035);
  animal.eyeL.matrix.scale(0.05, 0.04, 0.03);
  animal.eyeL.render();

  animal.eyeR.color = [1.0, 1.0, 1.0, 1.0];
  animal.eyeR.matrix = new Matrix4(headMat);
  animal.eyeR.matrix.translate(-0.03, 0.15, 0.02);
  animal.eyeR.matrix.scale(0.05, 0.06, 0.06);
  animal.eyeR.render();

  animal.eyeR.color = [0.0, 0.0, 0.0, 1.0];
  animal.eyeR.matrix = new Matrix4(headMat);
  animal.eyeR.matrix.translate(-0.04, 0.16, 0.035);
  animal.eyeR.matrix.scale(0.05, 0.04, 0.03);
  animal.eyeR.render();

  // Muzzle
  animal.muzzle.color = [0.60, 0.50, 0.30, 1.0];
  animal.muzzle.matrix = headMat;
  animal.muzzle.matrix.translate(0.01, 0, -0.2);
  animal.muzzle.matrix.scale(0.23, 0.23, 0.2);
  animal.muzzle.render();

  // Nostrils
  animal.nostrilL.color = [0.38, 0.28, 0.18, 1.0];
  animal.nostrilL.matrix = new Matrix4(animal.muzzle.matrix);
  animal.nostrilL.matrix.translate(0.3, 0.7, -0.03);
  animal.nostrilL.matrix.scale(0.1, 0.2, 0.1);
  animal.nostrilL.render();

  animal.nostrilR.color = [0.38, 0.28, 0.18, 1.0];
  animal.nostrilR.matrix = new Matrix4(animal.muzzle.matrix);
  animal.nostrilR.matrix.translate(0.6, 0.7, -0.03);
  animal.nostrilR.matrix.scale(0.1, 0.2, 0.1);
  animal.nostrilR.render();

  // Mouth
  animal.mouthTop.color = [0.38, 0.28, 0.18, 1.0];
  animal.mouthTop.matrix = new Matrix4(animal.muzzle.matrix);
  animal.mouthTop.matrix.translate(0.2, 0.1, -0.03);
  animal.mouthTop.matrix.scale(0.6, 0.1, 0.1);
  animal.mouthTop.render();

  animal.mouthBot.color = [0.38, 0.28, 0.18, 1.0];
  animal.mouthBot.matrix = new Matrix4(animal.muzzle.matrix);
  animal.mouthBot.matrix.translate(0.45, 0.1, -0.03);
  animal.mouthBot.matrix.scale(0.1, 0.3, 0.1);
  animal.mouthBot.render();

  // Front Left Leg
  animal.legFL[0].color = [0.60, 0.50, 0.30, 1.0];
  animal.legFL[0].matrix.setTranslate(0.05, -0.09, -0.3);
  animal.legFL[0].matrix.rotate(anim.legFL.upper, 1, 0, 0);
  let legFLMat = new Matrix4(animal.legFL[0].matrix);
  animal.legFL[0].matrix.rotate(180, 1, 0, 0);
  animal.legFL[0].matrix.scale(0.15, 0.3, -0.15);
  animal.legFL[0].render();

  animal.legFL[1].color = [0.38, 0.28, 0.18, 1.0];
  animal.legFL[1].matrix = legFLMat;
  animal.legFL[1].matrix.translate(0.025, -0.2, 0.05);
  animal.legFL[1].matrix.rotate(180, 1, 0, 0);
  animal.legFL[1].matrix.rotate(anim.legFL.lower, 1, 0, 0);
  let legFLMat2 = new Matrix4(animal.legFL[1].matrix);
  animal.legFL[1].matrix.scale(0.1, 0.2, -0.1);
  animal.legFL[1].render();

  animal.legFL[2].color = [0.38, 0.28, 0.18, 1.0];
  animal.legFL[2].matrix = legFLMat2;
  animal.legFL[2].matrix.translate(-0.01, 0.18, -0.11);
  animal.legFL[2].matrix.rotate(anim.legFL.foot, 1, 0, 0);
  animal.legFL[2].matrix.scale(0.13, 0.05, 0.2);
  animal.legFL[2].render();

  // Front Right Leg
  animal.legFR[0].color = [0.65, 0.55, 0.3, 1.0];
  animal.legFR[0].matrix.setTranslate(-0.2, -0.09, -0.3);
  animal.legFR[0].matrix.rotate(anim.legFR.upper, 1, 0, 0);
  let legFRMat = new Matrix4(animal.legFR[0].matrix);
  animal.legFR[0].matrix.rotate(180, 1, 0, 0);
  animal.legFR[0].matrix.scale(0.15, 0.3, -0.15);
  animal.legFR[0].render();

  animal.legFR[1].color = [0.38, 0.28, 0.18, 1.0];
  animal.legFR[1].matrix = legFRMat;
  animal.legFR[1].matrix.translate(0.025, -0.2, 0.05);
  animal.legFR[1].matrix.rotate(180, 1, 0, 0);
  animal.legFR[1].matrix.rotate(anim.legFR.lower, 1, 0, 0);
  let legFRMat2 = new Matrix4(animal.legFR[1].matrix);
  animal.legFR[1].matrix.scale(0.1, 0.2, -0.1);
  animal.legFR[1].render();

  animal.legFR[2].color = [0.38, 0.28, 0.18, 1.0];
  animal.legFR[2].matrix = legFRMat2;
  animal.legFR[2].matrix.translate(-0.01, 0.18, -0.11);
  animal.legFR[2].matrix.rotate(anim.legFR.foot, 1, 0, 0);
  animal.legFR[2].matrix.scale(0.13, 0.05, 0.2);
  animal.legFR[2].render();

  // Back Left Leg
  animal.legBL[0].color = [0.65, 0.55, 0.3, 1.0];
  animal.legBL[0].matrix.translate(0, 0.09, 0.4);
  animal.legBL[0].matrix.rotate(180, 1, 0, 0);
  animal.legBL[0].matrix.rotate(anim.legBL.upper, 1, 0, 0);
  let legBLMat = new Matrix4(animal.legBL[0].matrix);
  animal.legBL[0].matrix.scale(0.2, 0.35, -0.2);
  animal.legBL[0].render();

  animal.legBL[1].color = [0.38, 0.28, 0.18, 1.0];
  animal.legBL[1].matrix = legBLMat;
  animal.legBL[1].matrix.translate(0.05, 0.24, -0.15);
  animal.legBL[1].matrix.rotate(anim.legBL.lower, 1, 0, 0);
  let legBLMat2 = new Matrix4(animal.legBL[1].matrix);
  animal.legBL[1].matrix.scale(0.1, 0.25, 0.1);
  animal.legBL[1].render();

  animal.legBL[2].color = [0.38, 0.28, 0.18, 1.0];
  animal.legBL[2].matrix = legBLMat2;
  animal.legBL[2].matrix.translate(-0.01, 0.22, 0);
  animal.legBL[2].matrix.rotate(anim.legBL.foot, 1, 0, 0);
  animal.legBL[2].matrix.scale(0.13, 0.05, 0.2);
  animal.legBL[2].render();

  // Back Right Leg
  animal.legBR[0].color = [0.65, 0.55, 0.3, 1.0];
  animal.legBR[0].matrix.translate(-0.2, 0.09, 0.4);
  animal.legBR[0].matrix.rotate(180, 1, 0, 0);
  animal.legBR[0].matrix.rotate(anim.legBR.upper, 1, 0, 0);
  let legBRMat = new Matrix4(animal.legBR[0].matrix);
  animal.legBR[0].matrix.scale(0.2, 0.35, -0.2);
  animal.legBR[0].render();

  animal.legBR[1].color = [0.38, 0.28, 0.18, 1.0];
  animal.legBR[1].matrix = legBRMat;
  animal.legBR[1].matrix.translate(0.05, 0.24, -0.15);
  animal.legBR[1].matrix.rotate(anim.legBR.lower, 1, 0, 0);
  let legBRMat2 = new Matrix4(animal.legBR[1].matrix);
  animal.legBR[1].matrix.scale(0.1, 0.25, 0.1);
  animal.legBR[1].render();

  animal.legBR[2].color = [0.38, 0.28, 0.18, 1.0];
  animal.legBR[2].matrix = legBRMat2;
  animal.legBR[2].matrix.translate(-0.02, 0.22, 0);
  animal.legBR[2].matrix.rotate(anim.legBR.foot, 1, 0, 0);
  animal.legBR[2].matrix.scale(0.13, 0.05, 0.2);
  animal.legBR[2].render();

  // Tongue (if shift animation)
  if (g_animationShift) {
    animal.tongue.color = [0.9, 0.4, 0.4, 1.0];
    animal.tongue.matrix = new Matrix4(animal.muzzle.matrix);
    animal.tongue.matrix.translate(0.3, 0.3, 0.1);
    let flop = 170 + 20 * Math.sin(g_seconds * 8);
    animal.tongue.matrix.rotate(flop, 1, 0, 0);
    animal.tongue.matrix.scale(0.4, 0.18, 0.5);
    animal.tongue.render();
  }

  let duration = performance.now() - startTime;
  sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(10000 / duration), 'performance-display');
}


function sendTextToHTML(txt, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if(!htmlID) {
    console.log("Failed to get " + htmlID + " from HTML.");
    return;
  }
  htmlElm.innerHTML = txt;
}

function tick() {
  g_seconds = performance.now()/1000.0 - g_startTime;
  renderScene();
  requestAnimationFrame(tick);
}


function main() {
  setUpWebGL();
  connectVariablesToGLSL();
  addActionListeners();
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  renderScene();
  requestAnimationFrame(tick);
}