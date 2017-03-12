// config/passport.js

// load all the things we need
var LocalStrategy = require('passport-local').Strategy;

// load up the user model
var User = require('../models/user');

// expose this function to our app using module.exports
module.exports = function (passport) {

    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
            done(err, user);
        });
    });

    passport.use('local-signup', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    }, function (req, email, password, done) {
        process.nextTick(function () {
            User.findOne({ 'email': email }, function (err, user) {
                if (err)
                    return done(err);
                if (user) {
                    return done(null, false, { message: 'this email is already taken' });
                } else {

                    var newUser = new User();
                    newUser.email = email;
                    newUser.password = newUser.generateHash(password);

                    newUser.save(function (err) {
                        if (err)
                            throw err;
                        return done(null, newUser);
                    });
                }
            });
        });
    }));

    passport.use('local-login', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    }, function (req, email, password, done) {

        User.findOne({ 'email': email }, function (err, user) {
            if (err)
                return done(err);

            if (!user)
                return done(null, false, { message: 'no user found by email' });

            if (!user.validPassword(password))
                return done(null, false, { message: 'wrong password' }); // create the loginMessage and save it to session as flashdata

            return done(null, user);
        });

    }));

};