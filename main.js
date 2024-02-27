const express = require('express');
const session = require('express-session');
const ejs = require('ejs');
const app = express();
const port = 3000;
var bodyParser = require('body-parser');

var authRouter = require('./auth');
const connection = require('./db');
const { log } = require('console');


app.set('view engine', 'ejs');
app.set('views', './views');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true,
}))

app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});


app.get('/', (req, res) => {
    if (req.session.is_logined) {
        res.send(`
            <h1>홈페이지에 오신 것을 환영합니다.</h1>
            <header style="border-bottom:1px solid #aaa; margin-bottom:10px; padding-bottom: 10px;;">
                <nav>
                    <a href="/">홈</a> |
                    <a href="/logout">로그아웃</a> | <!-- 로그아웃 링크 -->
                    <a href="/board">게시판</a> |
                </nav>
            </header>
        `);
    } else {
        res.send(`
            <h1>홈페이지에 오신 것을 환영합니다.</h1>
            <header style="border-bottom:1px solid #aaa; margin-bottom:10px; padding-bottom: 10px;;">
                <nav>
                    <a href="/">홈</a> |
                    <a href="/login">로그인</a> | <!-- 로그인 링크 -->
                    <a href="/board">게시판</a> |
                </nav>
            </header>
        `);
    }
});


app.get('/login', (req, res) => {
    res.render('login');
})

app.use('/', authRouter);

app.get('/board', (req, res) => {
    connection.query('SELECT b.board_id, b.title , b.content , u.userId as id FROM board b LEFT JOIN `user` u on b.id = u.id ORDER BY b.board_id DESC', (err, rows) => {
        if(err) throw err;
        console.log(rows);
        res.render('board', {rows : rows});
    })
})

app.get('/board/form', (req, res) => {
    if(!req.session.is_logined) {
        res.send(`<script>alert("게시글을 작성하려면 로그인이 필요합니다.");document.location.href="/login";</script>`);
    } else {
        res.render('form');
    }
})

app.post('/board/formProc', (req, res) => {
    const title = req.body.title;
    const content = req.body.content;
    const usrid = req.session.usrNum;

    console.log(usrid)

    

    var sql = `INSERT INTO board(title, content, id) VALUES(?, ?, ?)`

    connection.query(sql, [title, content, parseInt(usrid)], function(err, results){
        if (err) throw err;

        res.send(`<script>alert("게시글 등록 완료"); document.location.href='/board';</script>`);
    })
    
})

app.get('/board/:board_id', (req, res) => {
    const boardId = req.params.board_id;
    const num = req.session.usrNum;
    var sql = `SELECT b.board_id, b.title, b.content, u.id as usrNum, u.userId as usrId FROM board b LEFT JOIN user u on b.id = u.id WHERE board_id = ?`

    connection.query(sql, boardId, function(err, results){
        if (err) throw err;

        console.log(results);
        
        res.render('board_detail', {board: results});
    });
});

app.get('/board/:board_id/update', (req, res) => {
    const boardId = req.params.board_id;

    var sql = `SELECT * FROM board WHERE board_id = ?`

    connection.query(sql, boardId, function(err, results) {
        if(err) throw err;
        if(results[0].id != req.session.usrNum) {
            res.send(`<script>alert("수정 권한이 존재하지 않습니다"); document.location.href="/board/${boardId}"</script>`);
        } else {
            res.render('form_update', {board: results});
        }
    });

});

app.get('/board/:board_id/delete', (req, res) => {
    const boardId = req.params.board_id;

    var sql = `SELECT * FROM board WHERE board_id = ?`

    connection.query(sql, boardId, function(err, results) {
        if(err) throw err;
        if(results[0].id != req.session.usrNum) {
            res.send(`<script>alert("삭제 권한이 존재하지 않습니다"); document.location.href="/board/${boardId}"</script>`);
        } else {
            var deleteSql = `DELETE FROM board WHERE board_id = ?`
            
            connection.query(deleteSql, boardId, function(err, results) {
                if (err) throw err;
                res.send(`<script>alert("삭제가 완료되었습니다."); document.location.href="/board";</script>`);
            });
        }
    });
    
})

app.post('/board/updateProc', (req, res) => {
    const title = req.body.title;
    const content = req.body.content;
    const boardId = req.body.board_id;

    var sql = `UPDATE board SET title = ?, content = ? WHERE board_id = ?`

    connection.query(sql, [title, content, boardId], function(err, results) {
        if (err) throw err;
        
        res.send(`<script>alert("수정이 완료되었습니다."); document.location.href="/board/${boardId}"; </script>`)
    })
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
})