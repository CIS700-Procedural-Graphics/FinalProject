import Tile from './Tile.js'
const PLAYER = 'P';

export default class Viewport {
  constructor(grid, pos) {
    this.width = 15;
    this.height = 11;
    this.halfWidth = Math.floor(this.width / 2);
    this.halfHeight = Math.floor(this.height / 2);

    this.cells = new Array(this.width);
    for (let i = 0; i < this.width; i++) {
      this.cells[i] = new Array(this.height);
    }
    this.focus = {x: pos.x, y: pos.y};
    this.grid = grid;
    this._sampleTiles();
  }

  updateFocus(x, y) {
    this.focus.x = x;
    this.focus.y = y;
    this._sampleTiles();
  }

  _sampleTiles() {
    for (let i = 0; i < this.width; i++) {
      for (let j = 0; j < this.height; j++) {
        let x = i + this.focus.x - this.halfWidth;
        let y = j + this.focus.y - this.halfHeight;
        this.cells[i][j] = this.grid.getTile(x, y);
      }
    }
    this.cells[Math.floor(this.width / 2)][Math.floor(this.height / 2)] = new Tile(PLAYER);
  }


}
