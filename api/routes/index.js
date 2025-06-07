var express = require('express');
var router = express.Router();

const config= require("../config");

const fs =require("fs");

//let routes =fs.readdirSync("./routes");
let routes =fs.readdirSync(__dirname);

console.log(routes);
//her bir route yani js dosyasi mi string

// appten gelen her bir requesti endpoimtine göre doğru router'a yönlendiririz
for(let route of routes){
  if (route.includes(".js") && route != "index.js" ){
    //middleware tanımlıyoruz ve require ettiğimiz için her route sonunda mutlaka router export edilmiş olmalı
    router.use('/' + route.replace(".js", "") , require('./' + route)) ;
  }
}

module.exports = router;
