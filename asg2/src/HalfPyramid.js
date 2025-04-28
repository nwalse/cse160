// HalfPyramid.js
// used ai to help me with this


class HalfPyramid {
  constructor() {
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
    this.buffer = null;

    // Updated vertices for half pyramid (right side)
    this.vertices = new Float32Array([
      0.0,  0.5, 0.0,   // Top (0)
      0.5, -0.5, 0.5,   // Front-right (1)
      0.5, -0.5, -0.5,  // Back-right (2)
      0.0, -0.5, 0.5    // Center front (new vertex) (3)
    ]);

    // Updated indices for half pyramid
    this.indices = new Uint16Array([
      0, 3, 1,  // Front face (top -> center -> front-right)
      0, 1, 2,  // Right face (top -> front-right -> back-right)
      0, 2, 3,  // Back face (top -> back-right -> center)
      3, 1, 2   // Base (center -> front-right -> back-right)
    ]);
  }

  render() {
    if(this.buffer === null) {
      this.buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
    }

    gl.uniform4fv(u_FragColor, this.color);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    // Vertex buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    // Index buffer
    let indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
  }
}



