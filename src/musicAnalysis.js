"use strict";
//Music Analysis!

import MusicalEvent from "./musicalEvent.js"
import MusicalExpression from "./musicalExpression.js"


export default class MusicAnalysis{

    constructor( musicParams, translator ){ //from sequencer settings - tempo, meter, etc
        this.musicParams = musicParams;
        this.MElist = [];
        //the translator
        this.translator = translator;

        //Musical qualities used in expressions
        //Not clear how to handle/list/define these
        this.MQgravity = {
            //List of note values that match grounding vs lifting 
            groundingNotes: [36,35],
            liftingNotes: [38],
        }
    }

    //Process a musical event
    //Generate MX as appropriate
    processME( ME ){
        //Store the music event in a list. Why? Probably will need it at some point.
        this.MElist.push( ME );

        //Process for different analysis methods
        //If an MX is generated, it gets added to list of MX's
        //?? I think we'll want this to be done via some Analysis Object list
        // and it runs through so we don't hard-code func names here for
        // each analysis.
        this.processForGravity( ME );
            
    }

    processNewMXinstance( MX ){
        this.translator.processNewMXinstance( MX );
    }

    //Check if the note matches the 'gravity' quality
    //Return new MX if one's created, otherwise null
    processForGravity( ME ){
        //console.log('in MusicAnalysis:processForGravity');
        var gravity = 'none';
        for( var note of this.MQgravity.groundingNotes ){
            if( ME.note == note ){
                gravity = 'grounding';
                break;
            }
        }
        if( gravity == 'none' )
         for( var note of this.MQgravity.liftingNotes ){
            if( ME.note == note ){
                gravity = 'lifting';
                break;
            }
        }

        if( gravity != 'none ' ){
            var MX = new MusicalExpression( 'gravity', ME, ME.times );
            MX.durBeats = 0; //all instantaneous for now
            
            //set the quality
            MX.gravity  = gravity;

            this.processNewMXinstance( MX );
        }
    }

}