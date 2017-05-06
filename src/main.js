"use strict";
const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
import Framework from './framework'

//import our code
//
import Sequencer from './sequencer.js'

//test
// import {g_floatListToArray, g_arrayToFloatList} from './utils.js'

// called after the scene loads
function onLoad(framework) {
  var scene = framework.scene;
  var camera = framework.camera;
  var renderer = framework.renderer;
  //var gui = framework.gui;
  var stats = framework.stats;
  
  // set camera position
  camera.position.set(-50, 30, 150);
  camera.lookAt(new THREE.Vector3(0,0,0));
  camera.fov = 40;
  camera.updateProjectionMatrix();
  //scene.add(adamCube);

  // edit params and listen to changes like this
  // more information here: https://workshop.chromeexperiments.com/examples/gui/#1--Basic-Usage
  //gui.add(camera, 'fov', 0, 180).onChange(function(newVal) {
  //  camera.updateProjectionMatrix();
  //});

  //add an object
  /*
  var geom = new THREE.CubeGeometry(2,3,4);
  var material = new THREE.MeshBasicMaterial( 0x5500aa );
  var mesh = new THREE.Mesh(geom, material);
  scene.add( mesh );
  */

  // console.log( g_floatListToArray("1 1.1 2") );
  // console.log( g_arrayToFloatList( [3, 2, 1] ) );

  ////////
  //
  // Create the main sequencer/controller
  framework.sequencer = new Sequencer( scene, camera, framework.orbitControls );
  //Keyboard event handler for basic midi input.
  //Handled within sequencer
  window.addEventListener('keydown', function(event){
      framework.sequencer.keyboardInput(event);
  } );

  //Init prev frame time
  framework.prevTime = Date.now();
}

//////
//
// called on frame updates
//
function onUpdate(framework) {
  //console.log(`the time is ${new Date()}`);
  var msec = Date.now();
  if( typeof( framework.sequencer ) != 'undefined'){
    //console.log(framework.sequencer);
    var dTime = (msec - framework.prevTime);
    framework.prevTime = msec;
    //NOTE typical dTime here is 15-20, even when skipping call to nextFrame()
    if( dTime > 8 )
      framework.sequencer.nextFrame( msec );
  }
  //console.log(adamMaterial.uniforms.uTimeMsec.value);
}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);