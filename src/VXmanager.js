"use strict";

//
//VXmanager
//

const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
//import DAT from 'dat-gui'
//Newer version of dat-gui fixes presets bug
import dat from './dat.gui.js' //copied to src dir for submission

//Global export of the single instnace of VXmanager,
// for other VX's and other code to use. Hacky.
export var g_VXmanager = {}; //gets set when VXmanager is instantiated

//Import particular VX's from other files
import {VXrunner} from './VXrunner.js'
import {VXpath, VXpathDisplacement} from './VXpathAndPathDisplacement.js'
import {VXstarField} from './VXstarField.js'
import {VXelasticTail} from './VXelasticTail.js'
import {guiPresets_VXmanager} from './guiPresets.js'

//////////////////////////////////
//
//Class to manage VX's.
//
//Will be just a single instance of this
//
export class VXmanager{
    constructor( scene, camera, orbitControls ){
        //List of VXs that are currently active, being rendered
        this.VXactiveList = [];
        //List of all VX's ever created, in case we need them.
        this.VXallList = [];

        //For adding a uniq id to each VX that's created
        this.currentUniqID = 0;

        //The THREE.js scene to add object to
        this.scene = scene;

        //Camera
        this.camera = camera;
        this.orbitControls = orbitControls

        //Set global ref for other classes to import and use
        g_VXmanager = this;

    }

    //Call to finish initial setup after object is fully created
    // and other basic stuff has been set up by sequencer
    initializeVXs(){
        //Some hard-coded VX objects for now. Have to sort this all out
        
        //elastic tail
        //INSTANTIATE THIS FIRST cuz of weird copy-object bug. See notes elsewhere.
        this.VXelasticTail = this.createNewVXs( 'elasticTail', 'tail')[0];
        this.addNewVXs( [this.VXelasticTail], null );

        //Runner
        this.VXrunner = this.createNewVXs( 'runner', 'runner')[0];
        this.addNewVXs( [this.VXrunner], null );

        //WORKAROUND for weird bug with VXelastic and copying the VXrunner object. See notes
        // in main project doc
        this.VXelasticTail.ts.tail.reload();

        //The main path
        this.VXmainPath = this.createNewVXs( 'path', 'main_path' )[0];
        this.addNewVXs( [this.VXmainPath], [this.VXrunner,  this.VXelasticTail] /*parent/receiver of input from this VX*/ );
                //Init vals here since it won't get genereated by an MX
        this.VXmainPath.setScaleNorm( [40,40,1] );
        this.VXmainPath.setVisible( false );

        //Star Field
        this.VXstarField = this.createNewVXs( 'starField', 'starField')[0];
        this.addNewVXs( [this.VXstarField], null );

    }

    //We're counting on this getting called at begin of app launch when
    // sequencer is getting setup.
    reset(){
        
        // remove any mesh's from scene, and
        // clear related object memory
        this.cleanScene();

        this.VXactiveList = [];
        this.VXallList = [];
        this.currentUniqID = 0;
        
        //hack this in
        if( typeof(this.VXelasticTail) != 'undefined' )
            this.VXelasticTail.particleGUI.destroy();

        this.initializeVXs();
        this.cameraSetDefaults();
        this.cameraUpdate();
        this.setupGUI();
        this.initLights();
    }

    initLights(){
        //DirectionLight has a position and a target. Target default is 0,0,0, but
        // otherwise acts as infinitely far light source yielding parallel light rays.
        this.lightDirectional = new THREE.DirectionalLight( 0xffffff, 0.85 );
        this.lightDirectional.position.set( -1,1,-0.2);
        this.lightAmbient = new THREE.AmbientLight( 0xffffff, 0.15 );
        this.scene.add( this.lightDirectional );
        this.scene.add( this.lightAmbient );
    }

    //Create a separate guif from the one made by sequencer.
    //For now at least, let's us control it better since can't figure out
    //how to remove items from a gui, only know how to destroy() whole thing.
    setupGUI(){
        if( typeof(this.gui)  != 'undefined' )
            this.gui.destroy();

        this.gui = new dat.GUI( guiPresets_VXmanager );
        //'remember' can only be called on top level gui
        //this.gui.remember( this );
        this.guifolder = this.gui.addFolder('VX Manager');
        this.guifolder.open();
        var f = this.guifolder.addFolder('camera');
        f.add(this.cameraState, 'posFollow',0,1).name('Cam pos follow');
        f.add(this.cameraState, 'lookAtFollow',0,1).name('Cam lookAt follow');


        //Get active VX's to set up their gui's
        for( var VX of this.VXactiveList ){
            VX.setupGUI( this.guifolder, this.gui/*main gui for 'remember' as needed*/ );
            //actually seems like calling remember about on whole vxmanager does the trick?
            //this.gui.remember( VX );
        }

        //Call this to get the auto-loaded preset to actually take effect
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
        //hacked in here for now for Particles' gui
        this.VXelasticTail.guiOpenClose();
    }

    //default camera settings
    cameraSetDefaults(){
        this.cameraState = {
            pos: new THREE.Vector3(-5, 20, 55),
            lookAt: new THREE.Vector3(0,0,0),
            fov: 40,
            //How much we have the camera follow the motion of the main focus point.
            //0 for none, 1 for full
            posFollow: 0.002,
            lookAtFollow: 0.002,
        }
    }

    //update camera based on current state
    cameraUpdate(){
        this.camera.position.copy(this.cameraState.pos);
        this.camera.lookAt( this.cameraState.lookAt );
        this.camera.fov = this.cameraState.fov;
        this.camera.updateProjectionMatrix();
        this.orbitControls.target = this.cameraState.lookAt;
    }

    //Returns point at which camera is focused.
    //e.g. for star field. will also want to know which way it's looking too, probably
    //Returns Vector3
    getCameraFocus(){
        return this.cameraState.lookAt;
    }

    //Update camera's position based on some target VX
    //Called every frame
    cameraUpdateForTarget( VX ){
        var camSt = this.cameraState;
        var prevLookAt = camSt.lookAt;
        //Returns an arr3 at which to focus the camera
        var focusArr3 = VX.getFocusPoint();
        //Change look at position to follow the focus point,
        // but with some lag. Simple proportional controller.
        var diff = new THREE.Vector3().fromArray( focusArr3 );
        diff.subVectors( diff, prevLookAt );
        var newLookAt = new THREE.Vector3().copy( prevLookAt );
        newLookAt.setX( newLookAt.x + diff.x * camSt.lookAtFollow );
        newLookAt.setY( newLookAt.y + diff.y * camSt.lookAtFollow );
        newLookAt.setZ( newLookAt.z + diff.z );
        camSt.lookAt = newLookAt;

        //Move the camera along same vector that focus moved?
        //camSt.pos.add( diff );

        //Move camera position mainly along -z to keep up with motion along -z,
        // and along x/y to track (parallel way) the motion of focus point,
        // but with some lag (simple proportional controller).
        diff.setX( diff.x * camSt.posFollow );
        diff.setY( diff.y * camSt.posFollow );

        //Add the diff to camera's current state so we can still change view with the
        // orbit controls (i.e. rather than just replacing this.camera.position)
        camSt.pos.copy( this.camera.position );
        camSt.pos.add( diff );

        this.cameraUpdate();
    }

    updateForFrame( musicalTiming ){
        var VXactiveNEW = [];
        for( var VX of this.VXactiveList ){

            //Calls the VX to update itself. VX will
            // call its inputs to update themselves.
            VX.updateForFrame( musicalTiming );
 
            //If VX is done then remove it from active list
            //Flag should be set in VX.updateForFrame (and elsewhere possibly?)
            //Seems simplest to actually just make a new array of the ones to keep
            if( VX.isDone ){
                VX.cleanFromScene();
            }else            
                VXactiveNEW.push( VX );
        }
        this.VXactiveList = VXactiveNEW;

        //Now go through each again and have them
        // scan their inputs for done VXs and remove
        //But only after everything's updated
        for( var VX of this.VXactiveList ){
            VX.removeDoneInputs();
        }

        //Have the camera follow the front of path.
        //Hard-code what to folow for now
        this.cameraUpdateForTarget( this.getMainPathVX() );
    }

    cleanScene(){
        for( var VX of this.VXactiveList ){
            VX.cleanFromScene( this.scene );
        }
        this.scene.remove( this.lightDirectional );
        this.scene.remove( this.lightAmbient );

    }

    dumpState(){
        var L = console.log;
        L('--- VXmanager: dumpState ---');
        L('VXactiveList:');
        for( var VX of this.VXactiveList ){
            L(VX);
        }
    }

    //Hack for now to get the main path VX
    getMainPathVX(){
        return this.VXmainPath;
    }

    getNextUniqID(){
        var id = this.currentUniqID;
        this.currentUniqID++;
        return id;
    }

    //Directly add a scene object (THREE.js Object3D to be rendered)
    //For now at least, whatever object creates a scene object is
    // responsible for calling this func to add it to the scene.
    addSceneObject( obj ){
        this.scene.add( obj );
    }

    //Tell each VX (single or array) to add its scene object(s)
    // Not sure where this really belongs.
    addSceneObjectFromVX( VXlist ){
        var list = VXlist;
        if( ! (VXlist instanceof Array ) ){
            list = [VXlist];
        }
        for( var VX of list ){
            VX.addSceneObjects( this.scene );
        }
    }

    //Create and return one or more VXs based on type name
    //typeList - name of or array of the type of each VX to create
    //instanceName - list of name for each particular instance. pass 'auto' (no array needed) for default for each
    //Return - array of one or more VXs
    createNewVXs( typeList, instanceNamesList ){
        var returnVXlist = [];
        var VXlist = typeList;
        if( ! (typeList instanceof Array ) )
             VXlist = [typeList];
        if( typeof(instanceNamesList) == 'string' )
            instanceNamesList = [ instanceNamesList ]; //make it an array
        for( var ind in VXlist ){
            //Set the instance name
            var uniqID = this.getNextUniqID();
            var type = VXlist[ind];
            var instanceName = instanceNamesList[ Math.min( ind, instanceNamesList.length-1 ) ];

            if( instanceName == 'auto' ){
                instanceName = type + '_' + uniqID;
            } else {
                instanceName = instanceNamesList[ind]+'_'+uniqID;
            }

            var VX = {};
            switch( type ){
                case 'pathDisplacement':
                    VX = new VXpathDisplacement( instanceName ); break;
                case 'path':
                    VX = new VXpath( instanceName ); break;
                case 'runner':
                    VX = new VXrunner( instanceName ); break;
                case 'starField':
                    VX = new VXstarField( instanceName ); break;
                case 'elasticTail':
                    VX = new VXelasticTail( instanceName ); break;
                default:
                    throw 'Unrecognized VX type: ' + type; break;
            }
            //Set the uniq ID. 
            VX.uniqID = uniqID;

            //add to return list
            returnVXlist.push( VX );

        }
        return returnVXlist;
    }

    //Add a new VX to main lists.
    //The VX may be have been created here or elsewhere (e.g. in ExpressionTranslator)
    //VXlist - single VX or an array of one or more VXs
    //VXreceiver - if non-null, also add the list to this VX's inputs
    addNewVXs( VXlist, VXreceiver ){
        //append new list to existing list, without copying first list
        //http://stackoverflow.com/questions/1374126/how-to-extend-an-existing-javascript-array-with-another-array-without-creating
        Array.prototype.push.apply( this.VXactiveList, VXlist );
        Array.prototype.push.apply( this.VXallList, VXlist );
        if( VXreceiver !== null ){
            if( typeof(VXreceiver) == 'undefined' ){
                throw "addNewVXs: VXreceiver undefined"
            }
            var list = VXreceiver;
            if( ! (list instanceof Array ) )
                list = [VXreceiver];
            for( var VX of list )
                VX.appendToVXinputs( VXlist );
        }
        this.addSceneObjectFromVX( VXlist );
    }
}