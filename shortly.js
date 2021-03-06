var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');
var bcrypt = require('bcrypt-nodejs');
var escape = require('escape-html');
var cookieParser = require('cookie-parser');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();
app.use(cookieParser('asdf1234'));
app.use(session({
  secret: "asdf1234"
}));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
// app.use(express.session());

app.get('/', 
function (req, res) {
  if (!req.session.username){
    res.redirect('/login');
  } else {
    res.render('index');
  }
});

app.get('/create', 
function (req, res) {
  if (!req.session.username){
    res.redirect('/login');
  } else {
    res.render('/index');
  }
});

app.get('/links', 
function (req, res) {
  if (!req.session.username){
    console.log('accessing links without login');
    res.redirect('/login');
  } else {
    console.log('should fetch links next');
    Links.reset().fetch().then(function(links) {
      res.send(200, links.models);
    });
  }
});

app.post('/links', 
function (req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        Links.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        })
        .then(function(newLink) {
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/
app.get('/login', 
function(req, res) {
  res.render('login');
});

app.get('/signup', 
function(req, res) {
  res.render('signup');
});

app.get('/logout', 
function(req, res) {
  req.session.destroy(function(){
    res.redirect('login');
  });
});


app.post('/login', function(req, res) {
  var username = req.body.username;
  var password =req.body.password;
  User.where('username', '=', escape(username))
    .fetch()
    .then(function(user){ 
      if(user){

        var salt = user.get('salt');
        bcrypt.compare(password, user.get('password'), function (err, result) {
          if (result) {
            req.session.regenerate(function() {
              req.session.username = username;
              res.redirect('/');
            });
          } else {
            res.redirect('/login');
          }
        });
      } else {
        res.redirect('/login');
      }
    });
});

app.post('/signup', function (req, res) {
  var username = req.body.username;
  var password =req.body.password;
  User.where('username', '=', escape(username))
    .fetch()
    .then(function (model){
      if (!model) {
        // var salt = bcrypt.genSaltSync(10);
        // var hash = bcrypt.hashSync(password, salt);

        new User({
          'username': username
          // 'salt': salt,
          //'password': password
        }).save({username: username, password: password}).then(function() {
          req.session.regenerate(function() {
            req.session.username = username;
            res.redirect('/');
          });
        });
      } else {
        console.log('redirecting');
       res.redirect('/login');
      }
    });
});
/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});


console.log('Shortly is listening on 4568');
app.listen(4568);
