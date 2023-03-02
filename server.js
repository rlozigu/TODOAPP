//라이브러리 첨부
const express = require('express');
//객체 생성
const app = express();
app.use(express.urlencoded({extended: true}))

//서버 생성(포트, 함수)
app.listen(8080, function(){
    console .log('listening on 8080');
});

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
    res.send('전송완료');
})