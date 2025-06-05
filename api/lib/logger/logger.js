//destructuring assignment
const { format, createLogger, transports } = require('winston');
const {LOG_LEVEL} = require('../../config');

//log formatı oluşturma- combine methodu birleştirilmiş hali oluyor birden fazla metodun örn json , simple...
const formats = format.combine(
    format.timestamp({format:"YYYY-MM-DD HH:mm:ss:SS"}),
    format.simple(), //oluşturulacak yapı string olucak demek
    format.splat(),

    // format.printf() method defines how each log message should be formatted into a string before it's written to the output (e.g., console, file, database). 
    // info: an object containing log data. Common fields: timestamp(yukarıdaki formattan alıyor), level (bunu info metodunda alıyor loggerClass .js ' de kullandığımız),
    //  message (LoggerClass'da oluşturduğumuz log objesi paramaetreleri info.message altına ekleniyor).
    //It returns a formatted string like this:[2025-06-4] INFO: [email:asd] [location:asd] [procType:asd] [log:{}] - oluşturmak istediğimiz format yapısı
    format.printf(info => `${info.timestamp} ${info.level.toUpperCase}: [email:${info.message.email}] [location:${info.message.location}] [procType:${info.message.procType}] [log:${info.message.log}]`)

);

// oluşturduğumuz formatı logger kullanarak tanımlayalım

const logger = createLogger({
    //hangi level'a kadar log basılacak. log levellar bir sıralamaya göre gerçekleşir. Verdiğimiz log levelına kadar olan tüm levellardaki logları basar verdiğimiz dahil. sonrasındakilere basmaz.
    level: LOG_LEVEL,
    //transports nereye basabileceğimizi söyler stream, http, console...
    transports: [
        new (transports.Console)({ format: formats })
    ]
});

module.exports = logger;