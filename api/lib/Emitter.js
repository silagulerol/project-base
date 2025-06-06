/**
 * Node.js’in events modülünden gelen EventEmitter, özel olaylar oluşturmak, dinlemek ve tetiklemek (emit etmek) için kullanılan temel bir sınıftır.
   Bu yapı, Observer (gözlemci) tasarım deseni üzerine kuruludur: olaylar tetiklenir (publish), dinleyiciler (listener/subscriber) bu olaylara tepki verir.
 */


const { EventEmitter } = require('events');

// Emitter class'ından her bir nesne oluşturduğumuzda aynı nesneyi elde edebilmemiz için singleton bir yapı kurmamız gerekiyor
var  instance = null;
class Emitter {

    constructor() {
        if(!instance) {
            // oluşturulan ilk instance'a (nesneye) ait bir attribute oluşturduk, sonrasında oluşturulan ilk instance'ı her yeni bir nesne yaratıldığında dönüecek olan değere atadık
            this.emitters = {};
            instance = this;
        }
        return instance;
    }

    getEmitter(name) {
        // o name key'ine karşılık gelen EventEmitter nesnesi geri döndürülür
        return this.emitters[name];
    }

    addEmitter(name) {
        //yeni bir EventEmitter nesnesi yaratınca, o nesnenin on, emit, off.. gibi metodlarını kullanabilir hale geldik 
        // name parametresini EventEmitter' VERİLMELİ Mİİ????
        this.emitters[name] = new EventEmitter(name);
        return this.emitters[name];
    }
}

module.exports = new Emitter();