"use strict";
//
// PathContainer
//
// Contains a path object, simple for now, used by VXpath objects and maybe elsewhere eventually
//
//Path class that holds path control points, time values,
// THREE objects for rendering. Methods for accessing data ,etc.
//Seprate class to keep clean from VXpathDisplacement, and cuz
// we may need it separately at some point for some other things.

const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
//Need g_VXmanager to add object3D to scene
import {g_VXmanager} from "./visualExpression.js"


export class PathContainer{
    //Requires initial values for msec, beat and point so getCurrentPointInfo can be
    // called before any control points have been added by the app
    constructor( initBufferLength, iniperfMsec, iniperfBeatRaw, initPointArr3 ){
        this.initBufferLength = initBufferLength;
        this.cptsFlt32Arr = new Float32Array( initBufferLength );
        this.cptsFlt32Arr.set( initPointArr3, 0 );

        //Array of msec time values corresponding to cptsArr, from start of performance
        this.perfMsec = []; 
        this.perfMsec[0] = iniperfMsec;

        //Array of non-quantized beat time values corresponding to cptsArr, from start of performance
        this.perfBeatRaw = [];
        this.perfBeatRaw[0] = iniperfBeatRaw;

        //Number of points that have been stored, different from cpts bufferlength
        this.length = 0; // ??? not using ?

        //Current index of the curve for which a control point has been set
        this.curInd = 0;

        //Starting index of draw range for Line Object3D
        //Note that this index value is in terms of 3d points, not buffer values
        this.drawRangeStart = 0;
        
        //Set this to draw most recent N indecies of the path
        //0 to just draw from drawRangeStart
        this.drawRangeLengthInd = 0;

        //Geometry and Objet3D
        this.lineMaterial = new THREE.LineBasicMaterial({ color: 0x997700 });  
            //can also set width, if it takes light (false by default), and otherwise inherited from Material class
        this.lineBufferGeometry = new THREE.BufferGeometry();
        this.updateGeometryBuffer();
        this.setDrawRangeStart( 0 );

        //Make the object3D and add to scene
        this.lineObject3D = new THREE.Line(this.lineBufferGeometry, this.lineMaterial );
        g_VXmanager.addSceneObject( this.lineObject3D );
    }

    //Return info on current/most-recent control point
    //See getPointInfo
    getCurrentPointInfo(){
        return this.getPointInfo( this.curInd );
    }

    //Separate func for this so when we resize the buffer and
    // get a new buffer ref, we can easily assign it to the geometry and keep on truckin'
    updateGeometryBuffer(){
        var attr = this.lineBufferGeometry.getAttribute('position');
        if( typeof(attr) != 'undefined' )
            this.lineBufferGeometry.removeAttribute('position');
        this.lineBufferGeometry.addAttribute( 'position', new THREE.BufferAttribute( this.cptsFlt32Arr, 3) );
    }

    //Return control point info object for given index.
    //point - a Float32Array of length 3. This is a shallow copy, so since this is non-object values
    // it's actually a copy of the data from the buffer, so can modify if want to for some reason.
    getPointInfo( ind ){
        var bufferOffset = ind * 3;
        return {
            perfMsec: this.perfMsec[ind],
            perfBeatRaw: this.perfBeatRaw[ind],
            cpt: this.cptsFlt32Arr.slice( bufferOffset, bufferOffset + 3 /*non-inclusive*/), 
        }
    }

    addControlPoint( perfMsec, perfBeatRaw, posArr3 ){
        //console.log('PathContainer: addControlPoint');
        //First check if the new time is same as current time. If so,
        // overwrite
        // But we expect an overwrite of initial values, so skip if first index
        if( perfMsec <= this.perfMsec[this.curInd] && this.curInd != 0 ){ 
            if( perfMsec == this.perfMsec[this.curInd] ){
                //Just overwrite and issue a warning
                console.log('WARNING addControlPoint: new perfMsec ' + perfMsec +' == that at current index: ' + this.perfMsec + '. Overwriting');
            }else
                throw "addControlPoint: new perfMsec " + perfMsec +' < that at current index: ' + this.perfMsec[this.curInd];
        }
        else 
            this.curInd++;

        //Check if we need to extend the buffer
        if( this.curInd >= Math.floor( this.cptsFlt32Arr.length / 3 ) ){
            this.resizeBuffer( this.initBufferLength );
            console.log('PathContainer: resizing buffer');
        }

        //Now finally add the new control point
        var ind = this.curInd;
        this.perfMsec[ind] = perfMsec;
        this.perfBeatRaw[ind] = perfBeatRaw;
        this.cptsFlt32Arr.set( posArr3, ind * 3 );

        //test
        //this.setDrawRangeStart( Math.max( 0, ind - 6 ));

        this.updateDrawRange();
    }

    //Resize the cpts buffer
    //Since it's typeArray, no easy way to do it, but
    // it's efficient
    resizeBuffer( addedLength ){
        //based on http://stackoverflow.com/questions/4554252/typed-arrays-in-gecko-2-float32array-concatenation-and-expansion
        var result = new Float32Array( this.cptsFlt32Arr.length + addedLength ); //init's to all 0's
        //copy the existing control points into it
        result.set(this.cptsFlt32Arr);
        this.cptsFlt32Arr = result;
        //Call this so new cptsFlt32Arr gets set to the buffer attribute
        this.updateGeometryBuffer();
    }

    //Set the starting point for what part of the path to render
    //Note that this index value is in terms of 3d points, not buffer values
   setDrawRangeStart( startInd ){
        this.drawRangeStart = startInd;
        this.updateDrawRange();
    }

    //Update draw range based on stored start index and current index
    updateDrawRange(){
        //How many verts to draw. It's ok if this goes past end of buffer, will just render all.
        var start = 0;
        if( this.drawRangeLengthInd > 0 )
            start = Math.max( 0, this.curInd - this.drawRangeLengthInd )
        else
            start = this.drawRangeStart;
        var count = this.curInd - start + 1;
        this.lineBufferGeometry.setDrawRange( start, count );
        this.lineBufferGeometry.attributes.position.needsUpdate = true; // required after the first render
    }

    //Add the Object3D to scene for rendering
    addSceneObjects( scene ){
        scene.add( this.lineObject3D );
    }

    //Clean objects from scene. See top-level version for notes.
    cleanFromScene(scene){
        scene.remove( this.lineObject3D );
        // clean up memory
        this.lineBufferGeometry.dispose();
        this.lineMaterial.dispose();
        // texture.dispose();
    }
}
