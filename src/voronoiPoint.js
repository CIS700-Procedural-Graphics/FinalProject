const THREE = require('three')

export default class VoronoiPoint //class for rooms or corridors
{
	constructor( p, e1, e2 )
	{
		this.point = new THREE.Vector3( p.x, p.y, p.z );
		this.edgeEndPoints = [];

		this.edgeEndPoints.push(new THREE.Vector3( e1.x, e1.y, e1.z ));
		this.edgeEndPoints.push(new THREE.Vector3( e2.x, e2.y, e2.z ));
	}
}
