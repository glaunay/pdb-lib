/*
    PDB primary structure section (pss)
    Input&relationships specs at
    http://www.wwpdb.org/documentation/file-format-content/format33/sect3.html
*/

var sectionTags = ['SEQRES'];

module.exports = {
    sectionTags : sectionTags
}


/* PDB Preambule section constructor */
/*var SeqRes  = function(data) {
    baseClass.TextEntity.call(this, data);
    this.sectionTags = sectionTags;

}
SeqRes.prototype = Object.create(baseClass.TextEntity.prototype);
SeqRes.prototype.constructor = SeqRes;
*/