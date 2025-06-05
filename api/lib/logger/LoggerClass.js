// logger'ı kullnmak için bu LoggerClass sınıfını kullanıyoruz
// Neden LoggerClass' oluşrmadan, direk logger class'ı import edip kullavnacağımız yerde logger.error() çağırmadıkda bu class'ı oluşturduk?
// Çünkü Kişisel verilerin maskelenmesini bu class üzerinden loglamadan önce gerçekleştirebiliriz.


const logger = require('./logger');

let instance = null;
/**
 #mask(message){
    return message+"*"
 }
 */
class LoggerClass {
    constructor() {
        if(!instance) {
            instance =this 
        }
        return instance;
    }

    // objemşzi oluşturacak metod
    #createLogObject( email, location, procType, log){
        // log = this.mask(logs);
        return {
            email, location, procType, log
        }
    }

    // bir log oluşturur aldığı parametrelerle
    info(email, location, procType, log){
        // log oluşturulur
        let logs = this.#createLogObject(email, location, procType, log);
        // info metodunu winston sayesinde kullanabiliyoruz. Bu metod bir obje alıyor(logger.js 'de format.printf içinde kullandığımız info objesine denk geliyor)
        logger.info(logs);
    }

    warn(email, location, procType, log){
        let logs = this.#createLogObject(email, location, procType, log);
        // info metodunu winston syaesinde kullanabiliyoruz. Bu metod bir obje alıyor(logger.js 'de format.printf içinde kullandığımız info objesine denk geliyor)
        logger.warn(logs);
    }
    error(email, location, procType, log){
        let logs = this.#createLogObject(email, location, procType, log);
        // info metodunu winston syaesinde kullanabiliyoruz. Bu metod bir obje alıyor(logger.js 'de format.printf içinde kullandığımız info objesine denk geliyor)
        logger.error(logs);
    }
    verbose(email, location, procType, log){
        let logs = this.#createLogObject(email, location, procType, log);
        // info metodunu winston syaesinde kullanabiliyoruz. Bu metod bir obje alıyor(logger.js 'de format.printf içinde kullandığımız info objesine denk geliyor)
        logger.verbose(logs);
    }
    silly(email, location, procType, log){
        let logs = this.#createLogObject(email, location, procType, log);
        // info metodunu winston syaesinde kullanabiliyoruz. Bu metod bir obje alıyor(logger.js 'de format.printf içinde kullandığımız info objesine denk geliyor)
        logger.silly(logs);
    }
    http(email, location, procType, log){
        let logs = this.#createLogObject(email, location, procType, log);
        // info metodunu winston syaesinde kullanabiliyoruz. Bu metod bir obje alıyor(logger.js 'de format.printf içinde kullandığımız info objesine denk geliyor)
        logger.http(logs);
    }

}

module.exports = new LoggerClass();