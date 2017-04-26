"use strict";
//Musical Expression

//MX characteristics (preliminary)
//
// absBeat - onset of the expression in abs beats
// beatDiv - sub-beat analysis (0 is onbeat, otherwise offbeat)
//   apply beatDiv-specific characteristics here to MX, or let MX-to-VX process do this?
// durBeats - duration of the expression in beats. 0 for instantaneous
// gravity - grounding vs lifting (e.g. low drum vs snare)
//

// aka "MX"
export default class MusicalExpression{
    constructor( type, ME /*null for none*/, musicalTimesObj ){
        //type of expression. not sure how this will end up looking. probably
        // will need sub-types, etc
        //Can we subclass so we don't have every quality in every MX instance?
        this.type = type;

        //ME associated with this expression, or if there's more than one,
        // the one that started it
        // null if none
        this.firstME = ME;

        //Object holding various msec and musical time value for the start of this event
        //From sequencer
        //See comments in Sequencer class
        this.times = musicalTimesObj;

        this.durBeats = 0; //Need this? Have flag 'isInstantaneous' instead?
        this.perfBeatEnd = 0; //Ending time of this in beats since sequencer start
        
        //List of VXs driven by this expression.
        //Will probably want separate MX instances for each mapping
        // between the same MX type and a VX. But we may have some MX types
        // that generated multple VX's, so we have an array here.
        this.VXlist = [];

        //Flag saying this MX is new and hasn't yet
        // been processd by translator
        //Need this?
        this.isNew = true;

        //Flag saying this MX is done and needs no more
        // processing.
        //Only set this true once its assoc'ed VX has been
        // created and init'ed. If 
        this.isDone = false;

        //qualities - throw all in here for now
        this.gravity = 'none';
    }

    //TODO - this should be a virtual function
    // overriden by subclassing based on MX type
    updateForFrame( musicalTiming ){
        //First - pdate anything particular to this MX
        if( this.type == 'gravity' ){
            //probably nothing to do for gravity, it's instantaneous
        }
        //Second - call the assigned translate object's update method
        // to make any changes to assigned VX.
        this.translation.updateForFrame( this, musicalTiming );

        //All done if instantaneous MX
        this.isDone = ( this.durBeats == 0 );
    }
}