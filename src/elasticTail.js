/*

Based on:

  Multi-Instantiable Elastic Mouse Trailer v0.1
  By: Matt Evans, mtdevans.com
  Date: 2013/04/13
  Depends on: jQuery
  Released under CC0 Licence
  URL: ...

  Usage Example:
  var newTrail = new elasticTail({
                          num:5,
                          gravityAmp:9.81,
                          gravityDir: [0,-1,0],
                          spacing: 2,
                          mass:15,
                          k:4000,
                          damping:0.5,
                          objectSize: 1,
                          objectTaper: 1,
                          dtUnstableMsec: 50,
                          dtStableMsec: 30,
                          dtSkipMsec: 12
                          });

  Stauffer 4/2017
  - modified for three.js
  - modified to take timing and head position info from an outside function, i.e. does not do its own timer updates anymore
  - modifying for 3D
  - added user input of gravity vector
  - added check for large delta times and consequent incremental simulation steps to avoid erratic behavior
  - added dat.gui gui option

*/
"use strict";

const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
import Framework from './framework'


export class elasticTail{
    constructor (config) {

      //setup configuration
      this.num = config.num || 3;
      this.gravityAmp = typeof(config.gravityAmp) == 'undefined' ? 9.81 : config.gravityAmp; // Acceleration due to gravity in metres per second per second
      if( typeof(config.gravityDir) == 'undefined' )
        this.gravityDir = [0,-1,0];
      else
        this.setGravityDir( config.gravityDir ); //Will make sure it's normalized
      this.spacing = typeof(config.spacing) == 'undefined' ? 5 : config.spacing; // Rest length of elastic in units we'll call cm
      this.mass = config.mass || 25; // Mass in kg
      this.k = config.k || 1000; // Elastic coefficient in N/m (ie stiffness)
      this.damping = config.damping || 0.4; // Fraction damping per oscillation

      //Tail object size tapering. Each object size is tapered down to
      // 1 - objectTaper * (num-1)/num * objectSize by the final item/object
      this.objectSize = config.objectSize || 1.0;
      this.objectTaper = config.objectTaper || 1.0;

      //For handling large delta times in simulation. See update() function.
      this.dtUnstableMsec = config.dtUnstableMsec || 50;
      this.dtStableMsec = config.dtStableMsec || 30;
      this.dtSkipMsec = config.dtSkipMsec || 10;

      this.reloading = false;
      //This will tell us whether we have scene objects to move at each update
      this.scene = null;
      this.init();
    }

    setGravityDir( arr3 ){
      this.gravityDir = this.normalize( arr3 );
    }

    //set everything up given the current config
    init(){
      // Initialize some variables
      this.items = new Array();

      //Stauffer - head position is supplied from outside this class in update().
      // Have an object that holds x/y position of origin, i.e mouse in orig code
      //Init here to 0
      this.headPosition = {x: 0, y: 0, z: 0};
      this.headPositionVel = {x: 0, y: 0, z: 0};

      //Caching
      this.cacheNextMsec = Number.MAX_VALUE;
      this.cache = {}

      // Create the items
      for (var i=0; i<this.num; i++) {
        var z = this.items.length;
        //Stauffer - I don't know what this jQuery call is doing, other than maybe instantiating the 'trailtime' object described above in the comments. But, if so,
        //its 'position' member isn't used anywhere that I can see, so skip it. Just
        // make an empty object.
        //this.items[z] = jQuery("<div class=\"trailItem\">*</div>");
        this.items[z] = {};
        this.items[z].parent = (i==0 ? this.headPosition : this.items[z-1]);
        // Initialize some variables here to make the code easier to read later on (no existance checking required)
        // Store the absolute, screen value of position
        // This is pretty goofy, using object properties for x,y,z, instead of vector. But orig code was like
        //  this so I'm going with it.
        this.items[z].x = this.headPosition.x; 
        this.items[z].y = this.headPosition.y;
        this.items[z].z = this.headPosition.z;
        // Position, velocity <-- stores the relative value of position (relative to its parent)
        // Maybe init the offsets here to align with gravity and spacing. Would that prevent the spastic
        // initial couple seconds of the sim?
        this.items[z].state = {'x':[this.headPosition.x, 0], 'y':[this.headPosition.y, 0], 'z':[this.headPosition.z, 0]}; 
        // How much stretch, or displacement from spring rest position
        this.items[z].stretch = {'x':0, 'y':0, 'z':0, 'mag': 0, 'dir':[0,0,0]};
      }

      //Stauffer - add this.
      this.prevTimeMsec = 0;

    }//init()

    // Translated from: http://doswa.com/2009/01/02/fourth-order-runge-kutta-numerical-integration.html
    rk4(x, v, a, dt) {
      // Returns final (position, velocity) array after time dt has passed.
      //        x: initial position
      //        v: initial velocity
      //        a: acceleration function a(x,v,dt) (must be callable)
      //        dt: timestep
      var x1 = x;
      var v1 = v;
      var a1 = a.call(this, x1, v1, 0); // Using .call(obj, arg1, arg2,...) to keep the context for `this`

      var x2 = x + 0.5*v1*dt;
      var v2 = v + 0.5*a1*dt;
      var a2 = a.call(this, x2, v2, dt/2);

      var x3 = x + 0.5*v2*dt;
      var v3 = v + 0.5*a2*dt;
      var a3 = a.call(this, x3, v3, dt/2);

      var x4 = x + v3*dt;
      var v4 = v + a3*dt;
      var a4 = a.call(this, x4, v4, dt);

      var xf = x + (dt/6)*(v1 + 2*v2 + 2*v3 + v4);
      var vf = v + (dt/6)*(a1 + 2*a2 + 2*a3 + a4);

      return [xf, vf];
    }

    update( timeMsec, headPositionArr3 ) {
      if( !this.items )
        return;
      if( this.reloading )
        return;
      //Check if we're just starting
      if( this.prevTimeMsec == 0 ){
        this.prevTimeMsec = timeMsec;
        this.checkForCaching( timeMsec );
        return;
      }
      var dtMsec = timeMsec - this.prevTimeMsec;
      var dtSec = dtMsec / 1000;

      //Check if dt is greater than a value that empirically
      // I've observed to cause the simulation to flail briefly 
      // (at least that's what I assume is happening). I dumped
      // stored delta times when I observed a hiccup in the trail,
      // and it looks like it happened when dt is > 50 or so.
      // NOTE however, that a little later I started seeing smooth
      //  simulation even when disabled this and have some larger dt's.
      //  It was perhaps only after I changed gravityScale value below back to 100,
      //  but I'm not sure. In any case, leave this code here in case we need it again,
      //  and I've set the default dtUnstableMsec to a higher value.
      //
      //Is dtMsec large enough to risk causing erratic simulation blips? If so, do it in steps.
      //NOTE - could also have this always take the smallish same step, user-definable. And take
      // as many of these as needed to make up dtMsec, with remainders as below. That way
      // the simulation is more consistant overall between runs.
      var stepTimeMsec = this.prevTimeMsec
      this.prevTimeMsec = timeMsec;
      if( dtMsec >= this.dtUnstableMsec ){
        var remainder = dtMsec;
        //Progress the simulation in smaller steps
        while( remainder > this.dtSkipMsec ){ //dtSkipMsec is some small number like 5 msec that isn't worth doing
          var dtIncMsec = Math.min( this.dtStableMsec, remainder );
          //console.log('large dtMsec, ',dtMsec,' - doing increment. dtIncMsec: ', dtIncMsec);
          this.updateDo( dtIncMsec / 1000, headPositionArr3 );
          stepTimeMsec += dtIncMsec; //track this for absolute caching time
          this.checkForCaching( stepTimeMsec );
          remainder -= dtIncMsec;
        }
        //Take any remaining remainder off of stored time, to be accurate
        this.prevTimeMsec -= remainder;
      }else{
        this.updateDo( dtSec, headPositionArr3 );
        this.checkForCaching( timeMsec );
      }
    }

    updateDo( dtSec, headPositionArr3 /* [x,y,z] */ ) {
      if (this.items) {
        //console.log( '------------------------- tC: dt, headPosition: ', dt, ' ', headPosition );

        //Update with new head position and calc it's velocity
        //velocity first
        this.headPositionVel.x = headPositionArr3[0] - this.headPosition.x;
        this.headPositionVel.y = headPositionArr3[1] - this.headPosition.y;
        this.headPositionVel.z = headPositionArr3[2] - this.headPosition.z;
        //update
        this.headPosition.x = headPositionArr3[0]; //If just assigne whole object, the first item still points to old ref
        this.headPosition.y = headPositionArr3[1];
        this.headPosition.z = headPositionArr3[2];

        for (var i=0;i<this.items.length;i++) {
          
          // Making these local just as shorthand
          var item = this.items[i];
          var stretch = item.stretch;
          var state = item.state;

          //Stauffer - Originally code was floor'ing parent positions. Not sure why it was done, maybe cuz pixel
          // values, and it cut down on jitter? But we have smaller range for stuff so need real values.
          state.x[0] = item.x - item.parent.x;
          state.y[0] = item.y - item.parent.y;
          state.z[0] = item.z - item.parent.z;

          // Work out stretch in elastic
          // For this demo, it's simply the distance from the centre of oscillation (ie the parent's position)
          // Stauffer - 'stretch' is this point's displacement from its spring-neutral position, which is its
          // 'spacing' distance from its parent.
          stretch.x = state.x[0];
          stretch.y = state.y[0];
          stretch.z = state.z[0];

          // To make the elastic loose under compression, set to zero if .spacing > .sqrt(~)
          // Stauffer - I don't see this happening, so must be a note to do this as an option.
          //  Instead of calc'ing angle I'm using normalized vector. Easier for 3D, and should be more efficient.
          var length = Math.sqrt(stretch.x * stretch.x + stretch.y * stretch.y + stretch.z * stretch.z );
          stretch.mag = length - this.spacing;
          stretch.dir = [ stretch.x / length, stretch.y / length, stretch.z / length ];
          //stretch.theta = Math.atan2(stretch.y, stretch.x);

          item.stretch = stretch; //why is this assigned back? stretch is already a ref to item.stretch

          // Keep a reference for comparison later on
          // ** Stauffer - HUH? If this is trying to copy state to save for later, this
          // won't work, will it??? ** Actually, looks like state.x and .y are reassigned below
          // by call to rk4
          var lastState = [state.x, state.y, state.z];

          //console.log(' befor rk4: item x/y, parent x/y: ', item.x, item.y,', ', item.parent.x, item.parent.y);
          //console.log(' st.left, st.y: ', state.x,', ',state.y);
          // console.log(' lastSt left/top, stretch: ', lastState[0], lastState[1],', ',stretch);

          //Do the integration
          //Stauffer - added gravityScale. Orig code had hard-coded 100 scaling below. I don't know why. Affects only gravity component of the accel calc.
          //When I first got my version running, the simulation would just run wild. When I changed this
          // from 100 to 1, things started to work. However the pull of gravity was very weak and trail was very
          // slow to orient with gravity. Now I can put it back at 100 and the sim looks great. Don't know what I
          // changed to make it good now at 100. Thought it was maybe the special handling for large delta-times
          // in update() function, but if I skip that, the sim still remains stable with gravityScale = 100.
          this.gravityScale = 100; 
          // Orig code: Using .call(this, ...) to keep context inside the function
          state.x = this.rk4.call(this, state.x[0], state.x[1], (function(x, v, dt) {
              // This is the acceleration function
              //   gravity contribution - (k/mass * stretch * cos(theta) + damping/mass * velocity)
              // return this.gravityScale * this.gravityAmp * Math.cos(Math.PI/2 + this.gravityAngle * Math.PI / 180 ) + ( -this.k * ( item.stretch.mag * Math.cos( item.stretch.theta) ) - 1000 * this.damping * v) / this.mass;
              return this.gravityScale * this.gravityAmp * this.gravityDir[0] + ( -this.k * ( item.stretch.mag * stretch.dir[0] ) - 1000 * this.damping * v) / this.mass;

          }), dtSec);

          state.y = this.rk4.call(this, state.y[0], state.y[1], (function(x, v, dt) {
              // This is the acceleration function
              //   gravity contribution - (k/mass * stretch * sin(theta) + damping/mass * velocity)
              // Some might call the random powers of ten hacks.
              // return this.gravityScale * this.gravityAmp * Math.sin( Math.PI/2 + this.gravityAngle * Math.PI / 180 ) - ( this.k * ( item.stretch.mag * Math.sin( item.stretch.theta ) ) + 1000 * this.damping * v) / this.mass;
              return this.gravityScale * this.gravityAmp * this.gravityDir[1] - ( this.k * ( item.stretch.mag * stretch.dir[1]  ) + 1000 * this.damping * v) / this.mass;

          }), dtSec);

          state.z = this.rk4.call(this, state.z[0], state.z[1], (function(x, v, dt) {
              // This is the acceleration function
              //   gravity contribution - (k/mass * stretch * sin(theta) + damping/mass * velocity)
              // Some might call the random powers of ten hacks.
              // return this.gravityScale * this.gravityAmp * Math.sin( Math.PI/2 + this.gravityAngle * Math.PI / 180 ) - ( this.k * ( item.stretch.mag * Math.sin( item.stretch.theta ) ) + 1000 * this.damping * v) / this.mass;
              return this.gravityScale * this.gravityAmp * this.gravityDir[2] - ( this.k * ( item.stretch.mag * stretch.dir[2]  ) + 1000 * this.damping * v) / this.mass;

          }), dtSec);

          // How much the item has moved since the last run-through
          var delta = {};
          delta.x = state.x[0] - lastState[0][0];
          delta.y = state.y[0] - lastState[1][0];
          delta.z = state.z[0] - lastState[2][0];
          // console.log(' after b4: st.left, st.y: ', state.x, ', ', state.y);

          // Increase/decrease by that amount
          item.x += delta.x;
          item.y += delta.y;
          item.z += delta.z;

          // Move item into position
          if( this.scene !== null) 
            item.object3D.position.set( item.x, item.y, item.z );
        }
      }
    }

    //Keeping the current config settings, reload everything
    // else. Use this to respond to config changes.
    reload(){
      this.reloading = true; //I don't think the calling function will ever be in a different thread, but just in case...
      var scene = this.scene; //cache this
      this.removeFromScene();
      this.items = [];
      this.init();
      this.addSceneObjects( scene );
      this.reloading = false;
    }

    //Return an array of arr3's, holding each item's position.
    //First element is position of head, but that may be too jerky for us in other things
    getPosArr(){
      var res = [];

      //First the head position
      var h = this.headPosition;
      res.push( [h.x, h.y, h.z] );

      //Now the segments
      for (var it of this.items) {
        res.push( [it.x, it.y, it.z] )
      }

      return res;
    }//getPosArr

    //Return an object of { dir: [], mag: 0}, holding each item's normalized velocity direction and magnitdue from its state
    //First element is position of head, but that may be too jerky for us in other things
    getVelArrObj(){
      var dir = [];
      var mag = [];

      //First the head position
      var h = this.headPositionVel;
      dir.push( this.normalize( [h.x, h.y, h.z] ) );
      mag.push( this.magnitude( [h.x, h.y, h.z] ) );    

      //Now the segments
      for (var it of this.items) {
        var st = it.state;
        var velArr3 = [ st.x[1], st.y[1], st.z[1] ];
        dir.push( this.normalize( velArr3 ) );
        mag.push( this.magnitude( velArr3 ) );
      }

      return {dir: dir, mag: mag };
    }//getPosArr

    //Caching
    //Allow calling code to set an upcoming beat for which to cache
    // segment states using getPosArr and getVelArrObj. This should
    // allow it to get segment states at more consistent intervals, than
    // when simply relying on main framework's loop update intervals.
    setNextCacheTime( msec ){
      this.cacheNextMsec = msec;
    }

    //Cache up the state for retrieval by calling code.
    checkForCaching( timeMsec ){
      if( timeMsec >= this.cacheNextMsec ){
        var velArrObj = this.getVelArrObj();
        this.cache = {
          msecRequested: this.cacheNextMsec,
          msecActual: timeMsec,
          posArr: this.getPosArr(),
          velDirArr: velArrObj.dir,
          velMagArr: velArrObj.mag,
        }
      }
    }

    //caller must verify that it's for the expected time
    getCachedState(){
      return this.cache;
    }

    magnitude( arr3 ){
      return Math.sqrt( arr3[0]*arr3[0] + arr3[1]*arr3[1] + arr3[2]*arr3[2] )
    }
    normalize( arr3 ){
      var amp = this.magnitude( arr3 );
      return [ arr3[0] / amp, arr3[1] / amp, arr3[2] / amp ];
    }

    //Will add its params to the gui object passed in (doesn't make a subfolder )
    //Must be called separately by calling code, i.e. this isn't called in init() or ctor
    createGUI( gui ){
      gui.add(this, 'num', 0,100).step(1).onFinishChange(function(newVal){
        this.object.reload();
      });
      
      gui.add(this, 'gravityAmp',-100,100).step(.1);
      gui.add(this, 'spacing',0,20).step(0.5);
      gui.add(this, 'mass',1,100).step(.1);
      gui.add(this, 'k',100,20000).step(100);
      gui.add(this, 'damping',0,3).step(.02);
      //These two don't really need to reload the whole thing
      gui.add(this, 'objectSize',0.1,5).step(.1).onFinishChange(function(newVal){
        this.object.reload();
      });
      gui.add(this, 'objectTaper',0,1).step(.1).onFinishChange(function(newVal){
        this.object.reload();
      });
      gui.add(this, 'dtUnstableMsec',10,100).step(1);
      gui.add(this, 'dtStableMsec',10,100).step(1);
      gui.add(this, 'dtSkipMsec',1,20).step(1);
      //TODO - gravityDir
    }

    //Have this create its own three.js scene objects for each 'item' and
    // add them to the provided scene.
    addSceneObjects( scene ){
      this.scene = scene;
      //three.js render objects
      var count = 0;
      for( var item of this.items ){
        item.material = new THREE.MeshLambertMaterial( {color: 0xee6611} );
        var size = this.objectSize * ( 1 - ( this.objectTaper * count / this.num ) );
        //console.log("eTail size ", size);
        item.geom = new THREE.SphereGeometry( size, 24, 24 );
        item.object3D = new THREE.Mesh( item.geom, item.material );
        this.scene.add( item.object3D );
        count++;
      }
    }

    //Remove/clean scene object AND set scene ref to null
    removeFromScene() {
      if( this.scene !== null ){
        for (var i=0; i<this.items.length; i++) {
          this.scene.remove( this.items[i].object3D );
          this.items[i].material.dispose();
          this.items[i].geom.dispose();
        }
      }
      this.scene = null;
    }

    //** TODO **
    // Also clean/remove gui? But only when we destory the object, not just clean for a change in config/options
  
}//class elasticTail
