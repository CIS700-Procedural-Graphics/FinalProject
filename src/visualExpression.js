//Visual Expressions


//test multiple exports
export var VXlist = ['hi','ho'];

export class VisualExpression{
    constructor( VXtype ){
        //this.name ?? need an instance name ?? I'm so confused

        this.type = VXtype; //path, displacement, color, fog, sparks, 
        
        //TODO
        // Validate the 'type' passed in
        
        this.perfBeatStart = 0; //Starting beat relative to performance start
        this.perfBeatEnd = 0; //Ending beat. May or may not be inclusive, depending on expression

        //Last time this VX was updated. Used to know if it's been updated
        // yet for the current frame
        this.lastUpdateAbsBeat = 0;

        this.VXinputs = []; //VX(s) that this VX gets data/state from. So e.g. for sparks,
                      // the input could be a 'path' type, and the sparks direction would
                      // be taken from current path direction, and spark generation might
                      // be tied to parent's current acceleration.
                      // For a 'path' type, an input could be a 'path displacement' type that
                      //  changes the path.
                      //
                      //THESE MUST GET UPDATED FIRST at each frame. So before updating
                      //  this VX, iterate over inputs[] and update each one
                      //
                      //DANGER of getting into dependency loops. Have to put in a safeguard
                      // as things get more complex.

    }

    //Update the VX for the given performance time
    //??? Use Raw or Quantized time here?
    update( perfBeatRaw ){

    }

}