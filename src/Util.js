export default class Util {
  constructor() {
    this.randSeed = 0;
  }

  seed(seed) {
    this._seed = seed % 2147483647;
    if (this._seed <= 0) {
      this._seed += 2147483646;
    }
    this.randSeed = seed;
  }

  randInt() {
    return this._seed = this._seed * 16807 % 2147483647 - 1;
  }

  random() {
    return (this.randInt() - 1) / 2147483646;
  }
}

export let util = new Util();
