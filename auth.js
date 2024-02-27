const express = require('express');
const session = require('express-session');
const router = express.Router();
var bodyParser = require('body-parser');

const connection = require('./db');


router.post('/loginProc', function (req, res) {
    const user_id = req.body.userId;
    const user_pw = req.body.userPw;

    var sql = `SELECT * FROM user WHERE userId = ? AND userPw = ?`

    connection.query(sql, [user_id, user_pw],function(err, results){
        if (err) throw err;
        if (results.length > 0) {
            req.session.usrNum = results[0].id;
            req.session.is_logined = true;
            req.session.name = user_id;
            req.session.save(function() {
                res.redirect('/');
            });

            console.log(req.session.name);
        } else {
            response.send(`<script type="text/javascript">alert("로그인 정보가 일치하지 않습니다."); 
                document.location.href="/login";</script>`);  
        }
    });

})


router.get('/logout', function (req, res) {
    req.session.destroy(function (err) {
        res.redirect('/');
    });
});


module.exports = router;