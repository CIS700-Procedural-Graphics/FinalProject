//Expression Translator
//
//Maintains list of current MX and VX objects
// and will generate/modify VX objects as needed
//Performs mapping from new MX obj to the appropriate VX obj.
//For non-instantaneous MX obj, have it make changes if appropriate to
// it assigned VX('s).

import MusicExpression from "./musicalExpression.js"
import {VisualExpression, VXlist} from "./visualExpression.js"

//Object containing available TX's by MXtype.
var TXmasterList={};

//Class for various translations
class Translation{
    constructor( translationName, MXtype, VXtype ){
        this.translationName = translationName; //Name for this particular translation mapping
        this.MXtype = MXtype;
        this.VXtype = VXtype;
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
            throw 'Mismatching MX type in Translation.initMX()'

        //Create a new VX for this MX
        //Only allows one per VX for now, probably want multiple per
        // VX in the future, or maintain multiple identical MXs if we
        // want an MX to influence multiple VXs
        MX.VX = new VisualExpression( this.VXtype );

        //Assign the translation to the MX
        //Don't change anything!
        MX.translation = this;
    }

    //Update for frame
    //MUST be overridden by 'dervived' types
    //Instantaneous MXs will do their one-time mods
    // the assigned VX when this routine is first called,
    // then set their 'isDone' flag.
    updateForFrame( perfBeatQ ){
        throw "undefined Translation:updateForFrame()"
    }
}

//Hard code some translations (TX)
//These are user-definable/modifiable and control
// how MX's get mapped to VX's
//

// Gravity translator
//
var TXgravity = new Translation( 'gravityToPathDispl_1', 'gravity', 'pathDisplacement' );
TXgravity.updateForFrame = function( perfBeatQ ){
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


    //todo - set up the VX

}
   

export default class ExpressionTranslator{
    constructor(){
        //List of MX's that need processing
        this.MXactiveList = [];
        //List of all MX's that have been added. May need at some point.
        this.MXallList = [];

        //list of all VX's that need processing
        this.VXactiveList = [];
        //list of all VX's 
        this.VXallList = [];

        //test
        //console.log('imported VXlist: ', VXlist );
        //var vx = new VisualExpression();
        //console.log('test vx: ',vx);

    }

    //Take a new MX from music analysis (or also from elsewher?) 
    //Translate it to its VX
    addNewMX( MX ){
        this.MXactiveList.push( MX );
        this.MXallList.push( MX );
        //console.log('ExpressionTranslator:addNewMX: ', MX);

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
        if( TXmasterList.hasOwnProperty( MX.type ) )
            TXmasterList[MX.type].initMX( MX );

        //simpel debug
        console.log( 'ExpressionTranslator:addNew MX: ');
        console.log( '  New MX   : ', MX)
        console.log( '  Mapped VX: ', MX.VX)

        //Add the new VX to VX list
        //Keep list here? Or in a VisualExpressions object somewhere?

        // toto - add the VX somewhere( MX.VX );
    }

    //Update all active MXs in terms of what they may
    // need to update in themselves and possibly change
    // in their assigned VX(s)
    //Meant to be called each frame by sequencer
    updateActiveMX( perfBeatQ /* or perfBeatRaw ?? */){
        for( var ind in this.MXactiveList ){
            var MX = this.MXactiveList[ind];

            //Calls the MX's translate object to do updates
            // specific to the assigned VX
            MX.updateForFrame( perfBeatQ );

            //If MX is done (either instantaneous or time expired or marked as done)
            // then remove it from active list
            //Flag should be set 

            //todo
          //  if( MX.isDone )
          //      ...remove...
        }
    }
}
