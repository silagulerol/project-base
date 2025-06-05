const mongoose= require("mongoose");

const schema= mongoose.Schema({
    name: { type:String, required:true },
    is_active:{type:Boolean, default: true},
    created_by: {type: mongoose.SchemaTypes.ObjectID, /*required:true*/},
},{
    versionKey:false,
    timestamps:{
        createdAt: "created_at",
        updatedAt: "updated_at",

    }
});

class Categories extends mongoose.model{

}

// schema.loadClass(myClassName) : myClassName sınıfına tanımlanmış metodları, statik fonksiyonları, getter/setter'ları alıp Mongoose şemasına ekler.
// bu yöntem sayesinde şema üzerine sınıf tabanlı metodlar yazabilirsin.Böylece şemaya direkt olarak: örnek (instance) metodlar,  statik metodlar, getter/setter'lar tanımlayabiliriz.
schema.loadClass(Categories);
module.exports= mongoose.model("categories", schema);
