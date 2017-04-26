import Tile from './Tile.js'
import Player from './Player.js'
import { util } from './Util.js'

export default class World {
  constructor() {
    this.players = {};
    this.me = new Player({x: 0, y: 0}, -1);
  }

  getTile(x, y) {
    if (0 <= x && x < this.size && 0 <= y && y < this.size) {
      return this.grid[x][y];
    } else {
      return new Tile('0');
    }
  }

  initWorld(world, id) {
    let { players, size, seed } = world;
    players.forEach(p => {
      this.players[p.id] = p;
      if (p.id === id) {
        this.me.update(p);
      }
    });

    util.seed(seed);
    this.size = size;
    this.grid = new Array(size);
    for (let i = 0; i < size; i++) {
      this.grid[i] = new Array(size);
    }

    // generate four regions
    // top-left: grassy plains
    for (let i = 0; i < size / 2.0; i++) {
      for (let j = 0; j < size / 2.0; j++) {
        let rand = util.random();
        if (rand < 0.75) {
          this.grid[i][j] = new Tile('G', true);
          this.randomPokemon(i, j, 'grass') // can also not add a pokemon
        } else if (rand < 0.9) {
          this.grid[i][j] = new Tile('F', true);
        } else if (rand < 0.95) {
          this.grid[i][j] = new Tile('B', false);
        } else {
          this.grid[i][j] = new Tile('F2', true);
        }
      }
    }
    // top-right: snow region
    for (let i = size / 2.0; i < size; i++) {
      for (let j = 0; j < size / 2.0; j++) {
        let rand = util.random();
        if (rand < 0.8) {
          this.grid[i][j] = new Tile('S', true);
          this.randomPokemon(i, j, 'snow') // can also not add a pokemon
        } else {
          this.grid[i][j] = new Tile('SB', false);
        }
      }
    }
    // bottom-left: desert rocky area
    for (let i = 0; i < size; i++) {
      for (let j = size / 2.0; j < size; j++) {
        let rand = util.random();
        if (rand < 0.8) {
          this.grid[i][j] = new Tile('D', true);
          this.randomPokemon(i, j, 'sand') // can also not add a pokemon
        } else {
          this.grid[i][j] = new Tile('DR', false);
        }
      }
    }
    // bottom-right: water region
    for (let i = size / 2.0; i < size; i++) {
      for (let j = size / 2.0; j < size; j++) {
        let rand = util.random();
        if (rand < 0.8) {
          this.grid[i][j] = new Tile('W', true);
          this.randomPokemon(i, j, 'water') // can also not add a pokemon
        } else {
          this.grid[i][j] = new Tile('WR', false);
        }
      }
    }
  }

  syncPlayers(players, id) {
    // TODO: eliminate sync race condition serverside :(
    this.players = {};
    players.forEach(p => {
      if (p.id === id) {
        return;
      }
      this.players[p.id] = p;
    });
    this.players[this.me.id] = this.me;
  }

  resetGrid() {
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        this.grid[i][j].hasPlayer = false;
      }
    }
  }

  randomPokemon(i, j, region) {
		let rand = util.random();
    switch(region) {
      case 'grass':
        if (rand < 0.1) {
          this.grid[i][j].pokemon = 'g1';
        } else if (rand < 0.15) {
          this.grid[i][j].pokemon = 'g2';
        } else if (rand < 0.2) {
          this.grid[i][j].pokemon = 'g3';
        }
        break;
      case 'water':
        if (rand < 0.1) {
          this.grid[i][j].pokemon = 'w1';
        }
        break;
      case 'sand':
        if (rand < 0.1) {
          this.grid[i][j].pokemon = 's1';
        } else if (rand < 0.15) {
          this.grid[i][j].pokemon = 's2';
        } else if (rand < 0.2) {
          this.grid[i][j].pokemon = 's3';
        }
        break;
      case 'snow':
        if (rand < 0.01) {
          this.grid[i][j].pokemon = 'i1';
        }
        break;
    }
  }

  serialize() {
    let players = [];
    for (let p in this.players) {
      players.push(this.players[p]);
    }
    return {
      players: players,
      size: this.size,
      seed: this.seed
    };
  }
}
