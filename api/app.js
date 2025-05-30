// dotenv kütüphanesinin .env dosyasının içine yazılan parametrelerini al ve process.env dosyası içine ata
// manual bir şekilde process.env' da environment değişkenlerini  tanımlamak zor olduğu için bunu yapıyoruz 
// .env dosyası içine tanımlamaları console'a yaptığım gibi yapıyorum. 
// Ancak productiona çıkarken bu enviromentlar'ı verebileceğimiz bir ortam üzerinden çıkılır örneğin docker
//  dockerda içinde enviromentları verebilidğimiz yamal dosyası oluşturuluyor. bu yüzden .git.example dosyasını oluşturup git'e onu yüklüyoruz
// böylece hangi parametrelerin tanımlanması gerektiğini env.example'da tutmuş oluyoruz ve ortama göre değişceek olan parametreleri set etmemiş oluyoruz onu uygulamayı çalıştıracak kişilerden bekliyoruz

if (process.env.NODE_ENV != "production")
  require("dotenv").config()

/*process: node.js process'ini temsil eden global bir değişkenidir, herhangi bir tanıma ihtiyaç duymaz.
 process.env ile çevre değişlkenlerini (enviroment variables) çekmiş oluyoruz.
 alttaki kodu çalıştırınca işletim sistemindeki tanımlı tüm çevre değişkenlerini göstermiş oluyor, ancak uygulamamızda pek işimize yaramayacaklar
 bu nedenle biz özel environment parametreleri tanımlayabiliyor olmalıyız: bunun için işletim sisteminde uygulamayı çalıştırmadan önce bir tanım yapmalıyız.
 örnek: SILA =sila
*/ 

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/* manual bir şekilde tüm endpointleri bu şekilde import etmek yerine diinamik bir yapı oluşturmalıyız ve 
????api endpointi ile bu dosyalara frontendden erişimi enggelleriz?????
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));
app.use('/auditlogs', require('./routes/auditlogs'));
*/
app.use('/api', require('./routes/index'));




// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
