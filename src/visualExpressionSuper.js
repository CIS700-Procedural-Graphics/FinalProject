//VisualExpressionSuper - base class

import {g_floatListToArray, g_arrayToFloatList} from './utils.js'

export class VisualExpressionSuper{ //"base class""
    constructor( VXtype, instanceName ){
        //this.name ?? need an instance name ?? I'm so confused

        this.type = VXtype; //path, displacement, color, fog, sparks, 
        
        //TODO
        // Validate the 'type' passed in
        
        //These params may be arrays of values, depending on VX
        //
        this.perfBeatStart = 0; //Starting beat relative to performance start
        this.perfBeatEnd = Number.MAX_VALUE; //Ending beat. May or may not be inclusive, depending on expression
        
        //Last time this VX was updated. Used to know if it's been updated
        // yet for the current frame, or to calc beat-diff since last update.
        //Doesn't get updated to current time until updateForFrame() and updateBytype() are done.
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
        //[x,y,z]
        //We'll see how this works out.
        this.scaleNorm = [1,1,1];
        //String for handling via gui text box
        this.scaleNormStr = "1 1 1";

        //Type-specific stuff should all go in this obj, just
        // to try and keep things tidy.
        //Trying to keep its name short
        this.ts = {}
    }

    //Update the VX for the given performance time
    //
    //** Do *NOT* override in dervied classes **
    //
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

        //**DO THIS LAST**
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
    //Generally an array3. If pass a single number, will be put into [num,num,num]
    setScaleNorm( scaleNorm ){
        if (scaleNorm instanceof Array)
          this.scaleNorm = scaleNorm;
        else
          if( typeof(scaleNorm) == 'number' )
            this.scaleNorm = [scaleNorm, scaleNorm, scaleNorm ];
        else
            throw "scaleNorm is not array or number: " + typeof(scaleNorm)
        //assign the string. should update gui automatically
        this.scaleNormStr = g_arrayToFloatList( this. scaleNorm );
    }
    
    //Each VX must override this IF it has THREE.js Object3D to render,
    // in which case it should add its object to scene
    addSceneObjects( scene ){
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
            //Why do I have this here?
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
    //gui - the gui (typically a folder) to put items in
    //maingui - the top-level gui ref, needed for adding
    // things to gui 'remember' that aren't direclty in the
    // VX object (which get added by setup in VXmanager)
    setupGUI( gui, maingui /*optional*/ ){
        //Like so:

        //var f = gui.addFolder(this.instanceName);
        //This will add super-class common things. It's optional.
        //Will NOT create its own sub-folder.
        //this.setupGUIsuper( f );
        //Class-specific stuff...
    }

    //Super-class version that a derived class can call from
    // its version of setupGUI, to get some common things
    setupGUIsuper( gui ){
        //DO NOT create a subfolder here. Let the calling function do that.
        gui.add( this, 'scaleNormStr' ).name('Scale Norm').listen().onFinishChange( function(val){
            this.object.setScaleNorm( g_floatListToArray(val) );
        })
    }

} //class VisualExpressionSuper
