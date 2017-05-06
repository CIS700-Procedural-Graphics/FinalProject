const THREE = require('three')
function Rule(prob, str) {
    this.probability = prob;
    this.successorString = str;
}

function Node(symbol, iter) {
    this.next = null;
    this.prev = null;
    this.symbol = symbol;
    this.iter = iter;
}

function LinkedList(pos) {
    this.head = null;
    this.length = 0;
    this.scale = new THREE.Vector3(1.0, 1.0, 1.0);
    this.position = new THREE.Vector3(0, 0, 0);
    if (pos)
    {
        this.position = pos;
    }
}

LinkedList.prototype.getTailNode = function() {
    var currentNode = this.head;
    while (currentNode.next != null) {
        currentNode = currentNode.next;
    }
    return currentNode;
}

LinkedList.prototype.add = function(symbol, iter) {
    var node = new Node(symbol, iter);
    var currentNode = this.head;
    if (currentNode == null) {
        this.head = node;
        this.length = 1;
        return;
    }
    var tail = this.getTailNode();
    this.link(tail, node);
    this.length++;
}

LinkedList.prototype.link = function(first, second) {
    if (first != null)
    {
        first.next = second;
        if (second != null)
        {
            second.prev = first;
        }
    }
}

export function stringToLinkedList(input_string, iter) {
    var ll = new LinkedList();
    for (var i = 0; i < input_string.length; i++) {
        ll.add(input_string[i], iter);
    }
    return ll;
}

export function linkedListToString(linkedList) {
    var result = "";
    var currentNode = linkedList.head;
    while (currentNode != null) {
        result += currentNode.symbol;
        currentNode = currentNode.next;
    }
    return result;
}

function replaceNode(linkedList, node, replacementString, iter) {
    
    var nodeBefore = node.prev;
    var nodeAfter = node.next;

    var stringList = stringToLinkedList(replacementString, iter);
    var tail = stringList.getTailNode();

    if (nodeBefore == null && nodeAfter == null) {
        linkedList.head = stringList.head;
    }
    else if (nodeBefore == null)
    {
        linkedList.head = stringList.head;
        linkedList.link(tail, nodeAfter);
    }
    else if (nodeAfter == null) {
        linkedList.link(nodeBefore, stringList.head);
    }
    else {
        linkedList.link(nodeBefore, stringList.head);
        linkedList.link(tail, nodeAfter);
    }

    linkedList.length+= replacementString.length - 1;
    return linkedList;
}

export default function House() {
    this.axiom = "X";
    this.grammar = {};
    this.grammar['X'] = [
        new Rule(0.5, 'LX'),
        new Rule(0.25, 'LS'),
        new Rule(0.25, 'LSrX')
    ];
    this.grammar['S'] = [
        new Rule(0.35, 'D'),
        new Rule(0.25, 'T'),
        new Rule(0.25, 'Q'),
        new Rule(0.15, '[0LX][1LX][2LX][3LX][4LX][5LX][6LX][7LX]')
    ];
    this.grammar['D'] = [
        new Rule(0.04, '[0LX][1LX]'), new Rule(0.04, '[0LX][2LX]'), new Rule(0.04, '[0LX][3LX]'), new Rule(0.04, '[0LX][4LX]'), new Rule(0.04, '[0LX][5LX]'), new Rule(0.04, '[0LX][6LX]'), new Rule(0.04, '[0LX][7LX]'),
        new Rule(0.04, '[1LX][2LX]'), new Rule(0.04, '[1LX][3LX]'), new Rule(0.04, '[1LX][4LX]'), new Rule(0.04, '[1LX][5LX]'), new Rule(0.04, '[1LX][6LX]'), new Rule(0.04, '[1LX][7LX]'),
        new Rule(0.04, '[2LX][3LX]'), new Rule(0.04, '[2LX][4LX]'), new Rule(0.04, '[2LX][5LX]'), new Rule(0.04, '[2LX][6LX]'), new Rule(0.04, '[2LX][7LX]'),
        new Rule(0.04, '[3LX][4LX]'), new Rule(0.04, '[3LX][5LX]'), new Rule(0.04, '[3LX][6LX]'), new Rule(0.04, '[3LX][7LX]'),
        new Rule(0.04, '[4LX][5LX]'), new Rule(0.04, '[4LX][6LX]'), new Rule(0.04, '[4LX][7LX]'),
        new Rule(0.04, '[5LX][6LX]'), new Rule(0.04, '[5LX][7LX]'),
        new Rule(0.04, '[6LX][7LX]')
    ];
    this.grammar['T'] = [
        new Rule(0.028, '[0LX][1LX][2LX]'), new Rule(0.028, '[0LX][1LX][3LX]'), new Rule(0.028, '[0LX][1LX][4LX]'), new Rule(0.028, '[0LX][1LX][5LX]'), new Rule(0.028, '[0LX][1LX][6LX]'), new Rule(0.028, '[0LX][1LX][7LX]'), new Rule(0.028, '[0LX][2LX][3LX]'), new Rule(0.028, '[0LX][2LX][4LX]'), new Rule(0.028, '[0LX][2LX][5LX]'), new Rule(0.028, '[0LX][2LX][6LX]'), new Rule(0.028, '[0LX][2LX][7LX]'), new Rule(0.028, '[0LX][3LX][4LX]'), new Rule(0.028, '[0LX][3LX][5LX]'), new Rule(0.028, '[0LX][3LX][6LX]'), new Rule(0.028, '[0LX][3LX][7LX]'), new Rule(0.028, '[0LX][4LX][5LX]'), new Rule(0.028, '[0LX][4LX][6LX]'), new Rule(0.028, '[0LX][4LX][7LX]'), new Rule(0.028, '[0LX][5LX][6LX]'), new Rule(0.028, '[0LX][5LX][7LX]'), new Rule(0.028, '[0LX][6LX][7LX]'),
        new Rule(0.028, '[1LX][2LX][3LX]'), new Rule(0.028, '[1LX][2LX][4LX]'), new Rule(0.028, '[1LX][2LX][5LX]'), new Rule(0.028, '[1LX][2LX][6LX]'), new Rule(0.028, '[1LX][2LX][7LX]'), new Rule(0.028, '[1LX][3LX][4LX]'), new Rule(0.028, '[1LX][3LX][5LX]'), new Rule(0.028, '[1LX][3LX][6LX]'), new Rule(0.028, '[1LX][3LX][7LX]'), new Rule(0.028, '[1LX][4LX][5LX]'), new Rule(0.028, '[1LX][4LX][6LX]'), new Rule(0.028, '[1LX][4LX][7LX]'), new Rule(0.028, '[1LX][5LX][6LX]'), new Rule(0.028, '[1LX][5LX][7LX]'), new Rule(0.028, '[1LX][6LX][7LX]'),
        new Rule(0.028, '[2LX][3LX][4LX]'), new Rule(0.028, '[2LX][3LX][5LX]'), new Rule(0.028, '[2LX][3LX][6LX]'), new Rule(0.028, '[2LX][3LX][7LX]'), new Rule(0.028, '[2LX][4LX][5LX]'), new Rule(0.028, '[2LX][4LX][6LX]'), new Rule(0.028, '[2LX][4LX][7LX]'), new Rule(0.028, '[2LX][5LX][6LX]'), new Rule(0.028, '[2LX][5LX][7LX]'), new Rule(0.028, '[2LX][6LX][7LX]'),
        new Rule(0.028, '[3LX][4LX][5LX]'), new Rule(0.028, '[3LX][4LX][6LX]'), new Rule(0.028, '[3LX][4LX][7LX]'), new Rule(0.028, '[3LX][5LX][6LX]'), new Rule(0.028, '[3LX][5LX][7LX]'), new Rule(0.028, '[3LX][6LX][7LX]'),
        new Rule(0.028, '[4LX][5LX][6LX]'), new Rule(0.028, '[4LX][5LX][7LX]'), new Rule(0.028, '[4LX][6LX][7LX]'),
        new Rule(0.028, '[5LX][6LX][7LX]'),
    ];
    this.grammar['Q'] = [
        new Rule(0.028, '[0LX][1LX][2LX][3LX]'), new Rule(0.028, '[0LX][1LX][2LX][4LX]'), new Rule(0.028, '[0LX][1LX][2LX][5LX]'), new Rule(0.028, '[0LX][1LX][2LX][6LX]'), new Rule(0.028, '[0LX][1LX][2LX][7LX]'), new Rule(0.028, '[0LX][1LX][3LX][4LX]'), new Rule(0.028, '[0LX][1LX][3LX][5LX]'), new Rule(0.028, '[0LX][1LX][3LX][6LX]'), new Rule(0.028, '[0LX][1LX][3LX][7LX]'), new Rule(0.028, '[0LX][1LX][4LX][5LX]'), new Rule(0.028, '[0LX][1LX][5LX][6LX]'), new Rule(0.028, '[0LX][1LX][5LX][7LX]'), new Rule(0.028, '[0LX][1LX][6LX][7LX]'), new Rule(0.028, '[0LX][2LX][3LX][4LX]'), new Rule(0.028, '[0LX][2LX][3LX][5LX]'), new Rule(0.028, '[0LX][2LX][3LX][6LX]'), new Rule(0.028, '[0LX][2LX][3LX][7LX]'), new Rule(0.028, '[0LX][2LX][4LX][5LX]'), new Rule(0.028, '[0LX][2LX][4LX][6LX]'), new Rule(0.028, '[0LX][2LX][4LX][7LX]'), new Rule(0.028, '[0LX][2LX][5LX][6LX]'), new Rule(0.028, '[0LX][2LX][5LX][7LX]'), new Rule(0.028, '[0LX][2LX][6LX][7LX]'), new Rule(0.028, '[0LX][3LX][4LX][5LX]'), new Rule(0.028, '[0LX][3LX][4LX][6LX]'), new Rule(0.028, '[0LX][3LX][4LX][7LX]'), new Rule(0.028, '[0LX][3LX][5LX][6LX]'), new Rule(0.028, '[0LX][3LX][5LX][7LX]'), new Rule(0.028, '[0LX][3LX][6LX][7LX]'), new Rule(0.028, '[0LX][4LX][5LX][6LX]'), new Rule(0.028, '[0LX][4LX][5LX][7LX]'), new Rule(0.028, '[0LX][4LX][6LX][7LX]'), new Rule(0.028, '[0LX][5LX][6LX][7LX]'), 
        new Rule(0.028, '[1LX][2LX][3LX][4LX]'), new Rule(0.028, '[1LX][2LX][3LX][5LX]'), new Rule(0.028, '[1LX][2LX][3LX][6LX]'), new Rule(0.028, '[1LX][2LX][3LX][7LX]'), new Rule(0.028, '[1LX][2LX][4LX][5LX]'), new Rule(0.028, '[1LX][2LX][4LX][6LX]'), new Rule(0.028, '[1LX][2LX][4LX][7LX]'), new Rule(0.028, '[1LX][2LX][5LX][6LX]'), new Rule(0.028, '[1LX][2LX][5LX][7LX]'), new Rule(0.028, '[1LX][2LX][6LX][7LX]'), new Rule(0.028, '[1LX][3LX][4LX][5LX]'), new Rule(0.028, '[1LX][3LX][4LX][6LX]'), new Rule(0.028, '[1LX][3LX][4LX][7LX]'), new Rule(0.028, '[1LX][3LX][5LX][6LX]'), new Rule(0.028, '[1LX][3LX][5LX][7LX]'), new Rule(0.028, '[1LX][3LX][6LX][7LX]'), new Rule(0.028, '[1LX][4LX][5LX][6LX]'), new Rule(0.028, '[1LX][4LX][5LX][7LX]'), new Rule(0.028, '[1LX][4LX][6LX][7LX]'), new Rule(0.028, '[1LX][5LX][6LX][7LX]'), 
        new Rule(0.028, '[2LX][3LX][4LX][5LX]'), new Rule(0.028, '[2LX][3LX][4LX][6LX]'), new Rule(0.028, '[2LX][3LX][4LX][7LX]'), new Rule(0.028, '[2LX][3LX][5LX][6LX]'), new Rule(0.028, '[2LX][3LX][5LX][7LX]'), new Rule(0.028, '[2LX][3LX][6LX][7LX]'), new Rule(0.028, '[2LX][4LX][5LX][6LX]'), new Rule(0.028, '[2LX][4LX][5LX][7LX]'), new Rule(0.028, '[2LX][4LX][6LX][7LX]'), new Rule(0.028, '[2LX][5LX][6LX][7LX]'),         
        new Rule(0.028, '[3LX][4LX][5LX][6LX]'), new Rule(0.028, '[3LX][4LX][5LX][7LX]'), new Rule(0.028, '[3LX][4LX][6LX][7LX]'),
        new Rule(0.028, '[4LX][5LX][6LX][7LX]')
    ];

    this.updateAxiom = function(axiom) {
        if (typeof axiom !== "undefined") {
            this.axiom = axiom;
        }
    }

    this.updateGrammar = function(rule) {
        if (typeof axiom !== "undefined") {
            this.axiom = axiom;
        }
    }

    this.doIterations = function(n) {
        var lSystemLL = stringToLinkedList(this.axiom, 0);
        lSystemLL.position = this.position;
        for (var i = 0; i < n; i++) {
            var currentNode = lSystemLL.head;
            
            while (currentNode != null) {
                var next = currentNode.next;
                var symbol = currentNode.symbol;
                var iter = currentNode.iter;

                if (this.grammar[symbol])
                {
                    var rand = Math.random();
                    var sum = 0.0;
                    var rules = this.grammar[symbol];
                    for (var j = 0; j < rules.length; j++)
                    {
                        sum += rules[j].probability;
                        if (rand <= sum)
                        {
                            replaceNode(lSystemLL, currentNode, rules[j].successorString, i + 1);
                            break;
                        }
                    }
                }
                currentNode = next;
            }
        }
        this.axiom = linkedListToString(lSystemLL);
        return lSystemLL;
    }
}