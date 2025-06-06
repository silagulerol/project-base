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
const config= require('../config');
const i18n= new (require('../lib/i18n'))(config.DEFAULT_LANG);
const emitter= require('../lib/Emitter');
const exportExcel = new (require("../lib/Export"))();
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const Import = require('../lib/Import');
const excelImport = new (require('../lib/Import'))();


let multerStorage = multer.diskStorage({
  // req: atılan request içeriği, file: yüklenen dosya, next: tetiklenen callback fonksiyon hata fırlatılmıyorsa
  destination: (req, file, next) => {
    next(null, config.FILE_UPLOAD_PATH)
  },
  filename: (req,file, next) =>{
    next(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer( {storage: multerStorage}).single("pb_file");



router.all('*', auth.authenticate(), (req, res, next) => {
    next();
});

/* GET users listing. */
router.get('/',  /*auth.checkRoles("category_view"), */async (req, res, next) =>{
  
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
router.post('/add', /*auth.checkRoles("category_add") , */async (req, res) => {
  let body = req.body;
  try {
    // Code alanlarını Enum olarak kullanmak için config'e Enum tanımladık. Burada da validation failed vericez
    if(!body.name) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language), i18n.translate("COMMON.FIELD_MUST_BE_FILLED", req.user.language, ["name"] ));

    // ilk önce category modelinin nesnesini oluştururyoruz
    let category = new Categories({
      name: body.name,
      is_active: true,
      created_by: req.user?.id
    });

    await category.save();

    AuditLogs.info(req.user?.email, "Categories", "Add", category);
    logger.info(req.user?.email, "Categories", "Add", category)
    // emit yapmayı broadcast gibi düşünebiriz messages olayına data gönderiyoruz
    emitter.getEmitter("notifications").emit("messages", { message: category.name + " is added" });
    
    res.json(Response.successResponse({success:true}));

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
    if(!body._id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language), i18n.translate("COMMON.FIELD_MUST_BE_FILLED", req.user.language, ["_id"] ));
    
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
     if(!body._id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language), i18n.translate("COMMON.FIELD_MUST_BE_FILLED", req.user.language, ["_id"] ));

    let deleted =await Categories.deleteOne({_id: body._id});
    
    AuditLogs.info(req.user?.email, "Categories", "Delete", {_id:body._id});
    
    res.json(Response.successResponse({success: true}))

  }catch (err) {
    
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
 
});

router.post('/export' , /*auth.checkRoles("category_export"),*/ async (req, res, next) => {
  try{
    let categories = await Categories.find({});

    let excel = exportExcel.toExcel(
       ["NAME", "IS ACTIVE?", "USER_ID", "CREATED AT", "UPDATED AT"],
       ["name", "is_active", "created_by", "created_at", "updated_at"],
       categories
    );

    let filePath = __dirname + "/../tmp/categories_excel_" + Date.now() + ".xlsx";

    fs.writeFileSync(filePath, excel, "UTF-8");

    res.download(filePath);

    //fs.unlinkSync(filePath);

  } catch(err) {
     let errorResponse = Response.errorResponse(err);
     res.status(errorResponse.code).json(errorResponse);
  }
});

router.post('/import', /*auth.checkRoles("category_add"),*/upload, async(req, res,next) =>{
  try {
    let file =req.file;
    let body = req.body;

    let rows = excelImport.fromExcel(file.path);

    //ilk olarak bir format belirliyoruz
    for (let i=1; i < rows.length; i++) {
      let [name, is_active, user, created_at, updated_at] = rows[i];

      if(name) {
        await Categories.create({
          name: name,
          is_active: is_active,
          created_by: req.user._id //excel dosyasında bu alan boş olduğu için gelen requestten çektik
        });
      }
      
    }

    res.status(Enum.HTTP_CODES.CREATED).json(Response.successResponse(req.body, Enum.HTTP_CODES.CREATED));

  } catch(err) {
     let errorResponse = Response.errorResponse(err);
     res.status(errorResponse.code).json(errorResponse);
  }
})

module.exports = router;
