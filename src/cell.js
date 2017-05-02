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

		//holds a plain thats deformed in the shader
		this.mountain = new THREE.Mesh();
		this.mountainMaterial = new THREE.ShaderMaterial();

		// //slots for attaching walkways and paths
		// this.slot_left = [];
		// this.slot_right = [];
		// this.slot_front = [];
		// this.slot_back = [];
	}

	// emptyslots(numslots)
	// {
	// 	this.slot_left.length = 0;
	// 	this.slot_right.length = 0;
	// 	this.slot_front.length = 0;
	// 	this.slot_back.length = 0;

	// 	for(var i=0; i<numslots; i++)
	// 	{
	// 		this.slot_left.push(false);
	// 		this.slot_right.push(false);
	// 		this.slot_front.push(false);
	// 		this.slot_back.push(false);
	// 	}
	// }

	drawCell(scene)
	{
		this.mesh.scale.set( 1,1,1 );
		this.mesh.position.set( this.center.x, this.center.y, this.center.z );
		scene.add(this.mesh);
	}
}
