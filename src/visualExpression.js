"use strict";

//
//Visual Expressions
//

const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
import {PathContainer} from './Path.js'
import {PowerCurve3, PowerCurve} from './powerCurve.js'
import DAT from 'dat-gui'

///

export var g_VXmanager = {}; //gets set when VXmanager is instantiated

export class VisualExpressionSuper{ //"base class""
    constructor( VXtype, instanceName ){
        //this.name ?? need an instance name ?? I'm so confused

        this.type = VXtype; //path, displacement, color, fog, sparks, 
        
        //TODO
        // Validate the 'type' passed in
        
        //These params may be arrays of values, depending on VX
        //
        this.perfBeatStart = 0; //Starting beat relative to performance start
        this.perfBeatEnd = 0; //Ending beat. May or may not be inclusive, depending on expression
        
        //Last time this VX was updated. Used to know if it's been updated
        // yet for the current frame
        this.lastUpdateBeat = -1;

        this.VXinputs = []; //VX(s) that this VX gets data/state from. So e.g. for sparks,
                      // the input could be a 'path' type, and the sparks direction would
                      // be taken from current path direction, and spark generation might
                      // be tied to parent's current acceleration.
                      // For a 'path' type, an input could be a 'path displacement' type that
                      //  changes the path.
                      //
                      //THESE MUST GET UPDATED FIRST at each frame. So before updating
                      //  this VX, iterate over inputs[] and update each one
                      //
                      //DANGER of getting into dependency loops. Have to put in a safeguard
                      // as things get more complex.

        //Instance name provided for this particular instance
        this.instanceName = instanceName;

        //Flag set to true when VX is done and can be removed from active list
        this.isDone = false;

        //Uniq numerical id set by VXmanager. -1 means unset
        //Do we really need this? Or should
        // we just always append uniqID to instanceName even when instanceName
        // isn't automatically created from type? Yeah, probably. Might be
        // better to have just a single id (i.e. unique instanceName)
        this.uniqID = -1;

        ////////////// Params ///////////////////

        //Maximum relative response of this VX under 'normal' conditions.
        //May be an array for some VXs
        //We'll see how this works out.
        this.scaleNorm = 0;

        //Type-specific stuff should all go in this obj, just
        // to try and keep things tidy.
        //Trying to keep its name short
        this.ts = {}
    }

    //Update the VX for the given performance time
    //Do NOT override in dervied classes
    updateForFrame( musicalTiming ){

        //Check for input VX's that need updating first
        for( var VX of this.VXinputs )
            VX.updateForFrame( musicalTiming );

        //If we've already updated, skeedaddle
        //Do this after we do updates on inputs, to be safe
        if( this.lastUpdateBeat >= musicalTiming.perfBeatRaw )
            return;

        //Call VX-type-specific version
        //Treat like pure virtual, must be overridden
        this.updateByType( musicalTiming );

        //Check if this VX is done
        this.checkIfDone( musicalTiming);

        //update its update time
        this.lastUpdateBeat = musicalTiming.perfBeatRaw;
    }

    //Update method called in updateForFrame().
    //MUST be overridden by derived classes.
    updateByType( musicalTiming ){
        throw "undefined VisualExpression:updateByType"
    }

    //Add an array of VXs to the current
    // list of VXinputs or single VX object
    appendToVXinputs( VXlist ){
        //*NOTE* list can be single object or a list, but can't be a non-object value
        Array.prototype.push.apply(this.VXinputs, VXlist);
    }

    //Set the starting beat. May be overidden
    // by derived classes and require different argument type
    setPerfBeatStart( perfBeat ){ //Use Raw or Quantized?
        this.perfBeatStart = perfBeat;
    }

    //Set the ending beat. May be overidden
    // by derived classes and require different argument type
    setPerfBeatEnd( perfBeatEnd ){
        this.perfBeatEnd = perfBeatEnd;
    }

    //May be overidden by derived classes and require different argument type
    setScaleNorm( scaleNorm ){
        this.scaleNorm = scaleNorm;
    }
    
    //Each VX must override this IF it has THREE.js Object3D to render
    getSceneObject(){
        return null;
    }

    //If VX has any THREE.js render-related object, it will clean them.
    //Override in classes that have scene objects
    cleanFromScene( scene ){
        //From https://github.com/mrdoob/three.js/blob/master/examples/webgl_test_memory.html
        // which is given as example to go by near end of 
        // https://github.com/mrdoob/three.js/issues/5175
        //
        //To do in 
        // scene.remove( mesh );
        // // clean up memory
        // geometry.dispose();
        // material.dispose();
        // texture.dispose();
    }

    //Return arr3 point that this VX wants to be its focus.
    //Derived classes for which this makes sense must override.
    getFocusPoint(){
        throw "VX.getFocusPoint undefined."
    }

    //Check if this VX is done
    //Derived classes may override this for special handling
    //Default check expects just a number value 
    checkIfDone( musicalTiming ){
        if( typeof( musicalTiming.perfBeatRaw ) != 'number' )
            throw "VX:checkIfDone: perfBeatRaw is not type number. Probalby requires special handling."
        if( musicalTiming.perfBeatRaw >= this.perfBeatEnd )
            this.isDone = true;
    }

    //Scan inputs and remove any that are done
    removeDoneInputs(){
        var VXinputsNew = [];
        for( var VX of this.VXinputs ){
            //If VX is done then remove it from active list
            //Flag should be set in VX.updateForFrame (and elsewhere possibly?)
            //Seems simplest to actually just make a new array of the ones to keep
            if( ! VX.isDone )
                VXinputsNew.push( VX );
        }
        this.VXinputs = VXinputsNew;
    }

    //Override by dervied classes that need it
    setupGUI( gui ){
    }

} //class VisualExpressionSuper

//////////////////////////////////////////////////////////////////////ß
//
// Particular VX types
//
// This is like deriving a class, BUT it's impossible or very awkward
//  to call base version of an overriden method from parent/super class.

// VXpathDisplacement
//
export class VXpathDisplacement extends VisualExpressionSuper{
    constructor( instanceName ){
        super( 'pathDisplacement', instanceName );

        //Type-specific params, if any, goes into this.ts
        this.ts = {

            //The lateral/vertical/forward (just x/y/z for now, really) offset
            // calculated at most recent update, i.e. for this.lastUpdateBeat.
            //Already scaled by scaleNorm
            currentDisplacement3: [],

            //The displacement. PowerCurve for each direction
            curves: new PowerCurve3(1,1),

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

    setScaleNorm( scaleNorm ){
        if( scaleNorm.hasOwnProperty('length') )
          if( scaleNorm.length == 3 ){
            this.scaleNorm = scaleNorm;
            return;
        }
        throw "scaleNorm is not array of length 3: " + scaleNorm
    }

    updateByType( musicalTiming ){
        
        //Find the fractional position within the duration of this VX
        //Used to evaluate assigned curve.
        var fractions = [];
        var active = [1,1,1];
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
            spatialUnit: 5.0, 

            //a-b values for each of the three PowerCurves used
            // in a VXpathDisplacment. Have to put them here since we can't 
            // have gui for each fleeting VXpathDisplacement instance.
            //We'll need some param object for VX types that sets default
            // vals for each instance, and probably gets assigned to a translator
            // so it can be varied passed for a given translation mapping.
            curveABs: [1,1,1,1,1,1],
        }
    }

    //Each VX must override this if ti has a THREE.js Object3D to render
    getSceneObject(){
        return this.ts.path.getSceneObject();
    }

    cleanFromScene( scene ){
        this.ts.path.cleanFromScene( scene );
    }

    //Return arr3 point that this VX wants to be its
    // focus.
    getFocusPoint(){
        //To follow the front of the path itself:
        //return this.ts.path.getCurrentPointInfo().cpt;

        //To follow progress along z, real dumb for now
        return [0,0, this.ts.path.getCurrentPointInfo().cpt[2] ];
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
                    newPos[ind] += VX.ts.currentDisplacement3[ind]; //already scaled by scaleNorm
                 //console.log('VXpath uBT: currentDisplacement3  ',  VX.ts.currentDisplacement3);
            }
        }
        //console.log('VXpath uBT: newPos: ', newPos);

        //Add the point to our path object
        this.ts.path.addControlPoint( musicalTiming.perfMsec, musicalTiming.perfBeatRaw, newPos );
    }

    setupGUI( gui ){
        //length of main trail
        //I don't like coding deep into this like this, but hack it for now.
        var f = gui.addFolder(this.instanceName);
        f.add( this.ts.path, 'drawRangeLengthInd', 0, 100 );
        for( var ind = 0; ind < 6; ind+=2 ){
            var name = 'PCurve ' + ind;
            f.add( this.ts.curveABs, ind.toString(), 0.1,2.0).name(name+' a');
            f.add( this.ts.curveABs, (ind+1).toString(), 0.1,2.0).name(name+' b');
 //           fuck how do I get these vals into the VXpathDisp object????
        }
    }
}

//////////////////////////////////
//
//Class to manage VX's.
//
//Will be just a single instance of this
//
export class VXmanager{
    constructor( scene, camera ){
        //List of VXs that are currently active, being rendered
        this.VXactiveList = [];
        //List of all VX's ever created, in case we need them.
        this.VXallList = [];

        //For adding a uniq id to each VX that's created
        this.currentUniqID = 0;

        //The THREE.js scene to add object to
        this.scene = scene;

        //Camera
        this.camera = camera;

        //Set global ref for other classes to import and use
        g_VXmanager = this;

    }

    //Call to finish initial setup after object is fully created
    // and other basic stuff has been set up by sequencer
    initializeVXs(){
        //Some hard-coded VX objects for now. Have to sort this all out
        //
        //The main path
        this.VXmainPath = this.createNewVXs( 'path', 'main_path' )[0];
        //new VXpath( 'mainPath_' + this.getNextUniqID() );
        this.addNewVXs( [this.VXmainPath], null );
        //Init vals here since it won't get genereated by an MX
        this.VXmainPath.setPerfBeatStart( 0 );
        this.VXmainPath.setPerfBeatEnd( Number.MAX_VALUE ); //doesn't end
        this.VXmainPath.setScaleNorm( 1 ); //not sure what to do heregetSceneObject
    }

    //We're counting on this getting called at begin of app launch when
    // sequencer is getting setup.
    reset(){
        
        // remove any mesh's from scene, and
        // clear related object memory
        this.cleanScene();

        this.VXactiveList = [];
        this.VXallList = [];
        this.currentUniqID = 0;
        
        this.initializeVXs();
        this.cameraSetDefaults();
        this.cameraUpdate();
        this.setupGUI();

    }

    //Create a separate guif from the one made by sequencer.
    //For now at least, let's us control it better since can't figure out
    //how to remove items from a gui, only know how to destroy() whole thing.
    setupGUI(){
        if( typeof(this.gui)  != 'undefined' )
            this.gui.destroy();
        this.gui = new DAT.GUI();
        this.guifolder = this.gui.addFolder('VX Manager');

        for( var VX of this.VXactiveList )
            VX.setupGUI( this.guifolder );
    }

    //default camera settings
    cameraSetDefaults(){
        this.cameraState = {
            pos: new THREE.Vector3(0, 1, 2),
            lookAt: new THREE.Vector3(0,0,0),
            fov: 40,
        }
    }

    //update camera based on current state
    cameraUpdate(){
        this.camera.position.copy(this.cameraState.pos);
        this.camera.lookAt( this.cameraState.lookAt );
        this.camera.fov = this.cameraState.fov;
        this.camera.updateProjectionMatrix();
    }

    //Update camera's position based on some target VX
    cameraUpdateForTarget( VX ){
        //Returns an arr3 at which to focus the camera
        var prevLookAt = this.cameraState.lookAt;
        var focusArr3 = VX.getFocusPoint();
        var newLookAt = new THREE.Vector3().fromArray( focusArr3 );
        this.cameraState.lookAt = newLookAt;

        var diff = new THREE.Vector3().subVectors( newLookAt, prevLookAt );

        //Move the camera along same vector that focus moved?
        //this.cameraState.pos.add( diff );

        //Move camera position justalong -z to keep up with motion along -z,
        // and allow lookat to follow whatever focus point is
        diff.setX(0);
        diff.setY(0);
        this.cameraState.pos.add( diff );

        this.cameraUpdate();
    }

    updateForFrame( musicalTiming ){
        var VXactiveNEW = [];
        for( var VX of this.VXactiveList ){

            //Calls the VX to update itself. VX will
            // call its inputs to update themselves.
            VX.updateForFrame( musicalTiming );

            //If VX is done then remove it from active list
            //Flag should be set in VX.updateForFrame (and elsewhere possibly?)
            //Seems simplest to actually just make a new array of the ones to keep
            if( VX.isDone ){
                VX.cleanFromScene();
            }else            
                VXactiveNEW.push( VX );
        }
        this.VXactiveList = VXactiveNEW;

        //Now go through each again and have them
        // scan their inputs for done VXs and remove
        //But only after everything's updated
        for( var VX of this.VXactiveList ){
            VX.removeDoneInputs();
        }

        //Have the camera follow the front of path.
        //Hard-code what to folow for now
        this.cameraUpdateForTarget( this.getMainPathVX() );
    }

    cleanScene(){
        for( var VX of this.VXactiveList ){
            VX.cleanFromScene( this.scene );
        }
    }

    dumpState(){
        var L = console.log;
        L('--- VXmanager: dumpState ---');
        L('VXactiveList:');
        for( var VX of this.VXactiveList ){
            L(VX);
        }
    }

    //Hack for now to get the main path VX
    getMainPathVX(){
        return this.VXmainPath;
    }

    getNextUniqID(){
        var id = this.currentUniqID;
        this.currentUniqID++;
        return id;
    }

    //Directly add a scene object (THREE.js Object3D to be rendered)
    //For now at least, whatever object creates a scene object is
    // responsible for calling this func to add it to the scene.
    addSceneObject( obj ){
        this.scene.add( obj );
    }

    //query the VX (single or array) for a scene object and add
    // to scene if one is returned. Not sure
    // where this really belongs.
    addSceneObjectFromVX( VXlist ){
        var list = VXlist;
        if( ! (VXlist instanceof Array ) ){
            list = [VXlist];
        }
        for( var VX of list ){
            var obj = VX.getSceneObject();
            if( obj !== null )
                this.scene.add( obj );
        }

    }

    //Create and return one or more VXs based on type name
    //typeList - name of or array of the type of each VX to create
    //instanceName - list of name for each particular instance. pass 'auto' (no array needed) for default for each
    //Return - array of one or more VXs
    createNewVXs( typeList, instanceNamesList ){
        var returnVXlist = [];
        var VXlist = typeList;
        if( ! (typeList instanceof Array ) )
             VXlist = [typeList];
        if( typeof(instanceNamesList) == 'string' )
            instanceNamesList = [ instanceNamesList ]; //make it an array
        for( var ind in VXlist ){
            //Set the instance name
            var uniqID = this.getNextUniqID();
            var type = VXlist[ind];
            var instanceName = instanceNamesList[ Math.min( ind, instanceNamesList.length-1 ) ];

            if( instanceName == 'auto' ){
                instanceName = type + '_' + uniqID;
            } else {
                instanceName = instanceNamesList[ind]+'_'+uniqID;
            }

            var VX = {};
            switch( type ){
                case 'pathDisplacement':
                    VX = new VXpathDisplacement( instanceName );
                    break;
                case 'path':
                    VX = new VXpath( instanceName );
                    break;
                default:
                    throw 'Unrecognized VX type: ' + type;
            }
            //Set the uniq ID. 
            VX.uniqID = uniqID;

            //add to return list
            returnVXlist.push( VX );

        }
        return returnVXlist;
    }

    //Add a new VX to main lists.
    //The VX may be have been created here or elsewhere (e.g. in ExpressionTranslator)
    //VXlist - single VX or an array of one or more VXs
    //VXreceiver - if non-null, also add the list to this VX's inputs
    addNewVXs( VXlist, VXreceiver ){
        //append new list to existing list, without copying first list
        //http://stackoverflow.com/questions/1374126/how-to-extend-an-existing-javascript-array-with-another-array-without-creating
        Array.prototype.push.apply( this.VXactiveList, VXlist );
        Array.prototype.push.apply( this.VXallList, VXlist );
        if( VXreceiver !== null ){
            if( typeof(VXreceiver) == 'undefined' ){
                throw "addNewVXs: VXreceiver undefined"
            }
            VXreceiver.appendToVXinputs( VXlist );
        }
        this.addSceneObjectFromVX( VXlist );
    }
}