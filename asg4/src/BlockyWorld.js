// used ai thoughout this file

// Vertex shader program
var VSHADER_SOURCE = `
  precision mediump float;
  
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec3 a_Normal;

  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;

  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;

  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
    v_Normal = a_Normal;
    v_VertPos = u_ModelMatrix * a_Position;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;

  varying vec2 v_UV;
  varying vec3 v_Normal;

  uniform vec4 u_FragColor;

  uniform float u_ambientLevel;
  uniform float u_specularCoefficient;
  uniform vec3 u_diffuseColor;
  uniform vec3 u_specularColor;
  uniform vec3 u_ambientColor;


  uniform bool u_spotlightOn;
  uniform vec3 u_spotlightPosition;
  uniform vec3 u_spotlightDirection;
  uniform float u_spotlightCutoff;
  uniform float u_spotlightExponent;

  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform sampler2D u_Sampler3;
  uniform sampler2D u_Sampler4;
  uniform sampler2D u_Sampler5;

  uniform int u_textureOption;
  uniform float u_texColorWeight;
  uniform bool u_normalOn;
  uniform bool u_lightOn;


  uniform vec3 u_cameraPos;

  uniform vec3 u_lightPos;
  varying vec4 v_VertPos;

  void main() {
    if(u_textureOption == -1 || u_normalOn) {
      gl_FragColor = vec4((v_Normal+1.0)/2.0, 1.0);
    } else if(u_textureOption == 0) {  
      gl_FragColor = u_FragColor;
    } else if(u_textureOption == 1) {
      gl_FragColor = vec4(v_UV, 1.0, 1.0);
    } else if(u_textureOption == 2) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    } else if(u_textureOption == 3) {
      gl_FragColor = texture2D(u_Sampler1, v_UV);
    } else if(u_textureOption == 4) {
      gl_FragColor = texture2D(u_Sampler2, v_UV);
    } else if(u_textureOption == 5) {
      gl_FragColor = texture2D(u_Sampler3, v_UV);
    } else if(u_textureOption == 6) {
      gl_FragColor = texture2D(u_Sampler4, v_UV);
    } else if(u_textureOption == 7) {
      gl_FragColor = texture2D(u_Sampler5, v_UV);
    }

    vec3 lightVector = vec3(v_VertPos) - u_lightPos;
    float r= length(lightVector);
    
      // N dot L
    vec3 L = normalize(lightVector);
    vec3 N = normalize(v_Normal);
    float nDotL = max(dot(N, L), 0.0);

    // reflection
    vec3 R = reflect(L, N);

    // eye
    vec3 E = normalize(u_cameraPos-vec3(v_VertPos));

    // specular
    vec3 specular = u_specularColor * pow(max(dot(E, R), 0.0), u_specularCoefficient);

    vec3 diffuse = vec3(u_diffuseColor) * vec3(gl_FragColor) * nDotL * 0.5;
    vec3 ambient = vec3(u_ambientColor) * vec3(gl_FragColor) * u_ambientLevel;


    float spotFactor;
    if(u_spotlightOn) {
      vec3 L_spot = normalize(vec3(v_VertPos) - u_spotlightPosition);
      vec3 D = normalize(vec3(u_spotlightDirection));
      float angle = dot(L_spot, D);
      if(angle > u_spotlightCutoff) {
        spotFactor = pow(angle, u_spotlightExponent);
        // spotFactor = 1.0;
      } else {
        spotFactor = 0.3;
      }
      // gl_FragColor = vec4(spotFactor * (specular + diffuse + ambient), 1.0);
    } else {
      spotFactor = 1.0;
    }

    if(u_lightOn) {
      if(u_textureOption > 1 || u_textureOption == 0) {
        gl_FragColor = vec4(spotFactor * (specular + diffuse + ambient), 1.0);
      } else {
        gl_FragColor = vec4(diffuse + ambient, 1.0);
      }
    }
  }`;

const SKY = 2;
const GRASS_BOTTOM = 3;
const GRASS_SIDE = 4;
const GRASS_TOP = 5;
const DIRT = 3;
const PLANK = 6;


// global vars
let canvas;
let gl;
let a_Position;
let a_UV;
let a_Normal;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_GlobalRotateMatrix;
let u_textureSegment;
let camera;

let u_lightPos;
let u_normalOn;
let u_ambientLevel;
let u_specularCoefficient;
let u_cameraPos;
let u_specularColor;
let u_diffuseColor;
let u_ambientColor;
let u_lightOn;

let u_spotlightOn;
let u_spotlightPosition;
let u_spotlightDirection;
let u_spotlightCutoff;
let u_spotlightExponent;

let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let u_Sampler3;
let u_Sampler4;
let u_Sampler5;

let u_textureOption;

let g_cameraAngleX = 0;
let g_cameraAngleY = 0;
let g_animationActive = true;

let g_normalOn = false;
let g_lightPos = [0,2,0];
let g_lightOn = true;
let g_specularColor = [0.5,0.5,0.5];
let g_diffuseColor = [0.1,0.1,0.1];
let g_ambientColor = [0.5,0.5,0.5];
let g_ambientLevel = 0.65;
let g_specularCoefficient = 30.0;

let g_spotlight = {
  active: true,
  position: [0, 3, 0],
  direction: [0, -1, 0],
  cutoff: 0.8,
  exponent: 2
}

let g_headAngle = [0.0, 0.0, 0.0];
let g_flAngle = -30.0, g_frAngle = -30.0, g_flLowerAngle = 70.0, g_frLowerAngle = 70.0;
let g_blAngle = 20.0, g_brAngle = 20.0, g_blLowerAngle = -40.0, g_brLowerAngle = -40.0;
let g_flFootAngle = 0.0, g_frFootAngle = 0.0, g_blFootAngle = 0.0, g_brFootAngle = 0.0;

let g_deltaX = 0;
let g_deltaY = 0;

function setUpWebGL() {
  canvas = document.getElementById('webgl');
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

  // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if(!a_UV) {
    console.log('Failed to get the storage location of a_UV');
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

  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if(!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return;
  }

  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if(!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ProjectionMatrix');
    return;
  }

  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if(!u_Sampler0) {
    console.log('Failed to create sampler0 object');
    return false;
  }

  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  if(!u_Sampler1) {
    console.log('Failed to create sampler1 object');
    return false;
  }

  u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
  if(!u_Sampler2) {
    console.log('Failed to create sampler2 object');
    return false;
  }

  u_Sampler3 = gl.getUniformLocation(gl.program, 'u_Sampler3');
  if(!u_Sampler3) {
    console.log('Failed to create sampler3 object');
    return false;
  }

  u_Sampler4 = gl.getUniformLocation(gl.program, 'u_Sampler4');
  if(!u_Sampler4) {
    console.log('Failed to create sampler4 object');
    return false;
  }

  u_Sampler5 = gl.getUniformLocation(gl.program, 'u_Sampler5');
  if(!u_Sampler5) {
    console.log('Failed to create sampler5 object');
    return false;
  }

  u_textureOption = gl.getUniformLocation(gl.program, 'u_textureOption');
  if(!u_textureOption) {
    console.log('Failed to create texture option object');
    return false;
  }

  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  if(!a_Normal) {
    console.log('Failed to get the storage location of a_Normal');
    return;
  }

  u_cameraPos = gl.getUniformLocation(gl.program, 'u_cameraPos');
  if(!u_cameraPos) {
    console.log('Failed to create camera position object');
    return false;
  }

  u_lightPos = gl.getUniformLocation(gl.program, 'u_lightPos');
  if(!u_lightPos) {
    console.log('Failed to get the storage location of u_lightPos');
    return;
  } 

  u_spotlightPosition = gl.getUniformLocation(gl.program, 'u_spotlightPosition');
  if(!u_spotlightPosition) {
    console.log('Failed to get the storage location of u_spotlightPosition');
    return;
  }

  u_spotlightDirection = gl.getUniformLocation(gl.program, 'u_spotlightDirection');
  if(!u_spotlightDirection) {
    console.log('Failed to get the storage location of u_spotlightDirection');
    return;
  }

  u_spotlightCutoff = gl.getUniformLocation(gl.program, 'u_spotlightCutoff');
  if(!u_spotlightCutoff) {
    console.log('Failed to get the storage location of u_spotlightCutoff');
    return;
  }

  u_spotlightExponent = gl.getUniformLocation(gl.program, 'u_spotlightExponent');
  if(!u_spotlightExponent) {
    console.log('Failed to get the storage location of u_spotlightExponent');
    return;
  }

  u_normalOn = gl.getUniformLocation(gl.program, 'u_normalOn');
  if(!u_normalOn) {
    console.log('Failed to get the storage location of u_normalOn');
    return;
  }

  u_ambientLevel = gl.getUniformLocation(gl.program, 'u_ambientLevel');
  if(!u_ambientLevel) {
    console.log('Failed to get the storage location of u_ambientLevel');
    return;
  }

  u_diffuseColor = gl.getUniformLocation(gl.program, 'u_diffuseColor');
  if(!u_diffuseColor) {
    console.log('Failed to get the storage location of u_diffuseColor');
    return;
  }

  u_lightOn = gl.getUniformLocation(gl.program, 'u_lightOn');
  if(!u_lightOn) {
    console.log('Failed to get the storage location of u_lightOn');
    return;
  }

  u_spotlightOn = gl.getUniformLocation(gl.program, 'u_spotlightOn');
  if(!u_spotlightOn) {
    console.log('Failed to get the storage location of u_spotlightOn');
    return;
  }

  u_specularCoefficient = gl.getUniformLocation(gl.program, 'u_specularCoefficient');
  if(!u_specularCoefficient) {
    console.log('Failed to get the storage location of u_specularCoefficient');
    return;
  }

  u_specularColor = gl.getUniformLocation(gl.program, 'u_specularColor');
  if(!u_specularColor) {
    console.log('Failed to get the storage location of u_specularColor');
    return;
  }

  u_ambientColor = gl.getUniformLocation(gl.program, 'u_ambientColor');
  if(!u_ambientColor) {
    console.log('Failed to get the storage location of u_ambientColor');
    return;
  }

  let x = new Matrix4();
  camera = new Camera();
  camera.eye = new Vector3([0, 1, -3]);
  camera.at = new Vector3([0, 0, 100]);
  camera.up = new Vector3([0, 1, 0]);

  gl.uniform1f(u_ambientLevel, g_ambientLevel);
  gl.uniform1f(u_specularCoefficient, g_specularCoefficient);
  gl.uniform3fv(u_diffuseColor, g_diffuseColor);
  gl.uniform1f(u_lightOn, g_lightOn);
  gl.uniform3fv(u_specularColor, g_specularColor);
  gl.uniform3fv(u_ambientColor, g_ambientColor);

  gl.uniform1f(u_spotlightOn, g_spotlight.active);
  gl.uniform3fv(u_spotlightPosition, g_spotlight.position);
  gl.uniform3fv(u_spotlightDirection, g_spotlight.direction);
  gl.uniform1f(u_spotlightCutoff, g_spotlight.cutoff);
  gl.uniform1f(u_spotlightExponent, g_spotlight.exponent);

  gl.uniformMatrix4fv(u_ModelMatrix, false, x.elements);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, x.elements);
  gl.uniformMatrix4fv(u_ViewMatrix, false, x.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, x.elements);
  gl.uniform3fv(u_cameraPos, camera.eye.elements);
}

function initTextures() {
  loadTexture(gl, './../images/sky.jpg', 0, u_Sampler0);
  loadTexture(gl, './../images/grassSide.jpg', 2, u_Sampler2);
  loadTexture(gl, './../images/grassTop.jpg', 3, u_Sampler3);
  loadTexture(gl, './../images/plank.jpg', 4, u_Sampler4);
  loadTexture(gl, './../images/water.jpg', 5, u_Sampler5);
}

function loadTexture(gl, imageSrc, textureUnit, samplerUniform) {
  const image = new Image();
  image.onload = function() {
    const texture = gl.createTexture();
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE0 + textureUnit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(samplerUniform, textureUnit);
  };
  image.src = imageSrc;
}

function rotateCamera(ev) {
  camera.panRight(ev.movementX*0.1);
  camera.panUp(ev.movementY*0.1);
}



function addActionListeners() {
  let x_light = document.getElementById('light-x');
  let y_light = document.getElementById('light-y');
  let z_light = document.getElementById('light-z');
  let ambient_slider = document.getElementById('ambient-level');
  let specular_slider = document.getElementById('specular-level');
  let specular_color = document.getElementById('specular-color');
  let diffuse_color = document.getElementById('diffuse-color');
  let ambient_color = document.getElementById('ambient-color');

  ambient_slider.addEventListener('mousemove', function() {g_ambientLevel = this.value; gl.uniform1f(u_ambientLevel, g_ambientLevel); renderAllShapes();});

  specular_slider.addEventListener('mousemove', function() {g_specularCoefficient = this.value; gl.uniform1f(u_specularCoefficient, g_specularCoefficient); renderAllShapes();});

  diffuse_color.addEventListener('change', function() {
    hex = this.value
    hex = hex.replace(/^#/, '');
    let bigint = parseInt(hex, 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;
    
    g_diffuseColor = [r/255, g/255, b/255]; 
    gl.uniform3fv(u_diffuseColor, g_diffuseColor); 
    renderAllShapes();}
  );
  
  specular_color.addEventListener('change', function() {
    hex = this.value
    hex = hex.replace(/^#/, '');
    let bigint = parseInt(hex, 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;
    
    g_specularColor = [r/255, g/255, b/255]; 
    gl.uniform3fv(u_specularColor, g_specularColor);
    renderAllShapes();}
  );
  
  ambient_color.addEventListener('change', function() {
    hex = this.value
    hex = hex.replace(/^#/, '');
    let bigint = parseInt(hex, 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;

    g_ambientColor = [r/255, g/255, b/255];
    gl.uniform3fv(u_ambientColor, g_ambientColor);
    renderAllShapes();}
  );

  x_light.addEventListener('mousemove', function() {g_lightPos[0] = this.value/100; renderAllShapes();});
  y_light.addEventListener('mousemove', function() {g_lightPos[1] = this.value/100; renderAllShapes();});
  z_light.addEventListener('mousemove', function() {g_lightPos[2] = this.value/100; renderAllShapes();});

  canvas.onclick = function(ev) {
    if(!document.pointerLockElement) {
      canvas.requestPointerLock();
    }
  }
  document.addEventListener('pointerlockchange', function(ev) {
    if(document.pointerLockElement === canvas) {
      canvas.onmousemove = (ev) => rotateCamera(ev);
    } else {
      canvas.onmousemove = null;
    }
  });
}


function keydown(ev) {
  if(ev.keyCode == 39 || ev.keyCode == 68) {
    camera.moveRight();
  }
  if(ev.keyCode == 37 || ev.keyCode == 65) {
    camera.moveLeft();
  }
  if(ev.keyCode == 38 || ev.keyCode == 87) {
    camera.moveForward();
  }
  if(ev.keyCode == 40 || ev.keyCode == 83) {
    camera.moveBackward();
  }
  if(ev.keyCode == 81) {
    camera.panLeft(5);
  }
  if(ev.keyCode == 69) {
    camera.panRight(5);
  }
  renderAllShapes();
}

function convertMouseToEventCoords(ev) {
  var x = ev.clientX;
  var y = ev.clientY;
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return([x, y]);
}

function renderAllShapes() {
  var start_time = performance.now();

  gl.uniform1i(u_normalOn, g_normalOn);
  gl.uniform1f(u_lightOn, g_lightOn);
  gl.uniform1f(u_spotlightOn, g_spotlight.active);
  let projMat = camera.projectionMatrix;
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);
  let viewMat = camera.viewMatrix;
  viewMat.setLookAt(
    camera.eye.elements[0], camera.eye.elements[1], camera.eye.elements[2],
    camera.at.elements[0], camera.at.elements[1], camera.at.elements[2],
    camera.up.elements[0], camera.up.elements[1], camera.up.elements[2]
  );
  gl.uniform3fv(u_cameraPos, camera.eye.elements);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

  let globalRotMat = new Matrix4();
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
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
    legFL: [new Cube(), new Cube(), new Cube()],
    legFR: [new Cube(), new Cube(), new Cube()],
    legBL: [new Cube(), new Cube(), new Cube()],
    legBR: [new Cube(), new Cube(), new Cube()]
  };

  let anim = {
    neck: [g_headAngle[0], g_headAngle[1], g_headAngle[2]],
    legFL: { upper: g_flAngle, lower: g_flLowerAngle, foot: g_flFootAngle },
    legFR: { upper: g_frAngle, lower: g_frLowerAngle, foot: g_frFootAngle },
    legBL: { upper: g_blAngle, lower: g_blLowerAngle, foot: g_blFootAngle },
    legBR: { upper: g_brAngle, lower: g_brLowerAngle, foot: g_brFootAngle }
  };
  const speed = 5, distLow = 15, distUp = 20, neckWobble = 5;
  let l_lightPos = [g_lightPos[0], g_lightPos[1], g_lightPos[2]];

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
    l_lightPos[0] = g_lightPos[0] + 2*Math.sin(g_seconds);
    l_lightPos[1] = g_lightPos[1] + 2*Math.cos(g_seconds);
    l_lightPos[2] = g_lightPos[2] + 2*Math.cos(g_seconds);
  }

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


  let s = new Sphere();
  s.color = [0.5, 0.5, 0.5, 1.0];
  s.textureOption = 3;
  s.matrix.translate(2, 0, 2);
  s.render();

  let sky = new Cube();
  sky.textureOption = 2;
  sky.color = [1, 1, 1, 1];
  sky.matrix.translate(0, -1, 0);
  sky.matrix.scale(8, 8, 8);
  sky.matrix.translate(-0.5, 0, -0.5);
  sky.renderSkybox();

  if(g_lightOn) {
    gl.uniform3f(u_lightPos, l_lightPos[0], l_lightPos[1], l_lightPos[2])

    let light = new Cube();
    light.color = [1, 1, 0, 1];
    light.matrix.translate(l_lightPos[0], l_lightPos[1], l_lightPos[2]);
    light.matrix.scale(0.1, 0.1, 0.1);
    light.render();
  }

  let random_cube2 = new Cube();
  random_cube2.matrix.translate(-2, -1, -1);
  random_cube2.matrix.scale(0.75, 0.75, 0.75);
  random_cube2.color = [0.9, 0.9, 0.7, 1.0];
  random_cube2.textureOption = 0;
  random_cube2.render();

  var duration = performance.now() - start_time;
  sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(1000/duration), 'performance-display');
}

function sendTextToHTML(txt, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if(!htmlID) {
    console.log("Failed to get " + htmlID + " from HTML.");
    return;
  }
  htmlElm.innerHTML = txt;
}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0 - g_startTime;

function tick() {
  g_seconds = performance.now()/1000.0 - g_startTime;
  renderAllShapes();
  requestAnimationFrame(tick);
}

function main() {
  setUpWebGL();
  connectVariablesToGLSL();
  addActionListeners();
  initTextures();
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  document.onkeydown = keydown;
  renderAllShapes();
  requestAnimationFrame(tick);
}