# Procedural Pokemon
no memes allowed

## Milestone 1 Accomplishments

### David
- Configured infrastructure and set up the project. 
- Implemented sprite importing and rendering.
- Created a base world using the current sprite set.
- Implemented player.js and enabled player movement throughout the scene.
- Implemented the viewport so we only see a certain poprtion of the world.
- File changed: Made changes in all files (see commits).

### Joseph 
- Implemented Tile logic for use by the Grid. Tiles will be used to later determine which parts of the world belong to which biome, as well as which parts of the world are traversable, or will hold wild pokemon, etc. Currently used to holds symbols that tells the render engine what to render.
- Implemented render engine to render information in a tile. For now just the ability to render a single sprite to the canvas. David expanded this functionality to create the vanilla world you see.
- Developed logic for randomly spawning 'pokemon' throughout the world. Each index in the grid currently has some percentage change of spawning a pokemon. Currently the pokemon are represented by a symbol.
- Files changed: Tile.js, Grid.js, RenderEngine.js, App.js