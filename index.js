var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var bCrypt = require('bcrypt-nodejs');
var session = require('express-session');
var LocalStrategy = require('passport-local').Strategy;
var flash = require('connect-flash');
var multer = require('multer');
var path = require("path");


var Course = require('./controllers/courseController');
var User = require('./controllers/userController');
var Lesson = require('./controllers/lessonsController');
var Download = require('./controllers/downloadsController');
var app = express();


app.use(session({
    secret: 'secret',
    saveUninitialized: true,
    resave: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(cookieParser());
app.use(flash());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/restdb', { useNewUrlParser: true },function (err) {
    if (err) throw err;
    console.log('Database Successfully connected');
});

// Generates hash using bCrypt
var createHash = function (password) {
    return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
}

passport.use('login',new LocalStrategy({
    passReqToCallback: true
    },
    function (req,username, password, done) {    
        User.findOne({ emailId: username }, function (err, user) {
            if (err) {  
                return done(err, req.flash('message', err)); 
            }
            if (!user) { 
                return done(null, false, req.flash('message', 'Email-id does not exists.')); 
            }
            req.session.user = user;
            return done(null, user);
        });
    }
));


passport.use('register', new LocalStrategy({
    usernameField: 'emailId',
    passwordField: 'password',
    passReqToCallback: true
},
    function (req, username, password, done) {
        console.log(username,password);
        User.findOne({ emailId: username }, function (err, user) {
            if (err) {
                return done(err, req.flash('message', err));
            }
            if (user) {
                return done(null, false, req.flash('message', 'Email-id already registered'));
            }else{
                
                var user = new User({
                    _id: new mongoose.Types.ObjectId(),
                    name: req.body.name,
                    emailId: req.body.emailId,
                    password: createHash(req.body.password),
                    type: req.body.type
                });

                user.save(function (err) {
                    if (err) {
                        return done(null, false, req.flash('message', err));
                    } else {
                        return done(null, false, req.flash('message', 'Register successfully.'));
                    }
                }); 
            }
        });
    }
));

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

var urlencodedParser = bodyParser.urlencoded({
    extended: false,
    limit: '50mb'
});
//courseController(app);
//userController(app);

app.listen(8000);

console.log('server is listening on port 8000');

app.use(function (req, res, next) {
    res.locals.user = req.session.user;
    res.locals.message = res.message;
    res.locals.type = res.type;
    next();
}); 

app.get('/', function (req, resp) {

    Course.find({}).sort('-created')
        .populate('instructor')
        .limit(10)
        .exec(function (err, courses) {
            if (err) throw err;
            resp.render('index', {
                course: courses
            });
        });
});

app.get('/courseDetails/:id', function (req, resp) {
    Course.findById(req.params.id)
        .populate('instructor')
        .exec(function (err, course) {
            if (err) {
                resp.end('No such course found');
            } else {
                Lesson.find({
                    courseId: course._id
                })
                    .exec(function (err, lessons) {

                        if (req.session.user) {
                            console.log('logged in');
                            // user logged in. check enrollment status of the selected course
                            User.findOne({
                                enrolledCourses: {
                                    $elemMatch: {
                                        courseId: course._id
                                    }
                                },
                                _id: req.session.user._id
                            }).exec(function (err, user) {
                                if (err) throw err;
                                console.log(user);
                                if (!user)
                                    resp.render('courseDetails', {
                                        course: course,
                                        lessons: lessons,
                                        enrolled: false
                                    });
                                else
                                    resp.render('courseDetails', {
                                        course: course,
                                        lessons: lessons,
                                        enrolled: true
                                    });
                            });

                        } else {
                            resp.render('courseDetails', {
                                course: course,
                                lessons: lessons,
                                enrolled: false
                            });
                        }
                    });
            }

        });
});

/* Enroll Course */

app.post('/enrollCourse', urlencodedParser, function (req, resp) {

    if (req.session.user) {
        User.findByIdAndUpdate(req.session.user._id, {
            $push: {
                "enrolledCourses": {
                    courseId: req.body.courseId
                }
            }
        }, function (err, user) {
            if (err) {
                resp.send({
                    status: false,
                    message: err.message
                });
            } else {
                req.session.user.enrolledCourses = user.enrolledCourses;
                req.session.save(function (err) {
                    console.log('session saved');
                    req.session.reload(function (err) {
                        console.log('session reloaded');
                    });
                });
                resp.send({
                    status: true,
                    message: 'Course enrolled successfully'
                });
            }
        });
    } else {
        // not logged in
        resp.send({
            status: false,
            message: 'You need to login to enroll for any course.'
        });
    }

});

/* Registration */

app.get('/register', function (req, resp) {
    resp.render('register', { message: req.flash('message'),type:'error'});
});

/* app.post('/register', urlencodedParser, function (req, resp) {
   
    var user = new User({
        _id: new mongoose.Types.ObjectId(),
        name: req.body.name,
        emailId: req.body.emailId,
        password: req.body.password,
        type: req.body.type
    });
    
    user.save(function (err) {
        if (err) {
            resp.render('register',{
                status: false,
                message: (err.code ==11000 ? 'Email Id already exists':err.message),
                type:'error'
            });
        } else {
            resp.render('register',{
                status: true,
                message: 'Registration is successfully',
                type:'success'
            });
        }

    });
}); */

app.post('/login',
    passport.authenticate('login', { 
        failureRedirect: '/register',
        successRedirect: '/dashboard',
        failureFlash: true 
}));


app.post('/register',
    passport.authenticate('register', {
        failureRedirect: '/register',
        successRedirect: '/register',
        failureFlash: true
}));


/* app.post('/login', urlencodedParser, function (req, resp) {
    //implement user login
    User.findOne({
        emailId: req.body.usernameTb,
        password:req.body.password
    }).exec(function (err, user) {
            req.session.user=user;
            if (err) throw err;
            resp.redirect('/dashboard');
        });
}); */


app.get('/logout', function (req, resp) {
    req.session.destroy();
    resp.render('register');
});


/* Dashboard */
app.get('/dashboard', function (req, resp) {
    //console.log(resp);
    if (!req.session.user) {
        resp.render('register');
    } else {
        if (req.session.user.type == 1) {
            //instructor
            Course.find({
                'instructor': req.session.user._id
            })
                .exec(function (err, courses) {
                    if (err) throw err;

                    resp.render('dashboard', {
                        courses: courses,
                        user: req.session.user
                    });
                });
        } else {
            //student
            var courseIds = [];
            User.findById(req.session.user._id, function (err, user) {
                if (err) {
                    resp.send({
                        status: false,
                        message: err.message
                    });
                } else {
                    for (var i = 0; i < user.enrolledCourses.length; i++) {
                        courseIds.push(user.enrolledCourses[i].courseId);
                    }


                    Course.find({
                        '_id': {
                            '$in': courseIds
                        }
                    })
                        .exec(function (err, courses) {
                            if (err) throw err;
                            resp.render('dashboard', {
                                courses: courses,
                                user: req.session.user
                            });
                        });
                }
            });
        }
    }
});

/* Course Section */
app.get('/createCourse', function (req, resp) {
    if (!req.session.user) {
        resp.render('register');
    } else {
        resp.render('createCourse', {
            user: req.session.user
        });
    }

});

app.get('/deleteCourse', function (req, resp) {
    if (!req.session.user) {
        resp.render('register');
    } else {
        Course.find({
            instructor: req.session.user._id
        })
            .exec(function (err, courses) {
                if (err) throw err;
                resp.render('deleteCourse', {
                    course: courses,
                    user: req.session.user
                });
            });
    }

});

app.delete('/deleteCourse/:id', function (req, resp) {
    //implement delete course functionality
    if (!req.session.user) {
        resp.render('register');
    } else {
        Course.findById(req.params.id).remove(function (err, data) {
            if (err) {
                resp.send({
                    status: false,
                    message: err.message
                });
            } else {
                resp.send({
                    status: true,
                    message: 'Course Deleted successfully'
                });
            }
        });
    }
});

app.post('/createCourse', urlencodedParser, function (req, resp) {
    //implement create course functionality
    
    var course = new Course({
        _id: new mongoose.Types.ObjectId(),
        name: decodeURIComponent(req.body.name),
        description: decodeURIComponent(req.body.description),
        category    :   req.body.category,
        oneLiner    :   req.body.oneLiner,
        duration    :   req.body.duration,
        language    :   req.body.language,
        courseId: req.body.courseId,
        coverPhoto: req.body.coverPhoto,
        instructor: req.session.user._id
    });
    course.save(function (err) {
        if (err) {
            resp.send({
                status: false,
                message: err
            });
        } else {
            resp.send({
                status: true,
                message: 'Course Added successfully'
            });
        }
    }); 
});

app.post('/getCourseDetails', urlencodedParser, function (req, resp) {
    Course.findById(req.body.id)
        .exec(function (err, data) {
            if (err) {
                resp.send({
                    status: false,
                    message: err.message
                });
            } else {
                resp.send({
                    status: true,
                    course: data
                });
            }

        });
});

app.get('/updateCourse', function (req, resp) {

    if (!req.session.user) {
        resp.render('register');
    } else {
        Course.find({
            instructor: req.session.user._id
        })
            .exec(function (err, courses) {
                if (err) throw err;
                resp.render('updateCourse', {
                    course: courses,
                    user: req.session.user
                });
            });
    }
});

app.post('/updateCourse', urlencodedParser, function (req, resp) {
    //implement update Course functionality
    Course.findById(req.body.id, function (err, course) {
        if (err) {
            resp.send({
                status: false,
                message: err.message
            });
        } else {
            course.name = decodeURIComponent(req.body.name),
            course.category = req.body.category,
            course.oneLiner = req.body.oneLiner,
            course.duration =   req.body.duration,
            course.language = req.body.language,
            course.description = decodeURIComponent(req.body.description),
            course.coverPhoto = req.body.coverPhoto

            course.save(function (err) {
                if (err) {
                    resp.send({
                        status: false,
                        message: err.message
                    });
                } else {
                    resp.send({
                        status: true,
                        message: 'Course Updated successfully'
                    });
                }

            });
        }
    });
});

/* Lessons Section */

app.get('/createLesson', function (req, resp) {
    if (!req.session.user) {
        resp.render('register');
    } else {
        Course.find({
            instructor: req.session.user._id
        })
            .exec(function (err, courses) {
                if (err) throw err;
                resp.render('createLesson', {
                    course: courses,
                    user: req.session.user
                });
            });
    }
});

app.post('/createLesson', urlencodedParser, function (req, resp) {
    var lesson = new Lesson({
        _id: new mongoose.Types.ObjectId(),
        name: decodeURIComponent(req.body.name),
        description: decodeURIComponent(req.body.description),
        courseId: req.body.courseId,
        videoPath: req.body.videoFilePath
    });

    lesson.save(function (err) {
        if (err) {
            resp.send({
                status: false,
                message: err.message
            });
        } else {
            resp.send({
                status: true,
                message: 'Lesson Added successfully'
            });
        }
    });

});

/* course cover photo upload */
var coverPhotoStorage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, './public/assets/images');
    },
    filename: function (req, file, callback) {
        callback(null, Date.now() + '_' + file.originalname);
    }
});

var uploadCourseImage = multer({
    storage: coverPhotoStorage
}).single('uploadFile');

app.post('/coverPhoto', function (req, res) {
    uploadCourseImage(req, res, function (err) {
        if (err) {
            res.send({
                status: false,
                message: err.message
            });
        } else {
            res.send({
                status: true,
                filePath: req.file.filename
            });
        }
    });
});

var videoStorage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, './public/assets/videos');
    },
    filename: function (req, file, callback) {
        callback(null, Date.now() + '_' + file.originalname);
    }
});

var uploadVideo = multer({
    storage: videoStorage
}).single('videoFile');

app.post('/video', function (req, res) {
    uploadVideo(req, res, function (err) {
        if (err) {
            res.send({
                status: false,
                message: err.message
            });
        } else {
            res.send({
                status: true,
                filePath: req.file.filename
            });
        }
    });
});


app.get('/updateLesson', function (req, resp) {

    if (!req.session.user) {
        resp.render('register');
    } else {
        Course.find({
            instructor: req.session.user._id
        })
            .exec(function (err, courses) {
                if (err) throw err;
                resp.render('updateLesson', {
                    course: courses,
                    user: req.session.user
                });
            });
    }
});


app.post('/getLessonList', urlencodedParser, function (req, resp) {
    Lesson.find({
        courseId: req.body.courseId
    })
        .exec(function (err, lessons) {
            if (err) {
                resp.send({
                    status: false,
                    message: err.message
                });
            } else {
                resp.send({
                    status: true,
                    lessons: lessons
                });
    
        }
        });
});

app.post('/updateLesson', urlencodedParser, function (req, resp) {

    Lesson.findById(req.body.id, function (err, lesson) {
        if (err) {
            resp.send({
                status: false,
                message: err.message
            });
        } else {
            lesson.name = decodeURIComponent(req.body.name),
                lesson.description = decodeURIComponent(req.body.description),
                lesson.videoPath = req.body.videoFilePath

            lesson.save(function (err) {
                if (err) {
                    resp.send({
                        status: false,
                        message: err.message
                    });
                } else {
                    resp.send({
                        status: true,
                        message: 'Lesson Updated successfully'
                    });
                }

            });
        }
    });
});

app.get('/deleteLesson', function (req, resp) {
    if (!req.session.user) {
        resp.render('register');
    } else {
        var courseIds = [];
        Course.find({
            instructor: req.session.user._id
        })
            .exec(function (err, courses) {
                if (!err) {
                    for (var i = 0; i < courses.length; i++) {

                        courseIds.push(courses[i]._id);
                    }

                    Lesson.find({
                        'courseId': {
                            '$in': courseIds
                        }
                    })
                        .populate('courseId')
                        .exec(function (err, lessons) {
                            if (err) throw err;
                            resp.render('deleteLesson', {
                                lessons: lessons,
                                user: req.session.user
                            });
                        });

                }
            });
    }

});

app.delete('/deleteLesson/:id', function (req, resp) {
    if (!req.session.user) {
        resp.render('register');
    } else {
        Lesson.findById(req.params.id).remove(function (err, data) {
            if (err) {
                resp.send({
                    status: false,
                    message: err.message
                });
            } else {
                resp.send({
                    status: true,
                    message: 'Lesson Deleted successfully'
                });
            }

        });
    }
});

/* Downloads Section */
app.get('/createCourseMaterial', function (req, resp) {
    if (!req.session.user) {
        resp.render('register');
    } else {
        Course.find({
            instructor: req.session.user._id
        })
            .exec(function (err, courses) {
                if (err) throw err;
                resp.render('createCourseMaterial', {
                    course: courses,
                    user: req.session.user
                });
            });
    }
});

app.post('/createCourseMaterial', urlencodedParser, function (req, resp) {
    var courseDownload = new Download({
        _id: new mongoose.Types.ObjectId(),
        name: decodeURIComponent(req.body.name),
        description: decodeURIComponent(req.body.description),
        courseId: req.body.courseId,
        path: req.body.filePath
    });

    courseDownload.save(function (err) {
        if (err) {
            resp.send({
                status: false,
                message: err.message
            });
        } else {
            resp.send({
                status: true,
                message: 'Course Material Added successfully'
            });
        }
    });

});

var downloadStorage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, './public/assets/downloads');
    },
    filename: function (req, file, callback) {
        callback(null, Date.now() + '_' + file.originalname);
    }
});

var uploadFile = multer({
    storage: downloadStorage
}).single('downloadFile');

app.post('/courseFileUpload', function (req, res) {
    uploadFile(req, res, function (err) {
        if (err) {
            res.send({
                status: false,
                message: err.message
            });
        } else {
            res.send({
                status: true,
                filePath: req.file.filename
            });
        }
    });
});

app.get('/updateCourseMaterial', function (req, resp) {

    if (!req.session.user) {
        resp.render('register');
    } else {
        Course.find({
            instructor: req.session.user._id
        })
            .exec(function (err, courses) {
                if (err) throw err;
                resp.render('updateCourseMaterial', {
                    course: courses,
                    user: req.session.user
                });
            });
    }
});

app.post('/getMaterialList', urlencodedParser, function (req, resp) {
    Download.find({
        courseId: req.body.courseId
    })
        .exec(function (err, download) {
            if (err) {
                resp.send({
                    status: false,
                    message: err.message
                });
            } else {
                resp.send({
                    status: true,
                    material: download
                });
            }

        });
});
app.post('/updateCourseMaterial', urlencodedParser, function (req, resp) {

    Download.findById(req.body.id, function (err, material) {
        if (err) {
            resp.send({
                status: false,
                message: err.message
            });
        } else {
            material.name = decodeURIComponent(req.body.name),
                material.description = decodeURIComponent(req.body.description),
                material.path = req.body.filePath

            material.save(function (err) {
                if (err) {
                    resp.send({
                        status: false,
                        message: err.message
                    });
                } else {
                    resp.send({
                        status: true,
                        message: 'Course Material Updated successfully'
                    });
                }

            });
        }
    });
});
app.get('/deleteCourseMaterial', function (req, resp) {
    if (!req.session.user) {
        resp.render('register');
    } else {
        var courseIds = [];
        Course.find({
            instructor: req.session.user._id
        })
            .exec(function (err, courses) {
                if (!err) {
                    for (var i = 0; i < courses.length; i++) {

                        courseIds.push(courses[i]._id);
                    }
                    Download.find({
                        'courseId': {
                            '$in': courseIds
                        }
                    })
                        .populate('courseId')
                        .exec(function (err, material) {
                            if (err) throw err;
                            resp.render('deleteCourseMaterial', {
                                material: material,
                                user: req.session.user
                            });
                        });

                }
            });
    }

});

app.delete('/deleteCourseMaterial/:id', function (req, resp) {
    if (!req.session.user) {
        resp.render('register');
    } else {
        Download.findById(req.params.id).remove(function (err, data) {
            if (err) {
                resp.send({
                    status: false,
                    message: err.message
                });
            } else {
                resp.send({
                    status: true,
                    message: 'Course Material Deleted successfully'
                });
            }

        });
    }
});

/* Edit Profile */

app.get('/editProfile', function (req, resp) {

    if (!req.session.user) {
        resp.render('register');
    } else {
        resp.render('editProfile', {
            user: req.session.user
        });
    }
});

app.post('/changeProfile', urlencodedParser, function (req, resp) {

    User.findById(req.session.user._id, function (err, user) {
        if (err) throw err;
        
        user._id = req.session.user._id;
        user.name = req.body.name;
        user.emailId = req.body.emailId;

        user.save(function (err) {
            if (err) {
                resp.send({
                    status: false,
                    message: err.message
                });
            } else {
                resp.send({
                    status: true,
                    message: 'Profile Updated successfully'
                });
            }
        });
    });
});

app.post('/changePassword', urlencodedParser, function (req, resp) {

    User.findById(req.session.user._id, function (err, user) {
        if (err) throw err;
        
        user.password = req.body.password;

        user.save(function (err) {
            if (err) {
                resp.send({
                    status: false,
                    message: err.message
                });
            } else {
                resp.send({
                    status: true,
                    message: 'Password Changed successfully'
                });
            }
        });
    });
});

/* Course Content */
app.get('/courseContent/:id', function (req, resp) {
    var courseId = req.params.id;
    if (!req.session.user) {
        resp.render('register');
    } else {
        Lesson.find({
            courseId: courseId
        }).populate('courseId')
            .exec(function (err, lessons) {
                if (err) throw err;
                resp.render('courseContent', {
                    lessons: lessons,
                    user: req.session.user
                });

            });
    }

});

/* Course Material */

app.get('/myCourseMaterial', function (req, resp) {
    if (!req.session.user) {
        resp.render('register');
    } else {
        var courseIds = [];
        User.findById(req.session.user._id, function (err, user) {
            if (err) {
                resp.send({
                    status: false,
                    message: err.message
                });
            } else {
                for (var i = 0; i < user.enrolledCourses.length; i++) {
                    courseIds.push(user.enrolledCourses[i].courseId);
                }

                Download.find({
                    courseId: {
                        '$in': courseIds
                    }
                }).populate('courseId')
                    .exec(function (err, download) {
                        if (err) {
                            throw err;
                        } else {
                            resp.render('myCourseMaterial', {
                                material: download,
                                user: req.session.user
                            });
                        }
                    });
            }
        });
    }
});
module.exports = app;