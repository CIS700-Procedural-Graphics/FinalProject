const THREE = require('three')

export default class Cell //class for rooms or corridors
{
	constructor( _name, _center, _width, _length, _mesh )
	{
		this.name = _name;
		this.center = _center.clone();
		this.mesh = _mesh.clone();
		this.cellWidth = _width;
		this.cellLength = _length;
		this.radius = Math.sqrt( this.cellLength*this.cellLength + this.cellWidth*this.cellWidth ) * 0.5;
	}

	drawCell(scene)
	{
		this.mesh.scale.set( 1,1,1 );
		this.mesh.position.set( this.center.x, this.center.y, this.center.z );
		scene.add(this.mesh);
	}
}
