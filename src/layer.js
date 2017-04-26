const THREE = require('three')

export default class Layer //class for rooms or corridors
{
	constructor()
	{
		this.cellList = []; //holds a list of cells -- so rooms/slabs
		this.voronoi = []; //helps create voronoi pattern graph
		this.walkway = []; //holds a list of voxels -- so positions
		this.instancedWalkway = new THREE.Mesh();
	}
}
