// veritabanı tablosu modelini oluşturacağız
//veriatbanaı bağlantsını oluşturan kütüphane mongoose olduğu için buraya da tanımlıyoruz
const mongoose= require("mongoose");
const Enum = require('../../config/Enum');
const is =require("is_js"); 
const bcrypt = require('bcrypt-nodejs');


// Schema oluşturma
const schema = mongoose.Schema({
    email: {type: String, required:true, unique:true},
    password: {type: String, required:true},
    is_active: {type: Boolean, default:true},
    first_name: String,
    last_name: String,
    phone_number: String
}, {
    versionKey:false,
    timestamps:{
    createdAt: "created_at",
    updatedAt: "updated_at"
    }
});

// Users class extend edildiğinde mongoose.Model class'ının içindeki attribute'ları kullanabiliyor onları overwrite edebiliyor
// hook mantığı, belirli olaylar (örneğin bir verinin kaydedilmesi, güncellenmesi, silinmesi) öncesinde ya da sonrasında çalışan özel fonksiyonlar anlamına gelir.
class Users extends mongoose.Model {

    validatePassword(password){
        return bcrypt.compareSync(password, this.password); // buradaki this validPasswprd metodunu çağıran kullanıcının password fieldindeki değer
    }

    static validateFieldsBeforeAuth(email, password) {
      if(typeof password !== String || password.length < Enum.PASS_LENGTH || is.not.email(email) ){
          return false;      
      }
      return null;
  }
}

// User class'ını şemaya dahil ediyoruz
schema.loadClass(Users);

// 1. parametre: collection (tablo) ismimiz, 2.parametre schema
module.exports = mongoose.model("Users", schema);