const THREE = require('three')

export default class GridCell //class for rooms or corridors
{
	constructor()
	{
		// this.slabs = []; //list of pointers to the cell stored in layerList.cellList[index]
		this.occupied = false; //used to determine if its filled by an instanced voxel
	}
}
