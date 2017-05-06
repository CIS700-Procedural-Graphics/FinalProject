//notePlayer
//simple note player
"use strict";

import MidiIO from './midiIO.js'

//to get array of all props in here:
//  Object.keys(loops)

export class notePlayer{
    constructor(gui){
        this.loops = {}
        this.generate();

        //options
        this.chosenLoopName = 'none'; //for gui
        this.play = true; //not used internally. used for gui. caller can get state using isPlaying()

        //load the first loop in the list
        this.resetTransport(); //call this first
        this.loadLoop( this.namesArr[0] );

        this.gui = gui;
        this.setupGui();

    }

    newLoopState(){
        //state
        this.nextNoteNum = 0;
        this.loopCount = 0;
        this.startBeat = this.nextLoopStartBeat;
    }

    //Called form calling code when it's resetting its transport
    resetTransport(){
        //For loading loops on-the-fly, see below
        this.nextLoopStartBeat = 0;
        this.newLoopState();
    }

    //for calling code to check if gui is set to play
    isPlaying(){
        return this.play;
    }

    setupGui( ){
        //don't create a folder, rely on parent to pass one if it wants
        this.gui.add( this, 'chosenLoopName', this.namesArr ).name('Loop').listen().onChange( function(newVal) {
            this.object.loadLoop(newVal);
        });
        this.gui.add( this, 'play' ).listen();
    }

    //Calling func calls this and gets the next note in the loop.
    //If calling func uses it, it should then call usedTheNote() to
    // advance the internal index
    checkNextNote(){
        var ind = this.nextNoteNum * 2;
        //Get the note ( beat time and instrument number );
        var note = this.currentLoop.notes.slice( ind, ind+2 /*non-inclusive*/ );
        //Increment beat for the loop # we're on
        note[0] += this.startBeat + ( this.loopCount * this.currentLoop.beatLength );
        return note;
    }

    //Caller used the note, so update internal state
    usedTheNote(){
        this.nextNoteNum++;
        if( this.nextNoteNum * 2 >= this.currentLoop.notes.length ){
            this.loopCount++;
            this.nextNoteNum = 0;
            //cache this so we can load new loop while parent transport is still going,
            // and we'll get the beat timing right for this loop to start up in sync within
            // one loop-duration.
            this.nextLoopStartBeat = this.startBeat + ( (this.loopCount+1) * this.currentLoop.beatLength );
        }
    }

    addLoop(name,beatLength,noteArr){
        this.loops[name] = {
            beatLength: beatLength,
            notes: noteArr,
            }
    }

    loadLoop( name ){
        if( ! this.loops.hasOwnProperty( name ) )
            throw 'notePlayer: loop name not found: ' + name;
        this.currentLoop = this.loops[name];
        this.chosenLoopName = name;
        this.newLoopState();
    }

/////// THE LOOPS //////////////////////////////////////////

    generate( ){
        var k = 35; //Kick Drum, acoustic
        var s = 38; //Snare, acoustic

        this.addLoop( '2-7onDaFloor', 8, [
                        0,  k,
                        1,  k,
                        2,  k,
                        3,  k,
                        4,  k,
                        5,  k,
                        6,  k
                        ]);
        this.addLoop( '1-bobber', 4, [
                        0,  k,
                        1,  k,
                        2.5,s,
                        3,  k,
                        3.5,s,
                        ]);
        this.addLoop( '1-rock0', 4, [
                        0,  k,
                        1,  s,
                        2,  k,
                        3,  s
                        ]);
        this.addLoop( '1-rock1', 4, [
                        0,  k,
                        1,  s,
                        2,  k,
                        2.5,k,
                        3,  s
                        ]);
        this.addLoop( '1-rock2', 4, [
                        0,  k,
                        1,  s,
                        2,  k,
                        2.5,k,
                        3,  s,
                        3.5,k
                        ]);
        this.addLoop( '2-rock1-fill', 8, [
                        0,  k,
                        1,  s,
                        2,  k,
                        2.5,k,
                        3,  s,
                        4,  k,
                        5,  s,
                        6,  s,
                        6.25,s,
                        6.75,s,
                        7.25,s,
                        7.5,s
                        ]);
        this.addLoop( '1-AOx3_Aoea', 4, [
                        0,   k,
                        0.75,k,
                        1,   k,
                        1.75,k,
                        2,   k,
                        2.75,k,
                        3,   s,
                        3.25,s,
                        3.75,s
                        ]);
        this.addLoop( '2-OE_AO', 8, [
                        0,   k,
                        0.25,k,
                        1,   k,
                        1.25,k,
                        2,   k,
                        2.25,k,
                        3,   s,
                        3.75,k,
                        4,   k,
                        4.75,k,
                        5,   k,
                        5.75,k,
                        6,   k,
                        7,   s,
                        ]);
        this.addLoop( '2-oe_ao', 8, [
                        0,   s,
                        0.25,s,
                        1,   s,
                        1.25,s,
                        2,   s,
                        2.25,s,
                        3,   k,
                        3.75,s,
                        4,   s,
                        4.75,s,
                        5,   s,
                        5.75,s,
                        6,   s,
                        7,   k,
                        ]);
        this.addLoop( '2-Oe_aO', 8, [
                        0,   k,
                        0.25,s,
                        1,   k,
                        1.25,s,
                        2,   k,
                        2.25,s,
                        3.75,s,
                        4,   k,
                        4.75,s,
                        5,   k,
                        5.75,s,
                        6,   k,
                        ]);
                        
        this.namesArr = Object.keys( this.loops );
        console.log('loops: ',this.loops);
    }
}
