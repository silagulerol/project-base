// Bu dosya bizim connectionımızı oluşturucak olan dosya

const mongoose = require('mongoose');

let instance= null;
class Database {

    // constructor'da bu class'ı singleton haline getiririz
    // Singleton (tekil), nesne yönelimli programlamada (OOP) bir sınıfın yalnızca bir tane örneğinin (instance) oluşturulmasına izin veren bir tasarım desenidir.
    // Uygulamanın farklı yerlerinden bu nesneye erişildiğinde, her seferinde aynı örnek (instance) kullanılır.
    // Singleton deseni sayesinde MongoDB bağlantısı uygulama boyunca sadece bir kez kurulur, böylece:
    // Tek bir bağlantı y   önetilir. Bellek kullanımı optimize olur. Her require/import çağrısında yeni bağlantı yerine var olanı kullanır. Hatalı tekrar bağlantılar engellenmiş olur.

    constructor(){
        // !instance means bu instance tanımlı mı
        if(!instance){
            this.mongoConnection = null;
            instance = this;
        }
        return instance;
    }

    //monogdb connection sağlayacak bir function oluşturuyorum. options: connection yaparken kullanalacak parametreler
    async connect(options){
        try{
            console.log("DB connecting");

            let db= await mongoose.connect(options.CONNECTION_STRING);

            this.mongoConnection= db; 
            console.log("DB connected");
        }catch(err){
            console.error(err);
            process.exit(1);

        }

        
    }
}

// sonrasında class'ı export edince class modul halinde import edilebilinir olucak 
module.exports = Database