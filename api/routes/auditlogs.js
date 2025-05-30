const express=  require("express");
const router= express.Router();


// Endpoint oluşturulması: router geliştirmek
// request: gelen requestin body,headers, params ve query fieldalarını içerir, 
// response: geri döndürülücek cevap için kullanılacak methodları barındırır, next: başka bir router'a gidilecekse vs.
// body url'le eklenmez, query ve params url'e eklenir, 
// params eklenmiş url farklı bir endpoint gibi davranır query eklnemiş aksine
router.get("/:id", (req, res, next) => {
    res.json({
        body: req.body,
        params: req.params,
        query: req.query,
        headers: req.headers,
    })
})

module.exports = router