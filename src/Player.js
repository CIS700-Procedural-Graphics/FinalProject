import Viewport from './Viewport.js'

export default class Player {
  constructor(grid) {
    this.pos = {x: 10, y: 10};
    this.grid = grid;
    this.viewport = new Viewport(grid, this.pos);
  }


  move(dir) {
    switch(dir) {
      case 'right':
        if (this.pos.x + 1 < this.grid.size) {
          this.pos.x += 1;
        }
        break;
      case 'left':
        if (this.pos.x - 1 >= 0) {
          this.pos.x -= 1;
        }
        break;
      case 'up':
        if (this.pos.y + 1 < this.grid.size) {
          this.pos.y += 1;
        }
        break;
      case 'down':
        if (this.pos.y - 1 >= 0) {
          this.pos.y -= 1;
        }
        break;
    }
    this.viewport.updateFocus(this.pos.x, this.pos.y);
  }
}
