"use strict";
const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much

//Expression Translator
//
//Maintains list of current MX and VX objects
// and will generate/modify VX objects as needed
//Performs mapping from new MX obj to the appropriate VX obj.
//For non-instantaneous MX obj, have it make changes if appropriate to
// it assigned VX('s).

import MusicExpression from "./musicalExpression.js"
//Not sure we need VXmanager in here
import {VisualExpression, g_VXmanager} from "./visualExpression.js"

//Object containing available TX's by MXtype.
var TXmasterList={};

////////////////////////////////
//
//Class for various translations
//
// *** NOTE ***
//  WHEN REFACTOR ALL THIS:
//  - Each different type of translation should be a sub-class of this class
//  - A new translation type is instantiated for each mapping between an MX and VX the user chooses
//     Question: should there be a new isntance for each instance of an MX that's instantaneous? Or
//      just have a single translation instance that handles multiples MX instances of same type and same mapping
//      to same VX type with same params/options? If each MX keeps track of which VXs it's influencing,
//      the translation instance could iterate over them and provide the mapping function (updateForFrame based on type),
//      and the MX would know which particular VX to modify. Think of how we want think to look/behave from the
//      user's perspecitve of manipulating the gui to change mappings. If user has 'gravity' MX mapped to
//      pathDisplacement VXs under the main path, and also has gravity MX mapped to, say, spring constant of
//      the bungee-cord-trailing-objcts effect running on the main dancing dude, then those two should be separate
//      translation instances actually since we may want to mod their options separately. Also, the two mappings
//      will show up in different spots of the gui.
class Translation{
    constructor( instanceName, MXtype, VXtypeList, VXparent ){
        this.instanceName = instanceName; //Name for this particular translation mapping
        this.MXtype = MXtype;
        
        //Array of type names to create, one for each element
        //Can be a string for single type
        if( typeof( VXtypeList == 'string' ) ){
            VXtypeList = [VXtypeList];
        }
        this.VXtypeList = VXtypeList; 

        //Parent VX to which to add any new VX's generated during init (or running?) of this translation
        //'null' for none
        this.VXparent = VXparent;
        
        //Add this object to the master list by MXtype name
        TXmasterList[this.MXtype] = this;
    }

    //Perform the translation into a new VX
    //Call this on new MX objs that haven't yet
    // had their VXs assigned.
    //All param setting on the VX will be done in the update method
    initMX( MX ){
        //Validate this MX matches set type
        if( MX.type != this.MXtype )
            throw 'Mismatching MX type in Translation.initMX(): ' + MX.type + ', ' + this.MXtype;

        //Create a new VX for this MX
        //Only allows one VX per MX for now, probably want multiple per
        // VX in the future, or maintain multiple identical MXs if we
        // want an MX to influence multiple VXs
        MX.VXlist = g_VXmanager.createNewVXs( this.VXtypeList, 'auto' )

        //Assign the translation to the MX
        //Don't change anything in it! How to make const?
        MX.translation = this;
    }

    //Update for frame
    //MUST be overridden by 'dervived' types
    //Gets called by an MX that has this translation assigned to it.
    //Gets called after MX does any required updates for this frame.
    //Instantaneous MXs will do their one-time mods on
    // the assigned VX when this routine is first called,
    // then set their 'isDone' flag.
    updateForFrame( MX, musicalTiming ){
        throw "undefined Translation:updateForFrame()"
    }
}

///////////////////////////////////
//
//Hard code some translations (TX)
//
//These are eventually user-definable/modifiable and control
// how MX's get mapped to VX's
//

var TXinit = function(){
    TXmasterList = {};

    // Gravity translator
    //
    //Make this in a separate init function so we can call it only after VXmanager
    // has been instantiated and init'ed
    //This will be different when I get this stuff designed properly
    var TXgravity = new Translation( 'gravityToPathDispl_1', //instanceName
                                    'gravity', //MXtype
                                    'pathDisplacement', //VXtypeList - can be string if just one 
                                    g_VXmanager.getMainPathVX() ); // Pass in VX for main path - hard-coded for now
    TXgravity.updateForFrame = function( MX, currentMusicalTiming /* timing of this frame */ ){
        //Handle different variations of MX
        //Seems weird to handle here, have to sort it out.
        //Although since this translation obj gets assigned to an MX
        // and MX calls this method when updating for frame, kinda does
        // make sense.
        //Some/much of these are going to be user options, somehow.
        //
        //TODO
        //  Music-side stuff - do in MusicAnalysis?
        //    If handle on music side, need to quantify or give each
        //    variation a name of parameter to set
        //  - grounding quality -  on beat vs off-beat
        //  - lifting quality - on beat vs off-beat
        //  - metric down beat 
        //  - 16th note position

        //set up the VX
        //simple for now
        //On VX of type pathDisplacement
        //It has separate params for lateral (x), vertical (y) and forward (z) displacement.
        
        var VX = MX.VXlist[0]; //expecting just one
        //For now, all directions start at same time. I suppose at some point
        // we not want them to?
        VX.setPerfBeatStart(MX.times.perfBeatQ ); //Use Raw or Quantized?

        //Each direction can have a separate end time
        //Lateral is main displacement - always end on the next beat for now
        //0 signifies do nothing
        var nextBeat = Math.floor( VX.perfBeatStart + 1.0 );
        var perfBeatEnd = [ nextBeat, 0, 0 ];
        VX.setPerfBeatEnd( perfBeatEnd );

        //Maximum relative displacement in each direction under 'normal' conditions.
        var scaleNorm = [ 1.0, 0, 0 ]; //just lateral for now
        VX.setScaleNorm( scaleNorm ); 

        //Mark MX as done since this is instantaneous and the VX will continue on its own
        MX.isDone = true;
    }// class TXgravity

}// function TXinit

//////////////////////////////////////////
//
export default class ExpressionTranslator{
    constructor( ){
        this.reset();
    }

    reset(){
        //List of MX's that need processing
        this.MXactiveList = [];
        //List of all MX's that have been added. May need at some point.
        this.MXallList = [];
        //Init some translations - will be overhauled later
        TXinit();
    }

    //Take a new MX isntance from music analysis (or also from elsewher?) 
    //Translate it to its VX
    processNewMXinstance( MX ){
        this.MXactiveList.push( MX );
        this.MXallList.push( MX );
        //console.log('ExpressionTranslator:processNewMXinstance: ', MX);

        //Translate
        //
        //Take an MX and 'translate' it (i.e. map it) to a VX per
        // translation settings.
        //Generates a new VX and adds it to the MX.
        //Sets the MX's translate ref to the appropriate translation.
        //Only done once per MX (at least at this point).
        //
        //Finds a match in translation list by MXtype, so at this point
        // we can only have one type of translation at any time for a given
        // MXtype.
        //NOTE in furture we probably want to do this via an instance of
        // a translation, so we can have multiple translations instances from
        // the same MXtype that either go to different VXs, and/or to same VX
        // but with different settings.
        //
        if( TXmasterList.hasOwnProperty( MX.type ) ){
            var TX = TXmasterList[MX.type];
            TX.initMX( MX );

            //simple debug
            //console.log( 'ExpressionTranslator:addNew MX: ');
            //console.log( '  New MX   : ', MX)
            //console.log( '  Mapped VX: ', MX.VX)

            //Add the new VXs to VX master list.
            g_VXmanager.addNewVXs( MX.VXlist, TX.VXparent );
        }else
            throw "Unmatched MX.type in processNewMXinstance: " + MX.type;
    }

    dumpState(){
        var L = console.log;
        L('--- Translator: dumpState ---');
        L('-- MXactiveList:');
        for( var MX of this.MXactiveList ){
            L(MX);
        }
        L('-- TXmasterList:');
        L(TXmasterList);
    }

    //Update MX and VX objects for current frame/time
    //Meant to be called each frame by sequencer
    updateForFrame( musicalTiming ){
        this.updateAllActiveMX( musicalTiming );
        g_VXmanager.updateForFrame( musicalTiming );
    }

    //Update all active MXs in terms of what they may
    // need to update in themselves and possibly change
    // in their assigned VX(s)
    updateAllActiveMX( musicalTiming ){
        var MXactiveNEW = [];
        for( var ind in this.MXactiveList ){
            var MX = this.MXactiveList[ind];

            //Calls the MX to update itself if needed, and
            // then it will call its translate object to do updates
            // specific to the assigned VX
            MX.updateForFrame( musicalTiming );

            //If MX is done then remove it from active list
            //Flag should be set in MX.updateForFrame (and elsewhere possibly?)
            //Seems simplest to actually just make a new array of the ones to keep
            if( ! MX.isDone )
                MXactiveNEW.push( MX );
        }
        this.MXactiveList = MXactiveNEW;
    }
}
