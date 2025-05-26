class World {
  constructor() {
    this.width = 32;
    this.height = 32;
    this.depth = 32;
    this.maxReachDistance = 5; // blocks

    // Terrain
    this.world = Array.from({ length: this.width }, () =>
      Array(this.depth).fill(1)
    );
    for (let x = 0; x < this.width; x++) {
      for (let z = 4; z <= 8; z++) {
        this.world[x][z] = WATER;
      }
    }
    for (let x = 10; x <= 12; x++) {
      for (let z = 20; z <= 23; z++) {
        this.world[x][z] = 2;
      }
    }
    for (let x = 11; x <= 11; x++) {
      for (let z = 20; z <= 22; z++) {
        this.world[x][z] = 3;
      }
    }

    // Placed blocks
    this.blocks = [];
    for (let x = 0; x < this.width; x++) {
      this.blocks.push([]);
      for (let z = 0; z < this.depth; z++) {
        this.blocks[x].push([]);
        for (let y = 0; y < this.height; y++) {
          this.blocks[x][z].push(0);
        }
      }
    }

    // Preview marker
    this.previewCube = new Cube();
    this.previewCube.color = [1, 1, 0, 0.5]; // semi-transparent yellow
    this.previewCube.textureOption = 5; // color mode
  }

  drawMap() {
    let cube = new Cube();
    for (let x = 0; x < this.width; x++) {
      for (let z = 0; z < this.depth; z++) {
        let blockType = this.world[x][z];
        let yHeight = blockType;
        if (blockType === WATER) {
          cube.textureOption = [WATER, WATER, WATER, WATER, WATER, WATER];
          yHeight = 1;
        } else {
          cube.textureOption = [GRASS_SIDE, GRASS_SIDE, GRASS_SIDE, GRASS_SIDE, GRASS_TOP, GRASS_BOTTOM];
        }
        cube.matrix.setTranslate(x * 0.25 - 4, yHeight * 0.25 - 1, z * 0.25 - 4);
        cube.matrix.scale(0.25, 0.25, 0.25);
        cube.render();
      }
    }
  }

  drawBlocks() {
    let cube = new Cube();
    cube.textureOption = [PLANK, PLANK, PLANK, PLANK, PLANK, PLANK];
    for (let x = 0; x < this.width; x++) {
      for (let z = 0; z < this.depth; z++) {
        for (let y = 0; y < this.height; y++) {
          if (this.blocks[x][z][y] === 1) {
            cube.matrix.setTranslate(x * 0.25 - 4, y * 0.25 - 1, z * 0.25 - 4);
            cube.matrix.scale(0.25, 0.25, 0.25);
            cube.render();
          }
        }
      }
    }
  }

  // Helper: get the target block position in front of the camera
  getTargetBlockPosition() {
    // Camera direction vector
    let dir = new Vector3(camera.at.elements).sub(camera.eye).normalize();
    // Camera eye position
    let eye = camera.eye.elements;
    // Target position at a fixed distance
    let tx = eye[0] + dir.elements[0] * this.maxReachDistance * 0.25;
    let ty = eye[1] + dir.elements[1] * this.maxReachDistance * 0.25;
    let tz = eye[2] + dir.elements[2] * this.maxReachDistance * 0.25;
    // Convert to grid
    let gx = Math.floor((tx + 4) * 4);
    let gy = Math.floor((ty + 1) * 4);
    let gz = Math.floor((tz + 4) * 4);
    return { x: gx, y: gy, z: gz };
  }

  placeBlock() {
    let { x, y, z } = this.getTargetBlockPosition();
    if (this.isValidPosition(x, y, z) && this.blocks[x][z][y] === 0) {
      this.blocks[x][z][y] = 1;
    }
  }

  removeBlock() {
    let { x, y, z } = this.getTargetBlockPosition();
    if (this.isValidPosition(x, y, z) && this.blocks[x][z][y] === 1) {
      this.blocks[x][z][y] = 0;
    }
  }

  drawPreview() {
    let { x, y, z } = this.getTargetBlockPosition();
    if (!this.isValidPosition(x, y, z)) return;
    this.previewCube.matrix.setTranslate(x * 0.25 - 4, y * 0.25 - 1, z * 0.25 - 4);
    this.previewCube.matrix.scale(0.25, 0.25, 0.25);
    this.previewCube.render();
  }

  isValidPosition(x, y, z) {
    return (
      x >= 0 && x < this.width &&
      y >= 0 && y < this.height &&
      z >= 0 && z < this.depth
    );
  }
}
