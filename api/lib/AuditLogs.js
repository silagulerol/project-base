const AuditLogsModel = require("../db/models/AuditLogs");
const Enum= require("../config/Enum");


class AuditLogs{
     constructor() {
        if (!AuditLogs.instance) {
            AuditLogs.instance = this;
        }

        return AuditLogs.instance;
    }

    // level'lara göre metodalrı yazıyoruz

    info(email, location, proc_type, log){
        this.#saveToDb({
            level: Enum.LOG_LEVELS.INFO, 
            email, location, proc_type, log
        });
    }

    warn(email, location, proc_type, log){
        this.#saveToDb({
            level: Enum.LOG_LEVELS.WARN,
            email, location, proc_type, log
        });
    }

    error(email, location, proc_type, log){
        this.#saveToDb({
            level: Enum.LOG_LEVELS.ERROR,
            email, location, proc_type, log
        });
    }

    debug(email, location, proc_type, log){
        this.#saveToDb({
            level: Enum.LOG_LEVELS.DEBUG,
            email, location, proc_type, log
        });
    }

    verbose(email, location, proc_type, log){
        this.#saveToDb({
            level: Enum.LOG_LEVELS.VERBOSE,
            email, location, proc_type, log
        });
    }

    http(email, location, proc_type, log){
        this.#saveToDb({
            level: Enum.LOG_LEVELS.HTTP,
            email, location, proc_type, log
        });
    }

    // veritabanına kayıt metodu, bu metoda gelen verileri kaydedicez, email parametresi işlemi kimin yaptığını temsil eder
    // '#' koyarak saveToDb metodunu private yaptık böylece başka bir class'dan erişilemez
    #saveToDb({level, email, location, proc_type, log}) {
        // await yazmadık çünkü her log yazmada veritabanına kayıt işlemini bekleyecek uygulama, bu da uygulama yavaşlığına yol açar
        AuditLogsModel.create({
            level,
            email,
            location,
            proc_type,
            log
        });

     }
}

//singleton olduğu için her defasında aynı instance dönücek constructor çalıştırıldığında
module.exports= new AuditLogs();