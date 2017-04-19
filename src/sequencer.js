//sequencer
//coordinates all activate and each frame/step

const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
import MusicalEvent from './musicalEvent.js'
import MusicAnalysis from './musicAnalysis.js'
import MidiIO from './midiIO.js'
import ExpressionTranslator from './expressionTranslator.js'

export default class Sequencer{
    constructor(){
        this.midi = new MidiIO(); //sets up midi connection and inits first output device
        this.setDefaults();
        this.reset();
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
            quantizeDivs: 12,
        }
    }

    //After options have been set, call this before starting from begin
    reset(){
        this.state = 'stop'; //others: 'play'
        this.startMsec = Date.now(); //abs world time we started the sequencer
        
        this.translator = new ExpressionTranslator();
        this.musicAnalysis = new MusicAnalysis( this.musicParams, this.translator );
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
      switch( keyName ){
        case 'f':
            note = 36;  //36 is bass drum
            instr = 0x09; //0-based midi channel for now
            duration = 0;
            break;
        case 'j':
            note = 38; //38 is acoustic snare
            instr = 0x09;
            duration = 0;
            break;
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
        //Always (?) 12 divs per quarter-note beat
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

        console.log('')
        console.log('Sequencer: new MusicalEvent: ')
        console.log('  ME          : ', ME)
        console.log('  Musical perfBeatQ: ', ME.times.perfBeatQ, ' measure: ', ME.times.measure, ' beat: ', ME.times.beatNum );        

        //Send to musical analysis.
        //ME gets added to list of notes in MA obj, and generates
        // a MX that gets added to list in MA obj
        this.musicAnalysis.processME( ME );

    }

    //Process and render for next frame
    nextFrame( globalMsec ){
        //Match MX's to VX's
        // ?? Should each MX get a ref to matched VX? This would make it
        //    easier to track non-instantaneous MX's and the VX they created
        //    and allow them to modify it during its lifetime.


        //Run through VX's and apply - visualize!
    }
}