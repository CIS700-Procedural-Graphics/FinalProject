export default class Sprite {
  constructor(src, onload) {
    this.image = new Image();
    this.image.src = src;
    this.image.onload = onload
    this.tileWidth = 16;
    this.tileHeight = 16;
    this.width = this.image.clientWidth / this.tileWidth;
    this.height = this.image.clientHeight / this.tileHeight;
  }

  getTile(x, y) {
    return {x: x * this.width, y: y * this.height};
  }
}
