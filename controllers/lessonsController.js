var mongoose = require('mongoose');

var lessonSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name : String,
    description : String,
    videoPath : String,
    courseId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Course'
    },
    created: { 
        type: Date,
        default: Date.now
    }
});

var Lesson = mongoose.model('Lesson',lessonSchema);

module.exports = Lesson;

