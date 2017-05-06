//VXstarField
"use strict";

const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about 
import DAT from 'dat-gui'
import {VisualExpressionSuper} from "./visualExpressionSuper.js"
import {g_VXmanager} from "./VXmanager.js"

//Thanks to http://codepen.io/GraemeFulton/pen/BNyQMM
//
//NOTE - with the current model of the camera following the path/runner down the -z axis,
// all positions are absolute. So the star field won't actually move, we'll move through it.
// As we move though, we have to change stars' z position as the go past us to keep 
// refreshing things.
export class VXstarField extends VisualExpressionSuper{
    constructor( instanceName ){
        super( 'starField', instanceName );

        this.ts = {
            numStars: 180,
            //Width and height of start placement
            fieldX: 250,
            fieldY: 250,
            fieldZ: 350, //from 0,0,fieldZ to 0,0,-fieldZ. 
            speed: 30,   //spacial units per beat
            starSpheres: [],
            materials: [],
            geometries: [],
            visible: true,
        }

        this.init();
    }

    init(){
        for( var ind=0; ind < this.ts.numStars; ind++ ){
            var geometry   = new THREE.SphereGeometry(0.1, 8, 8);   //, 16, 16)
            var material = new THREE.MeshBasicMaterial( {color: 0xddddff} );
            var sphere = new THREE.Mesh(geometry, material)
            
            this.ts.starSpheres.push( sphere );
            this.ts.materials.push(material);
            this.ts.geometries.push(geometry);
        }
        this.setAllRandom();
    }

    resetPositions(){
        this.setAllRandom();
    }

    setAllRandom(){
        for( var ind=0; ind < this.ts.numStars; ind++ ){
            this.ts.starSpheres[ind].position.fromArray( this.getRandomPos() );
        }
    }

    getRandomPos(){
        var x = (Math.random() - 0.5 ) * this.ts.fieldX;
        //Move position away from center line to avoid starts coming straight down the middle
        x += Math.sign(x) * 2;
        var y = (Math.random() - 0.5 ) * this.ts.fieldY;
        y += Math.sign(y) * 2;
        var z = -1 * Math.random() * this.ts.fieldZ;
        return [x,y,z];                 
    }

    updateByType( musicalTiming ){
        //The stars stay in place. The path moves through space and we move the
        // camera. So check if star is likely out of view and if so restart it.
        var focusPoint = g_VXmanager.getCameraFocus();
        for( var ind=0; ind < this.ts.numStars; ind++ ){
            var pos = this.ts.starSpheres[ind].position;
            pos.setZ( pos.z + this.ts.speed * ( musicalTiming.perfBeatRaw - this.lastUpdateBeat) );
            var zOver = 100;
            if( pos.z > (focusPoint.z + zOver) ){ //why do the stars seemingly never disappear if I set this to this.fieldZ/2 ??
                //reposition the star
                var newPos = this.getRandomPos();
                newPos[2] = focusPoint.z - this.ts.fieldZ + zOver; //move all the way to the back
                pos.fromArray( newPos );
            }
            //quick hack
            this.ts.starSpheres[ind].visible = this.ts.visible;
        }        
    }

    setupGUI( gui ){
        //length of main trail
        //I don't like coding deep into this like this, but hack it for now.
        var f = gui.addFolder(this.instanceName);
        f.add( this.ts, 'speed',0,100 );
        f.add( this, 'setAllRandom').name('Reset Stars');
        f.add( this.ts, 'visible');
    }

    addSceneObjects( scene ){
        for( var ind=0; ind < this.ts.numStars; ind++ ){
            scene.add( this.ts.starSpheres[ind] );
        }
    }

    cleanFromScene( scene ){
        for( var ind=0; ind < this.ts.numStars; ind++ ){
            scene.remove( this.ts.starSpheres[ind] );
            // clean up memory
            this.ts.geometries[ind].dispose();
            this.ts.materials[ind].dispose();
            // texture.dispose();
        }
    }

}//VXstarField