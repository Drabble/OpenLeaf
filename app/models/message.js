// load the things we need
var mongoose = require('mongoose');

// define the schema for our user model
var messageSchema = mongoose.Schema({

    local            : {
        content      : String,
        username     : String,
        creationDate : Date,
    }

});

// methods ======================
projectSchema.methods.dateDiff = function(date) {
    var diff = {}                           // Initialisation du retour
    var tmp = date - Date.now;
 
    tmp = Math.floor(tmp/1000);             // Nombre de secondes entre les 2 dates
    diff.sec = tmp % 60;                    // Extraction du nombre de secondes
 
    tmp = Math.floor((tmp-diff.sec)/60);    // Nombre de minutes (partie entière)
    diff.min = tmp % 60;                    // Extraction du nombre de minutes
 
    tmp = Math.floor((tmp-diff.min)/60);    // Nombre d'heures (entières)
    diff.hour = tmp % 24;                   // Extraction du nombre d'heures
     
    tmp = Math.floor((tmp-diff.hour)/24);   // Nombre de jours restants
    diff.day = tmp;
     
    return diff;
}

// create the model for users and expose it to our app
module.exports = mongoose.model('Message', messageSchema);