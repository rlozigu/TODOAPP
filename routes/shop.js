//라우터 파일 필수
var router = require('express').Router();

function loginConfirm(request, response, next){
    if(request.user){
        next()
    } else{
        response.send('로그인해주세요.')
    }
}

//라우터 파일에 있는 모든 url에 적용할 미들웨어
router.use(loginConfirm);
//라우터 파일 중 특정 url에만 적용할 미들웨어
//router.use('/shirts', loginConfirm);

router.get('/shirts', function(request, response){
    response.send('셔츠 파는 페이지입니다.')
})

router.get('/pants',function(request, response){
    response.send('바지 파는 페이지입니다.')
})

//배출문법
//module.exports = 내보낼 변수명
module.exports = router;