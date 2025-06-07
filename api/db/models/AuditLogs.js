// veritabanı tablosu modelini oluşturacağız
//veriatbanaı bağlantsını oluşturan kütüphane mongoose olduğu için buraya da tanımlıyoruz
const mongoose= require("mongoose");

// Schema oluşturma
const schema = mongoose.Schema({
    // id değerini mongoose otomati olarak tanımlar bu yüzden tanımlamamıza gerek yok
    level: String,
    email: String,
    location: String,
    proc_type: String,
    log: mongoose.SchemaTypes.Mixed,
}, {
    versionKey:false,
    timestamps:{
        createdAt: "created_at",
        updatedAt: "updated_at"
    }
});

// Users class extend edildiğinde mongoose.Model class'ının içindeki attribute'ları kullanabiliyor onları overwrite edebiliyor
// hook mantığı, belirli olaylar (örneğin bir verinin kaydedilmesi, güncellenmesi, silinmesi) öncesinde ya da sonrasında çalışan özel fonksiyonlar anlamına gelir.
class AuditLogs extends mongoose.Model {
  
}

// User class'ını şemaya dahil ediyoruz
schema.loadClass(AuditLogs);

// 1. parametre: collection (tablo) ismimiz, 2.parametre schema
module.exports = mongoose.model("audit_logs", schema);