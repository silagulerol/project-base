const express = require("express");
const moment = require("moment");
const Response = require("../lib/Response");
const AuditLogs = require("../db/models/AuditLogs");
const Categories = require("../db/models/Categories");
const Users = require("../db/models/Users");
const router = express.Router();
const auth = require("../lib/auth")();

router.all('*', auth.authenticate(), (req, res, next) => {
    next();
});

/**
1. AuditLogs tablosunda işlem yapan kişilerin hangi tip işlemi kaç kez yaptığını veren bir sorgu.
2. Kategori tablosunda tekil veri sayısı.
3. Sistemde tanımlı kaç kullanıcı var?
 */

// /api/stats/auditlogs
router.post("/auditlogs", async (req, res) =>  {
    try{
        let body =req.body;;
        let filter = {};

        if (typeof body.location === "string") filter.location = body.location;

        // aggregate fonksionu bir pipleine alır ve birden fazla işlemi adım adım yapabiliriz.
        let result = await AuditLogs.aggregate([
            {$match: filter}, // AuditLogs tablosundan şu filtreye uygun verileri çek,
            
            //bir alana göre gruplama yaptığımızda süslü pareantez açmamıza gerek yok, örn: 
            {$group: { _id: {email: "$email", proc_type: "$proc_type"}, count: {$sum:1} }},//kişiye göre ve iş tipine göre gruplama
            
            {$sort: {count: -1}} // yukarıda elede ettiğimiz count'a göre sıralama
        ]);  

        res.json(Response.successResponse(result));

    }catch(err) {
        let errorResponse = Response.errorResponse(err, req.user?.language );
                res.status(errorResponse.code).json(errorResponse);
    }

});

// /api/stats/categories/unique
router.post("/categories/unique", async (req, res) =>  {
    try{
        
        let body =req.body;;
        let filter = {};

        if (typeof body.is_active === "boolean") filter.is_active = body.is_active;

        // distinct bize ilk parametrede vericeğimiz field'a göre tekil parametreleri getirmemizi sağlıyor, ikinci parametre de filtre alanımız
        let result = await Categories.distinct("name", filter);

        res.json(Response.successResponse( {result, count:result.length} ));

    }catch(err) {
        let errorResponse = Response.errorResponse(err, req.user?.language );
                res.status(errorResponse.code).json(errorResponse);
    }

});


router.post("/users/count", async (req, res) =>  {
    try{
        
        let body =req.body;;
        let filter = {};

        if (typeof body.is_active === "boolean") filter.is_active = body.is_active;

        // distinct bize ilk parametrede vericeğimiz field'a göre tekil parametreleri getirmemizi sağlıyor, ikinci parametre de filtre alanımız
        let result = await Users.countDocuments(filter);

        res.json(Response.successResponse(result));

    }catch(err) {
        let errorResponse = Response.errorResponse(err, req.user?.language );
                res.status(errorResponse.code).json(errorResponse);
    }

});

module.exports= router;