//VXelasticTail
"use strict";

const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about 
import dat from '../../dat-gui-git/dat.gui.npm/build/dat.gui.js'
import {VisualExpressionSuper} from "./visualExpressionSuper.js"
import {g_VXmanager} from "./VXmanager.js"
import {elasticTail} from "../../elasticTail/src/elasticTail.js"
import {ParticlesManager} from './particles.js'
import {guiPresets_TailParticles} from './guiPresets.js'


export class VXelasticTail extends VisualExpressionSuper{
    constructor( instanceName ){
        super( 'elasticTail', instanceName );

        this.ts = {
            tail: null,
            tailConfig: {},
        }

        this.init();
    }//ctor

    init(){
        //Set config for the tail
        this.ts.tailConfig = {
            num: 7,
            gravityAmp: 9.81,
            gravityDir: [0,0,1], //point away from default fwd motion
            spacing: 0.5,
            mass: 15,
            k: 4000,
            damping: 0.5,
            objectSize: 1,
            objectTaper: 1,
            dtUnstableMsec: 50,
            dtStableMsec: 30,
            dtSkipMsec: 10
        };
        
        this.ts.tail = new elasticTail( this.ts.tailConfig );

        //dump particle system directly in here for now
        //** Note ** this config structure does not get verified at all inside particle manager ctor **
        //
        var config = { 
            sizeGeom: 0.1, //max size of the generated geometry object. fixed. See sizeScale* for mod'ing it
            sizeDecayBias: 0.3, //0.5 for linear.  < 0.5 for slower onset of decay. 'b' param of perlin bias curve
            sizeDecayStartP: 0.3, //time as % of particle duration that the decay should start.
            sizeOnsetBias: 0.7, //0.5 for linear. < 0.5 for slower onset. like for decay bu for ramp up from min size
            sizeOnsetEndP: 0.1, //like for decay for end of size ramp-up time. 0 for no ramp-up of size
            sizeOnsetScale: 0.0, //initial scaling factor for size
            sizeMaxScale: 1.0, //max scaling factor of unit-size geometry
            sizeEndScale: .2,   //size scale to decay to by end of particle life
            sizeRangeP: 0.0, //size range percentage. non-zero yields randomization of each particle with sizeScaleMax +/- (sizeRangeP * sizeScaleMax)
                            // and same for sizeScaleEnd, unless sizeScaleEnd is 0 in which case it stays zero
            velDecayBias: 0.3, //velocity magnitude decay bias
            velDecayStartP: 0.1, //like sizeDecayStartP
            velMagRangeP: 0.0, //percentage. like sizeRangeP
            colorStartHex: 0xeeff00,
            colorEndHex: 0xcc1111,
            colorLerpBias: 0.7, //perlian bias value, 0.5 = linear, < 0.5 for slower onset, > 0.5 for faster onset     
        }

        //particles manager
        this.particles = new ParticlesManager( config )
        this.particlesGenerationNextBeat = 0;
        this.particlesGenerationCacheMsec = 0;
        this.ts.tail.setNextCacheTime( this.particlesGenerationCacheMsec ); // for now at least, this should be safe. beat 0 is always perfMsec 0
    }

    updateByType( musicalTiming ){
        //expect type 'path' as VX input
        for( var VX of this.VXinputs ){
            //Eventually we want to query by type of data/info that VX can supply
            if( VX.type == 'path' ){ 
                //VX will have already been updated by call in base class
                var pos = VX.getCurrentPoint(); //array3
                this.ts.tail.update( musicalTiming.perfMsec, pos );
            }
        }

        //particles!!
        //Hacked direclty into here for now
        //add some particles 
        //Get array of arr3's of current positions, vel dir and vel mag
        //First element of each is head position, i.e VXrunner - might not want to use
        //Vel dir is normalized
        var px = this.particles.extras; //extra stuff thrown into particles class for addition to gui
        var nowBeat = musicalTiming.perfBeatRaw;
        if( nowBeat >= this.particlesGenerationNextBeat ){
            //Time to make new set of particles
            if( px.enable ){
                /* orig method, grab state at current beat
                var posArr = this.ts.tail.getCachedPosArr();
                var velObj = this.ts.tail.getCachedVelArrObj();
                var beatToUse = nowBeat;
                */
                //cache method. we request the tail to cache segment state
                // at a particular time during its simulation so even if we
                // come here much later than particleGenerationNextBeat, we'll
                // get a state closer to the time we want
                var state = this.ts.tail.getCachedState();
                if( state.msecRequested != this.particlesGenerationCacheMsec )
                    console.error('VXelasticTail: state.msecRequested ! = particlesGenerationCacheMsec: ', state.msecRequested, this.particlesGenerationCacheMsec);
//                if( state.msecActual - state.msecRequested > 5 )
//                    console.warn('VXelasticTail: state.msecActual - state.msecRequested > 5: ', state.msecActual, state.msecRequested )
                var posArr = state.posArr;
                var velObj = {dir: state.velDirArr, mag: state.velMagArr };
                var beatToUse = musicalTiming.perfMsecToBeat( state.msecActual );
                //Option to skip the head, which at this point at least is the leading point of VXpath which is jerky
                var start = px.skipHead ? 1 : 0;
                for( var ind = start; ind < posArr.length; ind++ ){
                    var velMag = velObj.mag[ind];
                    var velDir = velObj.dir[ind];
                    var overVelocityThreshold = Math.abs(velDir[1] * velMag) > px.velThreshold || Math.abs(velDir[2] * velMag) > px.velThreshold 
                    if( overVelocityThreshold ){ //no particles when lined up straight ahead
                        if( px.velFixedFlag ){
                            velMag = px.velFixed;
                        }else
                            velMag *= px.velScale;
                        if( px.velDirBack ) velDir = [0,0,1];
                        if( px.velDirSide ) { velDir[1] = 0, velDir[2] = 0 }
                        if( px.velDirVert ) { velDir[0] = 0, velDir[2] = 0 }
                        //*NOTE* config must exactly match what's expected!!
                        var config = { 
                            initPos: posArr[ind], //starting pos
                            velDir: velDir, //velocity dir - will get normalized
                            velMag:  velMag, //starting velocity mag in world units/beat
                            startBeat: beatToUse, //start of particle in beats
                            durBeats: px.durBeats, //duration in beats
                            linger: px.linger, //flag whether to have particle stay visiable at end of durBeats
                        }            
                        this.particles.addParticle( config );
                    }
                }
            }
        //always update this, even if particles not currently enabled
        this.particlesGenerationNextBeat += px.newParticleIntervalBeats;
        this.particlesGenerationCacheMsec = musicalTiming.beatToPerfMsec( this.particlesGenerationNextBeat );
        this.ts.tail.setNextCacheTime( this.particlesGenerationCacheMsec );
        }
        //Always update the existing particles at each step
        //NOTE the particle class update() breaks the update into
        // smaller steps, performing as many as needed at a time to
        // keep up to date. This should keep paritcles moving consitently
        // relative to each other, so their not at the whims of main
        // framework update callback intervals.  
        if( px.enable )
            this.particles.update( musicalTiming );
    }//updateByType

    addSceneObjects( scene ){
        this.ts.tail.addSceneObjects( scene ); //stores scene ref
        this.particles.addSceneObjects( scene );
    }

    setupGUI( gui, maingui ){
        var f = gui.addFolder( this.instanceName );
        //This will not make its own subfolder
        this.ts.tail.createGUI( f );
        maingui.remember(this.ts.tail);

        //own gui for particle manager for now,
        // so can store presests separately
        this.particleGUI = new dat.GUI( guiPresets_TailParticles );
        var f = this.particleGUI.addFolder('Tail Particles');
        this.particles.setupGUI( f, this.particleGUI );
    }

    //hack this in here for now. will get called by VXmanager
    guiOpenClose(){
        //See sequencer.guiOpenClose()
        if(this.particleGUI.closed){
            this.particleGUI.open()
        }
        else{
            this.particleGUI.close();
        }
    }


    cleanFromScene( scene ){
        //This will just remove scene objects and set
        // internal scene ref to null.
        this.ts.tail.removeFromScene();
    }

}//VXelasticTail