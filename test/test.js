var p = require('../index');

var input = null;
process.argv.forEach(function (val, index, array){
	if (val === '-f') {
        	if (! array[index + 1])
            		throw("usage : node test.js -f [PDB_FILE]");
		input = array[index + 1]
	}
});
if(!input)
	throw("usage : node test.js -f [PDB_FILE]");

p.parse({ 'file' : input }).on('end', function (pdbObj_1){
    var pdbObj_2 = pdbObj_1.model(1);
    console.log(pdbObj_2.dump());
    console.log("test ok current pdb selection size is " + pdbObj_2.selecSize());
});

