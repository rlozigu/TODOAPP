//라이브러리 첨부
const express = require('express');
//객체 생성
const app = express();
app.use(express.urlencoded({extended: true}));

const MongoClient = require('mongodb').MongoClient;
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
    res.sendFile(__dirname + '/write.html');
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