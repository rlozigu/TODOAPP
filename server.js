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

//환경변수 라이브러리 등록
require('dotenv').config();

var db;
MongoClient.connect(process.env.DB_URL , function(err, client){

    if(err) return console.log(err);
    db = client.db('todoapp');

    //서버 생성(포트, 함수)
    app.listen(process.env.PORT , function(){
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


app.get('/list', function(req, res){
    //db에 저장된 post 라는 collection 안의 모든 데이터 꺼내기
    db.collection('post').find().toArray(function(err, res1){
        if(err){
            console.log(err);
        }
         res.render('list.ejs', {posts: res1});
    });
})


app.get('/search', (request, response) => {
    console.log(request.query)
    var searchString = [
        {
            $search: {
              index: 'titleSearch',
              text: {
                query: request.query.value,
                path: 'title'  // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
              }
            }
        },
        { $sort: {_id: 1}}
    ]
    db.collection('post').aggregate(searchString).toArray(function(err, result){
        if(err){
            console.log(err);
        }

        response.render('list.ejs', {posts: result});
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

app.get('/fail', function(request, response){
    response.render('fail.ejs');
})

app.get('/mypage', loginConfirm, function(request, response){
    console.log(request.user)
    response.render('mypage.ejs', {user: request.user});
})

app.get('/upload', function(request, response){
    response.render('upload.ejs')
})


function loginConfirm(request, response, next){
    if(request.user){
        next()
    } else{
        response.send('로그인해주세요.')
    }
}

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

//로그인한 유저의 개인정보를 DB에서 찾는 역할 >> 마이페이지 접속시 발동
passport.deserializeUser(function(id, done){
    db.collection('login').findOne({ id: id }, function (에러, 결과) {
        if (에러) return done(에러)
        if (!결과) return done(null, false, { message: '존재하지 않는 아이디입니다.' })

        done(null, 결과);
    })   
});

//회원기능이 필요하면 passport 세팅하는 부분이 위에 있어야함
app.post('/register', function(request, response){
    db.collection('login').insertOne({id: request.body.id, pw: request.body.pw}, function(err, result){
        response.redirect('/')
    })
})


app.post('/add', function(req, res){
    db.collection('counter').findOne({name: '게시물갯수'}, function(err, res2){
        var totalPost = res2.totalPost;
        var data = {_id: totalPost + 1, title: req.body.title, date: req.body.date, writer: req.user._id}

        db.collection('post').insertOne(data, function(err, res2){
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


app.delete('/delete', function(req, rep){
    req.body._id = parseInt(req.body._id);
    console.log(req.body);

    var data = {_id: req.body.id, writer: req.user._id}
    db.collection('post').deleteOne(data, function(err, res){
        if(err){
            return console.log(err);
        }
        console.log(req);
        console.log('------------------------')
        console.log(res);
        console.log('삭제완료');
        //응답 코드로 200 보내기
        rep.status(200).send({messsage: '성공'});
    });
})

//server.js에 shop.js 라우터 첨부하기
// '/'경로로 요청했을 때 미들웨어 적용하기.(경로 없는 건 전역 미들웨어.)
app.use('/shop', require('./routes/shop.js'))
app.use('/board/sub', require('./routes/board.js'))

let multer = require('multer');

//멀티파일 램에 저장
//var storage = multer.memoryStorage({})
//하드에 저장
var storage = multer.diskStorage({
    destination : function(request, file, cb){
        cb(null, './public/image')
    },
    filename: function(request, file, cb){
        cb(null, file.originalname)
    },
    filefilter: function(req, file, cb){
        //확장자 필터링
    },
    limits: function(req, file, cb){
        //용량 등 제한
    },
})

var upload = multer({storage: storage});

//upload.single('input 컴포넌트의 name')
//다중업로드: upload.array('input 컴포넌트의 name', 한 번에 받을 파일의 최대 갯수)
app.post('/upload', upload.single('profile'), function(request, response){
    response.send('업로드완료')
})

app.get('/image/:name', function(request, response){
    response.sendFile(__dirname + '/public/image/' + request.params.name);
})

app.post('/chat', loginConfirm, function(request, response){
    var data = {member: [request.body.user_id, request.user._id]
                , date: new Date()
                , title: '채팅방'}
    db.collection('chatroom').insertOne(data, function(err, res2){
        if(err) {
            return err;
        }
        
        response.send('채팅방 개설 완료');
    })
})

app.get('/chat', loginConfirm, function(request, response){
    db.collection('chatroom').find({member: request.user._id}).toArray().then((result) => {
        console.log(result)
        response.render('chat.ejs', {data: result})
    })

})

app.post('/message', function(request, response){

    var data ={
        parent: request.body.parent
        , content: request.body.content
        , userid : request.user._id
        , date: new Date()
    }

    db.collection('message').insertOne(data).then(()=>{
        response.send('DB저장성공')
    })
})