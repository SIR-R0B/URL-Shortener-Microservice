'use strict';

const EXPRESS = require('express');
const MONGO = require('mongodb');
const MONGOOSE = require('mongoose');
const CORS = require('cors');
const DNS = require('dns');

const APP = EXPRESS();

// Basic Configuration 
const PORT = process.env.PORT || 3000;

/** this project needs a db !! **/ 
MONGOOSE.connect(process.env.MONGOLAB_URI, {useNewUrlParser: true});

//create the schema

const Schema = MONGOOSE.Schema;

const urlSchema = new Schema({
  
  original_url: String,
  short_url: String
}, 
  {timestamps: true}
  
);

const ModelClass = MONGOOSE.model('shortUrl',urlSchema);

APP.use(CORS());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
const BODYPARSER = require('body-parser');
APP.use(BODYPARSER.urlencoded({ extended: false }));

/*
bodyParser.urlencoded({extended: ...}) basically tells the system whether you want 
to use a simple algorithm for shallow parsing (i.e. false) or complex algorithm for 
deep parsing that can deal with nested objects (i.e. true).
*/

//allows node to find static index.html
APP.use('/public', EXPRESS.static(process.cwd() + '/public'));

APP.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
APP.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

APP.get("/api/shorturl/:shorturl", function (req, res) {
  
  //assumes valid shorturl param is passed. error handling not included in user requirements for this challenge.
  let shortenedUrl = req.params.shorturl;
  ModelClass.findOne({short_url: shortenedUrl},function (err, data) {
    
    if (err) return (err.stack); //handle invalid shorturl param passed here
      
    res.redirect(data.original_url);
    
    return (null,data);
    })

});

APP.post("/api/shorturl/new/", (req, res, next) => {
  
  let originalUrl = req.body.url; //submitted through the form on the index page
  
  //need to strip http:// or https:// as the DNS.lookup looks up dns
  
  let regex = /^(http|https)(\:\/\/)(www\.)*/g;
  
  //let dnsOfOriginalUrl = originalUrl.replace(regex,"");
    
DNS.lookup(originalUrl.replace(regex,""),(err,address,family)=>{

  if(err){
  console.log(err.stack);
    return res.json({error:"invalid URL"}); //handle invalid URL 
  }
  
  //requirements specifies valid URLs as MUST follow http(s)://www.example.com(/more/routes) format. 
  if(!regex.test(originalUrl)){
  return res.json({error:"invalid URL"}); //handle invalid URL ie. news.google.com fails
  }
  
  //requirements do not specifiy a high degree of app robustness. E.g. more robust would be to check if originalUrl already exists in the db, if yes, return the existing record
  
  var url = new ModelClass({original_url: originalUrl, short_url: (Math.floor(Math.random()*100000)).toString()});
  url.save(function (err, data) {
    if (err) return (err.stack);
    return (null,data);
    })
  
  res.json({"original_url": url.original_url, "short_url": url.short_url});
});   



});



APP.listen(PORT, function () {
  console.log('Node.js listening ...');
});