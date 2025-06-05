const Enum = require("../config/Enum");
const CustomError = require("./Error");

class Response {
    constructor(){

    }

    static successResponse(data, code=200 ) {
        return {
            code, 
            data
        }
    }

    // OOP'de bir class'ın metodlarına,fieldlarına erişebilmek için onun br instance oluşturmak zorundayız (new ile)
    // Ancak içinde static metodlar varsa bu static metodlara class'ına class referansıyla ulaşabiliriz 
    static errorResponse(error) {
        console.log(error);
        if (error instanceof CustomError){
            return {
                code: error.code,
                error: {
                    message: error.message,
                    description: error.description
                }
            }
        }else if(error && error.message && error.message.includes("E11000")){
            return {
            code: Enum.HTTP_CODES.CONFLICT,
            error: {
               message: "Already Exists!",
              description: "Already Exists!"
            }
        }
        }
        return {
            code: Enum.HTTP_CODES.INT_SERVER_ERROR,
            error: {
               message: "Unknown Error!",
              description: error.message
            }
        }
        
        
    } 
}



// module.exports = new Response(); dediğimizde instance
// module.exports = Response; dediğimizde class'ın kendisi döner
module.exports = Response;