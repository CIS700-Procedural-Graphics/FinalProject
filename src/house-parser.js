const THREE = require('three')
import House, {linkedListToString} from './house-lsystem.js'

var ParserState = function(pos, dir, r) {
    return {
        pos: new THREE.Vector3(pos.x, pos.y, pos.z),
        dir: new THREE.Vector3(dir.x, dir.y, dir.z),
        radius: r
    }
}
  
export default class Parser {
    
    constructor(position, direction, scene, radius) {
        this.initPos = position;
        this.initDir = direction;

        this.state = new ParserState(this.initPos, this.initDir, radius);
        this.stack = [];

        this.scene = scene;

        this.house = new House();

        this.objs = [];

        this.idxCtr = 0;

        this.renderGrammar = {
            'L' : this.addLevel.bind(this),
            '[' : this.saveState.bind(this),
            ']' : this.applyState.bind(this),
            '0' : this.shiftState.bind(this, 0),
            '1' : this.shiftState.bind(this, 1),
            '2' : this.shiftState.bind(this, 2),
            '3' : this.shiftState.bind(this, 3),
            '4' : this.shiftState.bind(this, 4),
            '5' : this.shiftState.bind(this, 5),
            '6' : this.shiftState.bind(this, 6),
            '7' : this.shiftState.bind(this, 7),
            'r' : this.decreaseRadius.bind(this)
        };

        this.stdDir = [            
        new THREE.Vector3(-1, 0, 1).normalize(),
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(1, 0, 1).normalize(),
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(1, 0, -1).normalize(),
        new THREE.Vector3(0, 0, -1),
        new THREE.Vector3(-1, 0, -1).normalize(),
        new THREE.Vector3(-1, 0, 0)          
        ];

        this.renderSymbols(this.house.doIterations(5));
    }

    saveState() {
        var newState = new ParserState(this.state.pos, this.state.dir, this.state.radius);
        this.stack.push(newState);
    }

    applyState() {
        this.state = this.stack.pop();
    }

    shiftState(posNum) {
        
        var currR = this.state.radius;

        var pos = this.state.pos;
        var newP = new THREE.Vector3(pos.x, pos.y, pos.z).addScaledVector(this.stdDir[posNum], 3 * currR / 4);
        
        this.state.radius = currR / 4;
        this.state.pos = newP;
    }

    decreaseRadius() {
        this.state.radius *= 0.7;
    }

    addLevel() {
        if (Math.random() > 0.5) {
            this.addCylinder();

        } else {
            this.addBox();
        }
    }

    addCylinder() {
        var currR = this.state.radius;
        var outerR = currR - (Math.random() * currR / 2);
        var innerR = outerR - (Math.random() * outerR / 2);
        this.state.radius = innerR;

        var height = (currR * 0.1) + Math.random() * Math.pow(this.currIdx, 0.25);

        var color = new THREE.Color(Math.random(), Math.random(), Math.random());

        var geom = new THREE.CylinderGeometry(innerR, outerR, height, 16);
        var material = new THREE.MeshLambertMaterial({color: color});
        var cyl = new THREE.Mesh(geom, material);

        var pos = this.state.pos;
        var dir = this.state.dir;
        
        pos.addScaledVector(dir, height / 2);
        cyl.position.set(pos.x, pos.y, pos.z);

        cyl.lookAt(pos.addScaledVector(dir, height / 2));
        cyl.rotateX(Math.PI / 2);

        this.objs.push({index: this.currIdx, object: cyl});

        //this.scene.add(cyl);
    }

    addBox() {
        var currR = this.state.radius;
        var width = currR - (Math.random() * currR / 2);        
        var depth = currR - (Math.random() * currR / 2);
        this.state.radius = Math.min(width, depth) / 2;

        var height = (currR * 0.1) + Math.random() * Math.pow(this.currIdx, 0.25);

        var color = new THREE.Color(Math.random(), Math.random(), Math.random());

        var geom = new THREE.BoxGeometry(width, height, depth);
        var material = new THREE.MeshLambertMaterial({color: color});
        var box = new THREE.Mesh(geom, material);

        var pos = this.state.pos;
        var dir = this.state.dir;
        
        pos.addScaledVector(dir, height / 2);
        box.position.set(pos.x, pos.y, pos.z);

        box.lookAt(pos.addScaledVector(dir, height / 2));
        box.rotateX(Math.PI / 2);

        this.objs.push({index: this.currIdx, object: box});

        //this.scene.add(box);
    }

    renderSymbol(symbolNode) {
        var func = this.renderGrammar[symbolNode.symbol];
        if (func) {
            func();
        }
    };

    renderSymbols(linkedList) {
        if (!linkedList) {
            console.log("Cant find house");
            return;
        }
        this.currIdx = 0;
        for(var currentNode = linkedList.head; currentNode != null; currentNode = currentNode.next) 
        {
            this.renderSymbol(currentNode);
            this.currIdx = currentNode.iter;
        }
    }

    render(iterations) {

        if (iterations > this.idxCtr)
        {
            for (var i = this.idxCtr; i < iterations; i++)
            {
                for (var j = 0; j < this.objs.length; j++)
                {
                    if (this.objs[j].index == i)
                    {
                        this.scene.add(this.objs[j].object);
                    }
                }
            }
        }

        else if (iterations < this.idxCtr)
        {
            for (var i = this.idxCtr; i >= iterations; i--)
            {
                for (var j = 0; j < this.objs.length; j++)
                {
                    if (this.objs[j].index == i)
                    {
                        this.scene.remove(this.objs[j].object);
                    }
                }
            }
        }
        this.idxCtr = iterations;
    }
}