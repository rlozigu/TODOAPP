//라우터 파일 필수
var router = require('express').Router();

router.get('/sports', function(request, response){
    response.send('스포츠 게시판')
})

router.get('/game', function(request, response){
    response.send('게임 게시판')
})

//배출문법
//module.exports = 내보낼 변수명
module.exports = router;