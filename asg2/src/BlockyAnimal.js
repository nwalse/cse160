// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program

var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
    gl_Position = a_Position;
    //gl_PointSize = 10.0;
    gl_PointSize = u_Size;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`


// Global variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;

function setupWebGL() { 
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  // gl = getWebGLContext(canvas);
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
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

  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }
}

let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 5;
let g_selectedType = 'point';
let g_selectedSegments = 10;

let g_watercolorMode = false;
let g_watercolorFadeFactor = 1.0;
let g_baseColor = [1.0, 1.0, 1.0, 1.0];

function addActionsForHtmlUI() {
  document.getElementById('green'). onclick = function() { 
    g_selectedColor = [0.0,1.0,0.0,1.0]; 
  };
  document.getElementById('red').onclick = function() { 
    g_selectedColor = [1.0,0.0,0.0,1.0]; 
  };

  document.getElementById('clear').onclick = function() { 
    g_shapesList = [];
    renderAllShapes();
  };

  document.getElementById('point').onclick = function() { 
    g_selectedType = 'point';
  };
  document.getElementById('triangle').onclick = function() { 
    g_selectedType = 'triangle';
  };
  document.getElementById('circle').onclick = function() { 
    g_selectedType = 'circle';
  };

  document.getElementById('drawing').onclick = function() { 
    console.log('drawing');
    showDrawing();
  };

  document.getElementById('watercolorMode').onclick = function() { 
    g_watercolorMode = !g_watercolorMode;
    this.textContent = g_watercolorMode ? "Exit Watercolor Mode" : "Watercolor Mode";
  };

  document.getElementById('redSlide').addEventListener('mouseup', function () { g_selectedColor[0] = this.value/100 });
  document.getElementById('greenSlide').addEventListener('mouseup', function () { g_selectedColor[1] = this.value/100 });
  document.getElementById('blueSlide').addEventListener('mouseup', function () { g_selectedColor[2] = this.value/100 });

  document.getElementById('sizeSlide').addEventListener('mouseup', function () { g_selectedSize = this.value });
  document.getElementById('sizeSegment').addEventListener('mouseup', function () { g_selectedSegments = this.value });
}

function main() {

  setupWebGL();

  connectVariablesToGLSL();

  addActionsForHtmlUI();

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;
  canvas.onmousemove = function(ev) { if(ev.buttons == 1) {click(ev)} } ;

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}

var g_shapesList = [];

function click(ev) {
  [x, y] = convertCoordinates(ev);

  // Store the coordinates to g_points array
  if (g_selectedType == 'point') {
    var point = new Point();
  } else if (g_selectedType == 'triangle') {
    var point = new Triangle();
  } else if (g_selectedType == 'circle') {
    var point = new Circle();
    point.segments = g_selectedSegments;
  }

  if (ev.type === 'mousedown') {
    g_watercolorFadeFactor = 1.0;
    g_baseColor = g_selectedColor.slice();
  }

  if (g_watercolorMode) {
    g_watercolorFadeFactor = Math.max(g_watercolorFadeFactor - 0.02, 0);
    point.color = g_baseColor.map(c => c * g_watercolorFadeFactor);
  } else {
    point.color = g_selectedColor.slice();
  }

  point.position = [x, y, 0.0];
  point.size = g_selectedSize;
  
  g_shapesList.push(point);

  renderAllShapes();

}

function convertCoordinates(ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return([x, y]);
}

function renderAllShapes() {
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  var len = g_shapesList.length;
  for(var i = 0; i < len; i++) {
    g_shapesList[i].render();

  }
}

function showDrawing() {
  g_shapesList = [];

  drawSprial('circle');
  drawSprial('triangle');

  renderAllShapes();
}

function drawSprial(spiralType) {
  const SHAPE_COUNT = 50;
  const SPIRAL_TURNS = 2;
  const BASE_SIZE = 25;
  for (let i = 0; i < SHAPE_COUNT; i++) {
    // Used chatgpt on the spiral math
    const angle = i * (2 * Math.PI * SPIRAL_TURNS / SHAPE_COUNT);
    const radius = i * 0.015;
    
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    
    const hue = (angle / (2 * Math.PI)) * 360;
    const color = hslToRgb(hue, 80, 60);
    
    const size = BASE_SIZE - (i * 0.20);
    
    let geom;
    if (spiralType == 'triangle') {
      geom = new Triangle();
    } else if (spiralType == 'circle') {
      geom = new Circle();
      geom.segments = 20;
    }
    geom.size = size;
    
    geom.position = [x, y, 0];
    geom.color = color;
    g_shapesList.push(geom);
  }
}

// Used chatgpt here
function hslToRgb(h, s, l) {
  h /= 360, s /= 100, l /= 100;
  let r, g, b;
  
  if (s === 0) {
      r = g = b = l;
  } else {
      const hue2rgb = (p, q, t) => {
          if(t < 0) t += 1;
          if(t > 1) t -= 1;
          if(t < 1/6) return p + (q - p) * 6 * t;
          if(t < 1/2) return q;
          if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
  }
  
  return [r, g, b, 1];
}
