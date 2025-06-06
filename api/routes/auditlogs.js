const express=  require("express");
const router= express.Router();
const Response =require("../lib/Response");
const AuditLogs = require("../db/models/AuditLogs");
const moment= require("moment");
const auth = require('../lib/auth')();

// Endpoint oluşturulması: router geliştirmek
// request: gelen requestin body,headers, params ve query fieldalarını içerir, 
// response: geri döndürülücek cevap için kullanılacak methodları barındırır, next: başka bir router'a gidilecekse vs.
// body url'le eklenmez, query ve params url'e eklenir, 
// params eklenmiş url farklı bir endpoint gibi davranır query eklnemiş aksine

router.all('*', auth.authenticate(), (req, res, next) => {
    next();
});

router.post("/", auth.checkRoles("auditlogs_view"), async (req, res,) => {
    try{
        let body = req.body;
        let query = {};
        let skip= body.skip; 
        let limit= body.limit;

        if( typeof body.skip !== "number"){
            skip = 0;
        }

        if (typeof body.limit !== "number" || body.limit > 500) {
            limit = 500;
        }

        if(body.begin_date && body.end_date){
            query.created_at ={
                $gte: moment(body.begin_date),
                $lte: moment(body.end_date)
            };
        }else {
            query.created_at ={
                $gte: moment().subtract(1, "day").startOf("day"),
                $lte: moment()
            };
        }

        let auditLogs = await AuditLogs.find(query).sort({created_at: -1}).skip(skip).limit(limit);

        res.json(Response.successResponse(auditLogs));

    }catch(err){
        let errorResponse = Response.errorResponse(err);
        res.status(errorResponse.code).json(errorResponse);
    }
});

module.exports = router