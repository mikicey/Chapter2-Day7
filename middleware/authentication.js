module.exports.checkLogin = (req,res, next) => {
    if(!req.session.isLogin){
         res.status(404).redirect("/")
    } else {
        next()
    };
};

module.exports.alreadyLogin = (req,res,next) => {
    if(req.session.isLogin){
        res.redirect("/")
    } else {
        next()
    };
};