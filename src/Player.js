export default class Player {
  constructor(pos, id) {
    this.pos = {x: pos.x, y: pos.y};
    this.id = id;
  }

  move(dir, world) {
    switch(dir) {
      case 'right':
        if (this.pos.x + 1 < world.size
          && world.getTile(this.pos.x+1, this.pos.y).traversable) {
          this.pos.x += 1;
        }
        break;
      case 'left':
        if (this.pos.x - 1 >= 0
          && world.getTile(this.pos.x-1, this.pos.y).traversable) {
          this.pos.x -= 1;
        }
        break;
      case 'up':
        if (this.pos.y + 1 < world.size
          && world.getTile(this.pos.x, this.pos.y+1).traversable) {
          this.pos.y += 1;
        }
        break;
      case 'down':
        if (this.pos.y - 1 >= 0
          && world.getTile(this.pos.x, this.pos.y-1).traversable) {
          this.pos.y -= 1;
        }
        break;
    }
  }

  moveTo(pos) {
    this.pos.x = pos.x;
    this.pos.y = pos.y;
  }

  update(player) {
    this.pos = player.pos;
    this.id = player.id;
  }

  serialize() {
    return {
      pos: {
        x: this.pos.x,
        y: this.pos.y
      },
      id: this.id,
    };
  }
}
