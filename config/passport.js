var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;

var User = require('../app/models/user');
var config = require('../config/database');

module.exports = function(passport) {
  var opts = {};
  opts.jwtFromRequest = ExtractJwt.fromAuthHeader();
  opts.secretOrKey = config.secret;
  // opts.issuer = "accounts.issuer.com";
  // opts.audience = "audience.com";
  passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
    User.findOne({ id: jwt_payload.id }, function(err, user) {
      if (err) {
        return done(err, false);
      } else {
        if (user) {
          done(null, user);
        } else {
          done(null, false);
        }
      }
    });
  }));
};