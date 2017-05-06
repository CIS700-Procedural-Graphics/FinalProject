"use strict";
const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
//import DAT from 'dat-gui'
//Newer version of dat-gui fixes presets bug
import dat from '../../dat-gui-git/dat.gui.npm/build/dat.gui.js'


//Expression Translator
//
//Maintains list of current MX and VX objects
// and will generate/modify VX objects as needed
//Performs mapping from new MX obj to the appropriate VX obj.
//For non-instantaneous MX obj, have it make changes if appropriate to
// it assigned VX('s).

import MusicExpression from "./musicalExpression.js"
//Not sure we need VXmanager in here
import {g_VXmanager} from "./VXmanager.js"
import {g_floatListToArray} from './utils.js'
import {guiPresets_TX} from './guiPresets.js'

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

    //setup gui
    //Once translation class is redone, we'll probably have
    // MX-type-specific options/params held within the translation
    // instance, so that MX's can be ephemeral while we keep options
    // consistent.
    setupGUI( gui, maingui /*top-level gui needed for remember()*/ ){
        //override in derived class as needed
        //??? or we might have translation mapping options set here,
        // like this translator takes MX of this type and goes to this type of VX
        //Not sure
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
    TXgravity.displacementMap = {
        grounding: [
                    ".5 -.2 .4", //beatDiv 0
                    "0 0 0 ",   //1
                    "0 0 0 ",   //2
                    ".2 .1 .5", //3 16th note
                    "0 0 0 ",   //4
                    "0 0 0 ",   //5
                    ".3 .3 .2", //6 8th note
                    "0 0 0 ",   //7
                    "0 0 0 ",   //8
                    ".2 .1 .5",  //9 16th
                    "0 0 0",    //10
                    "0 0 0",    //11
        ],
        lifting: [
                    ".1 .2 .2", //beatDiv 0
                    "0 0 0 ",   //1
                    "0 0 0 ",   //2
                    "0 .3 .1", //3 16th note
                    "0 0 0 ",   //4
                    "0 0 0 ",   //5
                    "0 .5 .1", //6 8th note
                    "0 0 0 ",   //7
                    "0 0 0 ",   //8
                    "0 .3 -.2",  //9 16th
                    "0 0 0",    //10
                    "0 0 0",    //11
        ]
    }

    TXgravity.getDisplacement = function( MX, beatDiv ){
        return g_floatListToArray( this.displacementMap[MX.gravity][beatDiv] );
    }

    TXgravity.setupGUI = function( gui, maingui ){
        var f = gui.addFolder( this.instanceName );
        f.open();

        //Only adding displacement amplitude options for 16th-note divs for now
        var str = ['1','e','&','a'];
        for( var ind of [0,3,6,9]){
            f.add( this.displacementMap.grounding, ind.toString() ).name('ground.'+str[ind/3] ).onFinishChange( function(newVal) {
                //this.object = this.displacementMap.grounding
                //this.property = result of ind.toString() above
                this.object[this.property] = newVal; 
            });
        }
        for( var ind of [0,3,6,9]){
            f.add( this.displacementMap.lifting, ind.toString() ).name(  'lift...'+str[ind/3] ).onFinishChange( function(newVal) {
                this.object[this.property] = newVal;
            });
        }
        maingui.remember(this.displacementMap.grounding);
        maingui.remember(this.displacementMap.lifting);
    }

    //For switching lateral displacement sides every beat or other time period
    TXgravity.swingX ={
            enable: true,
            regular: false,
            //Which of gravity-type notes to do the swing on
            //Track separately or together, i.e. can have swing change only on grounding notes,
            // or only lifting notes. Or respond to both - in which case 'regular' swing always 
            // responds to both, and for 'irregular', 'together' means that when either
            // note-type comes in, do the swing, or 'separate' which means each gravity type
            // tracks and swings separately.
            gravityType: 'separate', //can be 'grounding, lifting' or 'together' or 'separate'
            //For 'irregular' swing, i.e. not on every beat, but on every note in a new beat
                //NOTE I'd like some typedefs here!
            irrState: {
                grounding: { prevBeatNum: 0, prevDirec: 1 },
                lifting:   { prevBeatNum: 0, prevDirec: 1 },
                together:   { prevBeatNum: 0, prevDirec: 1 },
            },
    }

    //Return 1 or -1, to multiply lateral displacement
    TXgravity.getSwingX = function(MX, musicalTiming ){
        //Swap lateral direction every beat, or every beat where there's a note, etc.
        //Storing this option in the translation since the MX and TX here are
        // non-permanent. 
        //Will probably want to do this going forward when the translator
        // class code gets revamped
        var direc = 1; //1 for keep as it is, -1 for swap
        var gType = this.swingX.gravityType;
        var perfBeatNumQ = Math.floor(MX.times.perfBeatQ)
        //console.log('perfBeatNumQ ',perfBeatNumQ);
        if( this.swingX.enable &&
            (  gType == 'together' || gType == 'separate' || gType == MX.gravity )
          )
        
        {
            if( this.swingX.regular ){
                //swing changes regular with every beat
                //direc = ( musicalTiming.perfBeatQ % 2 ) == 0 ? 1 : -1;
                direc = ( perfBeatNumQ % 2 ) == 0 ? 1 : -1;
            }else{
                //irregular
                //this changes direction everytime we start in a different beat,
                // so e.g. if we hit only on 1 and 3, we'll still swing
                //get the state we're working with
                var name = gType == 'together' ? 'together' : MX.gravity;
                var state = this.swingX.irrState[name];
                if( state.prevBeatNum != perfBeatNumQ ){
                    //console.log('swinging! ', this.swingX.prevBeatNum, beatQ);
                    state.prevDirec *= -1;
                    state.prevBeatNum = perfBeatNumQ;
                }
                direc = state.prevDirec;
            }
        }
        return direc;
    }
    

    TXgravity.updateForFrame = function( MX, musicalTiming /* timing of this frame */ ){
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
        //
        //*** Use Raw or Quantized??? ***
        //Using Raw for the VX start time, so that if it's called before the master clock
        // has reached the quantized beat, there' won't be weird issues with negative beat
        // diffs.
        //BUT use quantized time to calc nextBeat, otherwise if we're right before the next
        // beat, it will be chosen as the next beat which isn't what we want, so quantized
        // beat+1 is what we want.
        //
        var MXstartBeat = MX.times.perfBeatRaw; //Raw or quantized? See comments above
        var nextBeat = Math.floor( MX.times.perfBeatQ + 1.0 );
        var beatDiff = nextBeat - MXstartBeat;

        //Each direction can have a separate end time
        //Lateral is main displacement - always end on the next beat for now
        //0 signifies do nothing
        var perfBeatEnd = [ nextBeat, nextBeat, nextBeat ];
        VX.setPerfBeatStart( MXstartBeat ); 
        VX.setPerfBeatEnd( perfBeatEnd );

        //scaleNorm = "scale normal", i.e. how much scaling/offset to do under
        // normal conditions, i.e. no special musical expression happening. Not
        // sure about this.
        var beatDiv = MX.firstME.times.beatDiv; //beat div of [0,11]
        //scaleNorm is an array3
        var scaleNorm = this.getDisplacement( MX, beatDiv );
        //console.log('TXgravity beatDiv, scaleNorm, gravity ', beatDiv, " ", scaleNorm, " ", MX.gravity );

        scaleNorm[0] *= this.getSwingX(MX, musicalTiming );

        scaleNorm[2] *= -1; //Seems we should be able to pass +z for "forwards" here, rather
                             // than having to reverse its direction
                            //*NOTE* having be positive, or opposite direction of 'forward'
                            // makes for some cool loops!
        VX.setScaleNorm( scaleNorm ); 

        //Mark MX as done since this is instantaneous and the VX will continue on its own
        MX.isDone = true;

    }// TXgravity.updateForFrame

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
        //after TXinit:
        this.setupGUI();
    }

    //Create a separate guif from the one made by sequencer.
    //For now at least, let's us control it better since can't figure out
    //how to remove items from a gui, only know how to destroy() whole thing.
    setupGUI(){
        if( typeof(this.gui)  != 'undefined' )
            this.gui.destroy();
        this.gui = new dat.GUI( guiPresets_TX ); //load JSON-based presets 

        //Trying to change gui placement - no luck so far. See changes in index.html            
        // this.gui = new DAT.GUI( {autoPlace: false });
        //this.gui.domElement.id = 'guiTX'
        // var customContainer = $('.moveGUI').append($(gui.domElement));
        // var customContainer = document.getElementById('canvas');
        // customContainer.appendChild(gui.domElement);
        
        var f = this.gui.addFolder('TX');
        TXmasterList['gravity'].setupGUI( f, this.gui /*top-level gui for remember()*/ );

        //Get the current preset to load
        this.gui.revert();
    }

    guiOpenClose(){
        //See sequencer.guiOpenClose()
        if(this.gui.closed){
            this.gui.open()
        }
        else{
            this.gui.close();
        }
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
