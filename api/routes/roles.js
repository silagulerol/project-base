const express = require("express");
const router =express.Router();

const config= require('../config');
const Enum = require("../config/Enum");

const Response = require("../lib/Response");
const auth = require('../lib/auth')();
const CustomError =require("../lib/Error");
const i18n= new (require('../lib/i18n'))(config.DEFAULT_LANG);

const Roles = require("../db/models/Roles");
const rolePrivileges = require("../config/role_privileges");
const RolePrivileges = require("../db/models/RolePrivileges");
const UserRoles = require("../db/models/UserRoles");




router.all('*', auth.authenticate(), (req, res, next) => {
    next();
});

router.get("/", auth.checkRoles("role_view"),   async (req, res, next) => {
    try {
        //roles arrayindeki her bir item bir role document: { role_name: "asd", is_active: true/false, created_by: user._id }
        // lean() --> ancak ben ekleme yapmak istediğim için bir mongoose model objesi array'i olan roles array'ini bir javascript objesi modeline çeviriyorum.
        let roles = await Roles.find({}).lean();

        // ikinci çözüm javascript objesine çevirim için
        // roles= JSON.parse( JSON.stringify(roles) );

        for (let i=0; i < roles.length; i++) {
            // her bir role için o role ait permissionları çekeceğim bir permissions array oluşturuyorum. Permissions dizisindeki her bir item bir permnission document {role_id: role._id, permission: "category_view", created_by: user._id }
            let permissions = await RolePrivileges.find( {role_id :roles[i]._id });
            roles[i].permissions = permissions; 
        }

        res.json(Response.successResponse(roles));
    
    } catch(err){
        let errorResponse = Response.errorResponse(err);
        res.status(errorResponse.code).json(errorResponse);
    }
});

router.post('/add', auth.checkRoles("role_add"), async (req, res, next) =>{
    let body = req.body;
    try{
        
        if(!body.role_name) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "validation error", "the name filed must be filled");
        
        // permissions field'ı olmalı, array olmalı, içinde en az 1 eleman olmalı
        if(!body.permissions || !Array.isArray(body.permissions) || body.permissions.length == 0){
            throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,  i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language), i18n.translate("COMMON.FIELD_MUST_BE_TYPE", req.user.language, ["permissions", "Array"]));
        }

        let role = new Roles({
            role_name: body.role_name,
            is_active: true,
            created_by: body.user?.id
        });

        await role.save();

        //permissions tablosuna ekleme yapıyoruz
        for (let i =0; i< body.permissions.length;i++){
            let priv = new RolePrivileges({
                // bir role'ün tüm yetkilerini(privileglarını ekliyoruz) yeni bir permission olarak RolePrivileges collecton'ına ekliyoruz 
                // new Roles({}) yaptığımızda 1 tane role_id otomatik olarak oluşturulur
                role_id: role._id,
                permission: body.permissions[i],
                created_by: req.user?.id
            });

            // oluşturulan yeni nesne (document) db'ye kaydedilir
            await priv.save();
        }

        res.json(Response.successResponse({ success: true}) );

    }catch(err){
        let errorResponse = Response.errorResponse(err);
        res.status(errorResponse.code).json(errorResponse);
    }
});

router.post('/update', auth.checkRoles("role_update"), async (req, res, next) =>{
    let body = req.body; // id olarak aldığım güncellemek istediğim rolün ObjectId'si
    try{
        let updates = {};

        if(!body._id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,  i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language), i18n.translate("COMMON.FIELD_MUST_BE_FILLED", req.user.language, ["_id"] ));
        
        // Eğer güncellemek istediğim rolün id'si login yapan kullanıcının rollerinden biriyse ---> ERROR , çünkü kendi rolünün yetkilerini arttırmasını istemiyoruz
        // kullanıcı bu role sahip mi diye sorguluyoruz
        let userRole = await UserRoles.find( {user_id: req.user.id } ,{role_id: body._id} );

        if(userRole){
            throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,  i18n.translate("COMMON.NEED_PERMISSION", req.user.language), i18n.translate("COMMON.NEED_PERMISSION", req.user.language));
        }
        if(body._id )
        if(body.role_name) updates.role_name = body.role_name;
        if(typeof body.is_active === "boolean") updates.is_active = body.is_active;

        if(body.permissions && Array.isArray(body.permissions) && body.permissions.length > 0 ){
            
            // existing_priv: db'deki var olan yetkiler, new_priv: db'deki var olan yetkiler
            //bana existing_priv ^ new_priv kümesi lazım. intersection'ları 

            // role_id'si verilen role'e ait yetkileri dön
            let permissions = await RolePrivileges.find({role_id: body._id})
            

            // permissions(veri tabanındaki) dizinden bir filtre oluşturuyorum schema'daki permissiob kısmı, privileges'daki kkey değerine karşılık geliyor
            // body.permissions => {"categories_view", "user_add"}
            // permissions => [{_id: 123 ,role_id: aaa, permission, created_by: }, {_id: 432 ,role_id: bbb, permission, created_by: }]
            let removedPermissions = permissions.filter(x => !body.permissions.includes(x.permission)) 
            let newPermissions = body.permissions.filter(x => !permissions.map(p => p.permission).includes(x) )
            
            if(removedPermissions.length > 0){
                await RolePrivileges.deleteMany({_id: removedPermissions.map(x => x._id)});
            }

            if (newPermissions.length > 0){
                for (let i =0; i< newPermissions.length;i++){
                    let priv = new RolePrivileges({
                        // bir role'ün tüm yetkilerini(privileglarını ekliyoruz) yeni bir permission olarak RolePrivileges collecton'ına ekliyoruz 
                        // new Roles({}) yaptığımızda 1 tane role_id otomatik olarak oluşturulur
                        role_id: body._id,
                        permission: newPermissions[i],
                        created_by: req.user?.id
                    });

                    // oluşturulan yeni nesne (document) db'ye kaydedilir
                    await priv.save();
                }
            }

        }

        // ilk parametre sorgu parametresi bize o koşula uyan documnenlar getirilir
        await Roles.updateMany({_id : body._id}, updates);

        res.json(Response.successResponse({ success: true}) );

    }catch(err){
        let errorResponse = Response.errorResponse(err);
        res.status(errorResponse.code).json(errorResponse);
    }
});

router.post('/delete',auth.checkRoles("role_delete"),  async (req, res, next) =>{
    let body = req.body;
    try {
        if(!body._id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST,  i18n.translate("COMMON.VALIDATION_ERROR_TITLE", req.user.language), i18n.translate("COMMON.FIELD_MUST_BE_FILLED", req.user.language, ["_id"] ));

        await Roles.deleteMany({_id: body._id});

        res.json(Response.successResponse({ success: true }));
    
    } catch(err){
        let errorResponse = Response.errorResponse(err);
        res.status(errorResponse.code).json(errorResponse);
    }
});

router.get("/role_privileges", async (req, res, next)=>{
    res.json(rolePrivileges);
})
module.exports = router;