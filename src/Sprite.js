export default class Sprite {
  constructor(src, w, h, onload) {
    this.image = new Image();
    this.image.src = src;
    this.image.onload = onload
    this.tileWidth = w;
    this.tileHeight = h;
    this.width = this.image.clientWidth / this.tileWidth;
    this.height = this.image.clientHeight / this.tileHeight;
  }

  getTile(x, y) {
    return {x: x * this.width, y: y * this.height};
  }
}
