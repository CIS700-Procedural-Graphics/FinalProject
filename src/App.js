import World from './World.js'
import Player from './Player.js'
import RenderEngine from './RenderEngine.js'
import Sprite from './Sprite.js'

const ASSETS = './assets';
const SERVER_URL = 'wss://davidliao.me:8000/play';
const RESOLUTION_SCALE = 3;
const DEFAULT_WORLD_SIZE = 100;
const DEFAULT_PLAYER_POS = {x: 10, y: 10};
export default class App {
  constructor () {
    this.canvas = document.createElement('canvas'); // Aspect ratio of 3:2
    this.canvas.width = 240 * RESOLUTION_SCALE;
    this.canvas.height = 160 * RESOLUTION_SCALE;
    this.terrainSpriteSrc = `${ASSETS}/biomes.png`;
    this.pokemonSpriteSrc = `${ASSETS}/pokemon.png`;
    this.playerSpriteSrc = `${ASSETS}/player.png`;
    this.clientID = -1; // default null value for client ID
  }

  setup() {
    this.setupWebsocket();
    this.setupGame();
    this.setupEventListeners();
  }

  setupGame() {
    this.world = new World(DEFAULT_WORLD_SIZE);
    this.re = new RenderEngine(
      this.canvas,
      this.terrainSprite,
      this.playerSprite,
      this.pokemonSprite,
      this.world);
  }

  setupEventListeners() {
    window.addEventListener('keydown', (event) => {
      let { me } = this.world;
      switch (event.keyCode) {
        case 32:
          break;
        case 37:
          me.move("left", this.world);
          break;
        case 38:
          me.move("down", this.world);
          break;
        case 39:
          me.move("right", this.world);
          break;
        case 40:
          me.move("up", this.world);
          break;
      }
      this.sendEvent('sync', {
        message: 'syncing shit',
        game: {
          world: this.world.serialize()
        }
      });
      this.re.render();
    });
  }

  onLoad() {
    document.body.appendChild(this.canvas);
    this.terrainSprite = new Sprite(this.terrainSpriteSrc, 16, 16, () => {
      this.pokemonSprite = new Sprite(this.pokemonSpriteSrc, 64, 64, () => {
        this.playerSprite = new Sprite(this.playerSpriteSrc, 19, 24, () => {
          this.setup();
        });
      });
    });
  }

  onUpdate() {
  }

  onResize() {

  }

/**********************
  WebSocket Shenanigans
 **********************/

  setupWebsocket() {
    this.ws = new WebSocket(SERVER_URL);
    this.ws.onopen = this.onWSOpen.bind(this);
    this.ws.onmessage = this.receiveEvent.bind(this);
  }

  onWSOpen() {
    this.sendEvent('init', {message: 'initializing connection and awaiting id assignment'});
  }

  sendEvent(type, data) {
    let m = {
      type: type,
      data: data,
      id: this.clientID
    }
    this.ws.send(JSON.stringify(m));
  }

  receiveEvent(e) {
    let { type, data, id } = JSON.parse(e.data);
    switch (type) {
      case 'init':
        this.clientID = id;
        this.world.initWorld(data.game.world, id);
        break;
      case 'sync':
        this.world.syncPlayers(data.game.world.players, id);
        break;
      default:
        console.log('event not handled', e.data);
        return;
    }
    this.re.render();
  }
}
