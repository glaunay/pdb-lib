// rewriting a zillioniem pdb file parser.

// expose a parse function/ Input is file or stream
// return a pdb instance
// API for pdbAtomRecord AKA model to directly manipulate a pdb record OR a set of pdb record (for superimposition).

// Usage :
//var h = p.parse({file : "/data/dev/ardock/scriptPackage/test/4MOW.pdb"})
//   .on('end', function (obj){ pdb = obj;});
//console.log(pdb.model(1).resName("AS*")
//                        .resSeq("220:230", "24*").name("CA", "CB")
//                        .delete({resSeq : ['221:223', 224], name : '*B'})
//                        .dump());


var naturals = ['ALA', 'ASP', 'ARG', 'ASN', 'CYS',
                'GLU', 'GLN', 'GLY', 'HIS', 'LEU',
                'ILE', 'LYS', 'MET', 'PHE', 'PRO',
                'SER', 'THR', 'TYR', 'TRY', 'TRP',
                'VAL'];

var events = require('events');
var fs = require('fs'),
    byline = require('byline');

var preambule = require('./lib/preambule.js');
var coordinates = require('./lib/coordinates.js');
var seqres = require('./lib/seqres.js');
//var _ = require('underscore');

var re = /^([\S]+)/;


var parseBuffer = function () {
    return {
        seqres : { tags : seqres.sectionTags, data : [] },
        coordinates : {tags : coordinates.sectionTags, data : [] },
        preambule : {tags : preambule.sectionTags, data : [] }
    };
}

var arrayCoherce = function(value) {
    var param = [];
    if (typeof(value) === 'string')
        param.push(value);
    else if (typeof(value) === 'array')
        param = value;
    else
        throw 'parameter must be a list or a string ' + typeof(value);

    return param;
};

var PdbObject  = function(data) {
    this.currentModel = 1;
    this.altLocPreserve = false;
    this.preambule = null;
    this.seqres = null;
    this.coordinates = null;
    this.currentSelection = [];

    // TO DO DEVELOP high level selection parser
    this.remove = function(expression) {
        return this;
    };
    this.select = function(expression) {
        return this;
    };


// Set B-factor of current selection
    this.bFactor = function(value, type) { // assign or read bFactor value to/from current selection
        this.coordinates.bFactor(this.currentSelection, value, type);
    };

// Number of atoms in current selection
    this.selecSize = function() {
        return this.currentSelection.length;
    };
// non-redundant list of chains found in currentSelection
    this.listChainID = function() {
        var chainList = this.coordinates.listChainID(this.currentSelection);
        return chainList
    }

// Initialize/ reset selection
    this.model = function(string) {
        this.currentSelection = this.coordinates.model(string);
        return this;
    },

// Selector short-cut
    this.naturalAminoAcidOnly = function() {
        var self = this.resName.apply(this, naturals);
        return self;
    };

// Basic Selectors
    this.chain = function () { // could receive an array as sole argument
        var nArgs = [this.currentSelection];

        if(Array.isArray(arguments[0])) {
            arguments[0].forEach(function(e){
                nArgs.push(e);
            });
        } else {
            for (var i = 0; i < arguments.length ; i++) {
                nArgs.push(arguments[i]);
            }
        }
        this.currentSelection = this.coordinates.chain.apply(this.coordinates, nArgs);
        return this;
    };

    this.name = function (args) {
        var nArgs = [this.currentSelection];
        for (var i = 0; i < arguments.length ; i++) {
            nArgs.push(arguments[i]);
        }
        this.currentSelection = this.coordinates.name.apply(this.coordinates, nArgs);
        return this;
    };

    this.resSeq = function (args) {
        var nArgs = [this.currentSelection];
        for (var i = 0; i < arguments.length ; i++) {
            nArgs.push(arguments[i]);
        }
        this.currentSelection = this.coordinates.resSeq.apply(this.coordinates, nArgs);
        return this;
    };

    this.resName = function (args) {
        var nArgs = [this.currentSelection];
        for (var i = 0; i < arguments.length ; i++) {
            nArgs.push(arguments[i]);
        }
        this.currentSelection = this.coordinates.resName.apply(this.coordinates, nArgs);
        return this;
    };

// Deleters
    this.chainDel = function () {
        var nArgs = [this.currentSelection];

        if(Array.isArray(arguments[0])) {
            arguments[0].forEach(function(e){
                nArgs.push(e);
            });
        } else {
            for (var i = 0; i < arguments.length ; i++) {
                nArgs.push(arguments[i]);
            }
        }
        this.currentSelection = this.coordinates.delChain.apply(this.coordinates, nArgs)
        return this;
    };

    this.nameDel = function () {
        var nArgs = [this.currentSelection];

        if(Array.isArray(arguments[0])) {
            arguments[0].forEach(function(e){
                nArgs.push(e);
            });
        } else {
            for (var i = 0; i < arguments.length ; i++) {
                nArgs.push(arguments[i]);
            }
        }
        this.currentSelection = this.coordinates.delName.apply(this.coordinates, nArgs)
        return this;
    };

    this.resNameDel = function () {
        var nArgs = [this.currentSelection];

        if(Array.isArray(arguments[0])) {
            arguments[0].forEach(function(e){
                nArgs.push(e);
            });
        } else {
            for (var i = 0; i < arguments.length ; i++) {
                nArgs.push(arguments[i]);
            }
        }
        this.currentSelection = this.coordinates.delResName.apply(this.coordinates, nArgs)
        return this;
    };

    this.resSeqDel = function () {
        var nArgs = [this.currentSelection];

        if(Array.isArray(arguments[0])) {
            arguments[0].forEach(function(e){
                nArgs.push(e);
            });
        } else {
            for (var i = 0; i < arguments.length ; i++) {
                nArgs.push(arguments[i]);
            }
        }
        this.currentSelection = this.coordinates.delResSeq.apply(this.coordinates, nArgs)
        return this;
    };


// Clone selection into a new pdb object and set currentSelection to total atomRecord
    this.pull = function() {
        var pdbObject = new PdbObject();
        pdbObject.coordinates = coordinates.clone(this.currentSelection);
        pdbObject.model().name('*');
        return pdbObject;
    }

    this.pdbnum = function  () {
        if (this.currentSelection.length === 0) {
            console.log("Empty atom selection !");
            return null;
        }
        var numSequence = [];
        var warden = null;
        this.currentSelection.forEach(function(e, i, array){
            if (!warden) {
                warden = e.pdbNum();
                numSequence.push(warden);
                return;
            }

            if (warden === e.pdbNum())
                return;

            numSequence.push(e.pdbNum());
            warden = e.pdbNum();
        });
        return numSequence;
    }

    this.sequence = function () {
        if (this.currentSelection.length === 0) {
            console.log("Empty atom selection !");
            return null;
        }
        var string = '';
        var warden = null;
        this.currentSelection.forEach(function(e, i, array){
            if (!warden)
                warden = e.pdbNum();
            else if (warden === e.pdbNum())
                return;

            string += e.oneLetter();
            warden = e.pdbNum();
        });
        return string;
    }

// Display current Selection optional number of field (columns)
    this.dump = function (nField) {
        if (this.currentSelection.length === 0) {
            console.log("Empty atom selection !");
            return null;
        }
        var string = '';
        if (!nField) {
            this.currentSelection.forEach(function(e, i, array){
                string += e.stringify();
            });
        } else {
            var n = parseInt(nField);
            if (n < 0) {
                throw "irregular field number \"" + n + "\"";
            }
            this.currentSelection.forEach(function(e, i, array){
                string += e.stringify().substring(0,n);
                if( !string.endsWith("\n") )
                    string += '\n';
            });
        }

        return string;
    }

    this.asArray = function () {
        if (this.currentSelection.length === 0) {
            console.log("Empty atom selection !");
            return null;
        }
        var array = [coordinates.atomFields];
        this.currentSelection.forEach(function(e) {
                    array.push(e.asArray());
                });
        return array;
    }
    this.asFasta = function () {
        if (this.currentSelection.length === 0) {
            console.log("Empty atom selection !");
            return null;
        }
        var array = [coordinates.atomFields];
        this.currentSelection.forEach(function(e) {
                    array.push(e.asArray());
                });
        return array;
    }

}

// Parsing Routines
var setBuffer = function(line, buffers) {
    var m = line.match(re);
    if (!m){
        console.log("unknown tag " + line);
        return null;
    }
    var tBuf = null;
    for (var k in buffers) {
        if(buffers[k].tags.indexOf(m[0]) === -1)
            continue;
        return buffers[k].data;
    }
    return null;
};

var parse = function(opt) {
        if (!opt) throw "No input specified";

        //console.dir(opt);
        var emitter = new events.EventEmitter();
        var stream;
        if ('file' in opt)
                stream = byline(fs.createReadStream(opt.file, { encoding: 'utf8' }));
        else if('rStream' in opt)
                stream = byline(opt.rStream);
        else
            throw "No input specified";
        var nBuffer = parseBuffer();
        stream.on('readable', function() {
            while (null !== (line = stream.read())) {
                if(typeof(line) !== 'string' ) line = line.toString();

               // console.log(line);

                var buffer = setBuffer(line, nBuffer);
                if (!buffer) {
                    //console.log("unknown tag at " + line);
                    continue;
                }
                buffer.push(line);
            }
        })
        .on('end',function(){
            var pdbObject = new PdbObject();
            pdbObject.coordinates = coordinates.parse(pdbObject.altLocPreserve,
                                    nBuffer.coordinates.data);
            emitter.emit('end', pdbObject);
        });
        return emitter;
    };

module.exports = {
    parse : parse,
    fWrite : function (pdbObj, path) {
        var emitter = new events.EventEmitter();
        fs.writeFile(path, pdbObj.dump(), function(err) {
            if(err) {
                return console.log(err);
            }
            emitter.emit('saved')
        });
        return emitter;
    }
}


/* Test -- Case */
process.argv.forEach(function (val, index, array){
    if (val === '-f')
        var pdbObj = parse({'file' : array[index + 1] });
});
