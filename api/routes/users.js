var express = require('express');
var router = express.Router();
// password hashing için
const bcrypt= require("bcrypt-nodejs");
//email kontrolü için
const is =require("is_js");

const Users = require("../db/models/Users");
const Roles = require("../db/models/Roles");
const UserRoles = require("../db/models/UserRoles");
var Response = require("../lib/Response");
var CustomError= require("../lib/Error");
var Enum = require("../config/Enum");

/* GET users listing. */
router.get('/', async function(req, res) {
    try {
      let users = await Users.find({})

      res.json(Response.successResponse(users));

    }catch(err) {
        let errorResponse = Response.errorResponse(err);
        res.status(errorResponse.code).json(errorResponse);
    }
});

router.post('/add', async(req,res) => {
    let body = req.body; 
    try{
        // body controls
        if(!body.email) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "validation error", "email field must be filled")

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
router.post('/update', async (req, res) => {
    let body = req.body;
    try {
        //creating updates object
        let updates = {}
        //body controls

        if(!body._id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "validation error", "_id field must be filled");

        if(body.password && body.password >= Enum.PASS_LENGTH){
            updates.password = bcrypt.hashSync(body.password,  bcrypt.genSaltSync(8), null);
        } 
        if(typeof body.is_active === "boolean") updates.is_active = body.is_active;
        if(body.first_name) updates.first_name = body.first_name;
        if(body.last_name) updates.last_name = body.last_name;
        if(body.phone_number) updates.phone_number = body.phone_number;


        //ROLES CONTROL
        // eğer role field'ı array ve boş değilse DB'de yine body'de verilen user id ye göre UserRole tablosundan role'leri çekicez
        if(Array.isArray(body.roles) || body.roles.length >= 0 ){
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

router.post('/delete', async (req, res) => {
    let body =req.body;
    try{
        // id kontrolü yap
        if(!body._id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "validation error", "_id field must be filled");

        // silme işlemi yap
        await Users.deleteOne({_id: body._id});

        await UserRoles.deleteMany({user_id: body._id});

    }catch(err) {
         let errorResponse = Response.errorResponse(err);
        res.status(errorResponse.code).json(errorResponse);
    }
});


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
        
        //creating new user
        // create static olarak tanımlanmış bir metoddur, class referansıyla çağrılabilinir
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

module.exports = router;
