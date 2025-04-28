class Cube {
  constructor() {
    this.type = 'cube';
    this.color = [0.5, 0.5, 0.5, 0.5];
    this.matrix = new Matrix4();

    this.buffer = null;
  }

  render() {
    if(this.buffer === null) {
      this.buffer = gl.createBuffer();
      if (!this.buffer) {
        console.log("Failed to create the buffer object");
        return -1;
      }
    }

    var rgba = this.color;

    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    // front of the cube
    gl.uniform4f(u_FragColor, 0.9*rgba[0], 0.9*rgba[1], 0.9*rgba[2], rgba[3]);
    drawTriangle3D([0.0, 0.0, 0.0,  1.0, 1.0, 0.0,  1.0, 0.0, 0.0], this.buffer);
    drawTriangle3D([0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  1.0, 1.0, 0.0], this.buffer);

    // face to the right
    gl.uniform4f(u_FragColor, 0.75*rgba[0], 0.75*rgba[1], 0.75*rgba[2], rgba[3]);
    drawTriangle3D([1.0, 0.0, 0.0,  1.0, 1.0, 1.0,  1.0, 0.0, 1.0], this.buffer);
    drawTriangle3D([1.0, 0.0, 0.0,  1.0, 1.0, 0.0,  1.0, 1.0, 1.0], this.buffer);

    // face to the left
    drawTriangle3D([0.0, 0.0, 0.0,  0.0, 1.0, 1.0,  0.0, 0.0, 1.0], this.buffer);
    drawTriangle3D([0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 1.0], this.buffer);

    // top face
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    drawTriangle3D([0.0, 1.0, 0.0,  1.0, 1.0, 1.0,  1.0, 1.0, 0.0], this.buffer);
    drawTriangle3D([0.0, 1.0, 0.0,  0.0, 1.0, 1.0,  1.0, 1.0, 1.0], this.buffer);

    // bottom face
    gl.uniform4f(u_FragColor, 0.5*rgba[0], 0.5*rgba[1], 0.5*rgba[2], rgba[3]);
    drawTriangle3D([0.0, 0.0, 0.0,  1.0, 0.0, 1.0,  1.0, 0.0, 0.0], this.buffer);
    drawTriangle3D([0.0, 0.0, 0.0,  0.0, 0.0, 1.0,  1.0, 0.0, 1.0], this.buffer);
    
    gl.uniform4f(u_FragColor, 0.75*rgba[0], 0.75*rgba[1], 0.75*rgba[2], rgba[3]);
    // back of the cube
    drawTriangle3D([0.0, 0.0, 1.0,  1.0, 1.0, 1.0,  1.0, 0.0, 1.0], this.buffer);
    drawTriangle3D([0.0, 0.0, 1.0,  0.0, 1.0, 1.0,  1.0, 1.0, 1.0], this.buffer);
  }
}

let cubeVertexBuffer = null;
let cubeIndexBuffer = null;
let cubeInitialized = false;

function initCubeBuffers() {
  const vertices = new Float32Array([
    -0.5, -0.5,  0.5,  // Front-bottom-left
     0.5, -0.5,  0.5,  // Front-bottom-right
     0.5,  0.5,  0.5,  // Front-top-right
    -0.5,  0.5,  0.5,  // Front-top-left
    -0.5, -0.5, -0.5,  // Back-bottom-left
     0.5, -0.5, -0.5,  // Back-bottom-right
     0.5,  0.5, -0.5,  // Back-top-right
    -0.5,  0.5, -0.5   // Back-top-left
  ]);

  const indices = new Uint16Array([
    0,1,2, 0,2,3,    // Front face
    4,5,6, 4,6,7,    // Back face
    3,2,6, 3,6,7,    // Top face
    0,1,5, 0,5,4,    // Bottom face
    1,2,6, 1,6,5,    // Right face
    0,3,7, 0,7,4     // Left face
  ]);

  // Create buffers
  cubeVertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  cubeIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  cubeInitialized = true;
}

function drawCube(matrix) {
  if (!cubeInitialized) initCubeBuffers();

  // Set up vertex attributes
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  // Bind index buffer
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);

  // Set model matrix uniform
  gl.uniformMatrix4fv(u_ModelMatrix, false, matrix.elements);

  // Draw the cube
  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
}
