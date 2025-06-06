var express = require('express');
var router = express.Router();

// ilk önce modelimi import ediyorum, böylece artık burada mongoose.model ile bize sunduğu fonksiyonları kullanabilirm Categories modeli üzerinde
const Categories = require("../db/models/Categories"); 

//library'deki Response calss'ını import ediyorum, içindeki static metodlara ulaşmak için
const Response = require("../lib/Response");

//library'deki Error calss'ını import ediyorum, içindeki static metodlara ulaşmak için
const CustomError = require("../lib/Error");

const Enum = require("../config/Enum");

const AuditLogs = require("../lib/AuditLogs");

const logger = require('../lib/logger/LoggerClass');

const auth = require('../lib/auth')();

router.all('*', auth.authenticate(), (req, res, next) => {
    next();
});

/* GET users listing. */
router.get('/',  auth.checkRoles("category_view"), async (req, res, next) =>{
  
  try{
    // db'ye find sorgusu atılır
    let categories = await Categories.find({});

    res.json(Response.successResponse(categories));
    // dönülen response'un sabit bir yapısı olamsını istediğim için. Biriyle paylaşıldığında anlaşılır olması için.
    // örn: error döndüğünde hangi field'lar , success döndüğünde hangi field'ların olucağı
 
  } catch(err) {
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

// id'yi database verdiği için name olup olmadığının kontrolünü yaptım
router.post('/add', auth.checkRoles("category_add"), async (req, res) => {
  let body = req.body;
  try {
    // Code alanlarını Enum olarak kullanmak için config'e Enum tanımladık. Burada da validation failed vericez
    if(!body.name) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,"validation error", "name field must be filled");

    // ilk önce category modelinin nesnesini oluştururyoruz
    let category = new Categories({
      name: body.name,
      is_active: true,
      created_by: req.user?.id
    });

    await category.save();

    AuditLogs.info(req.user?.email, "Categories", "Add", category);
    logger.info(req.user?.email, "Categories", "Add", category)
    res.json(Response.successResponse({category}));

  }catch(err) {
    logger.error(req.user?.email, "Categories", "Add", err);
    // json her defasında status 200 döndürür bunu engellemek için:
    // res.status(err.code || Enum.HTTP_CODES.INT_SERVER_ERROR).json(Response.errorResponse(err));
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});


/*
router.post('/add_many', async (req, res) => {
  let body = req.body;
  try {

    let categories= body.categories;

    for(const category of categories){
      if(!category.name) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,"validation error", "name field must be filled");

      let new_category = new Categories({
        name: category.name,
        is_active: true,
      });
     
      await new_category.save();

    }
    

    res.json(Response.successResponse({categories}));

  }catch(err) {
    // json her defasında status 200 döndürür bunu engellemek için:
    // res.statsus(err.code || Enum.HTTP_CODES.INT_SERVER_ERROR).json(Response.errorResponse(err));
    
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});
*/

router.post('/update',auth.checkRoles("category_update"), async (req, res, next)=> {
  let body = req.body;
  try{
    // update edilecek objenin id'si verilmek zorunda, diğer field'lerde zorunluluk yok.
    if(!body._id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,"validation error", "_id field must be filled");
    
    //yapılan değişikliklerin kaydedildiği bir obje yarattım
    let updates ={};

    if (body.name) updates.name = body.name;
    if (typeof body.is_active === "boolean") updates.is_active = body.is_active;    
     
    await Categories.updateOne({_id:body._id}, updates);


    AuditLogs.info(req.user?.email, "Categories", "Update", {_id:body._id, ...updates});

    res.json(Response.successResponse({ success: true }))
  }catch(err){

    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});


router.post ('/delete',auth.checkRoles("category_delete"), async (req, res, next) => {
  let body = req.body;
  try{
     if(!body._id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "validation error", "_id field must be filled");

    let deleted =await Categories.deleteOne({_id: body._id});
    
    AuditLogs.info(req.user?.email, "Categories", "Delete", {_id:body._id});
    
    res.json(Response.successResponse({success: true}))

  }catch (err) {
    
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
 
});

module.exports = router;
