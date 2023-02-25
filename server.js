//라이브러리 첨부
const express = require('express');
//객체 생성
const app = express();

//서버 생성(포트, 함수)
app.listen(8080, function(){
    console.log('listening on 8080');
});

