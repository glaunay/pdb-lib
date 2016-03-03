/*
COLUMNS        DATA  TYPE    FIELD        DEFINITION
-------------------------------------------------------------------------------------
 1 -  6        Record name   "ATOM  "
 7 - 11        Integer       serial       Atom  serial number.
13 - 16        Atom          name         Atom name.  <-- ERROR seems to be 14-16
17             Character     altLoc       Alternate location indicator.
18 - 20        Residue name  resName      Residue name.
22             Character     chainID      Chain identifier.
23 - 26        Integer       resSeq       Residue sequence number.
27             AChar         iCode        Code for insertion of residues.
31 - 38        Real(8.3)     x            Orthogonal coordinates for X in Angstroms.
39 - 46        Real(8.3)     y            Orthogonal coordinates for Y in Angstroms.
47 - 54        Real(8.3)     z            Orthogonal coordinates for Z in Angstroms.
55 - 60        Real(6.2)     occupancy    Occupancy.
61 - 66        Real(6.2)     tempFactor   Temperature  factor.
77 - 78        LString(2)    element      Element symbol, right-justified.
79 - 80        LString(2)    charge       Charge  on the atom.

*/

var sprintf = require('sprintf-js').sprintf;
var arrayUniq = require('array-uniq');

function sortNumber(a,b) {
    return a - b;
}



var Atom = function (data){

    var stringify = function() {
        var name = this.name.length < 4 ? " " + this.name : this.name;
        var string = sprintf("%6s%5d %-4s%s%3s %s%4s%s   %8.3f%8.3f%8.3f%6.2f%6.2f          %-2s%-2s\n",
            this.recordName, this.serial, name, this.altLoc, this.resName, this.chainID, this.resSeq,
            this.iCode, this.x, this.y, this.z,
            this.occupancy, this.tempFactor, this.element, this.charge);

        return string;
    }

    if (typeof(data) === 'string') {
        var m = data.match(/^ATOM|HETATM/);
        if (!m) return null;
        if (data.length < 81) {
            for (var i = 0; i < (81 - data.length); i++) {
                data += ' ';
            }
        }

        return {
            stringify : stringify,
            'recordName' : data.substring(0, 6),
            'serial' : parseInt(data.substring(6, 11)),
            'name' : data.substring(12, 16).replace(/[\s]+/g, ""),
            'altLoc' : data.substring(16, 17),
            'resName' : data.substring(17, 20),
            'chainID' : data.substring(21, 22),
            'resSeq' : data.substring(22, 26),
            'iCode' : data.substring(26, 27),
            'x' : parseFloat(data.substring(30, 38)),
            'y' : parseFloat(data.substring(38, 46)),
            'z' : parseFloat(data.substring(46, 54)),
            'occupancy' : parseFloat(data.substring(54, 60)),
            'tempFactor' : parseFloat(data.substring(60, 66)),
            'element' : data.substring(76, 78),
            'charge' : data.substring(78, 80)
        };
    }
    if (typeof(data) === 'object') {
        return {
            stringify : stringify,
            'recordName' : data.recordName,
            'serial' : parseInt(data.serial),
            'name' : data.name,
            'altLoc' : data.altLoc,
            'resName' : data.resName,
            'chainID' : data.chainID,
            'resSeq' : data.resSeq,
            'iCode' : data.iCode,
            'x' : parseFloat(data.x),
            'y' : parseFloat(data.y),
            'z' : parseFloat(data.z),
            'occupancy' : parseFloat(data.occupancy),
            'tempFactor' : parseFloat(data.tempFactor),
            'element' : data.element,
            'charge' : data.charge
        };

    }
    throw "Unknown data on input";
}

var coordinatesInstance = function () {
    this.models = {};
    this.verbose = false;
};

coordinatesInstance.prototype.chain = function (currentSelection, chainID) {

    var nArgs = ['chainID', 'pick'];
    for (var i = 0; i < arguments.length; i++) {
        nArgs.push(arguments[i]);
    }
    var atomRecord = this._scan.apply(this, nArgs);
    return atomRecord;

    /*var buffer = [];
    var target = this.models[this.currentModel];
    if (currentSelection.length > 0) {
        target = currentSelection;
    }
    target.forEach(function(e, i, array) {
        if(e.chainID === chainID)
            buffer.push(e);
    });
    return buffer;
    */
};
coordinatesInstance.prototype.bFactor = function(currentSelection, value, type) {
    var bUp = type ? type === 'increment' ? true : false : false;
    if(value != null) {
        currentSelection.forEach( function(e){
            if(bUp)
                e.tempFactor  = e.tempFactor  + value;
            else
                e.tempFactor = value;
        });
    }
};

coordinatesInstance.prototype.listChainID = function(currentSelection) {
    var buffer = currentSelection.map(function(e) {
                    return e.chainID
                });
    return arrayUniq(buffer);
}

// Reset current atom selection, if no model specified pick one
coordinatesInstance.prototype.model = function (modelID) {
    var buffer = [];
    var currentModel = modelID;
    if(!currentModel) {
        for (var k in this.models) {
            currentModel = k;
            //console.log("Record size of model id " +currentModel + " " + this.models[currentModel].length);
            break;
        }
    }
    var target = this.models[currentModel];
    target.forEach(function(e, i, array) {
            buffer.push(e);
    });
    return buffer;
}

var setPattern = function(string) {
    var reStart = /^\*/;
    var reEnd = /\*$/;
    var pattern = string.replace(/\*/g, '.*').replace(/^\.\*/, '').replace(/\.\*$/,'');
    if(!reStart.test(string) && !reEnd.test(string)) {
        pattern =  "^[\\s]*" + pattern + "[\\s]*$";
    }
    else if(reStart.test(string)) {
        pattern =  pattern + "[\\s]*$";
    }
    else if(reEnd.test(string)) {
        pattern =  "^[\\s]*" + pattern;
    }
    return pattern
}

coordinatesInstance.prototype._scan = function (args) {  // args 0 is atom field, rest is rules
    var index = [];
    var atomField = arguments[0];
    var mode = arguments[1]
    var currentSelection = arguments[2];
    var buffer = {};
    var target = this.models[this.currentModel];
    if (currentSelection.length > 0)
        target = currentSelection;

    var self = this;

    for (var iArg = 3; iArg < arguments.length; iArg++) {
        var ruleWord = arguments[iArg];

        var patternPair = ruleWord.toString().split(":");
        var pattern1 = setPattern(patternPair[0]);
        var reUp = new RegExp(pattern1);
        if (patternPair.length === 1) {
            if (this.verbose) console.log(atomField + ' ' + pattern1 + ' in ' + target.length);
            target.forEach(function(e, i, array) {
                if (reUp.test(e[atomField])){
                    if(mode === 'pick') {
                        buffer[e.serial] = e;
                        index.push(e.serial);
                    }
                } else {
                    if(mode === 'kick') {
                        buffer[e.serial] = e;
                        index.push(e.serial);
                    }
                }
            });
        }
        else if (patternPair.length === 2) {
            var bCopy = false;
            var last = false;
            var pattern2 = setPattern(patternPair[1]);
            var reDown = new RegExp(pattern2);
            for (var i = 0 ; i < target.length; i++) {
                var e = target[i];
                if(reUp.test(e[atomField]))
                    bCopy = true;
                if (!bCopy)
                    continue;

                /*copy stop condition match elements exit after in pick mode*/
                if (bCopy && reDown.test(e[atomField]))
                    last = true;
                if(last && !reDown.test(e[atomField]) && mode === 'pick')
                    break;
            // in kick mode, we want to go beyond the specified region to recover atom not matching condition
                if(last && !reDown.test(e[atomField]))
                    bCopy = false;
                if (bCopy && mode === 'pick') {
                    buffer[e.serial] = e;
                    index.push(e.serial);
                }
                if (!bCopy && mode === 'kick') {
                    buffer[e.serial] = e;
                    index.push(e.serial);
                }
            }
        }
    }// Sort atom record based on atom serial number
    var newRecord = index.sort(sortNumber).map(function(i){
        return buffer[i]
    })
    return newRecord;
}

coordinatesInstance.prototype.delName = function () {
    var nArgs = ['name', 'kick'];
    for (var i = 0; i < arguments.length; i++) {
        nArgs.push(arguments[i]);
    }
    var atomRecord = this._scan.apply(this, nArgs);
    return atomRecord;
}
coordinatesInstance.prototype.delResSeq = function () {
    var nArgs = ['resSeq', 'kick'];
    for (var i = 0; i < arguments.length; i++) {
        nArgs.push(arguments[i]);
    }
    var atomRecord = this._scan.apply(this, nArgs);
    return atomRecord;
}
coordinatesInstance.prototype.delResName = function () {
    var nArgs = ['resName', 'kick'];
    for (var i = 0; i < arguments.length; i++) {
        nArgs.push(arguments[i]);
    }
    var atomRecord = this._scan.apply(this, nArgs);
    return atomRecord;
}

coordinatesInstance.prototype.resName = function (args) {
    var nArgs = ['resName', 'pick'];
    for (var i = 0; i < arguments.length; i++) {
        nArgs.push(arguments[i]);
    }
    var atomRecord = this._scan.apply(this, nArgs);
    return atomRecord;
};

coordinatesInstance.prototype.resSeq = function (args) {
    var nArgs = ['resSeq', 'pick'];
    for (var i = 0; i < arguments.length; i++) {
        nArgs.push(arguments[i]);
    }
    var atomRecord = this._scan.apply(this, nArgs);
    return atomRecord;
};

coordinatesInstance.prototype.name = function (args) {
    var nArgs = ['name', 'pick'];
    for (var i = 0; i < arguments.length; i++) {
        nArgs.push(arguments[i]);
    }
    var atomRecord = this._scan.apply(this, nArgs);
    return atomRecord;
};



var sectionTags = ['MODEL','ATOM','ANISOU','TER','HETATM','ENDMDL'];
var parse = function(altLocPreserve, data) {
    var coordinates = new coordinatesInstance();
    var currentModel = null;
    data.forEach(function(e,i, array) {
        var m = e.match(/^MODEL[\s]+([\d]+)/);
        if (m) {
            currentModel = m[1]
            coordinates.models[m[1]] = [];
            return;
        }
        if (!currentModel) {
            currentModel = 1;
            coordinates.models[1] = [];
        }
        var cRecord = coordinates.models[currentModel];
        var atom = Atom(e);
        if (atom) {
            if (!altLocPreserve && ! atom.altLoc === ' ') {

            } else if(atom.altLoc === ' ' || atom.altLoc === 'A') {
                cRecord.push(atom);
            }
        }
    });
    return coordinates;
};
/*
var model = function (data) {
    var number = null;
    var atomRecord = [];
    return {
        number : number,
        atomRecord : atomRecord
    };
}
*/

/*  return a deep copy of an atomRecord*/
var clone = function(atomRecord, modelID) {
    var newCoordinates = new coordinatesInstance();
    var currentModel = modelID ? modelID : 1;
    newCoordinates.models[currentModel] = [];
    newCoordinates.models[currentModel] = atomRecord.map(function(e, i, array){
        var tAtom = new Atom(e);
        return tAtom;
    });
    return newCoordinates;
}
module.exports = {
    sectionTags : sectionTags,
    parse : parse,
    clone : clone

}


/* PDB Preambule section constructor */
/*var Coordinates  = function(data) {
    baseClass.TextEntity.call(this, data);
    this.sectionTags = sectionTags;
}
Coordinates.prototype = Object.create(baseClass.TextEntity.prototype);
Coordinates.prototype.constructor = Coordinates;
*/