const THREE = require('three')

export default class WalkwayLayer //class for rooms or corridors
{
	constructor()
	{
		this.walkway = []; //holds a list of voxels -- so positions
		this.instancedWalkway = new THREE.Mesh();
	}
}
