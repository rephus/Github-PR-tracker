//dependencies
var express = require("express");
var env = require('node-env-file');
var request = require('superagent');

var logFactory = require('./helpers/log.js');
var log = logFactory.create("app");

//Exports app make it testable from supertest
var app = exports.app = express();

try {
 env(process.cwd() + '/.env');
} catch(err){}

global.env = process.env;

/**
 *  == Load models ==
 */

/**
 *  == Load utils ==
 */
var utils = require('./helpers/utils.js');

//var minify = require('./helpers/minify.js');
//minify.public();

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(express.static(__dirname + '/public'));

/**
 *  == Load controllers ==
 */
 app.get('/user',function(req, res){
    //Can request https://api.github.com/user to get my user name from github-api
     res.json({response: {name: process.env.GITHUB_USERNAME}});

 });
 app.get('/issues-search',function(req, res){
     var token = req.query.token;
     var search = encodeURIComponent(req.query.search);

     var domain = "https://api.github.com";
     var url = domain + "/search/issues?access_token="+token+"&q="+search;
     log.info("Making request to github: "+ url);

     var debug=false;
     /*IF debug is true, it will return a pre-saved json response,
      to prevent useless requests to github. */
     if (debug){
       var testJson = require('./test.json');
       res.json(testJson);

      } else {
        request
         .get(url)
         .end(function(err, response){

           if (err)  {
             log.error("Unable to get response from github", err, response);
             res.json({error: err});
           } else{
             res.json(response.body);
           }
         });
      }

 });

app.listen(process.env.PORT);
log.info("Server started in http://localhost:"+process.env.PORT);
