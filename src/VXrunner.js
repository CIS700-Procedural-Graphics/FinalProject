//VXrunner
"use strict";

const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about 
import DAT from 'dat-gui'
import {VisualExpressionSuper} from "./visualExpressionSuper.js"
import {g_VXmanager} from "./VXmanager.js"

/////////////////////////////////
//VXrunner
//
//Dude that follows a main path (or whatever other input gives him a position, I suppose)
//
export class VXrunner extends VisualExpressionSuper{
    constructor( instanceName ){
        super( 'runner', instanceName );

        this.ts = {

        }

        //Render object - for now just one type
        //Can't create within define of ts above cuz can't reference params until object is created
        this.ts.material = new THREE.MeshPhongMaterial( {color: 0xeeff22} ); //not working to set color here
        
        //Weird bug with this geometry and VXelasticTail. See notes in main project doc.
        this.ts.geom = new THREE.SphereGeometry( 1.1, 24, 24);
        this.ts.object3D = new THREE.Mesh( this.ts.geom, this.ts.material );

    }//ctor

    updateByType( musicalTiming ){
        for( var VX of this.VXinputs ){
            //Eventually we want to query by type of data/info that VX can supply
            if( VX.type == 'path' ){ 
                //VX will have already been updated by call in base class
                var pos = VX.getCurrentPoint();
                this.ts.object3D.position.fromArray( pos );
            }
        }
    }

    //Each VX must override this if ti has a THREE.js Object3D to render
    addSceneObjects( scene ){
        scene.add( this.ts.object3D );
    }

    cleanFromScene( scene ){
        scene.remove( this.ts.object3D );
        // clean up memory
        this.ts.geom.dispose();
        this.ts.material.dispose();
        // texture.dispose();
    }
}//VXdude