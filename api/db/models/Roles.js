// veritabanı tablosu modelini oluşturacağız
//veriatbanaı bağlantsını oluşturan kütüphane mongoose olduğu için buraya da tanımlıyoruz
const mongoose= require("mongoose");
const RolePrivileges = require("./RolePrivileges");

// Schema oluşturma
const schema = mongoose.Schema({
    // id değerini mongoose otomati olarak tanımlar bu yüzden tanımlamamıza gerek yok
    role_name: {type: String, required:true, unique:true},
    is_active: {type: String, default:true},
    // created_by users tablosundaki bir değer olamalı
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        //required:true
    }
}, {
    versionKey: false,
    timestamps:{
    createdAt: "created_at",
    updatedAt: "updated_at"
    }
});

// Users class extend edildiğinde mongoose.Model class'ının içindeki attribute'ları kullanabiliyor onları overwrite edebiliyor
// hook mantığı, belirli olaylar (örneğin bir verinin kaydedilmesi, güncellenmesi, silinmesi) öncesinde ya da sonrasında çalışan özel fonksiyonlar anlamına gelir.
class Roles extends mongoose.Model {
    static async deleteMany(query) {
        // eğer query'de id değeri veriilmişse RolePrivileges collection'ından aynı role_id değerine sahip documnetları sil
        if(query._id){
            await RolePrivileges.deleteMany({role_id: query._id});
        }
        await super.deleteMany(query);  
    }
}

// User class'ını şemaya dahil ediyoruz
schema.loadClass(Roles);
// 1. parametre: collection (tablo) ismimiz, 2.parametre schema
module.exports = mongoose.model("Roles", schema);