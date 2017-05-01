const THREE = require('three')

export default class Cell //class for rooms or corridors
{
	constructor( _name, _center, _width, _length, _mesh )
	{
		this.name = _name;
		this.center = _center.clone();
		this.mesh = _mesh.clone();
		this.cellWidth = _width; //a x axis term
		this.cellLength = _length; //a z axis term
		this.radius = Math.sqrt( this.cellLength*this.cellLength + this.cellWidth*this.cellWidth ) * 0.5;

		//for block version of the mountains
		this.roomVoxels = []; //holds a list of voxels -- so positions
		this.voxelColors = []; //holds a list of voxels -- so positions
		this.roomVoxelsMesh = new THREE.Mesh();
		this.roomVoxelMat;

		//holds a plain thats deformed in the shader
		this.mountain = new THREE.Mesh();
	}

	drawCell(scene)
	{
		this.mesh.scale.set( 1,1,1 );
		this.mesh.position.set( this.center.x, this.center.y, this.center.z );
		scene.add(this.mesh);
	}
}
