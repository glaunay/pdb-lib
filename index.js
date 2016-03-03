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


    this.bFactor = function(value, type) { // assign or read bFactor value to/from current selection
        this.coordinates.bFactor(this.currentSelection, value, type);
    };

    this.selecSize = function() {
        return this.currentSelection.length;
    };
    this.listChainID = function() {
        var chainList = this.coordinates.listChainID(this.currentSelection);
        return chainList
    }
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
    this.naturalAminoAcidOnly = function() {
        var self = this.resName.apply(this, naturals);
        return self;
    };
    this.remove = function(opt) {
        //this.coordinates.verbose = true;
        if ('resSeq' in opt) {
            this.currentSelection = this.coordinates.delResSeq(this.currentSelection, arrayCoherce(opt.resSeq))
        }
        if ('resName' in opt) {
          this.currentSelection = this.coordinates.delResName(this.currentSelection, arrayCoherce(opt.resName))
        }
        if ('name' in opt) {
           this.currentSelection = this.coordinates.delName(this.currentSelection, arrayCoherce(opt.name))
        }
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
        //console.log(arguments);
        var nArgs = [this.currentSelection];
        for (var i = 0; i < arguments.length ; i++) {
            //console.log("==>" + arguments[i]);
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
    this.model = function(string) {
        this.currentSelection = this.coordinates.model(string);
        //console.log("model: currentSelectionSize " + this.currentSelection.length);
        return this;
    },
    // Clone selection into a new pdb object and set currentSelection to total atomRecord
    this.pull = function() {
        var pdbObject = new PdbObject();
        //console.log("-->neo constructed currentSelection size : " + pdbObject.currentSelection.length);
        //console.log("input currentSelection to pull size " + this.currentSelection.length);
        pdbObject.coordinates = coordinates.clone(this.currentSelection);
        pdbObject.model().name('*');
        //console.log("-->pulled currentSelection size : " + pdbObject.currentSelection.length);
        return pdbObject;
    }
    this.dump = function () {
        if (this.currentSelection.length === 0) {
            console.log("Empty atom selection !");
            return null;
        }
        var string = '';
        this.currentSelection.forEach(function(e, i, array){
            string += e.stringify();
        });
        return string;
    }
}


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
}


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


/* */
process.argv.forEach(function (val, index, array){
    if (val === '-f')
        var pdbObj = parse({'file' : array[index + 1] });
/*    if (val === '--slurm') slurm = true;
    if (val === '--http') bHttp = true;
    if (val === '--conf') {
        if (! array[index + 1])
            throw("usage : ");
        bean = parseConfig(array[index + 1]);
    }*/
});
