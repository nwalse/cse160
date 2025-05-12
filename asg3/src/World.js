// Used ai to help with this

class World {

  constructor() {
    this.blocks = [];
    this.width = 32;
    this.height = 32;
    this.depth = 32;
    this.world = Array.from({length: this.width}, () => 
      Array(this.depth).fill(1)
    );
    
    for(let x = 0; x < this.width; x++) {
      for(let z = 4; z <= 8; z++) { 
        this.world[x][z] = WATER; 
      }
    }

    for (let x = 0; x < this.width; x++) {
      this.blocks.push([]);
      for (let z = 0; z < this.depth; z++) {
        this.blocks[x].push([]);
        for (let y = 0; y < this.height; y++) {
          this.blocks[x][z].push(0);
        };
      };
    };

    // Add a small hill (3x3, 2 blocks high) at (x=10-12, z=6-8)
    // First layer of the hill (height 2)
    for(let x = 10; x <= 12; x++) {
      for(let z = 20; z <= 23; z++) {
        this.world[x][z] = 2; // Slightly higher than grass
      }
    }
    // Second (top) layer of the hill (height 3, smaller area)
    for(let x = 11; x <= 11; x++) {
      for(let z = 20; z <= 22; z++) {
        this.world[x][z] = 3; // Highest point of the hill
      }
    }
  }

  drawMap() {
    let cube = new Cube();
    for (let x = 0; x < this.width; x++) {
      for (let z = 0; z < this.depth; z++) {
        let blockType = this.world[x][z];
        let yHeight = blockType; // Use blockType as the height
  
        if(blockType === WATER) {
          cube.textureOption = [WATER, WATER, WATER, WATER, WATER, WATER];
          yHeight = 1; // Keep water at base height
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
    cube.textureOption = [PLANK,PLANK,PLANK,PLANK,PLANK,PLANK];
    for(let x = 0; x < this.width; x++) {
      for(let z = 0; z < this.depth; z++) {
        for(let y = 0; y < this.height; y++) {
          if (this.blocks[x][z][y] === 1) {
            cube.matrix.setTranslate(x * 0.25 - 4,y * 0.25 -1,z * 0.25 - 4);
            cube.matrix.scale(0.25,0.25,0.25);
            cube.render();
          }
        }
      }
    }
  }

  placeBlock() {
    let x_eye = Math.floor((camera.eye.elements[0] + 4) * 4);
    let y_eye = Math.floor((camera.eye.elements[1] + 1) * 4);
    let z_eye = Math.floor((camera.eye.elements[2] + 4) * 4);
    
    let x_at = Math.floor((camera.at.elements[0] + 4) * 4);
    let y_at = Math.floor((camera.at.elements[1] + 1) * 4);
    let z_at = Math.floor((camera.at.elements[2] + 4) * 4);


    let dX = x_at - x_eye;
    let dZ = z_at - z_eye;

    if(0 <= x_eye && x_eye < this.width && 0 <= z_eye && z_eye < this.depth && 0 <= y_eye && y_eye < this.height) {
      if(dX == 0 && dZ > 0) {
          this.blocks[at][z_eye+1][y_eye] = 1;
      } else if(dX == 0 && dZ < 0) {
          this.blocks[x_eye][z_eye-1][y_eye] = 1;
      } else if(dX > 0 && dZ == 0) {
          this.blocks[x_eye+1][z_eye][y_eye] = 1;
      } else if(dX < 0 && dZ == 0) {
          this.blocks[x_eye-1][z_eye][y_eye] = 1;
      } else if(dX > 0 && dZ > 0) {
          this.blocks[x_eye+1][z_eye+1][y_eye] = 1;
      } else if(dX > 0 && dZ < 0) {
          this.blocks[x_eye+1][z_eye-1][y_eye] = 1;
      } else if(dX < 0 && dZ > 0) {
          this.blocks[x_eye-1][z_eye+1][y_eye] = 1;
      } else if(dX < 0 && dZ < 0) {
          this.blocks[x_eye-1][z_eye-1][y_eye] = 1;
      }
    }
  }

  removeBlock() {
    let x_eye = Math.floor((camera.eye.elements[0] + 4) * 4);
    let y_eye = Math.floor((camera.eye.elements[1] + 1) * 4);
    let z_eye = Math.floor((camera.eye.elements[2] + 4) * 4);
    
    let x_at = Math.floor((camera.at.elements[0] + 4) * 4);
    let y_at = Math.floor((camera.at.elements[1] + 1) * 4);
    let z_at = Math.floor((camera.at.elements[2] + 4) * 4);

    let dX = x_at - x_eye;
    let dZ = z_at - z_eye;

    if(0 <= x_eye && x_eye < this.width && 0 <= z_eye && z_eye < this.depth && 0 <= y_eye && y_eye < this.height) {
      if(dX == 0 && dZ > 0) {
        this.blocks[x_eye][z_eye+1][y_eye] = 0;
      } else if(dX == 0 && dZ < 0) {
        this.blocks[x_eye][z_eye-1][y_eye] = 0;
      } else if(dX > 0 && dZ == 0) {
        this.blocks[x_eye+1][z_eye][y_eye] = 0;
      } else if(dX < 0 && dZ == 0) {
        this.blocks[x_eye-1][z_eye][y_eye] = 0;
      } else if(dX > 0 && dZ > 0) {
        this.blocks[x_eye+1][z_eye+1][y_eye] = 0;
      } else if(dX > 0 && dZ < 0) {
        this.blocks[x_eye+1][z_eye-1][y_eye] = 0;
      } else if(dX < 0 && dZ > 0) {
        this.blocks[x_eye-1][z_eye+1][y_eye] = 0;
      } else if(dX < 0 && dZ < 0) {
        this.blocks[x_eye-1][z_eye-1][y_eye] = 0;
      }
      console.log("Block removed at: " + x_eye + ", " + y_eye + ", " + z_eye);
    }
  }
}