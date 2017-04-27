"use strict";
//Power curve
//http://www.iquilezles.org/www/articles/functions/functions.htm

//const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much

//Holds three power curves and gives nice interface to evaluate
// all at same time and return result in array dim 3
export class PowerCurve3{
    //Can only pass a1 & b1 and they'll be used for all
    constructor( a1, b1, a2, b2, a3, b3 ){
        //If a1 is a string, assumes its "[a1,b1,a2,...]" for stupid gui hack
        //console.log('PCurve ctor: a1 ',a1, 'typeof ', typeof(a1));
        if( typeof(a1) == 'string' ){
            var a = JSON.parse(a1);
            a1=a[0];
            b1=a[1];
            a2=a[2];
            b2=a[3];
            a3=a[4];
            b3=a[5]; 
        }else{
            //If only pass a1 and b1, then copy
            if( typeof(a2) == 'undefined' ){
                a2 = a3 = a1;
                b2 = b3 = b1;
            }
        }
        this.curves = [];
        this.curves[0] = new PowerCurve( a1, b1 );
        this.curves[1] = new PowerCurve( a2, b2 );
        this.curves[2] = new PowerCurve( a3, b3 );
    }

    setVals( curveNum, a, b ){
        this.curves[curveNum].setVals( a, b);
    }

    //Return 3d array of each curve evaluated at x,
    // where x can be scalar or Array(3) with diff
    // vals for each curve
    evaluate( x /* [0,1] */){
        if( ! (x instanceof Array) )
            x = [x,x,x];
        var arr3 = [];
        for( var ind in this.curves )
            arr3[ind] = this.curves[ind].evaluate( x[ind] );
        return arr3;
    }

    dump(steps){
        for( var ind in this.curves ){
            console.log('--- curve ' + ind +' ---');
            this.curves[ind].dump(steps);
        }
    }   
}

//User can directly change a & b, and k will be recomputed on next call
// to eval()
export class PowerCurve{
    constructor( a, b ){
        this.k = 0;
        this.setVals( a, b );
    }

    //Pass new values for a & b and update K
    setVals( a, b ){
        this.a = this.a_prev = a;
        this.b = this.b_prev = b;
        this.computeK();
    }

    computeK(){
        var a = this.a;
        var b = this.b;
        this.k = Math.pow( a+b, a+b ) / ( Math.pow( a,a ) * Math.pow( b,b ) );
    }

    //Evaluate the curve at x, where x is in {0,1}
    //Silently clamped to [0,1]
    evaluate( x /* [0, 1] */){
        if( this.a != this.a_prev || this.b != this.b_prev ){
            //User has directly updated a or b
            this.a_prev = this.a;
            this.b_prev = this.b;
            this.computeK();
        }
        //Clamp
        x = Math.min( Math.max( 0, x ), 1.0 );
        return this.k * Math.pow( x, this.a ) * Math.pow( 1.0 - x, this.b );
    }

    //Simple dump to console of values
    dump(steps){
        console.log("a, b, k: ",this.a, this.b, this.k);
        for( var i=0; i <= steps; i++){
            var x = i / steps;
            console.log(x.toFixed(3), " : ", this.evaluate( x ).toFixed(3) );
        }
    }

}