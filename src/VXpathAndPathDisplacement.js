//VXpath and VXpathDisplacement
"use strict";

const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about 
import DAT from 'dat-gui'
import {VisualExpressionSuper} from "./visualExpressionSuper.js"
import {g_VXmanager} from "./VXmanager.js"
import {PathContainer} from './Path.js'
import {PowerCurve3, PowerCurve} from './powerCurve.js'
import {g_floatListToArray, g_arrayToFloatList} from './utils.js'

///
//a-b values for each of the three PowerCurves used
// in a VXpathDisplacment. Have to put them here since we can't 
// have gui for each fleeting VXpathDisplacement instance. F'ed up.
//We'll need some param object for VX types that sets default
// vals for each instance, and probably gets assigned to a translator
// so it can be varied passed for a given translation mapping.
//
//This is a string so we can have single input object and user
// must type vals like this to get them to work:
//var g_curveABs = { str: '[1,2.2,1,2.2,1,2.2]' };
var g_curveABs = { str: '1 2.2 1 2.2 1 2.2' };

//VXpath
//
//What does path need?
// - get displacements from any input VX's of type pathDisplacement 
// - 'forward' speed
//      - some constant fwd speed
//      - changes based on VXs
// - store control points
// - ? generate/store a piecewise smooth parametric curve object like bezier
//      Which kind always goes through all control points?
//      We want 2nd-deriv continuity *if* we're going to use this curve
//      for calc'ing derivatives. 
// - THREE obj for rendering the path
// - render options
//     color, width, how much of it to render
// - calc and return instantaneous velocity, accel and g-force
// - have a baseline relative to which all its displacements/spatial-changes
//     take place. Simplest is a vector like [0,0,-1]. But might want ability
//     to have it be another path.
//
export class VXpath extends VisualExpressionSuper{
    constructor( instanceName ){
        super( 'path', instanceName );

        this.ts = {
            //Path object holds control points and timing, and THREE.js Line Object3D for rendering.
            path: new PathContainer( 10000 /*initial buffer length - ca 100/sec at 30fps since 3 vals per point*/,
                                     0, 0, [0,0,0] /* inital control point values*/),

            //The baseline velocity
            //We move 'forward' in baseline direction by this much every beat, plus whatever
            // displacements or other changes may affect motion in this same direction.
            //Units: spatial-units per beat
            baselineVel: [0, 0, -1.0], //fwd direction is down -z for now

            //Size of one spatial unit in terms of 3D space - what are these units called?
            //Not using currently. See scaleNorm which I'm using to scale in each dim
            //spatialUnit: 5.0, 

            //Global scaling factors

        }

        //Flag if path is visible
        //NOTE this isn't in ts object cuz otherwise in gui onChange callback, I can't
        // get ref to VXpath object, only to this.ts.
        //I could put a setVisible func in ts, I suppose.
        this.pathVisible = false;

        //Call this so it propogates to path object
        this.setVisible( this.pathVisible );
    }

    //Each VX must override this if ti has a THREE.js Object3D to render
    addSceneObjects( scene ){
        this.ts.path.addSceneObjects( scene );
    }

    cleanFromScene( scene ){
        this.ts.path.cleanFromScene( scene );
    }

    //Flag whether to show the path object
    setVisible( flag ){
        this.ts.pathVisible = flag;
        this.ts.path.setVisible( flag );
    }

    //Return the lead point of the path
    getCurrentPoint(){
        return this.ts.path.getCurrentPointInfo().cpt;
    }

    //Return arr3 point that this VX wants to be its camera focus.
    getFocusPoint(){
        //To follow the front of the path itself:
        return this.ts.path.getCurrentPointInfo().cpt;

        //To follow progress along z, real dumb for now
        //return [0,0, this.getCurrentPoint()[2] ];
    }

    //Get called by main VX update func
    //Any input VX's have already been updated by main update func
    updateByType( musicalTiming ){

        //For now keep it real simple. Baseline/forward direction is always
        // along -z. At some point we'll want much more flexibility, like
        // a reference frame for baseline at each point, so paths can wind
        // around other paths

        var prevPosInfo = this.ts.path.getCurrentPointInfo();
        //console.log('VXpath uBT: prevPosInfo: ', prevPosInfo );
        var deltaBeat = musicalTiming.perfBeatRaw - prevPosInfo.perfBeatRaw;
        //Just doing baseline velocity along z axis for now
        var newBaselineZ = prevPosInfo.cpt[2] + deltaBeat * this.ts.baselineVel[2];
        //All displacements are added below, so x & y are 0 for now since displacements
        // are absolute.
        var newPos = [0, 0, newBaselineZ];

        //Get any displacement from input VX's and add to baseline position
        for( var VX of this.VXinputs ){
            if( VX.type == 'pathDisplacement' ){
                //element-wise addition - no easy way in js
                for( var ind in newPos )
                    //already scaled by VXpathDisplacement.scaleNorm, but we have to add
                    // our global scaling too
                    newPos[ind] += ( VX.ts.currentDisplacement3[ind] * this.scaleNorm[ind] );
                    
                 //console.log('VXpath uBT: currentDisplacement3  ',  VX.ts.currentDisplacement3);
            }
        }
        //console.log('VXpath uBT: newPos: ', newPos);

        //Add the point to our path object
        this.ts.path.addControlPoint( musicalTiming.perfMsec, musicalTiming.perfBeatRaw, newPos );
    }

    setupGUI( gui, maingui ){
        var f = gui.addFolder(this.instanceName);
        f.add( this, 'pathVisible' ).onChange( function(newVal) {
            this.object.setVisible(newVal);
        })
        //This will add super-class common things. It's optional.
        //Will NOT create its own sub-folder.
        this.setupGUIsuper( f );

        //length of main trail
        //I don't like coding deep into this like this, but hack it for now.
        f.add( this.ts.path, 'drawRangeLengthInd', 0, 100 );
        //These are the a,b vals for PowerCurve used for 
        f.add( g_curveABs, 'str').name('PCurve a,b array');
        //maingui.remember('g_curveABs');

        //GUI for the path container
        this.ts.path.setupGUI( f );

        //f.open();
    }
}//VXpath

///////////////////////////////
// VXpathDisplacement
//
export class VXpathDisplacement extends VisualExpressionSuper{
    constructor( instanceName ){
        super( 'pathDisplacement', instanceName );

        //Type-specific params, if any, goes into this.ts
        //Ugly hack to get simple gui to change all vals
        this.ts = {

            //The lateral/vertical/forward (just x/y/z for now, really) offset
            // calculated at most recent update, i.e. for this.lastUpdateBeat.
            //Already scaled by scaleNorm
            currentDisplacement3: [],

            //The displacement. PowerCurve for each direction
            curves: new PowerCurve3(g_floatListToArray(g_curveABs.str)),

        }

        //debug
        //this.ts.curves.dump(15);
    }

    //NOTE perfBeatStart - scalar, for now at least

    //We expect arrays of length 3, one for each direction
    setPerfBeatEnd( perfBeatEnd ){
        if( perfBeatEnd.hasOwnProperty('length') )
          if( perfBeatEnd.length == 3 ){
            this.perfBeatEnd = perfBeatEnd;
            return;
        }
        throw "perfBeatEnd is not array of length 3: " + perfBeatEnd
    }

    updateByType( musicalTiming ){
        
        //Find the fractional position within the duration of this VX
        //Used to evaluate assigned curve.
        var fractions = [];
        var active = [1,1,1]; //lets us easily silence directions that end earlier
        //One end-time for each dimension
        //Have to specially handle if one or two dimension is done already before other(s)
        for( var ind in this.perfBeatEnd ){
            fractions[ind] = (musicalTiming.perfBeatRaw - this.perfBeatStart ) / 
                            (this.perfBeatEnd[ind] - this.perfBeatStart );
            if( musicalTiming.perfBeatRaw > this.perfBeatEnd[ind] )
                active[ind] = 0;
        }

        //Get current value
        this.ts.currentDisplacement3 = this.ts.curves.evaluate( fractions );

        //console.log('active: ', active, ' frac: ', fractions, ' now beatRaw: ', musicalTiming.perfBeatRaw );
        //console.log(' this.perfBeatStart: ', this.perfBeatStart, ' this.perfBeatEnd: ', this.perfBeatEnd);
        
        //scale by scaleNorm
        for( var ind in this.scaleNorm ){
            this.ts.currentDisplacement3[ind] *= ( active[ind] * this.scaleNorm[ind] );
        }
    }    

    //Override because we have three possibly-different end times
    checkIfDone( musicalTiming ){
        if( ! (this.perfBeatEnd instanceof Array) )
            throw "VXpathDisplacement:checkIfDone: perfBeatRaw is not array."
        var isDone = true;
        for( var endTime of this.perfBeatEnd )
            if( endTime > musicalTiming.perfBeatRaw )
                isDone = false;
        this.isDone = isDone;
    }

    setupGUI( gui ){
    }
    
} // class VXpathDisplacement

