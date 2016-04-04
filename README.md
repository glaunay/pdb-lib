##Another library to parse and manipulate "Protein Data Bank" files
Last revision : GL -- 06042016
Version tag : 0.2


###1. Installation and test
To install package and dependencies
`npm install pdb-lib`   

Launch test within the test folder
`node ./test.js -f ./1Z00.pdb`



###2. API
#### Loading library
`var pdbLib = require("pdb-lib")`
#### Invoking parser
`pdbLib.parse({"ValidKey" : input).on('end', callback)`<br>
Where callback is passed the created **pdbObject** as single parameter.
The inputs must be passed along with key used for source identification. Following  {key, input} pairs are supported:

*   **file** :  path to a file following the [PDB](http://www.rcsb.org/format) standard
* **rStream** :  a reference to a node readable stream

##### Parsing example
>pdbLib.parse({file : "./test/1Z00.pdb"})<br>
>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.on("end", function(pdbObjInp){<br>
>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;pdbObject = pdbObjInp;<br>
>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;});

#### Manipulating coordinates
The pdbObject interface tries to combine object chaining with "pymol-like" selecting expressions.  A pdbObject implements the following methods.

<br>
###### pdbObject.model(int) 
The mandatory method used to initialize or reset atom selections.
Assign to the **current selection**, the coordinates model designated by provided number. If the input featured no alternative structure (no "model ID" ), a default "number one" model is created so that `pdbObject.model(1)` will always work.
The previous **current selection** is effectively erased.
**returns** : the pdbObject

Note: Internally, the pdbObject performs most operations on a record of atoms named  **current selection**.  On any fresh pdbObject,  **current selection** _must_ be initialized by calling the model method!

<br>

###### pdbObject.resName(coordinateSelectorExpression) 
 Extract from the **current selection** all atom records with [resName](http://rcsb.org/format) field matching the provided coordinateSelectorExpression.
**returns**: the pdbObject

<br>

######  pdbObject.resSeq(coordinateSelectorExpression)
 Extract from the **current selection** all atom records with [resSeq](http://rcsb.org/format) field matching the provided coordinateSelectorExpression.
**returns**: the pdbObject

<br>

######  pdbObject.name(coordinateSelectorExpression)
 Extract from the **current selection** all atom records with [name](http://rcsb.org/format) field matching the provided coordinateSelectorExpression.
**returns**: the pdbObject

<br>

######  pdbObject.chain(coordinateSelectorExpression)
 Extract from the **current selection** all atom records with [segID](http://rcsb.org/format) field matching the provided coordinateSelectorExpression.
**returns**: the pdbObject

<br>

#### coordinateSelectorExpression definition

The coordinateSelectorExpressions are strings used to generate regular expressions. Theses are used  by the pdbObject  to scan its **current selection** of atom records. The subset of matching records are consequently deleted from the **current section** or used to replace the **current selection**.  

#####  Variable type
_coordinateSelectorExpression_ are passed to a $pdbObject$ method  as single or multiple arguments. In the latter case,  the **OR**-logic is employed.

*   Select all Lys, Leu, Asp, Asn, Arg : `pdbObj.resName('L*','A*')`

<br>

##### Regular Expression behavior
The character "*" specifies a unix-like wildcard (`/.*/` re-like)
Chaining selector methods allows to apply the **AND**-logic. 

*  Select atoms of Lys AND chain A : `pdbObj.resName('LYS').chain('A')`

<br>

##### Interval boundaries
Interval of values can be specified for [serial]() and [resSeq]() fields. Omit one boundary to specify a half-opened interval. 

*  Select residues between positions 16 and 54 :  `pdbObj.resSeq("16:54")`
*  Select all residues up to number 54 : `pdbObj.resSeq(":54")`

<br>

#### Deleting specific atoms
The same logic is employed to delete atom selections. Selecting atoms based on atom attributes is achieved through similar methods suffixed with the **Del** string.

<br>

###### pdbObject.resNameDel(coordinateSelectorExpression) 
 Delete from the **current selection** all atom records with [resName](http://rcsb.org/format) field matching the provided coordinateSelectorExpression.
**returns**: the pdbObject

<br>

######  pdbObject.resSeqDel(coordinateSelectorExpression)
 Delete from the **current selection** all atom records with [resSeq](http://rcsb.org/format) field matching the provided coordinateSelectorExpression.
**returns**: the pdbObject

<br>

######  pdbObject.nameDel(coordinateSelectorExpression)
 Delete from the **current selection** all atom records with [name](http://rcsb.org/format) field matching the provided coordinateSelectorExpression.
**returns**: the pdbObject

<br>

######  pdbObject.chainDel(coordinateSelectorExpression)
 Delete from the **current selection** all atom records with [segID](http://rcsb.org/format) field matching the provided coordinateSelectorExpression.
**returns**: the pdbObject

<br>

#### Coordinates manipulation exemples

*  Delete atoms from the chain B, then remove two fragments
`pdbObj.model(1).chainDel('B').resSeqDel("290:301","270:277")`

<br>

#### Additional methods

######  pdbObject.naturalAminoAcidOnly()
A short-cut method to select only the atoms part of the 20 natural amino-acids.
**returns**: the pdbObject

<br>

######  pdbObject.bFactor(value, [Optional type="increment"])
Update the bFactor fields of the **current selection** of atoms to specified value. By default, any previous value is erased. If the optional parameter is set to _"increment"_, the current bFactor values are incremented of _value_.
**returns**: null

<br>

######  pdbObject.selecSize()
Compute the size of the **current selection** of atoms
**returns**:  **current selection** array length

<br>

######  pdbObject.listChainID()
Extract from current selection a list of non-redundant chain identifiers.
**returns** : Array of single characters
