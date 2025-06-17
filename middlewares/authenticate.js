function authenticate(req, res, next) {
    if (req.session.user != undefined) {
         next();
        } else {
            return res.redirect("/");
        }
    };

 module.exports = authenticate;