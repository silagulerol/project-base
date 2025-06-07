var express = require('express');
var router = express.Router();
// password hashing için
const bcrypt= require("bcrypt-nodejs");
//email kontrolü için
const is = require("is_js");
const jwt = require("jwt-simple");

const Users = require("../db/models/Users");
const Roles = require("../db/models/Roles");
const UserRoles = require("../db/models/UserRoles");
var Response = require("../lib/Response");
var CustomError= require("../lib/Error");
var Enum = require("../config/Enum");
const config = require('../config');
const auth = require('../lib/auth')();
const i18n= new (require('../lib/i18n'))(config.DEFAULT_LANG);
const  { rateLimit } = require( 'express-rate-limit')
const  RateLimitMongo = require('rate-limit-mongo');


const limiter = rateLimit({
    store: new RateLimitMongo ({
        uri:config.CONNECTION_STRING,
        collectionName: "rateLimits",
        expireTimeMs:15 * 60 * 1000, // 15 minutes
    }),
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 5, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	//standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
	// store: ... , // Redis, Memcached, etc. See below.
})


//user register
router.post('/register', async(req,res) => {
    let body = req.body; 
    try{
        let user = await Users.findOne({});

        if(user) {
            return res.sendStatus(Enum.HTTP_CODES.NOT_FOUND);
        }

        // body controls
        if(!body.email) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "validation error", "email field must be filled")

        if(is.not.email(body.email)) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "validation error", "email field must be an email ofrmat")

        if(!body.password) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "validation error", "password field must be filled")

        if(body.password.length < Enum.PASS_LENGTH) {
            throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "validation error", "password must must be gretaer than " + Enum.PASS_LENGTH)
        }

        // round (aşağıda 8) değerini büyük girmek maliyet faktörünü arttırıyor, böyleec password daha zor oluyor
        let password = bcrypt.hashSync(body.password, bcrypt.genSaltSync(8), null);
        

        //creating new user - create static olarak tanımlanmış bir metoddur, class referansıyla çağrılabilinir
        let createdUser = await Users.create({
            email:  body.email,
            password: password, //password  de yazabilirdik sadece 
            is_active: true,
            first_name: body.first_name,
            last_name: body.last_name,
            phone_number: body.phone_number
        });

        let role = await Roles.create({
            // role_name'i SUPER_ADMIN olan user her permission'a(yetkiye) sahiptir diyeceğiz ileride
            role_name: Enum.SUPER_ADMIN,
            is_active: true,
            created_by: createdUser._id // yukarıda yaratılan kullanıcının object ID'si
        });

        await UserRoles.create({
            role_id: role._id ,// // yukarıda yaratılan role'ün object ID'si
            user_id: createdUser._id // yukarıda yaratılan kullanıcının object ID'si
        });

        //CREATED kodu 201 döner ben bir şey oluşturdum demek
        res.status(Enum.HTTP_CODES.CREATED).json(Response.successResponse( {success:true} ))

    } catch(err) {
        let errorResponse = Response.errorResponse(err);
        res.status(errorResponse.code).json(errorResponse);
    }
});

// user login
router.post('/auth', limiter, async (req, res) => {
    try {

        let {email, password} = req.body;

        Users.validateFieldsBeforeAuth(email, password);

        //if(!email) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "validation error", "the email field must be filled");
        //if(!password) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "validation error", "the password field must be filled");

        // ilk önce verilen email'e sahip bir user var mı kontrolü yapılır sonrasında passsword validation kontrolü
        let user = await Users.findOne( {email} );
         
        if(!user) throw new CustomError(Enum.HTTP_CODES.UNAUTHORIZED, "validation error", "the email or password wrong"); 
        if (!user.validatePassword(password)) throw new CustomError(Enum.HTTP_CODES.UNAUTHORIZED, "validation error", "the email or password wrong"); ;

        // validationlar yapıldıktan sonra JWT Token yaratılmaya başlanır
        let payload = {
            id: user._id,
            exp: parseInt(Date.now() / 1000 ) + config.JWT.EXPIRE_TIME
        }
        
        //jwt-simple kütüphanesi encode ve decode işlemleri yapmamızı sağlar
        let token = jwt.encode(payload, config.JWT.SECRET);

        let userData = {
            _id: user._id,
            first_name: user.first_name,
            last_name: user.last_name
        }

        res.json(Response.successResponse({token, user: userData}));

    }catch(err) {
        let errorResponse = Response.errorResponse(err);
        res.status(errorResponse.code).json(errorResponse);
    }
})

router.all('*', auth.authenticate(), (req, res, next) => {
    next();
});


/* GET users listing. */
router.get('/', auth.checkRoles("user_view"), async function(req, res) {
    try {
      // {}, {password: 0} --> tüm filed'ları al ama password alma
      //{}, {password: 0, is_active:0} -->  tüm filed'ları al ama password ve is_active alma
      // {}, {password: 1} --> sadece password field'ını al (._id default döner)
      // {}, {password: 1, _id: 0} --> sadece password field'ını al (._id field'ı da dönmez)
      let users = await Users.find({}, {password: 0}).lean(); 
      
      // kullanıcı bilgilerini çektiğimde her bir document'a rol bilgilerini de ekelemk istiyorum
      for (let i=0; i < users.length; i++) {
        let roles = await  UserRoles.find( {user_id: users[i]._id}).populate("role_id");
        users[i].roles = roles;
      }

      res.json(Response.successResponse(users));

    }catch(err) {
        let errorResponse = Response.errorResponse(err);
        res.status(errorResponse.code).json(errorResponse);
    }
});

router.post('/add',auth.checkRoles("user_add"),  async(req,res) => {
    let body = req.body; 
    try{
        // body controls
        if(!body.email) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language), i18n.translate("COMMON.FIELD_MUST_BE_FILLED", req.user.language, ["email"] ));

        if(is.not.email(body.email)) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "validation error", "email field must be an email ofrmat")

        if(!body.password) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "validation error", "password field must be filled")

        if(body.password.length < Enum.PASS_LENGTH) {
            throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "validation error", "password must must be gretaer than " + Enum.PASS_LENGTH)
        }

        // round (aşağıda 8) değerini büyük girmek maliyet faktörünü arttırıyor, böyleec password daha zor oluyor
        let password = bcrypt.hashSync(body.password, bcrypt.genSaltSync(8), null);
        

         //ROLES CONTROL- body field'ında gönderilen dizinin kontrolü
        if(!body.roles || !Array.isArray(body.roles) || body.roles.length === 0 ){
            throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "validation error", "roles field must be an array")
        }

        // body.roles dizisindeki her bir id değeri için Roles collection'ında için sorgu başlatıyoruz. 
        // Dizideki id'lerden birine sahip documnetlardan roles dizisini oluşturduk
        let roles = await Roles.find({_id: {$in:body.roles}})

        //  Eğer roles dizisi boşsa, eşeleşen hiç b,r role objectId yoksa --> ERROR 
        if(roles.length===0){
            throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "validation error", "there is no matching role")
        }

        //CREATING NEW USER
        // create static olarak tanımlanmış bir metoddur, class referansıyla çağrılabilinir
        let createdUser = await Users.create({
            email:  body.email,
            password: password, //password  de yazabilirdik sadece 
            is_active: true,
            first_name: body.first_name,
            last_name: body.last_name,
            phone_number: body.phone_number
        });

        // ADDING ROLES TO THE CREATED USER - dizideki role'ler UserRoles tablosuna eklenir, user id ile
        for (const roleId of roles){
            await UserRoles.create({
                role_id: roleId,
                user_id: createdUser._id
            });
        }
        

        //CREATED kodu 201 döner ben bir şey oluşturdum demek
        res.status(Enum.HTTP_CODES.CREATED).json(Response.successResponse( {success:true} ))

    } catch(err) {
        let errorResponse = Response.errorResponse(err);
        res.status(errorResponse.code).json(errorResponse);
    }
});


// _id dışındaki filedler isteğe bağlı
router.post('/update', auth.checkRoles("user_update"), async (req, res) => {
    let body = req.body;
    try {
        //creating updates object
        let updates = {}
        //body controls

        if(!body._id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language), i18n.translate("COMMON.FIELD_MUST_BE_FILLED", req.user.language, ["_id"] ));
        if(body.password && body.password >= Enum.PASS_LENGTH){
            updates.password = bcrypt.hashSync(body.password,  bcrypt.genSaltSync(8), null);
        } 
        if(typeof body.is_active === "boolean") updates.is_active = body.is_active;
        if(body.first_name) updates.first_name = body.first_name;
        if(body.last_name) updates.last_name = body.last_name;
        if(body.phone_number) updates.phone_number = body.phone_number;

        if(req.user.id == body._id) body.roles= null;

        //ROLES CONTROL
        // eğer role field'ı array ve boş değilse DB'de yine body'de verilen user id ye göre UserRole tablosundan role'leri çekicez
        if(Array.isArray(body.roles) && body.roles.length > 0 ){
            let userRoles = await UserRoles.find({user_id: body._id});           
            
            // body'deki role field'i ile DB userRole'leri karşılaştırırız
            let removedRoles= userRoles.filter(x => !body.roles.includes(x.role_id.toString()));
            let newRoles= body.roles.filter(x => !userRoles.map(r => r.role_id.toString()).includes(x));

            if(removedRoles.length > 0 ){
                // i will delete a document which has 2 field, so i will do it by OjectID
                await UserRoles.deleteMany( {_id: { $in: removedRoles.map(x=> x._id)}} );
            }

            if(newRoles.length > 0 ){ 
                for (const roleID of newRoles){
                    await UserRoles.create({
                        role_id: roleID,
                        user_id: body._id
                    });
                }
            }
            
        }

        
        await Users.updateMany({_id: body._id}, updates);

        res.json(Response.successResponse({ success: true }));

    }catch (err){
        let errorResponse = Response.errorResponse(err);
        res.status(errorResponse.code).json(errorResponse);
    }
});

router.post('/delete', auth.checkRoles("user_delete"), async (req, res) => {
    let body =req.body;
    try{
        // id kontrolü yap
        if(!body._id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language), i18n.translate("COMMON.FIELD_MUST_BE_FILLED", req.user.language, ["_id"] ));

        // silme işlemi yap
        await Users.deleteOne({_id: body._id});

        await UserRoles.deleteMany({user_id: body._id});

    }catch(err) {
         let errorResponse = Response.errorResponse(err);
        res.status(errorResponse.code).json(errorResponse);
    }
});


module.exports = router;
