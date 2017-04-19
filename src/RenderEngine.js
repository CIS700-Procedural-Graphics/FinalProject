const TILEMAP = {
  '0': {x: 32, y: 304},
  '1': {x: 16, y: 16},
  '2': {x: 48, y: 16},
  'P': {x: 7 * 16, y: 16}
};

export default class RenderEngine {
  constructor(canvas, sprite, grid, player) {
    // canvas is 960 x 640
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.sprite = sprite;
    this.grid = grid;
    this.player = player;
    this.viewport = player.viewport;
  }

  render() {
    for (let i = 0; i < this.viewport.width; i++) {
      for (let j = 0; j < this.viewport.height; j++) {
        this.drawTile(this.viewport.cells[i][j].symbol, i, j);
      }
    }
  }

  drawTile(tile, x, y) {
    let spritePos = TILEMAP[tile];
    let { tileHeight, tileWidth } = this.sprite;

    let canvasTileWidth = this.canvas.width / this.viewport.width;
    let canvasTileHeight = this.canvas.height / this.viewport.height;
    let canvasPosx = x * canvasTileWidth;
    let canvasPosy = y * canvasTileHeight;
    this.ctx.drawImage(
      this.sprite.image,
      spritePos.x, spritePos.y,
      tileWidth, tileHeight,
      canvasPosx, canvasPosy,
      canvasTileWidth, canvasTileHeight
    );
  }
}
