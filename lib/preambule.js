/*
    PDB title section
    Input&relationships specs at
    http://www.wwpdb.org/documentation/file-format-content/format33/sect2.html
*/

var sectionTags = ['HEADER', 'OBSLTE', 'TITLE', 'SPLT', 'CAVEAT', 'COMPND', 'SOURCE', 'KEYWDS', 'EXPDTA', 'NUMMDL', 'MDLTYP', 'AUTHOR', 'REVDAT', 'SPRSDE', 'JRNL', 'REMARKS'];
var events = require('events');



module.exports = {
    sectionTags : sectionTags
}


/* PDB Preambule section constructor */
/*var Preambule  = function(data) {
    baseClass.TextEntity.call(this, data);
    this.sectionTags = sectionTags;

}
Preambule.prototype = Object.create(baseClass.TextEntity.prototype);
Preambule.prototype.constructor = Preambule;
*/