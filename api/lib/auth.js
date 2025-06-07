const passport = require('passport');
const {ExtractJwt, Strategy} = require('passport-jwt');
const Users = require("../db/models/Users");
const config= require("../config");
const UserRoles = require("../db/models/UserRoles");
const RolePrivileges = require('../db/models/RolePrivileges');
const privs = require('../config/role_privileges'); 
const Response = require('./Response');
const {HTTP_CODES} = require('../config/Enum');
const CustomError = require('./Error')

module.exports = function() {
    /** 
    let  strategy = new Strategy({ jwt bilgileri },
        {Asenkron bir fonksiyondur 2. parametre:
        request'ten gelen token alınır, secret ile açılır, payload oradan gelir 
        done callback function - başka bir fonksiyona parametre olarak geçirilen ve o fonksiyon içinde daha sonra çağrılan fonksiyondur.
        kullanıcı kontrolü: 
          1) Kullanıcı var mı?  
            2) varsa aktif mi?
                Aktifse ilk olarak user'ın VERİTABANINDAN role'lerini ve o role'lerin privilegler'ını çekmeliyiz.
                Kullanıcının sahip olduğu yetkilerin detaylarını CONFIG/ROLEPRIVILEGES.JS'den çekiyoruz.

                done callback function'ı ile kullanıcıyı authenticate edip etmediğimiz bilgisini (edildiyse de req.body.user kısmında kullanıcı bilgileri ile) strategy midleware'dan role middleware'a dönüyoruz
                done functionı'nın ilk parametresi error eğer null'dan farklı bir değer verirsek authenticate edemediğimiz anlamı çıkar,ikinci parametresi ise jwt tojen payload'dundaki biliglerdir, payload kısmı hassa bilgi içermemmeli çünkü son kullanıcı tarafından erişilebilinir.
        }
    Oluşturlan stratejiyi passportun kullanabileceği şekilde tanımlamamız gerekiyor use metodu ile, böylece passport artık ilgili stratejiyi tanımış olur.
    
    module.export ile de bir function dönüldüğü için return tanımlarız
    */

    let strategy = new Strategy({
        secretOrKey: config.JWT.SECRET,
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()  //JWT request'ten alınacağı belirtilir
    }, async (payload, done) => {
        try{
            let user = await Users.findOne( {_id: payload.id} ); 
            if(user){
                let userRoles = await UserRoles.find( {user_id: payload.id });

                let rolePrivileges = await RolePrivileges.find( {role_id: {$in:userRoles.map(ur => ur.role_id)}} );

                let privileges =  rolePrivileges.map( rp => privs.privileges.find( x => x.key == rp.permission));

                // done parametresi içine payload bilgilerini koyarak req.user'a da bu bilgileri koymuş olduk
                done(null, {
                    id: user._id,
                    roles: privileges,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    language: user.language,
                    exp: parseInt(Date.now() / 1000) + config.JWT.EXPIRE_TIME  //date.now() milisaniye cinsinden bugünün tarihini verir, 1000'e bölerek saniyeye çevirdik
                });
            } else {
                done(new Error("User not found"), null);
            }

        }catch(err) {
            done(err, null);
        }
    });

    passport.use(strategy);

    return{
        initialize: function () {
            return passport.initialize();
        },
        authenticate: function(){
            return passport.authenticate( "jwt", {session : false} );
        },
        checkRoles: function(...expectedRoles){
            return (req, res, next) =>{ 
                // filter undefined ya da false alanı görürse oluşturduğu array'e parametre olarak aldığı değeri eklemez (Yani x endefined ise map fonksiyonuna girmez nöylece x.key hata vermez)
                let privileges = req.user.roles.filter(x => x).map(x => x.key);

                let i=0 ;

                while(i < expectedRoles.length && !privileges.includes(expectedRoles[i])) i++;
                console.log("in the func");
                if( i >= expectedRoles.length ) {
                    console.log("in the error");

                    let response = Response.errorResponse(new CustomError(HTTP_CODES.UNAUTHORIZED, "Need Permission", "Need Permission"));
                    res.status(response.code).json(response);
                }

                return next();
            }
        }
    }
}