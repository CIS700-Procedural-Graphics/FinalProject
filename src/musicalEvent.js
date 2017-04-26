"use strict";
//Musical Event
//Abstraction of music event (just notes for now) to use
// regardless of source of musical input

export default class MusicalEvent {
    constructor( globalMsec, note, instrument, durationMsec ){
        //Abs world time this note happened
        this.globalMsec = globalMsec;
        //Duration in msec
        this.durationMsec = durationMsec;
        //Note pitch/number (MIDI for now)
        this.note = note;
        //Instrument (MIDI channel for now)
        this.instrument = instrument;

        //This is set elsewhere, in sequencer most likely
        //See comments in Sequencer class
        //Object holding various msec and musical time value for this event
        this.times = {};
    }

    //Pass in a musical-times object as generated
    // by sequener and store a ref here
    setTimes( musicalTimesObj ){
        this.times = musicalTimesObj;
    }
}