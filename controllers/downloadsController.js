var mongoose = require('mongoose');

var downloadSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name : String,
    description : String,
    path : String,
    courseId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Course'
    },
    created: { 
        type: Date,
        default: Date.now
    }
});

var Download = mongoose.model('Download',downloadSchema);

module.exports = Download;

