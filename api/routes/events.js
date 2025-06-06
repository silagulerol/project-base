const express =require('express');
const router = express.Router();
const { HTTP_CODES} = require('../config/Enum');
const emitter = require("../lib/Emitter");

emitter.addEmitter("notifications");

router.get('/', async (req, res, next ) => {
    
    res.writeHead(HTTP_CODES.OK, {
        "Content-Type": "text/event-stream",
        "Connection": "keep-alive",
        "Cache-Control" : "no-cache, no-transform"
    });

    const listener = (data) => {
        res.write("data:" + JSON.stringify(data) + "\n\n" );
    }
    
    //notifications emitter'ına gönderilen messages eventleri dinlenmeye başlanır
    emitter.getEmitter("notifications").on("messages", listener);


    // request'in close event listener'ına bir fonksiyon tanımlıyoruz-notifications emitter'ına gönderilen messages eventleri dinlenmeyi durdururuz
    req.on("close", () => {
        emitter.getEmitter("notifications").off("messages", listener);
    })
});



module.exports = router;