const passport = require('passport');
const {ExtractJwt, Strategy} = require('passport-jwt');
const Users = require("../db/models/Users");
const config= require("../config");
const UserRoles = require("../db/models/UserRoles");
const RolePrivileges = require('../db/models/RolePrivileges');

module.exports = function(){
    /**
    let  strategy = new Strategy({ jwt bilgileri },
        {Asenkron bir fonksiyondur 2. parametre:
        request'ten gelen token alınır, secret ile açılır, payload oradan gelir 
        done callback function - başka bir fonksiyona parametre olarak geçirilen ve o fonksiyon içinde daha sonra çağrılan fonksiyondur.
        kullanııc kontrolü: 
          1) Kullanıcı var mı?  
            2) varsa aktif mi?
                Aktifse ilk olarak user'ın role'lerini ve o role'lerin privilegler'ını çekmeliyiz.
                done callback function'ı ile kullanıcıyı authenticate edip etmediğimiz bilgisini dönüyoruz done functionı'nın ilk parametresi error eğer null'dan farklı bir değer verirsek authenticate edemediğimiz anlamı çıkar, 
                ikinci parametresi ise jwt tojen payload'dundaki biliglerdir, payload kısmı hassa bilgi içermemmeli çünkü son kullanıcı tarafından erişilebilinir.
        }
    Oluşturlan stratejiyi passportun kullanabileceği şekilde tanımlamamız gerekiyor use metodu ile, böylece passport artık ilgili stratejiyi tanımış olur.
    
    module.export ile de bir function dönüldüğü için return tanımlarız
    */

    let  strategy = new Strategy({
        secretOrKey: config.JWT.SECRET,
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken //JWT request'ten alınacağı belirtilir
    }, async (payload, done) =>{
        try{
            let user = await Users.findOne( {_id: payload.id} ); 

            if(user){
                let userRoles = await UserRoles.find( {user_id: payload.id });
                let rolePrivileges = await RolePrivileges.find( {role_id: {$in:userRoles.map(ur => ur.role_id)}} );

                done(null, {
                    id: user._id,
                    roles: rolePrivileges,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    exp: parseInt(Date.now() / 1000) * config.JWT.EXPIRE_TIME  //date.now() milisaniye cinsinden bugünün tarihini verir, 1000'e bölerek saniyeye çevirdik
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
        }
    }
}