//라이브러리 첨부
const express = require('express');
const { redirect } = require('express/lib/response');
//객체 생성
const app = express();
app.use(express.urlencoded({extended: true}));

const MongoClient = require('mongodb').MongoClient;

const methodOverride = require('method-override');
app.use(methodOverride('_method'))
app.set('view engine', 'ejs');

var db;
MongoClient.connect('mongodb+srv://admin:aaaiii123@cluster0.ree0v9d.mongodb.net/?retryWrites=true&w=majority', function(err, client){
    if(err) return console.log(err);
    db = client.db('todoapp');

    //서버 생성(포트, 함수)
    app.listen(8080, function(){
        console .log('listening on 8080');
    });
})

/*get(param1, param2)
param2의 형태가 함수임
이와 같은 함수 안의 함수 구조를 콜백 함수라고 부른다.
-> 순차적으로 실행하고 싶을 때 사용
*/
app.get('/pet', function(req, res){
    res.send('펫 페이지입니다.');
})

app.get('/beauty', function(req, res){
    res.send('뷰티 페이지입니다.');
})

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
})

app.get('/write', function(req, res){
    res.render('write.ejs');
})

app.post('/add', function(req, res){
    db.collection('counter').findOne({name: '게시물갯수'}, function(err, res2){
        var totalPost = res2.totalPost;

        db.collection('post').insertOne({_id: totalPost + 1, title: req.body.title, date: req.body.date}, function(err, res2){
            //counter 콜렉션에 있는 totalPost 항목 1 증가
            //db.collection('counter').updateOne({수정할 항목},{수정할 값},function(){});
            //operator >> set(변경), inc(증가, 음수도 가능), min(기존값보다 적을 때만 변경), rename(key값 이름변경) 등..
            db.collection('counter').updateOne({name: '게시물갯수'},{ $inc: {totalPost: 1}},function(err, res2){
                if(err){
                    return console.log(err)
                }
                res.send('저장완료');
            });
        })

    });
})

app.get('/list', function(req, res){
    //db에 저장된 post 라는 collection 안의 모든 데이터 꺼내기
    db.collection('post').find().toArray(function(err, res1){
        if(err){
            console.log(err);
        }
         res.render('list.ejs', {posts: res1});
    });
})


app.delete('/delete', function(req, rep){
    req.body._id = parseInt(req.body._id);
    console.log(req.body);
    db.collection('post').deleteOne(req.body, function(err, res){
        if(err){
            return console.log(err);
        }
        console.log('삭제완료');
        //응답 코드로 200 보내기
        rep.status(200).send({messsage: '성공'});
    });
})

app.get('/detail/:id', function(request, response){
    db.collection('post').findOne({_id : parseInt(request.params.id)}, function(error, result){
        console.log(result);
        response.render('detail.ejs', {data: result});
    })
})

app.get('/edit/:id', function(request, response){
    db.collection('post').findOne({_id : parseInt(request.params.id)}, function(error, result){
        if(result == null){
            return response.status(400).send({messsage: '게시글없음'});
        }
        console.log(request.params.id);
        response.render('edit.ejs', {data: result});
    })
})

app.put('/edit', function(request, response){
    db.collection('post').updateOne({_id: parseInt(request.body.id)}, { $set : {title: request.body.title, date: request.body.date}}, function(error, result){
        if(error){
            return error;
        }
        console.log('수정완료');
        response.redirect('/list');
    })
})

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

//app.use(미들웨어)
//미들웨어: 요청 - 응답 중간에 뭔가 실행되는 코드
app.use(session({secret: '비밀코드', resave : true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());


app.get('/login', function(request, response){
    response.render('login.ejs');
})

app.post('/login', passport.authenticate('local', {failureRedirect : '/fail'}), function(request, response){
    response.redirect('/');
})

//LocalStrategy( { 설정 }, function(){ 아이디비번 검사하는 코드 } )
passport.use(new LocalStrategy({
    usernameField: 'id', //사용자가 제출한 id
    passwordField: 'pw', //사용자가 제출한 pw
    session: true, //세션을 만들건지
    passReqToCallback: false,//id, pw말고 다른 걸로(ex 이름) 검증하고 싶을 때 passReqToCallback: ture 하면 됨
  }, function (입력한아이디, 입력한비번, done) {
    //console.log(입력한아이디, 입력한비번);
    db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
        //done(서버에러, 성공시사용자DB데이터(실패시 false), 에러메세지)
        if (에러) return done(에러)
  
        if (!결과) return done(null, false, { message: '존재하지 않는 아이디입니다.' })
        //실무에선 암호화 필수!!
        if (입력한비번 == 결과.pw) {
            return done(null, 결과)
        } else {
            return done(null, false, { message: '비밀번호가 맞지않습니다.' })
        }
    })
}));

//id를 사용해 세션을 저장시키는 코드 > 로그인 성공시 발동
//세션 데이터를 만들고 세션의 id정보를 쿠키로 보냄
passport.serializeUser(function(user, done){
    done(null, user.id);
});

//세션 데이터를 가진 사람 DB에서 찾기 >> 마이페이지 접속시 발동
passport.deserializeUser(function(id, done){
    done(null, {});
});

