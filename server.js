var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var passport = require('passport');
var jwt = require('jsonwebtoken');
var mongoose = require('mongoose');
var config = require('./config/database');
var User = require('./app/models/user');
var port = process.env.PORT || 8080;

// parse for requests
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// log to console
app.use(morgan('dev'));

// use the passport package 
app.use(passport.initialize());

// connect to mongodb
mongoose.connect(config.database);

// passport for configuration
require('./config/passport')(passport);

// default route
app.get('/', function(req, res) {
  res.send('Hello! API is running well');
});


// api routes
var apiRoutes = express.Router();

apiRoutes.post('/signup', function(req, res) {
  if (!req.body.name || !req.body.password) {
    res.json({ success: false, msg: 'Please pass name and password' });
  } else {
    var newUser = new User({
      name: req.body.name,
      password: req.body.password
    });
    // save user
    newUser.save(function(err) {
      if (err) {
        return res.json({ success: false, msg: 'Username already exists.'});
      } 
      res.json({ success: true, msg: 'Create new user successfully.'});
    });
  }
});

apiRoutes.post('/authenticate', function(req, res) {
  User.findOne({
    name: req.body.name
  }, function(err, user) {
    if (err) {
      throw err;
    } else {
      if (!user) {
        res.send({ success: false, ms: 'Authentication failed, user not found.'});
      } else {
        user.comparePassword(req.body.password, function(err, isMatched) {
          if (isMatched && !err) {
            var token = jwt.sign(user, config.secret);
            res.json( {success: true, token: 'JWT ' + token});
          } else {
            res.send({success: false, msg: 'Authentication failed, wrong password.'});
          }
        });
      }
    }
  });
});

apiRoutes.get('/memberinfo', passport.authenticate('jwt', { session: false }), function(req, res) {
  console.log(req.headers);
  var token = getToken(req.headers);
  if (token) {
    var decoded = jwt.decode(token, config.secret);
    User.findOne({
      name: decoded._doc.name
    }, function(err, user) {
      if (err) throw err;
      if (!user) {
        return res.status(403).send({ success: false, msg: 'Authentication failed, use valid token'});
      } else {
        res.json({ success: true, msg: 'Welcome in the member area ' + user.name + '!'});
      }
    });
  } else {
    return res.status(403).send({success: false, msg: 'No token provided'});
  }
});

var getToken = function(headers) {
  if (headers && headers.authorization) {
    var parted = headers.authorization.split(' ');
    if(parted.length === 2) {
      return parted[1];
    } else {
      return null;
    }
  } else {
    return null;
  }
};

app.use('/api', apiRoutes);

app.listen(port, function() {
  console.log('The api is listneing on port ' + port);
});