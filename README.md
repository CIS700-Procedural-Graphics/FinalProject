# InterestingLevelGenerator

Author: Aman Sachan

The design doc exists in a pdf.

## Final Submission:

Custom Fog Shader for every material used.
Terrain created on the GPU with interesting gradient based shading.
More of the Gui (Fog stuff).
Fixed bugs with intersecting paths between layers.
grid based acceleration structure for collisions and edge connection. (Too memory hungry for it to be useable)
My portion of the work: All files in the project are my work(no teammates)

### Brief Run down of Activities for final Submission:

-> Custom Fog Shader for every material used: e^2 fall off, with edge case handling (such as the rims/peripheral vision
                                          and different occlusion cases based on the material)
-> Per slab Terrain: http://www.redblobgames.com/maps/terrain-from-noise/
                     biome and elevation based gradient mapping
                     smoothed simplex noise used for elevation map
-> More Gui: fog controls, 3D layer connectivity
-> Fixed bugs: the problem with intersecting paths between layers resolved.
-> grid based acceleration structure for collisions and edge connection: works but it takes too much memory so it can't be used :(

### Comments: I spent a lot of time trying to voxelize different types of noise CPU side, but that doesn't work out well because of the facet that you can only make the voxels so tiny before the instance buffer of threejs can't handle it. And even at that size it doesn't look nice at all. Finally I ended up implementing terrain on the GPU.
I need to build a kd tree instead of a grid structure for collision handling or even to figure out edge connections.

## MileStone 2:

3D level exists
Working on Noise and voxelizing noise
my portion of the work: All files in the project are my work(no teammates)

### Brief Run down of Activities for milestone2:

-> Functional Gui: Made entire generation work on variables and randomization
-> Multiple Stacks of 2D levels
-> Grid structure for positioning information
-> Fixed weird issue from milestone1 (instanced cubes refusing to show up from certain camera angles)

## MileStone 1:

2D procedural level generation: done

my portion of the work: All files in the project are my work(no teammates)

### Brief Run down of Activities for milestone1:

-> Gui exists and provides  a list of all the tweakable portions of the level generator. All though I have not implemented the reset function, so for the time being you have to refresh the page to see a new map.
-> Created a bunch of slabs and placed them in a plane at random positions; Using a sample and rejection technique to prevent overlapping slabs/rooms.

-> Created a fake voronoi graph using the slab centers as points; Credits: Trung

-> This fake voronoi starts of as a triangle and starts assimilating points into the graph based on their procimity to the established graph. This creates a highly interconnected graph that is very natural looking and has a feel of complexity but doesn't connect every point to every other point or the exact opposite, i.e a MST minimal spanning tree.

-> I then remove edges in the graph that intersect other edges.

-> Next I remove edges at random while maintaining atleast one connection on every graph point

-> along the line segments joining the slabs I voxelized the space and generated a bunch of cubes to represent the path;
Using randomness and some adjustable threshold I can remove cubes giving the path a worn away feel;

-> The cubes were created using the instanced BufferGeometry of three.js for speed and efficiency

### Weird Issues: The Instanced cubes that were created occassionally refuse to show up when viewing the scene from certain camera angles.

### Comments: I spent some time experimenting with various graphs and room placement techniques before settling down on the methods I am currently using. These methods proved to be faster and easier to implement than what I had initially mentioned in my design Doc.
