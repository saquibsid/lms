var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({extended: false});
var mongoose = require('mongoose');
var userSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name : String,
    emailId: {type: String, index: {unique: true}},
    password: String,
    type: Number,
    enrolledCourses: [
      {
            courseId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Course'
            },
            created: {
                type: Date,
                default: Date.now
            }
        }
    ],
    testArray:[
        {
            id:Number,
            name:String,
            created: {
                type: Date,
                default: Date.now
            }


    }],
    created: {
        type: Date,
        default: Date.now
    },
    profilePhoto : Buffer
});

var User = mongoose.model('User',userSchema);


module.exports = User;

