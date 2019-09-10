var chai = require('chai');
var chaiHttp = require('chai-http');
var session = require('express-session');
var app = require('../index');


var expect = chai.expect;
chai.use(chaiHttp);

describe('LMS TEST CASES',function(){
    this.timeout(15000);
    it('Home Page',function(done){
        chai.request(app)
            .get('/')
            .end(function(err,res){
                expect(res).to.have.status(200);
                done();
            });
    });
    

    it('View Register & Login page with the status 200',function(done){
        chai.request(app)
        .get('/register')
        .end(function(err,res){
            expect(res).to.have.status(200);
            done();
        });
    });

    it('User Registration',function(done){
        chai.request(app)
        .post('/register')
        .send({name:'saquib',emailId:'saquib155@gmail.com',password:'saquib@123',type:'1'})
        .end(function(err,res){
            if(err){
                console.log(err);
            }else{
                console.log('Register successfully.');
            }
            done();
        });
    });

    it('User Login',function(done) {
        chai.request(app)
        .post('/login')
            .send({ usernameTb:'amit1@gmail.com'})
        .end(function(err,res){
            var user = res.user;
            done(); 
        });
    });

    it('Dashboard',function(done){
        chai.request(app)
        .get('/dashboard')
        .end(function(err,res){
            console.log(res.status);
            console.log(res);
            done();
        });
    });

});
