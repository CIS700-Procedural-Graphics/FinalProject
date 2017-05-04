const THREE = require('three')

export default class Player //class for rooms or corridors
{
	constructor( _name, _pos, _radius, _mesh )
	{
		this.name = _name;
		this.position = _pos;
		this.mesh = _mesh.clone();
		this.radius = _radius;
	}

	drawCell(scene)
	{
		this.mesh.scale.set( 1,1,1 );
		this.mesh.position.set( this.position.x, this.position.y, this.position.z );
		scene.add(this.mesh);
	}
}
