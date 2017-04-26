"use strict";
//sequencer
//coordinates all activate and each frame/step

import DAT from 'dat-gui'

const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
import MusicalEvent from './musicalEvent.js'
import MusicAnalysis from './musicAnalysis.js'
import MidiIO from './midiIO.js'
import ExpressionTranslator from './expressionTranslator.js'
import {VisualExpression, VXmanager} from "./visualExpression.js"
import {PowerCurve, PowerCurve3} from './powerCurve.js'

export default class Sequencer{
    constructor( three_js_scene, camera ){
        //Store the THREE.js scene ref in case we need it, but mostly it'll
        // be used by VXmanager
        this.scene = three_js_scene;
        this.gui = {};
        this.camera = camera;

        this.midi = new MidiIO(); //sets up midi connection and inits first output device
        this.setDefaults();
        this.initGui(); //init GUI BEFORE framework
        this.initFramework();
        this.transportReset();

        //Test PowerCurve
        /*
        var pc = new PowerCurve( 1, 1 );
        pc.dump(10);
        gui.add(pc, 'a', 0.1, 10 ).name('P Curve a').onChange(function(newVal) {
            pc.a = newVal;
            pc.dump(20);
        })
        gui.add(pc, 'b', 0.1, 10 ).name('P Curve b').onChange(function(newVal) {
            pc.b = newVal;
            pc.dump(20);
        })
        */
    }

    setDefaults(){
        //musical paramaters
        this.musicParams = {
            meter: 4.0, //beats per measure - no denominator for now
            beatDur: 500, //beat duration in msec
            
            //Num of divisions per quarter-note beat to quantize things to
            //12 - 16th notes and 16th triplets within a beat
            //4  - 16th notes only
            //3  - 8th note triplets only (e.g. for 6/8, choose this and meter =2 ??)
            //6  - 16th note triplets only (e.g. for 6/8 with off-beats)
            //TODO
            // Enable quantizing to 16th notes and 8th-note triplets, w/out 16-note triplets,
            // cuz 16-note triplets are too easy to get by accident, e.g. by playing ahead of
            // the beat
            quantizeDivs: 4,

            //Value used to round-up a beat value to call it the next beat if
            // we're doing beat-based stuff like metronome click. If current beat
            // value is within this value of next beat, call it as next beat.
            // Should help make a little less jitter on beat click and file/event
            // playback since we'll never be a full frame's duration late on doing
            // something that should be on the beat.
            beatFracCloseEnough: 0.02, //at 500msec period, 0.1 would be 50 msec
        }
        this.beatClick = {
            //Time of next beat click in performance beats
            nextPerfBeat: 0, 
            clickAccent: [ 0x99, 76, 110], //76 = hi wood block, 77 = low wood block
            clickRegular: [ 0x99, 77, 95 ],
            clickCountin: [ 0x99, 37, 120 ], //37 = side stick
        }

        this.log = {
            dumpNewME: false,
        }

        this.guiFolders = {};
    }

    initGui(){
        console.log('init gui');
        this.gui = new DAT.GUI();
        this.gui.add(this.camera, 'fov', 0, 180).onChange(function(newVal) {
            this.camera.updateProjectionMatrix();
            });
        this.guiStartStop = this.gui.add(this, 'startStopToggle').name('Start-Stop');

        this.guiFolders.log = this.gui.addFolder('Log / Debug');
        this.guiFolders.log.add(this.log, 'dumpNewME' ).name('New ME');
        this.guiFolders.log.add(this, 'dumpState').name('Dump State');

        //this.guiFolders.VXmanger = this.gui.addFolder('VX Manager');

    }

    initFramework(){
        //Instantiate the VXmanager
        this.VXmanager = new VXmanager( this.scene, this.camera, this.gui );
        //this.VXmanager.initialize(); get called from VXmanager.reset()
        // so don't need to call it here as long as transportReset() gets
        // called when sequencer gets first instanatiated 

        //Instantiate the ExpressionTranslator
        this.translator = new ExpressionTranslator();
        this.musicAnalysis = new MusicAnalysis( this.musicParams, this.translator );
    }


    //Call this before starting from begin
    transportReset(){
        this.transportState = 'stop'; //others: 'play'
        this.beatClick.nextPerfBeat = 0;
        console.log('Transport stopped and reset');
        //reset/re-init some framework stuff to clear lists
        // of MX and VX objects (and whatever else)
        this.VXmanager.reset(); //Do this one FIRST so standalone VX's can be re-inited
        this.translator.reset();
    }

    startStopToggle(){
        if( this.transportState == 'play' )
            this.stop();
        else
            this.start();
    }

    //Go!
    start(){
        this.startMsec = Date.now(); //abs world time we started the sequencer
        this.transportState = 'play'; //others: 'play'

        //Do first frame right away, I guess
        this.nextFrame( this.startMsec );
        console.log("Sequencer started");
    }

    //Stop!
    //
    stop(){
        //Just stop and reset now. Worry about pause/resume later if it makes sense.
        this.transportReset();
    }

    //Process and render for next frame
    //Thread-safety - from what I've read, javascript is single-threaded with
    // some threading models in special cases, but nothing I'm doing, I think.
    nextFrame( globalMsec ){
        //console.log('nextFrame: ', globalMsec);
        if( this.transportState != 'play' )
            return;

        //Get current music time
        this.currentMusicTimes = this.getMusicTimes( globalMsec );

        //Beat click - can we do this in a separate thread somehow?
        this.doBeatClick();

        //Run through MX's & VX's and update - visualize!
        this.translator.updateForFrame( this.currentMusicTimes );
    }

    dumpState(){
        this.VXmanager.dumpState();
        this.translator.dumpState();
    }

    doBeatClick(){
        var times = this.currentMusicTimes;
        var note = [];
        if( times.perfBeatRaw >= ( this.beatClick.nextPerfBeat - this.musicParams.beatFracCloseEnough ) ){
            //Time to play the click

            //Do one measure of countin
            if( times.measure == 0 ){
                note = this.beatClick.clickCountin;
            }else{
                if( times.beatNum == 0 ){
                    note = this.beatClick.clickAccent;
                }else
                    note = this.beatClick.clickRegular;
            }

            this.midi.sendNote( note, 0 );
            this.beatClick.nextPerfBeat += 1.0;
        } 
    }

    //Process keyboard events
    keyboardInput(event){
      var globalMsec = Date.now();
      const keyName = event.key;
      //console.log('keydown: ', keyName );
      var isNote = true;
      var note = 0;
      var instr = 0;
      var duration = 0;
      //console.log('keyname'+ keyName +'.');
      switch( keyName ){
        case 'f':
            note = 35;  //35 is acoustic bass drum, 36 is bass drum 1
            instr = 0x09; //0-based midi channel for now
            duration = 0;
            break;
        case 'j':
            note = 38; //38 is acoustic snare
            instr = 0x09;
            duration = 0;
            break;
        case ' ': //Space is an actual space char - go figure
            this.startStopToggle();
            return;
        default:
            isNote = false;
      }

      //Process the note
      if( isNote ){
          var noteOn = [ 0x90 + instr, note, 127 ];
          this.midi.sendNote( noteOn, duration );
          this.processNewME( new MusicalEvent( globalMsec, note, instr, duration ) );
      }
    }

    // For given abs msec time from sequencer start,
    // calc beat info and quantizes as appropriate.
    getMusicTimes( globalMsec ){
        //Event time in msec rel to sequencer start
        var perfMsec = globalMsec - this.startMsec;

        //Absolute fractional beat from start of sequencer
        //UN-quantized
        var perfBeatRaw = perfMsec / this.musicParams.beatDur;

        //Quantize
        //always doing it, for now at least
        //
        var perfDiv = Math.round( perfBeatRaw * this.musicParams.quantizeDivs );
        //Fractional beat time *from start of sequencer*
        //QUANTIZED
        var perfBeatQ =  perfDiv / this.musicParams.quantizeDivs;
        var measure = Math.floor(perfBeatQ / this.musicParams.meter);
        //integer beat number within the measure, 0-based like all other stuff
        var beatNum = Math.floor( perfBeatQ % this.musicParams.meter );
        //beat fraction within beat [0, (this.musicParams.quantizeDivs-1)/this.musicParams.quantizeDivs) ] 
        var beatFrac = perfBeatQ % 1.0; 
        
        //Beat division id, [0,11]
        //beatDiv is one of 12 id's of sub-beat
        //Always (?) 12 divs per quarter-note beat, regardless of quantization resolution
        //0 = downbeat
        //1 = first 16th triplet
        //2 = 2nd 16th triplet
        //3 = first 16th note
        //4 = first 8th triplet, 3rd 16th triplet
        //5 = 4th 16th triplet
        //6 = first 8th note, 2nd 16th note
        //...
        var beatDiv = Math.round( beatFrac * 12.0 );

        return {
            perfMsec: perfMsec,
            perfBeatRaw: perfBeatRaw, 
            perfBeatQ: perfBeatQ,
            measure: measure,
            beatNum: beatNum,
            beatFrac: beatFrac,
            beatDiv: beatDiv,
            }
    }

    //Process a musical note/event (ME) input
    //Then hands off to musical analysis
    processNewME( ME ){
        
        //Calc beat & measure time
        ME.setTimes( this.getMusicTimes( ME.globalMsec ) );
        //console.log('new ME: ', ME,' times: ', ME.times);

        if( this.log.dumpNewME ){
            //console.log('')
            //console.log('Sequencer: new MusicalEvent: ')
            console.log('Seq new ME: ', ME)
            console.log('  perfBeatQ: ', ME.times.perfBeatQ, ' msr: ', ME.times.measure, ' beat: ', ME.times.beatNum, ' beatDiv: ', ME.times.beatDiv );        
        }

        //Send to musical analysis.
        //ME gets added to list of notes in MA obj, and generates
        // a MX that gets added to list in MA obj
        this.musicAnalysis.processME( ME );

    }

}