"use strict";
//midi i/o
//Using web MIDI API directly.
//Built-in to Chrome, maybe others.

//Use globals for device list and current device 
//When tried to assign these in onMIDISuccess to a property
// of MidiIO class, it said 'this' was undefined. Don't
// understand why. Same whether onMIDISuccess is defined within
// MidiIO ctor or outside it.
//
var g_outputDeviceList = [];
var g_outputDevice = null;

export default class MidiIO {

    constructor(){
        //straight-up web MIDI.

        // request MIDI access
        if (navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess({
                sysex: false // this defaults to 'false' and we won't be covering sysex in this article. 
            }).then(this.onMIDISuccess, this.onMIDIFailure);
        } else {
            alert("No MIDI support in your browser.");
        }
    }

    // midi setup functions
    onMIDIFailure(e) {
        // when we get a failed response, run this code
        alert("No access to MIDI devices or your browser doesn't support WebMIDI API. Please use WebMIDIAPIShim " + e);
    } 

    onMIDISuccess(midiAccess) {
        // when we get a succesful response, run this code
        //console.log('outputs: ', midiAccess.outputs);
        //g_outputDeviceList=[];
        for(var output of midiAccess.outputs.values()){
            //console.log('output: ',output);
            //Use global var for this. See comments at top of file.
            g_outputDeviceList.push(output);
        }
        //For now we assume output 0 is the apple IAC Bus
        //We don't have to open it, but this will reserve it and *maybe*
        // reduce latency slightly.
        g_outputDevice = g_outputDeviceList[0];
        g_outputDevice.open();
    }

    //Return a list of output device names
    getOutputDevices(){
        //TODO
    }

    //Set output device using 0-based value
    // that matches order of devices returned
    // by getOutputDevices()
    setOutputDevice( devNum ){
        if( devNum < g_outputDeviceList.length ){
            g_outputDevice = g_outputDeviceList[devNum];
        }
    }

    // noteon - notes are like: [0x92, 60, 127]
    // duration - in msec, 0 for no off-note (e.g. precussion)
    sendNote( noteon, duration ){

        // Send the 'note on' and schedule the 'note off' for 1 second later
        g_outputDevice.send(noteon);
        
        if( duration > 0 ){
            var noteoff = [ noteon[0] - 0x10, noteon[1], noteon[2] ];
            setTimeout( function() {
                g_outputDevice.send(noteoff);
                },
                1000 );
        }
    }
}

/* Channel 10 note values ( 0x9x )
35 Acoustic Bass Drum
36 Bass Drum 1
37 Side Stick
38 Acoustic Snare
39 Hand Clap
40 Electric Snare
41 Low Floor Tom
42 Closed Hi Hat
43 High Floor Tom
44 Pedal Hi-Hat
45 Low Tom
46 Open Hi-Hat
47 Low-Mid Tom
48 Hi-Mid Tom
49 Crash Cymbal 1
50 High Tom
51 Ride Cymbal 1
52 Chinese Cymbal
53 Ride Bell
54 Tambourine
55 Splash Cymbal
56 Cowbell
57 Crash Cymbal 2
58 Vibraslap
59 Ride Cymbal 2
60 Hi Bongo
61 Low Bongo
62 Mute Hi Conga
63 Open Hi Conga
64 Low Conga
65 High Timbale
66 Low Timbale
67 High Agogo
68 Low Agogo
69 Cabasa
70 Maracas
71 Short Whistle
72 Long Whistle
73 Short Guiro
74 Long Guiro
75 Claves
76 Hi Wood Block
77 Low Wood Block
78 Mute Cuica
79 Open Cuica
80 Mute Triangle
81 Open Triangle
*/

