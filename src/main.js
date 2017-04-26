//skybox images from: https://github.com/simianarmy/webgl-skybox/tree/master/images

const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
import Framework from './framework'
import DAT from 'dat-gui'
var OBJLoader = require('three-obj-loader');
import Cell from './cell'
import VoronoiPoint from './voronoiPoint'
import Layer from './layer'
import WalkwayLayer from './walkwaylayer'
import GridCell from './gridcell'
OBJLoader(THREE);

//------------------------------------------------------------------------------

var RAND = require('random-seed').create(Math.random());
var Pi = 3.14;

//------------------------------------------------------------------------------

var generalParameters = {
  Collisions: false,
  voxelsize: 0.45
}

var map2D = {
  numberOfCells: 30,
  connectivity: 0.3,
  roomSizeMin: 2.0, //controls min of width and length of rooms
  roomSizeMax: 3.0, //controls max of width and length of rooms
  walkWayWidth: 4.0,
  crumbleStatus: 0.5
}

var level3D = {
  numberOfLayers: 2,
  connectivity: 0.3
}

var floor_Material = new THREE.ShaderMaterial({
  uniforms:
  {
  	image1: { // Check the Three.JS documentation for the different allowed types and values
      type: "t",
      value: THREE.ImageUtils.loadTexture('./images/ground1.jpg')
    },
    ambientLight:
    {
        type: "v3",
        value: new THREE.Vector3( 0.2, 0.2, 0.2 )
    },
    lightVec:
    {
        type: "v3",
        value: new THREE.Vector3( 10, 10, 10 )
    }
  },
  vertexShader: require('./shaders/lambert-withTexture-vert.glsl'),
  fragmentShader: require('./shaders/lambert-withTexture-frag.glsl')
});
// floor_Material = new THREE.MeshPhongMaterial({color: 0xdd3311});


// material for instanced objects
var voxelMat = new THREE.RawShaderMaterial({
	  uniforms:
	  {
	  	image1: { // Check the Three.JS documentation for the different allowed types and values
	      type: "t",
	      value: THREE.ImageUtils.loadTexture('./images/ground1.jpg')
	    },
	    ambientLight:
	    {
	        type: "v3",
	        value: new THREE.Vector3( 0.2, 0.2, 0.2 )
	    },
	    lightVec:
	    {
	        type: "v3",
	        value: new THREE.Vector3( 10, 10, 10 )
	    },
	    color:
	    {
	        type: "v3",
	        value: new THREE.Vector3( 1.0, 0.3, 0.3 )
	    },
	  },
	vertexShader: require ('./shaders/instance-vert.glsl') ,
	fragmentShader: require ('./shaders/instance-frag.glsl')
} );

//------------------------------------------------------------------------------

var levelLayers = [];//list of 2D Layers
var grid = [];
var connectingWalkways = []; //list of walkwaylayers connecting
//grid indexing scheme: index = currIndy*gridsize*gridsize + currIndx*gridsize + currIndz;
var gridsize = 20;

//------------------------------------------------------------------------------

var TextActions = function(scene) {
	this.NewLevel = function() {
		onreset( scene );
	}
};

function changeGUI(gui, camera, scene)
{
	var tweaks = gui.addFolder('Tweaks');

	var level3DFolder = tweaks.addFolder('3D Level parameters');
	level3DFolder.add(level3D, 'numberOfLayers', 3, 10).step(1).onChange(function(newVal) {});
	level3DFolder.add(level3D, 'connectivity', 0.1, 1.0).onChange(function(newVal) {});

	var map2DFolder = tweaks.addFolder('2D Layer parameters');
	map2DFolder.add(map2D, 'numberOfCells', 10, 30).step(1).onChange(function(newVal) {});
	map2DFolder.add(map2D, 'roomSizeMin', 1.0, 4.9).onChange(function(newVal) {});  
	map2DFolder.add(map2D, 'roomSizeMax', 1.1, 5.0).onChange(function(newVal) {});
	map2DFolder.add(map2D, 'connectivity', 0.1, 0.9).onChange(function(newVal) {});
	map2DFolder.add(map2D, 'walkWayWidth', 2.0, 6.0).onChange(function(newVal) {});
	map2DFolder.add(map2D, 'crumbleStatus', 0.0, 1.0).onChange(function(newVal) {
		map2D.crumbleStatus = 0.3 + 0.5*map2D.crumbleStatus;
	});

	gui.add(generalParameters, 'Collisions').onChange(function(newVal) {});

	var text = new TextActions(scene);
	gui.add(text, 'NewLevel');
}

function setupLightsandSkybox(scene, camera, renderer)
{
	//add it to your own shader

	// var hex = 0x000000;
	// var near = 1;
	// var far = 1000;
	// scene.fog = new THREE.Fog(0xffffff, 1, 60);
  	// scene.fog.color.setHSL( 0.55, 0.4, 0.8 );

	// Set light
	var directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
	directionalLight.color.setHSL(0.1, 1, 0.95);
	directionalLight.position.set(1, 3, 2);
	directionalLight.position.multiplyScalar(10);
	scene.add(directionalLight);
	floor_Material.lightVec = directionalLight.position;

	// set skybox
	var loader = new THREE.CubeTextureLoader();
	var urlPrefix = 'images/skymap/';
	var skymap = new THREE.CubeTextureLoader().load([
	  urlPrefix + 'px.jpg', urlPrefix + 'nx.jpg',
	  urlPrefix + 'py.jpg', urlPrefix + 'ny.jpg',
	  urlPrefix + 'pz.jpg', urlPrefix + 'nz.jpg'
	] );
	// scene.background = skymap;

	renderer.setClearColor( 0xbfd1e5 );
	scene.add(new THREE.AxisHelper(20));

	// set camera position
	camera.position.set(50, 100, 50);
	camera.lookAt(new THREE.Vector3(50,0,50));
}

function onreset( scene )
{
	cleanscene(scene);
	create3DMap(scene);
}

function cleanscene(scene)
{
	//remove all objects from the scene
	for( var i = scene.children.length - 1; i >= 0; i--)
	{
		var obj = scene.children[i];
		scene.remove(obj);
	}

	//remove instanced objects separately, cause threejs's scene doesn't contain it as a child
	for( var i=0; i<levelLayers.length; i++)
	{
		scene.remove(levelLayers[i].instancedWalkway);
	}	
}

//------------------------------------------------------------------------------

function initwalkwayGeo(scene, walkwayGeo, walkwayMat)
{
	//define and set attributes of the instanced walkway
	// geometry
	var instances = 65000;
	// per mesh data
	var vertices = new THREE.BufferAttribute( new Float32Array( [
		// Front
		-1, 1, 1,
		1, 1, 1,
		-1, -1, 1,
		1, -1, 1,
		// Back
		1, 1, -1,
		-1, 1, -1,
		1, -1, -1,
		-1, -1, -1,
		// Left
		-1, 1, -1,
		-1, 1, 1,
		-1, -1, -1,
		-1, -1, 1,
		// Right
		1, 1, 1,
		1, 1, -1,
		1, -1, 1,
		1, -1, -1,
		// Top
		-1, 1, 1,
		1, 1, 1,
		-1, 1, -1,
		1, 1, -1,
		// Bottom
		1, -1, 1,
		-1, -1, 1,
		1, -1, -1,
		-1, -1, -1
	] ), 3 );
	walkwayGeo.addAttribute( 'position', vertices );
	var uvs = new THREE.BufferAttribute( new Float32Array( [
				//x	y	z
				// Front
				0, 0,
				1, 0,
				0, 1,
				1, 1,
				// Back
				1, 0,
				0, 0,
				1, 1,
				0, 1,
				// Left
				1, 1,
				1, 0,
				0, 1,
				0, 0,
				// Right
				1, 0,
				1, 1,
				0, 0,
				0, 1,
				// Top
				0, 0,
				1, 0,
				0, 1,
				1, 1,
				// Bottom
				1, 0,
				0, 0,
				1, 1,
				0, 1
	] ), 2 );
	walkwayGeo.addAttribute( 'uv', uvs );
	var indices = new Uint16Array( [
		0, 1, 2,
		2, 1, 3,
		4, 5, 6,
		6, 5, 7,
		8, 9, 10,
		10, 9, 11,
		12, 13, 14,
		14, 13, 15,
		16, 17, 18,
		18, 17, 19,
		20, 21, 22,
		22, 21, 23
	] );
	walkwayGeo.setIndex( new THREE.BufferAttribute( indices, 1 ) );

	//giving it random positions; -- change later with actual positions
	// per instance data
	var offsets = new THREE.InstancedBufferAttribute( new Float32Array( instances * 3 ), 3, 1 );
	var vector = new THREE.Vector4();
	for ( var i = 0, ul = offsets.count; i < ul; i++ ) 
	{
		var x = Math.random() * 100 - 50;
		var y = Math.random() * 100 - 50;
		var z = Math.random() * 100 - 50;
		vector.set( x, y, z, 0 );
		// move out at least 5 units from center in current direction
		offsets.setXYZ( i, x + vector.x * 5, y + vector.y * 5, z + vector.z * 5 );
	}
	walkwayGeo.addAttribute( 'offset', offsets ); // per mesh translation

	//scale cubes that form walkway
	walkwayGeo.scale ( generalParameters.voxelsize, generalParameters.voxelsize, generalParameters.voxelsize );

	//creating bounding sphere
	var boundingSphereCenter = new THREE.Vector3(0,0,0);
	var boundingSphereRadius = 300;
	walkwayGeo.boundingSphere = new THREE.Sphere(boundingSphereCenter, boundingSphereRadius);

	//create mesh
	return new THREE.Mesh( walkwayGeo, walkwayMat );
}

function setWalkWayVoxels(walkwayMesh, walkway)
{
	var offsets = walkwayMesh.geometry.getAttribute("offset");
	walkwayMesh.geometry.maxInstancedCount = walkway.length;

	for ( var i = 0; i < walkway.length; i++ ) 
	{
		var x = walkway[i].x;
		var y = walkway[i].y;
		var z = walkway[i].z;
		offsets.setXYZ(i, x, y, z);
	}
}

//------------------------------------------------------------------------------

function cellCreateHelper(cellList, centx, centz, w, l, flag, spacing)
{
    var size = cellList.length;
    if(size != 0)
    {
        var currRadius = Math.sqrt( w*w + l*l ) * 0.5;
        var counter = 0;

        for(var j=0; j<size; j++)
        {
            var cent = new THREE.Vector2(centx, centz);
            var cent2 = new THREE.Vector2(cellList[j].center.x, cellList[j].center.z);
            var r = cellList[j].radius;
            var currdist = cent.distanceTo(cent2);

            if( currdist > (currRadius + r + spacing) )
            {
                counter++;                
            }
        }

        if(counter == cellList.length)
        {
        	return true;
        }
        else
        {
        	return false;
        }
    }

    return true;
}

function spawn2DCells(scene, cellList, floorHeight)
{
	var count = 0;
	var count1 = 0;
	var roomscale = 2.8;
	var spacing = 3*roomscale;

	while(count<map2D.numberOfCells)
	{
		count1++;
		if(count1 > 100)
		{
			break;
		}

		var flag_create = true;

		var centx = RAND.random()*150;
		var centz = RAND.random()*150;

		var w = (map2D.roomSizeMin + RAND.random()*(map2D.roomSizeMax-map2D.roomSizeMin))*roomscale ;
		var l = (map2D.roomSizeMin + RAND.random()*(map2D.roomSizeMax-map2D.roomSizeMin))*roomscale ;

		//loop through other cells to see if there is an overlap --> sample and rejection technique
		flag_create = cellCreateHelper(cellList, centx, centz, w, l, flag_create, spacing);

		if( flag_create )
		{
			count++;
			var box_geo = new THREE.BoxGeometry( w*2.0, 1, l*2.0 );		
			var slab = new THREE.Mesh( box_geo, floor_Material );

			var cent = new THREE.Vector3( centx, floorHeight, centz );

			var cell = new Cell("undetermined", cent, w, l, slab);
			cellList.push(cell);      
			cellList[cellList.length-1].drawCell(scene);
		}

	}
	// console.log("number of cells: " + map2D.numberOfCells);
	// console.log("number of cells drawn: " + cellList.length);
}

//------------------------------------------------------------------------------

function removeIntersectingLines(linePoints)
{
  for(var i=0; i<linePoints.length; i+=2)
  {
  	var p1 = linePoints[i];
  	var p2 = linePoints[i+1];
  	var m1 = (p2.z - p1.z)/(p2.x-p1.x);

    for(var j=0; j<linePoints.length; j+=2)
    {
    	var q1 = linePoints[j];
	  	var q2 = linePoints[j+1];
	  	var m2 = (q2.z - q1.z)/(q2.x-q1.x);

    	if(i==j)
    	{
    		continue;
    	}

	  	//actually solving
	  	var X = ( (q1.z - p1.z) + (m1*p1.x - m2*q1.x) )/( m1-m2 );
	  	var Z = m2*(X - q1.x) + q1.z;

		function between(test, a, b) 
		{
			return ((a+0.01) < test && test < b-0.01) || (b+0.01 < test && test < a-0.01)
		}

		function betweenPoints(test, a, b) 
		{
			return between(test.x, a.x, b.x) && between(test.z, a.z, b.z);
		}

		var pt = {
			x: X,
			z: Z
		}

		if (betweenPoints(pt, p1, p2) && betweenPoints(pt, q1, q2)) 
		{
	  		//lines intersect
          	//delete one of them
          	linePoints.splice(j,2);
          	j -= 2;
	  	}
    }
  }
}

function removeRandomLines(voronoi)
{
	for(var i=0; i<voronoi.length; i++)
	{
		var cell = voronoi[i];
		for(var j=1; j<voronoi[i].edgeEndPoints.length; j++)
		{
			if(RAND.random()>map2D.connectivity)
			{
				voronoi[i].edgeEndPoints.splice(j,1);
			}      
		}
	}
}

function createWalkWays(pathPoints, walkway, height)
{
	//draw planes instead of line segments that represent walk ways
	for(var i=0; i<pathPoints.length; i=i+2)
  	{
	  	var p1 = pathPoints[i];
	  	var p2 = pathPoints[i+1];

	  	var w = map2D.walkWayWidth;

	  	var curve = new THREE.SplineCurve( [
			new THREE.Vector2( p1.x, p1.z ),
			new THREE.Vector2( p2.x, p2.z )
		] );

	  	var len = p1.distanceTo(p2);
	  	var stepsize = generalParameters.voxelsize;
	  	var numcurvepoints = (len/stepsize);
		var path = new THREE.Path( curve.getPoints( numcurvepoints+1 ) );
		var curvegeo = path.createPointsGeometry( numcurvepoints+1 );
		
	  	//create voxelized walkways; will look cooler than solid planes
	  	for(var j=0; j<numcurvepoints; j++)
  		{
  			var curvepos = new THREE.Vector3(curvegeo.vertices[j].x, height, curvegeo.vertices[j].y);
			var up = new THREE.Vector3( 0.0, 1.0, 0.0 );
  			var forward = new THREE.Vector3(curvegeo.vertices[j+1].x - curvegeo.vertices[j].x, 
							  				0.0, 
							  				curvegeo.vertices[j+1].y - curvegeo.vertices[j].y).normalize();
  			var left = new THREE.Vector3(up.x, up.y, up.z).normalize();
  			left.cross(forward).normalize();

  			for(var k=-w*0.5; k<=w*0.5; k++)
  			{
  				if( map2D.crumbleStatus > RAND.random() )
  				{
  				  	var perpPos = new THREE.Vector3(curvepos.x, curvepos.y, curvepos.z);
					var temp = new THREE.Vector3(left.x, left.y, left.z);
					perpPos.x += temp.x*k;
					perpPos.z += temp.z*k;
					walkway.push(perpPos);
  				}
  			}
  		}
  	}
}

function compareCells(cellA, cellB)
{
	//returns 1 if cellA.center.x > cellB.center.x (if x is equal compare y then z)
	//returns 0 if cellA.center.x = cellB.center.x 
	//returns -1 if cellA.center.x < cellB.center.x
	var origin = new THREE.Vector3(0.0,0.0,0.0);

	var dist1 = cellA.center.distanceTo(origin);
	var dist2 = cellB.center.distanceTo(origin);

	if(dist1 > dist2)
	{
		return 1;
	}
	else if(dist1 < dist2)
	{
		return -1;
	}
	else if(dist1 == dist2)
	{
		return 0;
	}
}

function createGraph(scene, cellList, voronoi, walkway, height)
{
	//sort cellList by the centers of the cells, sort centers by x (if equal use z)
	cellList.sort(compareCells);

	//Fake Cheap Traingular Voronoi
	//create a triangle from the first three points in the cellList. This is the beginning of the fake voronoi
	var v1 = new VoronoiPoint( cellList[0].center, cellList[1].center, cellList[2].center );
	var v2 = new VoronoiPoint( cellList[1].center, cellList[2].center, cellList[0].center );
	var v3 = new VoronoiPoint( cellList[2].center, cellList[0].center, cellList[1].center );

	voronoi.push(v1);
	voronoi.push(v2);
	voronoi.push(v3);

	//for each point after that you attach it to the existing triangle by finding the 2 closest points in the fake voronoi
	for(var i=3; i<cellList.length; i++)
	{
		var p = cellList[i].center;
		//find the closest vertices in voronoi;
		var min1index = 0;
		var min2index = 1;
		var epoint1 = voronoi[0].point;
		var epoint2 = voronoi[1].point;

		for(var j=2; j<voronoi.length; j++)
		{
			var currdist = p.distanceTo(voronoi[j].point);

			var min1dist = p.distanceTo(epoint1);
			var min2dist = p.distanceTo(epoint2);

			if((currdist < min1dist) && (currdist<min2dist))
			{
				min2index = min1index;
				epoint2 = voronoi[min1index].point;
				min1index = j;
				epoint1 = voronoi[j].point;
			}

			if( !(currdist < min1dist) && (currdist < min2dist))
			{
				min2index = j;
				epoint2 = voronoi[j].point;
			}
		}

	    //form voronoi triangle thing with the three points and push it into voronoi
	    var v = new VoronoiPoint( cellList[i].center,  epoint1, epoint2 );
	    voronoi.push(v);
  	}
	//you should have a voronoi which is a list of vertices(points) and an edgelist 
	//(a list of points that together with the vertex of the voronoi element form an edge)

	//draw the edges to visualize it
	removeRandomLines(voronoi); //so not everything is connected

	var verts = [];
	for(var i=0; i<voronoi.length; i++)
	{
		for(var j=0; j<voronoi[i].edgeEndPoints.length; j++)
		{
			verts.push(voronoi[i].point);
			verts.push(voronoi[i].edgeEndPoints[j]);
		}
	}

	removeIntersectingLines(verts);
	createWalkWays(verts, walkway, height);

	// console.log("number of walkways: " + verts.length*0.5);
}

//------------------------------------------------------------------------------

function initgrid()
{
	var index = 0;
	//fill grid with empty elements
	for(var i=0; i<gridsize; i++)
	{
		for(var j=0; j<gridsize; j++)
		{
			for(var k=0; k<gridsize; k++)
			{
				var gridcell = new GridCell();
				grid.push(gridcell);
			}	
		}
	}	
}

function populateGrid()
{
	//each grid cell contains a list of slabs that are in it
	var index = 0;

	//gridsize is 20
	//grid is a gridsize by gridsize by gridsize thing

	for(var i=0; i<levelLayers.length; i++)
	{		
		//for each layer
		for(var j=0; j<levelLayers[i].cellList.length; j++)
		{		
			//for each cell list
			//find it position and put it in a grid cell
			var cell = levelLayers[i].cellList[j];
			var pos = cell.center;
			var r = cell.radius;

			var indy = Math.floor(pos.y/gridsize);
			var indx = Math.floor(pos.x/gridsize);
			var indz = Math.floor(pos.z/gridsize);

			index = indy*gridsize*gridsize + indx*gridsize + indz;
			var gridcell = grid[index];
			gridcell.slabs.push(cell); 
		}
	}
}

function pathShifting(c1, c2, currCell, toCell)
{
	var p1 = new THREE.Vector3(c1.x, c1.y, c1.z);
	var p2 = new THREE.Vector3(c2.x, c2.y, c2.z);

	// var diff = new THREE.Vector3(c2.x - c1.x, c2.y - c1.y, c2.z - c1.z);
	// // diff.normalize();
	// var moveFactor = currCell.radius*8;
	// var p1 = new THREE.Vector3( c1.x + diff.x*moveFactor, diff.y*moveFactor, diff.z*moveFactor);

	// var diff = new THREE.Vector3(c1.x - c2.x, c1.y - c2.y, c1.z - c2.z);
	// // diff.normalize();
	// moveFactor = toCell.radius*0.8;
	// var p2 = new THREE.Vector3(c2.x - diff.x*moveFactor, c2.x - diff.y*moveFactor, c2.x - diff.z*moveFactor);
	var tolerance = 40;
	if((c2.x + currCell.cellWidth < c1.x) || (c2.x - currCell.cellWidth > c1.x))
	{
		p1.x = p1.x + currCell.cellLength;
		p2.x = p2.x - toCell.cellLength;
	}

	if((c2.z + currCell.cellLength < c1.z) || (c2.z - currCell.cellLength > c1.z))
	{
		p1.z = p1.z + currCell.cellWidth;
		p2.z = p2.z - toCell.cellWidth;
	}

	c1 = p1;
	c2 = p2;
}

function createInterConnectingWalkWays(pathPoints, walkway)
{
	//draw planes instead of line segments that represent walk ways
	for(var i=0; i<pathPoints.length; i=i+2)
  	{
	  	var p1 = pathPoints[i];
	  	var p2 = pathPoints[i+1];

	  	var w = map2D.walkWayWidth;

	  	var len = p1.distanceTo(p2);
	  	var stepsize = generalParameters.voxelsize;
	  	var numcurvepoints = (len/stepsize);

	  	//Three js is a stupid graphics library --> does not have a get points method for 3d points
	  	//hence the stupidity and hackiness below
	  	var curve1 = new THREE.SplineCurve( [
			new THREE.Vector2( p1.x, p1.y ),
			new THREE.Vector2( p2.x, p2.y )
		] );

		var curve2 = new THREE.SplineCurve( [
			new THREE.Vector2( p1.y, p1.z ),
			new THREE.Vector2( p2.y, p2.z )
		] );

		var path1 = new THREE.Path( curve1.getPoints( numcurvepoints+1 ) );
		var curvegeo1 = path1.createPointsGeometry( numcurvepoints+1 );

		var path2 = new THREE.Path( curve2.getPoints( numcurvepoints+1 ) );
		var curvegeo2 = path2.createPointsGeometry( numcurvepoints+1 );

	  	//create voxelized walkways; will look cooler than solid planes
	  	for(var j=0; j<numcurvepoints; j++)
  		{
  			var curvepos = new THREE.Vector3(curvegeo1.vertices[j].x, curvegeo1.vertices[j].y, curvegeo2.vertices[j].y);
			var up = new THREE.Vector3( 0.0, 1.0, 0.0 );
  			var forward = new THREE.Vector3(curvegeo1.vertices[j+1].x - curvegeo1.vertices[j].x, 
							  				curvegeo2.vertices[j+1].x - curvegeo2.vertices[j].x, 
							  				curvegeo2.vertices[j+1].y - curvegeo2.vertices[j].y).normalize();
  			var left = new THREE.Vector3(up.x, up.y, up.z).normalize();
  			left.cross(forward).normalize();

  			for(var k=-w*0.5; k<=w*0.5; k++)
  			{
  				if( map2D.crumbleStatus > RAND.random() )
  				{
  				  	var perpPos = new THREE.Vector3(curvepos.x, curvepos.y, curvepos.z);
					var temp = new THREE.Vector3(left.x, left.y, left.z);
					perpPos.x += temp.x*k;
					perpPos.y += temp.y*k;
					perpPos.z += temp.z*k;
					walkway.push(perpPos);
  				}
  			}
  		}
  	}
}

function interLayerWalkwaysOld(walkway)
{
	var index = 0;
	var verts = [];
	//for every n randomly chosen slabs connect them to some other slab in the layer above it
	for(var i=0; i<level3D.numberOfLayers-1; i++)
	{
		//for every layer
		//pick an x number of slabs
		var n = RAND.random()*5;

		for(var j=0; j<n; j++)
		{
			var ind1 = Math.floor(RAND.random()*levelLayers[i].cellList.length);
			var currCell = levelLayers[i].cellList[ind1];

			//find current cell's position in grid
			var currIndy = Math.floor(currCell.center.y/gridsize);
			var currIndx = Math.floor(currCell.center.x/gridsize);
			var currIndz = Math.floor(currCell.center.z/gridsize);

			var connectableCells = [];
			//search through the grid in nearby cells in some radius
			//cells to the right and towards the camera; -- add thing for other way too
			for(var k=currIndx+2; k<Math.min((currIndx+6), gridsize); k++)
			{
				for(var m=currIndz+2; m<Math.min((currIndz+6), gridsize); m++)
				{
					//create a list of those cells
					index = currIndy*gridsize*gridsize + currIndx*gridsize + currIndz;
					// debugger;
					for(var a=0; a<grid[index].slabs.length; a++)
					{
						debugger;
						connectableCells.push(grid[index].slabs[a]);
					}
				}
			}
			
			//pick a random cell from that list and connect the original cell to the chosen cell 
			var ind2 = Math.floor(RAND.random()*connectableCells.length);
			var toCell = connectableCells[ind2];

			verts.push(currCell.center);
			verts.push(toCell.center);
		}
	}

	var height = (currCell.center.y + toCell.center.y)*0.5;
	createInterConnectingWalkWays(verts, walkway);
}

function interLayerWalkways(walkway)
{
	var index = 0;
	var verts = [];
	//for every n randomly chosen slabs connect them to some other slab in the layer above it
	for(var i=0; i<level3D.numberOfLayers-1; i++)
	{
		//for every layer
		//pick an x number of slabs
		var n = 5+RAND.random()*10;

		for(var j=0; j<n; j++)
		{
			var ind1 = Math.floor(RAND.random()*levelLayers[i].cellList.length);
			var currCell = levelLayers[i].cellList[ind1];

			var connectableCells = [];
			//search in the layers above the cell in some radius
			//cells to the right and towards the camera; -- add thing for other way too
			for(var k=i+1; k<Math.min(i+2, level3D.numberOfLayers); k++)
			{
				for(var m=0; m<levelLayers[k].cellList.length; m++)
				{
					var toCell = levelLayers[k].cellList[m];

					if(currCell == toCell)
					{
						continue;
					}

					var dist = currCell.center.distanceTo(toCell.center);
					var radius = 75.0;
					if(dist < radius)
					{
						//create a list of those cells
						connectableCells.push(toCell);
					}					
				}
			}
			
			//pick a random cell from that list and connect the original cell to the chosen cell 
			var ind2 = Math.floor(RAND.random()*connectableCells.length);
			var toCell = connectableCells[ind2];

			var p1 = new THREE.Vector3( currCell.center.x, currCell.center.y, currCell.center.z );
			var p2 = new THREE.Vector3( toCell.center.x, toCell.center.y, toCell.center.z );

			//figure out which direction they walkway goes in and change p1 and p2 by width or length
			pathShifting(p1, p2, currCell, toCell);

			verts.push(p1);
			verts.push(p2);
		}
	}

	createInterConnectingWalkWays(verts, walkway);
}

function create3DMap(scene)
{
	levelLayers.length = 0;
	var floorOffset = 20;
	var h = 0;
	for(var i=0; i<level3D.numberOfLayers; i++)
	{		
		//new layer
		var layer = new Layer();

		//new set of platforms for layers
		spawn2DCells(scene, layer.cellList, h);
		//new set of walkways for layers	
		createGraph(scene, layer.cellList, layer.voronoi, layer.walkway, h);

		//new instanced geometry for all of the walkways
		var geo = new THREE.InstancedBufferGeometry();

		var mat = new THREE.RawShaderMaterial({
			  uniforms:
			  {
			    color:
			    {
			        type: "v3",
			        value: new THREE.Vector3( RAND.random(), RAND.random(), RAND.random() )
			    }
			  },
			vertexShader: require ('./shaders/instance-vert.glsl') ,
			fragmentShader: require ('./shaders/instance-frag.glsl')
		} );

		layer.instancedWalkway = initwalkwayGeo(scene,  geo, mat);
		setWalkWayVoxels(layer.instancedWalkway, layer.walkway);

		//add walkway to scene
		scene.add(layer.instancedWalkway);

		//push layer to list of layers
		levelLayers.push(layer);
		h = h + floorOffset; 
	}

	//now connect layers
	//new geometry and material for between layer connections
	var geo = new THREE.InstancedBufferGeometry();

	var mat = new THREE.RawShaderMaterial({
	  uniforms:
	  {
	    color:
	    {
	        type: "v3",
	        value: new THREE.Vector3( RAND.random(), RAND.random(), RAND.random() )
	    }
	  },
	vertexShader: require ('./shaders/instance-vert.glsl') ,
	fragmentShader: require ('./shaders/instance-frag.glsl')
	});

	var walkwayLayer = new WalkwayLayer();

	populateGrid();
	interLayerWalkways(walkwayLayer.walkway);
	
	console.log(walkwayLayer.walkway);

	walkwayLayer.instancedWalkway = initwalkwayGeo(scene,  geo, mat);
	setWalkWayVoxels(walkwayLayer.instancedWalkway, walkwayLayer.walkway);

	//add walkway to scene
	scene.add(walkwayLayer.instancedWalkway);
}

//------------------------------------------------------------------------------

// called after the scene loads
function onLoad(framework)
{
	var scene = framework.scene;
	var camera = framework.camera;
	var renderer = framework.renderer;
	var gui = framework.gui;
	var stats = framework.stats;

	setupLightsandSkybox(scene, camera, renderer);
	changeGUI(gui, camera, scene);

	initgrid();
	create3DMap(scene);
}

// called on frame updates
function onUpdate(framework)
{
}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);
