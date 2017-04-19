//Power curve
//http://www.iquilezles.org/www/articles/functions/functions.htm

//User can directly change a & b, and k will be recomputed on next call
// to eval()
export default class PowerCurve{
    constructor( a, b ){
        this.a = a;
        this.a_prev = a; //current used value of a
        this.b = b;
        this.b_prev = b;
        this.k = 0;
        this.computeK(this.a, this.b);
    }

    computeK(a,b){
        this.k = Math.pow( a+b, a+b ) / ( Math.pow( a,a ) * Math.pow( b,b ) );
    }

    //Evaluate the curve at x, where x is in {0,1}
    //No bounds checking
    evaluate( x /* {0, 1} */){
        if( this.a != this.a_prev || this.b != this.b_prev ){
            //User has directly updated a or b
            this.a_prev = this.a;
            this.b_prev = this.b;
            this.computeK(this.a, this.b);
        }
        return this.k * Math.pow( x, this.a ) * Math.pow( 1.0 - x, this.b );
    }

    //Simple dump to console of values
    dump(steps){
        console.log("a, b, k: ",this.a, this.b, this.k);
        for( var i=0; i <= steps; i++){
            var x = i / steps;
            console.log(x, ": ", this.evaluate( x ) );
        }
    }

}