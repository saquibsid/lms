var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({extended: false});
var mongoose = require('mongoose');

var courseSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    oneLiner: String,
    description: String,
    category: String,
    duration: Number,
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    language: String,
    created: {
        type: Date,
        default: Date.now
    },
    coverPhoto: String
});

var Course = mongoose.model('Course',courseSchema);


module.exports = Course;