//particles
//does timing in terms of beats

// ***
//
// DON'T FORGET
//  After init'ing ParticleManager, must call addSceneObjects() to tell it to 
//  and any existing and all newly generated particles' objects to the scene.

"use strict";
const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry 

export class ParticlesManager{

    /*
    config = { //DO NOT add objects as properties unless want to not do JSON copy in particle ctor
      sizeGeom: 0.4, //max size of the generated geometry object. fixed. See sizeScale* for mod'ing it
      sizeDecayBias: 0.3, //0.5 for linear.  < 0.5 for slower onset of decay. 'b' param of perlin bias curve
      sizeDecayStartP: 0.3, //time as % of particle duration that the decay should start.
      sizeOnsetBias: 0.7, //0.5 for linear. < 0.5 for slower onset. like for decay bu for ramp up from min size
      sizeOnsetEndP: 0.1, //like for decay for end of size ramp-up time. 0 for no ramp-up of size
      sizeOnsetScale: 0, //initial scaling factor for size
      sizeMaxScale: 1, //max scaling factor of unit-size geometry
      sizeEndScale: 0,   //size scale to decay to by end of particle life
      sizeRangeP: 0, //size range percentage. non-zero yields randomization of each particle with sizeMaxScale +/- (sizeRangeP * sizeMaxScale)
                    // and same for sizeEndScale, unless sizeEndScale is 0 in which case it stays zero
      velDecayBias: 0.3, //velocity magnitude decay bias
      velDecayStartP: 0.1, //like sizeDecayStartP
      velMagRangeP: 0, //percentage. like sizeRangeP
      colorStartHex: 0xeeff11, //pass hex value and NOT an Color object
      colorEndHex: 0xee3311,
      colorLerpBias: 0.3, //perlian bias value, 0.5 = linear, < 0.5 for slower onset, > 0.5 for faster onset
    }*/
    constructor( config ){
        //User config settings
        this.setMainConfig( config );

        //this.scene = scene;
        //this.gui = gui;
        this.initState();

        //extra stuff for controlling individual particle options
        //For now at least, put in gui here so we can have in one preset,
        // and let calling code access the vars for options while adding particles.
        this.extras = {
            velScale: 0.02, //scale to apply to velMag from whatever its source
            velFixedFlag: false, //set true to set a fixed velocity for new particles
            velFixed: 0.5, //the fixed velocity if flag is set
            velDirBack: false, //true to force all velocities backward [0,0,1]
            velDirSide: false, //true to only use lateral component
            velDirVert: false, //up only
            linger: false, //set linger on new particles - why isn't this a global option?
            durBeats: 1.0, //set the beat duration
            enable: true, //enable particles at all
            newParticleIntervalBeats: 0.25, //try to get fewer and more regular new particle addition
            velThreshold: 0.01, //threshold used to decide if there's not enough lat or vert movement to generat a particle based on magnitude in each direction - to avoid lines at rest and also trigger high velocity stuff.
            skipHead: true, //skip the head of the tail/worm, ie VXrunner
            updateStepMsec: 10, //integrator step to take in msec. if delta time is greater than this, will do multiple steps
        }

        //Call from calling code when it's ready
        //this.setupGUI(); //AFTER main config setup
    }

    //Separate func should allow us to update config on the fly?
    setMainConfig( config ){
        //TODO ? check that all config properties are present and valid

        //shallow copy, includes arrays, see notes below
        this.mainC = JSON.parse( JSON.stringify(config) );
        
        //validate
        if( this.mainC.velDecayStartP >= 1 ){
            console.warn( 'ParticleManger: velDecayStartP >= 1. Set to 0.99: ',this.mainC.velDecayStartP );
            this.mainC.velDecayStartP = 0.99;
        }
        if( this.mainC.sizeDecayStartP >= 1 ){
            console.warn( 'ParticleManger: sizeDecayStartP >= 1. Set to 0.99: ',this.mainC.sizeDecayStartP );
            this.mainC.sizeDecayStartP = 0.99;
        }
        if( this.mainC.sizeOnsetEndP < 0 ){
            console.warn( 'ParticleManger: sizeOnsetEndP < 0. Set to 0: ',this.mainC.sizeOnsetEndP );
            this.mainC.sizeOnsetEndP = 0;
        }
        if( this.mainC.sizeDecayStartP < this.mainC.sizeOnsetEndP ){
            console.warn(' ParticleManager: sizeDecayStartP < sizeOnsetEndP: ', this.mainC.sizeDecayStartP, this.mainC.sizeOnsetEndP, ' Setting to sizeOnsetEndP.');
            this.mainC.sizeDecayStartP = this.mainC.sizeOnsetEndP;
        }
        
        //color
        //create an object for end color since we need one for lerping and no need to create it every update
        this.mainC.colorEndObj = new THREE.Color( this.mainC.colorEndHex );
        this.mainC.colorStartObj = new THREE.Color( this.mainC.colorStartHex ); //to help with gui setup
        var c = this.mainC.colorStartObj;
        this.mainC.colorStartRGB =  [c.r, c.g, c.b];
        c = this.mainC.colorEndObj;
        this.mainC.colorEndRGB =  [c.r, c.g, c.b];


        //precalc bias factors
        this.mainC.sizeDecayBiasExp = Math.log( this.mainC.sizeDecayBias ) / Math.log (0.5);
        this.mainC.sizeOnsetBiasExp  = Math.log( this.mainC.sizeOnsetBias ) / Math.log (0.5);
        this.mainC.velDecayBiasExp  = Math.log( this.mainC.velDecayBias ) / Math.log (0.5);
        this.mainC.colorLerpBiasExp = Math.log( this.mainC.colorLerpBias) / Math.log (0.5);
    }

    initState(){
        this.particles = [];
        this.lastUpdateBeat = 0;
        this.lastUpdateMsec = 0; //use perfMsec, for now at least
    }

    //Call from calling code when it's ready for gui setup
    setupGUI( guiFolder, maingui ){
        //Add right into this.guiFolder - calling func should init ctor with a gui folder if desired
        this.guiFolder = guiFolder;
        this.maingui = maingui;
        //remember for presets
        this.maingui.remember(this.mainC); //need to do this at begin here?
        this.maingui.remember(this.extras);
        var f1 = this.guiFolder.addFolder('main');
        f1.add( this.mainC, 'sizeGeom', 0.02, 10 ).step(0.01);
        f1.add( this.mainC, 'sizeRangeP', 0.0, 1.0 ).step(0.1);
        f1.add( this.mainC, 'sizeOnsetScale', 0, 1.0 ).step(0.1);
        f1.add( this.mainC, 'sizeOnsetEndP', 0, 1.0 ).step(0.1);
        f1.add( this.mainC, 'sizeOnsetBias', 0, 1.0 ).step(0.1);
        f1.add( this.mainC, 'sizeMaxScale', 0, 1.0 ).step(0.1).name('-sizeMaxScale-');
        f1.add( this.mainC, 'sizeEndScale', 0, 1.0 ).step(0.1);
        f1.add( this.mainC, 'sizeDecayBias', 0, 1.0 ).step(0.1);
        f1.add( this.mainC, 'sizeDecayStartP', 0, 1.0 ).step(0.1);
        f1.add( this.mainC, 'velMagRangeP', 0, 1.0 ).step(0.1);
        f1.add( this.mainC, 'velDecayStartP', 0, 1.0 ).step(0.1);
        f1.add( this.mainC, 'velDecayBias', 0, 1.0 ).step(0.1);
        f1.add( this.mainC, 'colorLerpBias', 0, 1.0 ).step(0.1);
        //add a gui object to manage start color setting
        var c = this.mainC.colorStartObj;
        this.mainC.colorStartRGB =  [c.r, c.g, c.b];
        f1.addColor( this.mainC, 'colorStartRGB').name('Start Color').onChange( function(rgb){
            //set color back from rgb - ugly
            //console.log('onChange rgb ', rgb);
            this.object.colorStartObj.setRGB( rgb[0] / 255, rgb[1]  / 255, rgb[2] / 255 );
            this.object.colorStartHex = this.object.colorStartObj.getHex();
        });
        c = this.mainC.colorEndObj;
        this.mainC.colorEndRGB =  [c.r, c.g, c.b];
        f1.addColor( this.mainC, 'colorEndRGB').name('End Color').onChange( function(rgb){
            //set color back from rgb - ugly
            this.object.colorEndObj.setRGB( rgb[0] / 255, rgb[1] / 255, rgb[2] / 255 );
            this.object.colorEndHex = this.object.colorEndObj.getHex();
        });
        //extras
        this.guiFolder.add( this.extras, 'velScale', 0.0, 10.0 ).step(0.01);
        this.guiFolder.add( this.extras, 'velFixedFlag');
        this.guiFolder.add( this.extras, 'velFixed', 0.0, 50.0).step(0.1);
        this.guiFolder.add( this.extras, 'velDirBack');
        this.guiFolder.add( this.extras, 'velDirSide');
        this.guiFolder.add( this.extras, 'velDirVert');
        this.guiFolder.add( this.extras, 'linger');
        this.guiFolder.add( this.extras, 'durBeats', 0.1, 10.0).step(0.1);
        this.guiFolder.add( this.extras, 'newParticleIntervalBeats', 0,1).step(0.05);
        this.guiFolder.add( this.extras, 'velThreshold', 0.0, 500.0).step(0.01); //check mag in each direction now, so need larger range
        this.guiFolder.add( this.extras, 'skipHead');
        this.guiFolder.add( this.extras, 'enable');
        this.guiFolder.add( this.extras, 'updateStepMsec', 1,15).step(1);

        //clean lingering particles
        this.guiFolder.add( this, 'cleanAll');
    }

    //Add a particle from outside code our internal
    //See class ctor below for config format
    addParticle( partC ){
 
        //Randomize starting velocity
        if( this.mainC.velMagRange > 0 ){
            var diff = ( Math.random() * 2 - 1 ) * partC.velMag * this.mainC.velMagRange;
            partC.sizeMaxScale += diff;
        }

        //make sure velDir is normalized
        partC.velDir = this.normalize( partC.velDir );

        //particle size - start and end - put in particle config since may get randomized
        partC.sizeOnsetScale = this.mainC.sizeOnsetScale;
        partC.sizeMaxScale = this.mainC.sizeMaxScale;
        partC.sizeEndScale = this.mainC.sizeEndScale;

        //randomize size
        if( this.mainC.sizeRangeP > 0 ){
            //Randomize starting size
            var diff = ( Math.random() * 2 - 1 ) * this.mainC.sizeMaxScale * this.mainC.sizeRangeP;
            partC.sizeMaxScale += diff;
            //Also randomize end size if it's not 0
            if( this.mainC.sizeEndScale > 0 ){
                var diff = ( Math.random() * 2 - 1 ) * this.mainC.sizeEndScale * this.mainC.sizeRangeP;
                partC.sizeEndScale += diff;
            }
        }

        //add the particle
        var newPart =  new Particle( partC /*gets copied*/, this.mainC /*stored as ref*/ )
        this.particles.push( newPart );
        if( this.addSceneObjectsFlag )
            newPart.addSceneObject( this.scene );
    }

    update( musicalTiming ){
        var mt = musicalTiming;
        if( mt.perfMsec - this.lastUpdateMsec > 500 ){
            //we've probably reloaded a preset or something else has happened so
            // refresh update times to avoid a blob of particles
           // this.lastUpdateMsec = mt.perfMsec;
           // return;
           //why doesn't this work??
        }
        //Check for step size. Do as many steps as we need to take up
        // the time passed. Any remainder will be handled next time in here.
        //Goal is to get smooth simulation with uneven call intervals between calls to update.
        //**NOTE**
        // If I used a const deceleration param instead of a curve to change velocity, I could
        // just calc each particle's state from init pos at each step and not worry about
        // integration step size. However I did it the way it's done so that I can easily control
        // the time that velocity gets to 0 - i.e. at the end of particle duration. Although, it should be
        // easily possible actually to calc the required accel to get vel to 0 in a given time.
        //console.log('update: ', mt.perfMsec, this.lastUpdateMsec, this.extras.updateStepMsec )
        
        var beatForStep = this.lastUpdateBeat;
        var deltaBeat = this.extras.updateStepMsec / mt.musicParams.beatDur;
        while( mt.perfMsec - this.lastUpdateMsec > this.extras.updateStepMsec ){
            //beatForStep is what time in beats we're solving the integration for at this step
            beatForStep += deltaBeat;
            this.updateDo( beatForStep, deltaBeat );
            this.lastUpdateMsec += this.extras.updateStepMsec;
        }
        this.lastUpdateBeat = beatForStep;
    }

    updateDo( beat, delta ){
        //maintain a new list to which non-done particles get added
        //seems more efficient than splicing out each individual particle from the list
        // when it's done
        var newPartList = [];

        if( delta <= 0 ){
            if( delta < 0 )
                console.warn( 'particles:udate delta <= 0: ', delta, ' beat: ', beat, 'lastUpateBeat: ',this.lastUpdateBeat );
            return;
        }
        for( var part of this.particles ){
            part.update( beat, delta );
            //check for particles to remove
            if( part.isDone ){
                this.cleanParticle( part );
            }else
                newPartList.push(part);
        }
        this.particles = newPartList;
    }

    normalize( a3 ){
        var mag = Math.sqrt( a3[0]*a3[0] + a3[1]*a3[1] + a3[2]*a3[2] );
        return [ a3[0] / mag, a3[1] / mag, a3[2] / mag ];
    }

    //Calling code is saying to add all scene objects to scene.
    //When particles get created on the fly, they're added on the fly
    // if addSceneObjectsFlag is true.
    addSceneObjects( scene ){
        this.scene = scene;
        //Let's us know the calling code is ready for objects in the scene
        //Not sure it's really necessary
        this.addSceneObjectsFlag = true;
        for( var part of this.particles )
            part.addSceneObject( this.scene ); //makes sure it hasn't been added already
    }

    cleanAll(){
        for( var part of this.particles ){
            this.cleanParticle( part );
        }
        this.particles = [];
    }


    cleanParticle( part ){
        part.cleanUp( this.scene );
    }

}//Particles

///////////////////////////////////////////////////////////////////////////////////////////////////

class Particle{
    /*
    config = { //DO NOT add objects as properties unless want to not do JSON copy in particle ctor
        initPos: [0,0,0], //starting pos
        velDir: [0,0,1], //velocity dir - will get normalized
        velMag: 1, //starting velocity mag in world units/beat
        startBeat: 0, //start of particle in beats
        durBeats: 1, //duration in beats
        linger: false, //flag whether to have particle stay visiable at end of durBeats
    }
    */
    constructor( particleConfig, mainConfig /*kept as a ref*/ ){
        //copy the config. this copies everything except functions
        // http://stackoverflow.com/questions/728360/how-do-i-correctly-clone-a-javascript-object
        this.partC = JSON.parse( JSON.stringify(particleConfig) );
        this.mainC = mainConfig;

        //randomize velMag if set to
        if( this.mainC.velMagRangeP > 0 ){
            var diff = ( Math.random() * 2 - 1 ) * this.partC.velMag * this.mainC.velMagRangeP;
            this.partC.velMag += diff;
        }

        //state
        this.curPos = this.partC.initPos; //init
        this.isDone = false; //set true when particle is done and should be cleaned up

        //scene object
        //only gets added to scene by manager class
        this.generateSceneObject();

        //console.log('particle ctor done: ', this, 'this.curPos, partC.initPos: ', this.curPos, this.partC.initPos);
    }

    //////////////////////////
    update( beat, deltaBeat ){
        //Calc the position within the particle's set duration
        var frac = (beat - this.partC.startBeat) / this.partC.durBeats;
        //console.log('particle update: beat, deltaBeat, frac: ', beat, deltaBeat, frac);
        if( frac > 1 ){
            //If we're past duration AND this is set to linger,
            // AND the final size is not supposed to be 0, just
            // leave the particle as-is
            //NOTE might want to allow for lingering effects like color change
            if( this.partC.linger && this.mainC.sizeEndScale > 0 )
             return;
            //Otherwise mark as done and it will be removed by main update func
            this.isDone = true;
            //Do one last run through at frac = 1 ???
            frac = 1.0;
            //console.log('particle update isDone');
        }

        //Get new size and apply 
        var scale = Math.max( this.calcNewSize( frac ), 0.001 );
        this.object3D.scale.set(scale,scale,scale); //setting to 0 yields warning about determinant and matrix inverse

        //Get velocity mag and apply
        var curVelMag = this.calcNewVelocityMag( frac );
        for( var ind in this.curPos ){
            this.curPos[ind] += curVelMag * this.partC.velDir[ind] * deltaBeat;
        }

        //Update object3D
        if( this.hasBeenAddedToScene ){
            this.object3D.position.fromArray( this.curPos );
        }

        //color
        this.setNewColor( frac );

        //console.log('particle update end: scale ', scale, ' curVelMag: ', curVelMag, 'this.curPos: ', this.curPos, ' object3D.position: ', this.object3D.position );
    }

    setNewColor( frac ){
        var t = this.calcBias( this.mainC.colorLerpBiasExp, frac );
        var newColor = new THREE.Color( this.mainC.colorStartHex );
        newColor.lerp( this.mainC.colorEndObj, t );
        this.material.color.set( newColor.getHex() );
    }

    calcNewSize( frac ){
        var sizeScale = this.partC.sizeMaxScale;
        var onsetScale = 1;
        var decayScale = 1;
        if( frac < this.mainC.sizeOnsetEndP ){ // <, not <=
            //we're ramping up size
            var t = frac / this.mainC.sizeOnsetEndP;
            var scale = this.calcBias( this.mainC.sizeOnsetBiasExp, t );
            onsetScale = scale * (this.partC.sizeMaxScale - this.partC.sizeOnsetScale) + this.partC.sizeOnsetScale;
            //console.log('onset scaling: frac, sizeOnsetEndP, t, scale, onsetScale: ', frac, this.mainC.sizeOnsetEndP, t, scale, onsetScale  )
        }
        if( frac >= this.mainC.sizeDecayStartP ){
            //we've started decaying so change velmag
            var t = (frac - this.mainC.sizeDecayStartP) / (1 - this.mainC.sizeDecayStartP );
            var scale = 1 - this.calcBias( this.mainC.sizeDecayBiasExp, t );
            decayScale = scale * (this.partC.sizeMaxScale - this.partC.sizeEndScale) + this.partC.sizeEndScale;
        }
        return sizeScale * onsetScale * decayScale;        
    }

    //Get the velocity at current beat, taking decay into account
    calcNewVelocityMag( frac ){
        var curVelMag = this.partC.velMag;
        if( frac >= this.mainC.velDecayStartP ){
            //we've started decaying so change velmag
            var t = (frac - this.mainC.velDecayStartP) / (1 - this.mainC.velDecayStartP );
            var scale = 1 - this.calcBias( this.mainC.velDecayBiasExp, t );
            curVelMag *= scale;
        }
        return curVelMag;
    }

    calcBias( b, t ){
        return Math.pow( t, b );
    }

    //generate but don't add to scene
    generateSceneObject(){
        //console.log('particle generateSceneObject at begin: this: ', this);
        this.hasBeenAddedToScene = false;
        this.geometry = new THREE.SphereGeometry( this.mainC.sizeGeom, 16, 16 );
        //this.material = new THREE.MeshPhongMaterial();
        this.material = new THREE.MeshLambertMaterial(); //try lambert for less gpu load?
        this.material.color.setHex( this.mainC.colorStartHex );
        //this.material.color.setHSL(0.1, 1, 0.95);
        this.object3D = new THREE.Mesh( this.geometry, this.material );
        this.object3D.position.fromArray( this.partC.initPos );
        //console.log('particle generateSceneObject: initPos: ', this.partC.initPos, ' new object pos ', this.object3D.position);
    }

    addSceneObject( scene ){
        if( ! this.hasBeenAddedToScene ){
            if( this.object3D === null || typeof(this.object3D) == 'undefined' ){
                throw 'Particle: addSceneObject object3D is null or undefined'
                return;
            }
            scene.add( this.object3D );
            this.hasBeenAddedToScene = true;
        }
    }

    cleanUp( scene ){
        if( this.hasBeenAddedToScene ){
            scene.remove( this.object3D );
            // clean up memory
            this.geometry.dispose();
            this.material.dispose();
            // texture.dispose();
            this.geometry = null;
            this.object3D = null;
            this.material = null;
            //console.log('particle cleanUp done');
        }
    }
}
