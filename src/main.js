//skybox images from: https://github.com/simianarmy/webgl-skybox/tree/master/images
//simplex noise function: https://www.npmjs.com/package/simplex-noise
//terrain noise: http://www.redblobgames.com/maps/terrain-from-noise/

const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
import Framework from './framework'
import DAT from 'dat-gui'
var OBJLoader = require('three-obj-loader');
var textureLoader = new THREE.TextureLoader();
import Player from './player'
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
  Fog: false,
  FogDensity: 0.1,
  fog_Col: new THREE.Color(0xd5ddea),
  voxelsize: 0.25,
  maxInstanceCount: 200000
}

// var fogParameters = {
// 	color: new THREE.Color(0x000000)
// }

var map2D = {
  numberOfCells: 4,
  connectivity: 0.3,
  roomSizeMin: 2.0, //controls min of width and length of rooms
  roomSizeMax: 3.0, //controls max of width and length of rooms
  walkWayWidth: 2.5,
  crumbleStatus: 0.5,
  numslots: 3
}

var level3D = {
  numberOfLayers: 2,
  connectivity: 0.35
}

//material for slab below mountains
var slabMat = new THREE.ShaderMaterial({
	uniforms:
	{
		albedo:
	    {
	        type: "v3",
	        value: new THREE.Vector3( 35.0/255.0, 70.0/255.0, 175.0/255.0 )
	    },
		ambientLight:
	    {
	        type: "v3",
	        value: new THREE.Vector3( 0.2, 0.2, 0.2 )
	    },
	    lightVec:
	    {
	        type: "v3",
	        value: new THREE.Vector3( 1, 2, 3 )
	    },
	    camPos:
	    {
	        type: "v3",
	        value: new THREE.Vector3( 10, 10, 10 )
	    },
	    fogSwitch:
	    {
	        type: "f",
	        value: 0
	    },
	    fogColor:
	    {
	        type: "v3",
	        value: new THREE.Vector3( 0.5, 0.5, 0.5 )
	    },
	    fogDensity:
	    {
	        type: "f",
	        value: 0.1
	    },
	    rimColor:
	    {
	        type: "v3",
	        value: new THREE.Vector3( 0.1, 0.1, 0.1 )
	    }
	},
	vertexShader: require ('./shaders/slab-vert.glsl'),
	fragmentShader: require ('./shaders/slab-frag.glsl'),
	side: THREE.DoubleSide
} );

// material for instanced objects
var pathMat = new THREE.RawShaderMaterial({
	  uniforms:
	  {
	  	image1: { // Check the Three.JS documentation for the different allowed types and values
	      type: "t",
	      value: THREE.ImageUtils.loadTexture('./images/tex_nor_maps/path/TilingStone1.jpg')
	    },
	    ambientLight:
	    {
	        type: "v3",
	        value: new THREE.Vector3( 0.1, 0.1, 0.1 )
	    },
	    lightVec:
	    {
	        type: "v3",
	        value: new THREE.Vector3( 1, 1, 1)
	    },
	    camPos:
	    {
	        type: "v3",
	        value: new THREE.Vector3( 10, 10, 10 )
	    },
	    fogSwitch:
	    {
	        type: "f",
	        value: 0
	    },
	    fogColor:
	    {
	        type: "v3",
	        value: new THREE.Vector3( 0.5, 0.5, 0.5 )
	    },
	    fogDensity:
	    {
	        type: "f",
	        value: 0.1
	    },
	    rimColor:
	    {
	        type: "v3",
	        value: new THREE.Vector3( 0.1, 0.1, 0.1 )
	    }
	  },
	vertexShader: require ('./shaders/paths-vert.glsl') ,
	fragmentShader: require ('./shaders/paths-frag.glsl'),
	side: THREE.DoubleSide
} );

//------------------------------------------------------------------------------

var directionalLight;
var levelLayers = [];//list of 2D Layers
var grid = new Uint8Array(17600000); //could be more efficient if it was a array of bits
var connectingWalkways = []; //list of walkwaylayers connecting
//grid indexing scheme: index = currIndy*gridsize*gridsize + currIndx*gridsize + currIndz;
var gridsize = new THREE.Vector3(200, 440, 200); //max dimensions of scene

//------------------------------------------------------------------------------

var TextActions = function(scene) {
	this.NewLevel = function() {
		onreset( scene );
	}
};

function changeGUI(gui, camera, scene, renderer)
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
	map2DFolder.add(map2D, 'crumbleStatus', 0.35, 0.9).onChange(function(newVal) {
		map2D.crumbleStatus = map2D.crumbleStatus;
	});

	var fog = tweaks.addFolder('Fog');
	fog.add(generalParameters, 'Fog').onChange(function(newVal) {

		if(newVal)
		{
			renderer.setClearColor( generalParameters.fog_Col );
		}
		else
		{
			renderer.setClearColor( 0x000000 );
		}

		pathMat.uniforms.fogSwitch.value = newVal;
		slabMat.uniforms.fogSwitch.value = newVal;
		for(var i=0; i<levelLayers.length; i++)
		{
			if(levelLayers[i].instancedWalkwayMaterial.uniforms.fogSwitch)
			{
				levelLayers[i].instancedWalkwayMaterial.uniforms.fogSwitch.value = newVal;
			}
		}

		//terrain
		for(var i=0; i<levelLayers.length; i++)
		{
			for(var j=0; j<levelLayers[i].cellList.length; j++)
			{
				var cell = levelLayers[i].cellList[j];
				if(cell.mountainMaterial.uniforms.fogSwitch)
				{
					cell.mountainMaterial.uniforms.fogSwitch.value = newVal;
				}
			}
		}
	});

	fog.add(generalParameters, 'FogDensity', 0.01, 0.15).onChange(function(newVal) {
		pathMat.uniforms.fogDensity.value = newVal;
		slabMat.uniforms.fogDensity.value = newVal;
		for(var i=0; i<levelLayers.length; i++)
		{
			if(levelLayers[i].instancedWalkwayMaterial.uniforms.fogDensity)
			{
				levelLayers[i].instancedWalkwayMaterial.uniforms.fogDensity.value = newVal;
			}
		}

		//terrain
		for(var i=0; i<levelLayers.length; i++)
		{
			for(var j=0; j<levelLayers[i].cellList.length; j++)
			{
				var cell = levelLayers[i].cellList[j];
				if(cell.mountainMaterial.uniforms.fogDensity)
				{
					cell.mountainMaterial.uniforms.fogDensity.value = newVal;
				}
			}
		}
	});

	// fog.add(fogParameters, 'color', ).onChange(function(newVal) {
	// 	generalParameters.fog_Col = color;
	// });

	gui.add(generalParameters, 'Collisions').onChange(function(newVal) {});

	var text = new TextActions(scene);
	gui.add(text, 'NewLevel');
}

function setupLightsandSkybox(scene, camera, renderer)
{
	// Set light
	directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
	directionalLight.color.setHSL(0.1, 1, 0.95);
	directionalLight.position.set(0, 1, 0);
	directionalLight.position.multiplyScalar(10);
	scene.add(directionalLight);

	renderer.setClearColor( 0x000000 );
	// scene.add(new THREE.AxisHelper(20));

	// set camera position
	camera.position.set(50, 100, 50);
	camera.lookAt(new THREE.Vector3(50,0,50));
}

function onreset( scene )
{
	cleanscene(scene);
	initgrid();
	create3DMap(scene);
	createTerrain(scene);
	setMaterialValues();
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
	var instances = generalParameters.maxInstanceCount;
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

	var normals = new THREE.BufferAttribute( new Float32Array( [
		// Front
		0, 0, 1,
		0, 0, 1,
		0, 0, 1,
		0, 0, 1,
		// Back
		0, 0, -1,
		0, 0, -1,
		0, 0, -1,
		0, 0, -1,
		// Left
		-1, 0, 0,
		-1, 0, 0,
		-1, 0, 0,
		-1, 0, 0,
		// Right
		1, 0, 0,
		1, 0, 0,
		1, 0, 0,
		1, 0, 0,
		// Top
		0, 1, 0,
		0, 1, 0,
		0, 1, 0,
		0, 1, 0,
		// Bottom
		0, -1, 0,
		0, -1, 0,
		0, -1, 0,
		0, -1, 0
	] ), 3 );
	walkwayGeo.addAttribute( 'normal', normals );

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

		var centx = RAND.random()*100;
		var centz = RAND.random()*100;

		var w = (map2D.roomSizeMin + RAND.random()*(map2D.roomSizeMax-map2D.roomSizeMin))*roomscale ;
		var l = (map2D.roomSizeMin + RAND.random()*(map2D.roomSizeMax-map2D.roomSizeMin))*roomscale ;

		//loop through other cells to see if there is an overlap --> sample and rejection technique
		flag_create = cellCreateHelper(cellList, centx, centz, w, l, flag_create, spacing);

		if( flag_create )
		{
			count++;
			var box_geo = new THREE.BoxGeometry( w*2.0, 1, l*2.0 );
			var slab = new THREE.Mesh( box_geo, slabMat );

			var cent = new THREE.Vector3( centx, floorHeight, centz );

			var cell = new Cell("undetermined", cent, w, l, slab);
			// cell.emptyslots(map2D.numslots);
			cellList.push(cell);      
			cellList[cellList.length-1].drawCell(scene);
		}
	}

	//To display the number of cells created and drawn per layer, uncomment below
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

  			for(var k=-w*0.5; k<=w*0.5; k=k+stepsize*1.1)
  			{
  				if( RAND.random() > map2D.crumbleStatus )
  				{
  				  	var perpPos = new THREE.Vector3(curvepos.x, curvepos.y, curvepos.z);
					var temp = new THREE.Vector3(left.x, left.y, left.z);
					perpPos.x += temp.x*k;
					perpPos.z += temp.z*k;
					walkway.push(perpPos);

					//fill grid
					// console.log("grid cell filled");
					fillGridCell( perpPos );
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
	    var v = new VoronoiPoint( cellList[i].center, epoint1, epoint2 );
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
	grid = new Uint8Array(17600000);
	// grid.length = 0;

	// gridcellsize = generalParameters.voxelsize;
	// gridsize.x = gridsize.x/gridcellsize;
	// gridsize.y = gridsize.y/gridcellsize;
	// gridsize.z = gridsize.z/gridcellsize;
	// //fill grid with empty elements
	// for(var i=0; i<gridsize.x; i++)
	// {
	// 	for(var j=0; j<gridsize.y; j++)
	// 	{
	// 		for(var k=0; k<gridsize.z; k++)
	// 		{
	// 			// var gridcell = new GridCell();
	// 			grid.push(0);
	// 		}	
	// 	}
	// }	
}

function fillGridCell( pos )
{
	//pass in position of voxel; if used to store 
	var indx = Math.floor(pos.x/(200)); //Uint8 level 
	var indy = Math.floor(pos.y/(200)); //Uint8 level
	var indz = Math.floor(pos.z/(440)); //Uint8 level

	var index = indy*gridsize.x*gridsize.z + indx*gridsize.z + indz;
	var minpos = new THREE.Vector3(indx*200, indy*440, indz*200);
	var diff = new THREE.Vector3(pos.x - minpos.x, pos.y - minpos.y, pos.z - minpos.z);

	var indbitx = Math.floor(diff.x/2); //8 bit level
	var indbity = Math.floor(diff.y/2); //8 bit level
	var indbitz = Math.floor(diff.z/2); //8 bit level

	grid[index] = 0;

	if( indbity == 1 )
	{
		if( indbitx == 1 )
		{
			if( indbitz == 1 )
			{
				grid[index] += 128; //top, right, front
			}
			else
			{
				grid[index] += 64; //top, right, back
			}
		}
		else
		{
			if( indbitz == 1 )
			{
				grid[index] += 32; //top, left, front
			}
			else
			{
				grid[index] += 16; //top, left, back
			}
		}
	}
	else
	{
		if( indbitx == 1 )
		{
			if( indbitz == 1 )
			{
				grid[index] += 8; //back, right, front
			}
			else
			{
				grid[index] += 4; //back, right, back
			}
		}
		else
		{
			if( indbitz == 1 )
			{
				grid[index] += 2; //back, left, front
			}
			else
			{
				grid[index] += 1; //back, left, back
			}
		}
	}
}

function queryGridCell( pos )
{
	//pass in position of voxel; if used to store 
	var indx = Math.floor(pos.x/(200)); //Uint8 level 
	var indy = Math.floor(pos.y/(200)); //Uint8 level
	var indz = Math.floor(pos.z/(440)); //Uint8 level

	var index = indy*gridsize.x*gridsize.z + indx*gridsize.z + indz;
	var retVal = grid[index];

	return retVal;
}

//------------------------------------------------------------------------------

function pathShifting(c1, c2, currCell, toCell)
{
	var p1 = new THREE.Vector3(c1.x, c1.y, c1.z);
	var w1 = currCell.cellWidth;
	var l1 = currCell.cellLength;
	var p2 = new THREE.Vector3(c2.x, c2.y, c2.z);
	var w2 = toCell.cellWidth;
	var l2 = toCell.cellLength;

	var offset = map2D.walkWayWidth*0.3;

	if(c2.x > c1.x) 
	{ 
		//ToCell is to the right of the currCell
		p2.x = p2.x - w2 + offset;
		p1.x = p1.x + w1 - offset;
	}
	else 
	{ 
		//ToCell is to the left of the currCell
		p2.x = p2.x + w2 - offset;
		p1.x = p1.x - w1 + offset;
	}

	if(c2.z < c1.z) 
	{ 
		//ToCell is infront(if measured along z axis) of the currCell
		p2.z = p2.z + l2 - offset;
		p1.z = p1.z - l1 + offset;
	}
	else
	{ 
		//ToCell is behind(if measured along z axis) the currCell
		p2.z = p2.z - l2 + offset;
		p1.z = p1.z + l1 - offset;
	}

	c1.x = p1.x;
	c1.z = p1.z;
	c2.x = p2.x;
	c2.z = p2.z;
}

function removeRandomPaths(verts)
{
	for(var i=0; i<verts.length; i=i+2)
	{
		if(RAND.random()>level3D.connectivity)
		{
			verts.splice(i,2);
		} 
	}
}

function f_equals(a, b, epsilon)
{
	if( (a>(b-epsilon)) && (a<(b+epsilon)) )
	{
		return true;
	}
	return false;
}

function removeIntersectingPaths(linePoints)
{
	//reseource: https://math.stackexchange.com/questions/28503/how-to-find-intersection-of-two-lines-in-3d
	for(var i=0; i<linePoints.length; i=i+2)
	{
		//convert lines to parametric form
		var A = new THREE.Vector3(linePoints[i].x, linePoints[i].y, linePoints[i].z);
		var B = new THREE.Vector3(linePoints[i+1].x, linePoints[i+1].y, linePoints[i+1].z);

		for(var j=0; j<linePoints.length; j+=2)
    	{
    		if(i==j)
    		{
    			continue;
    		}

    		var C = new THREE.Vector3(linePoints[j].x, linePoints[j].y, linePoints[j].z);
			var D = new THREE.Vector3(linePoints[j+1].x, linePoints[j+1].y, linePoints[j+1].z);

			var s_numerator = ((A.y-C.y)*(B.x-A.x)) + ((C.x-A.x)*(B.y-A.y));
			var s_denominator = ((B.x-A.x)*(D.y-C.y)) - ((D.x-C.x)*(B.y-A.y));
			
			if(f_equals(s_denominator,0.0, 0.001))
			{
				//lines don't intersect
				continue;
			}

			var s = s_numerator/s_denominator;

			var t_numerator = (C.x-A.x) + s*(D.x-C.x);
			var t_denominator = B.x-A.x;

			if(f_equals(t_denominator,0.0, 0.001))
			{
				//lines don't intersect
				continue;
			}

			var t = t_numerator/t_denominator;

			var eq1 = A.z + t*(B.z-A.z);
			var eq2 = C.z + s*(D.z-C.z);

			if(f_equals(eq1,eq2, 0.00001))
			{
				//lines do intersect, so remove one of the lines
				linePoints.splice(j,2);
				j -= 2;
				// console.log("removed lines");
			}
    	}
	}
}

function repositionPath(p1, p2)
{
	//Doesn't work
	var origin = new THREE.Vector3( p1.x, p1.y, p1.z );
	var dir = new THREE.Vector3( p2.x-p1.x, p2.y-p1.y, p2.z-p1.z ); // backwards ray
	dir = dir.normalize();
	var dist = p1.distanceTo(p2);
	origin = origin.add( dir.multiplyScalar(dist*0.85) );

	var t = 0.5;

	for(var i=dist*0.85; i<=dist; i=i+0.5)
	{		
		var pos = new THREE.Vector3(origin.x+t*dir.x, 
									origin.y+t*dir.y, 
									origin.z+t*dir.z);

		if( queryGridCell(pos)>0 )
		{
			return true;
		}
	}
	return false;
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

  			for(var k=-w*0.5; k<=w*0.5; k=k+1.1*stepsize)
  			{
  				if( RAND.random() > map2D.crumbleStatus )
  				{
  				  	var perpPos = new THREE.Vector3(curvepos.x, curvepos.y, curvepos.z);
					var temp = new THREE.Vector3(left.x, left.y, left.z);
					perpPos.x += temp.x*k;
					perpPos.y += temp.y*k;
					perpPos.z += temp.z*k;
					walkway.push(perpPos);

					//fill grid
					// console.log("grid cell filled");
					fillGridCell( perpPos );
  				}
  			}
  		}
  	}
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
		var minWalkways = 2 + map2D.numberOfCells*0.1;
		var maxWalkways = 10;
		var n = minWalkways+RAND.random()*(minWalkways-1.8);//level3D.numberOfLayers*map2D.numberOfCells;

		if( n>maxWalkways )
		{
			n = maxWalkways;
		}

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
					var spacing = 12.0;
					var radius = 23.0 + spacing; //height between layers is 20 and so this has to be greater than 20^2 and then some
					if(dist > radius)
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

			//below code was to remove an edge case where paths intersect with walkways
			// var conflictingPath = repositionPath(p1, p2);
			// if( conflictingPath )
			// {
			// 	//the path between 2D layers is attaching to a point on a cell 
			// 	//that has already been taken by a 2D layer walkway; pick another
			// 	j--;
			// 	continue;
			// }			

			verts.push(p1);
			verts.push(p2);			
		}
	}

	removeRandomPaths(verts);
	removeIntersectingPaths(verts);
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
						  	ambientLight:
						    {
						        type: "v3",
						        value: new THREE.Vector3( 0.2, 0.2, 0.2 )
						    },
						    lightVec:
						    {
						        type: "v3",
						        value: new THREE.Vector3( 1, 1, 1 )
						    },
						    camPos:
							{
							    type: "v3",
							    value: new THREE.Vector3( 10, 10, 10 )
							},
							fogSwitch:
							{
							    type: "f",
							    value: 0
							},
							fogColor:
							{
							    type: "v3",
							    value: new THREE.Vector3( 0.5, 0.5, 0.5 )
							},
							fogDensity:
							{
							    type: "f",
							    value: 0.1
							},
							rimColor:
							{
							    type: "v3",
							    value: new THREE.Vector3( 0.5, 0.5, 0.5 )
							},
						    albedo:
						    {
						        type: "v3",
						        value: new THREE.Vector3( RAND.random(), RAND.random(), RAND.random() )
						    }
						  },
						vertexShader: require ('./shaders/walkway-vert.glsl') ,
						fragmentShader: require ('./shaders/walkway-frag.glsl'),
						side: THREE.DoubleSide,
						transparent: false
					} );

		layer.instancedWalkwayMaterial = mat;
		layer.instancedWalkway = initwalkwayGeo(scene, geo, layer.instancedWalkwayMaterial);
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
	var mat = pathMat;
	var walkwayLayer = new WalkwayLayer();

	interLayerWalkways(walkwayLayer.walkway);

	walkwayLayer.instancedWalkway = initwalkwayGeo(scene, geo, mat);
	setWalkWayVoxels(walkwayLayer.instancedWalkway, walkwayLayer.walkway);

	//add walkway to scene
	scene.add(walkwayLayer.instancedWalkway);
}

//------------------------------------------------------------------------------

function initRoomGeo(scene, roomGeo, roomMat)
{
	//define and set attributes of the instanced walkway
	// geometry
	var instances = generalParameters.maxInstanceCount;;
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
	roomGeo.addAttribute( 'position', vertices );

	var normals = new THREE.BufferAttribute( new Float32Array( [
		// Front
		0, 0, 1,
		0, 0, 1,
		0, 0, 1,
		0, 0, 1,
		// Back
		0, 0, -1,
		0, 0, -1,
		0, 0, -1,
		0, 0, -1,
		// Left
		-1, 0, 0,
		-1, 0, 0,
		-1, 0, 0,
		-1, 0, 0,
		// Right
		1, 0, 0,
		1, 0, 0,
		1, 0, 0,
		1, 0, 0,
		// Top
		0, 1, 0,
		0, 1, 0,
		0, 1, 0,
		0, 1, 0,
		// Bottom
		0, -1, 0,
		0, -1, 0,
		0, -1, 0,
		0, -1, 0
	] ), 3 );
	roomGeo.addAttribute( 'normal', normals );

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
	roomGeo.addAttribute( 'uv', uvs );
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
	roomGeo.setIndex( new THREE.BufferAttribute( indices, 1 ) );

	//giving it random positions; -- change later with actual positions
	// per instance data
	var offsets = new THREE.InstancedBufferAttribute( new Float32Array( instances * 3 ), 3, 1 );
	// var vector = new THREE.Vector4();
	for ( var i = 0, ul = offsets.count; i < ul; i++ ) 
	{
		var x = Math.random() * 100 - 50;
		var y = Math.random() * 100 - 50;
		var z = Math.random() * 100 - 50;
		// vector.set( x, y, z, 0 );
		// move out at least 5 units from center in current direction
		offsets.setXYZ( i, x + x * 5, y + y * 5, z + z * 5 );
	}
	roomGeo.addAttribute( 'offset', offsets ); // per mesh translation

	//giving it random values; -- change later with actual positions
	// per instance data
	var voxelColors = new THREE.InstancedBufferAttribute( new Float32Array( instances * 3 ), 3, 1 );
	for ( var i = 0, ul = offsets.count; i < ul; i++ ) 
	{
		var x = Math.random();
		var y = Math.random();
		var z = Math.random();
		voxelColors.setXYZ( i, x, y, z );
	}
	roomGeo.addAttribute( 'color', voxelColors ); // per mesh translation

	//scale cubes that form walkway
	roomGeo.scale ( generalParameters.voxelsize/4.0, generalParameters.voxelsize/4.0, generalParameters.voxelsize/4.0 );

	//creating bounding sphere
	var boundingSphereCenter = new THREE.Vector3(0,0,0);
	var boundingSphereRadius = 300;
	roomGeo.boundingSphere = new THREE.Sphere(boundingSphereCenter, boundingSphereRadius);

	//create mesh
	return new THREE.Mesh( roomGeo, roomMat );
}

function setVoxels(roomMesh, roomVoxels, voxelColors)
{
	var offsets = roomMesh.geometry.getAttribute("offset");
	var colors = roomMesh.geometry.getAttribute("color");
	roomMesh.geometry.maxInstancedCount = roomVoxels.length;

	for ( var i = 0; i < roomVoxels.length; i++ ) 
	{
		offsets.setXYZ(i, roomVoxels[i].x, roomVoxels[i].y, roomVoxels[i].z);
		colors.setXYZ(i, voxelColors[i].x, voxelColors[i].y, voxelColors[i].z);
	}
}

//------------------------------------------------------------------------------

function createTerrain(scene)
{
    for(var i=0; i<levelLayers.length; i++)
	{
		var level = levelLayers[i];
		for(var j=0; j<level.cellList.length; j++)
		{
			var cell = level.cellList[j];
			var center = cell.center;
			var w = cell.cellWidth;
			var l = cell.cellLength;
			var h = 10;
			var r = cell.radius;

			var mat = new THREE.ShaderMaterial({
				uniforms:
  				{
					ambientLight:
				    {
				        type: "v3",
				        value: new THREE.Vector3( 0.2, 0.2, 0.2 )
				    },
				    lightVec:
				    {
				        type: "v3",
				        value: new THREE.Vector3( 1, 1, 1 )
				    },
				    camPos:
					{
					    type: "v3",
					    value: new THREE.Vector3( 10, 10, 10 )
					},
					fogSwitch:
					{
					    type: "f",
					    value: 0
					},
					fogColor:
					{
					    type: "v3",
					    value: new THREE.Vector3( 0.5, 0.5, 0.5 )
					},
					fogDensity:
					{
					    type: "f",
					    value: 0.1
					},
					rimColor:
					{
					    type: "v3",
					    value: new THREE.Vector3( 0.1, 0.1, 0.1 )
					},
					slabCenter:
					{
					    type: "v3",
					    value: new THREE.Vector3( center.x, center.y, center.z )
					},
					width:
					{
					    type: "f",
					    value: w
					},
					length:
					{
					    type: "f",
					    value: l
					},
					slabRadius:
					{
					    type: "f",
					    value: r*2.0
					}
				},
				vertexShader: require ('./shaders/terrain-vert.glsl') ,
				fragmentShader: require ('./shaders/terrain-frag.glsl'),
				side: THREE.DoubleSide
			} );

			var plane_geo = new THREE.PlaneGeometry( w*2.0,  l*2.0, 100, 100 );
			plane_geo.rotateX(0.5*Pi);

			cell.mountainMaterial = mat;
			cell.mountain = new THREE.Mesh(plane_geo, mat);
			cell.mountain.position.set(center.x, center.y+0.5, center.z);
			scene.add(cell.mountain);
		}
	}
}

//------------------------------------------------------------------------------

function setMaterialValues()
{
	//interlayer voxels
	if(pathMat)
	{
		pathMat.uniforms.lightVec.value.set( directionalLight.position.x, directionalLight.position.y, directionalLight.position.z );

		pathMat.uniforms.fogColor.value.set( generalParameters.fog_Col.r, generalParameters.fog_Col.g, generalParameters.fog_Col.b );
		pathMat.uniforms.rimColor.value.set( generalParameters.fog_Col.r, generalParameters.fog_Col.g, generalParameters.fog_Col.b );

		pathMat.uniforms.fogDensity.value =  generalParameters.FogDensity;
		pathMat.uniforms.fogSwitch.value = generalParameters.Fog;
	}

	//slabs
	if(slabMat)
	{
		slabMat.uniforms.lightVec.value.set( directionalLight.position.x, directionalLight.position.y, directionalLight.position.z );

		slabMat.uniforms.fogColor.value.set( generalParameters.fog_Col.r, generalParameters.fog_Col.g, generalParameters.fog_Col.b );
		slabMat.uniforms.rimColor.value.set( generalParameters.fog_Col.r, generalParameters.fog_Col.g, generalParameters.fog_Col.b );

		slabMat.uniforms.fogDensity.value = generalParameters.FogDensity;
		slabMat.uniforms.fogSwitch.value = generalParameters.Fog;
	}

	//2D layer voxels
	for(var i=0; i<levelLayers.length; i++)
	{
		if(levelLayers[i].instancedWalkwayMaterial)
		{
			levelLayers[i].instancedWalkwayMaterial.uniforms.lightVec.value.set(directionalLight.position.x, directionalLight.position.y, directionalLight.position.z);

			levelLayers[i].instancedWalkwayMaterial.uniforms.fogColor.value.set( generalParameters.fog_Col.r, generalParameters.fog_Col.g, generalParameters.fog_Col.b );
			levelLayers[i].instancedWalkwayMaterial.uniforms.rimColor.value.set( generalParameters.fog_Col.r, generalParameters.fog_Col.g, generalParameters.fog_Col.b );

			levelLayers[i].instancedWalkwayMaterial.uniforms.fogDensity.value = generalParameters.FogDensity ;
			levelLayers[i].instancedWalkwayMaterial.uniforms.fogSwitch.value = generalParameters.Fog;
		}
	}

	//terrain
	for(var i=0; i<levelLayers.length; i++)
	{
		for(var j=0; j<levelLayers[i].cellList.length; j++)
		{
			var cell = levelLayers[i].cellList[j];
			if(cell.mountainMaterial)
			{
				cell.mountainMaterial.uniforms.lightVec.value.set(directionalLight.position.x, directionalLight.position.y, directionalLight.position.z);

				cell.mountainMaterial.uniforms.fogColor.value.set( generalParameters.fog_Col.r, generalParameters.fog_Col.g, generalParameters.fog_Col.b );
				cell.mountainMaterial.uniforms.rimColor.value.set( generalParameters.fog_Col.r, generalParameters.fog_Col.g, generalParameters.fog_Col.b );

				cell.mountainMaterial.uniforms.fogDensity.value = generalParameters.FogDensity;
				cell.mountainMaterial.uniforms.fogSwitch.value = generalParameters.Fog;
			}
		}
	}
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
	changeGUI(gui, camera, scene, renderer);

	initgrid();
	create3DMap(scene);
	createTerrain(scene);
	setMaterialValues();
}

// called on frame updates
function onUpdate(framework)
{
	//interlayer voxels
	if(pathMat.uniforms.camPos)
	{
		pathMat.uniforms.camPos.value.set( framework.camera.position.x, framework.camera.position.y, framework.camera.position.z );
	}

	//slabs
	if(slabMat.uniforms.camPos)
	{
		slabMat.uniforms.camPos.value.set( framework.camera.position.x, framework.camera.position.y, framework.camera.position.z );
	}

	//2D layer voxels
	for(var i=0; i<levelLayers.length; i++)
	{
		if(levelLayers[i].instancedWalkwayMaterial.uniforms.camPos)
		{
			levelLayers[i].instancedWalkwayMaterial.uniforms.camPos.value.set( framework.camera.position.x, framework.camera.position.y, framework.camera.position.z );
		}
	}

	//terrain
	for(var i=0; i<levelLayers.length; i++)
	{
		for(var j=0; j<levelLayers[i].cellList.length; j++)
		{
			var cell = levelLayers[i].cellList[j];
			if(cell.mountainMaterial.uniforms.camPos)
			{
				cell.mountainMaterial.uniforms.camPos.value.set( framework.camera.position.x, framework.camera.position.y, framework.camera.position.z );
			}
		}
	}
}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);
