const express = require('express');
const router = express.Router();
const { query } = require('../modules/db');
const { sign, verifyMiddleWare } = require('../modules/jwt');

router.post('/login', async (req, res, next) => {
  const { id, password } = req.body;

  const queryResult = await query(`SELECT * from user where id = '${id}' and password = '${password}';`);

  if (queryResult.length > 0) {
    const jwt = sign({
      id,
      name: queryResult[0].name
    });
    res.cookie('token', jwt, {
      httpOnly: true,
      expires: new Date( Date.now() + 60 * 60 * 1000 * 24 * 7) // 7일 후 만료
    }).json({
      status: 200,
      id,
      name: queryResult[0].name
    });
  } else {
    res.json({
      status: 400,
      message: 'Incorrect id or password'
    });
  }
});

router.get('/whoAmI', verifyMiddleWare, (req, res, next) => {
  const { id, name } = req.decoded;

  if (id) {
    res.json({
      success: true,
      id,
      name,
    });
  } else {
    res.json({
      success: false,
      message: 'Authentication is required'
    });
  }
});

router.patch('/logout', verifyMiddleWare, async (req, res, next) => {
  const {id} = req.decoded;

  if (id){
    await query(`UPDATE user SET online = 1 where id = '${id}'`)
    res.clearCookie('token').json({
      status: 200,
      message: '로그아웃 성공'
    })
  } else {
    res.json({
      status: 400,
      erroMessage: '로그아웃 실패'
    })
  }
});

router.post('/signin', async (req, res, next) => {
  const { id, password, name, type } = req.body;
  const id_regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{4,20}$/; // 4~20자리의 문자 및 숫자 1개 이상씩 사용한 정규식
  const name_regex = /^[ㄱ-ㅎ|가-힣|a-z|A-Z]{3,20}$/;

  // 아이디 유효성 검사 통과 x
  if (!id_regex.test(id)) {
    res.json({
      status: 400,
      message: 'Invalid id'
    });
  } else if (!name_regex.test(name)) {
    res.json({
      status: 400,
      message: 'Invalid name'
    });
  } else if (password.length == 0){
    res.json({
      status: 400,
      message: 'Enter password'
    });
  } else { // 통과 O
    // 중복 확인
    const queryResult = await query(`SELECT * from user where id = '${id}'`);

    if (queryResult.length > 0) {
      res.json({
        status: 400,
        message: 'Duplicate id'
      });
    } else {
      await query(`INSERT INTO user(id, password, name, type) VALUES('${id}', '${password}', '${name}', '${type}')`);

      res.json({
        status:200,
        message: '회원가입 성공'
      });
    }
  }
});

router.get('/signin/:id', verifyMiddleWare, async (req, res, next) => {
  const {id} = req.params;
  const queryResult = await query(`SELECT * from user where id = '${id}'`);
  if (queryResult.length > 0) {
    res.json({
      status:400,
      message: '중복된 id입니다'
    });
  } else {
    res.json({
      status: 200,
      message: '사용가능한 id입니다'
    });
  }
});

router.delete('/signout', verifyMiddleWare, async  (req, res, next) => {
  const {id, name} = req.decoded;
  if (id){
    res.json(
      {
        status:200,
        message: '회원탈퇴되었습니다'
      })
    await query(`DELETE FROM user where id = '${id}'`);
  } else {
    res.json({
      status:400,
      message: '회원탈퇴 실패'
    });
  }
});

router.patch('/change', verifyMiddleWare, async (req, res, next) => { 
  const {ierd} = req.decoded;
  const {id, state_message, place} = req.body;
  const state_message_regex = /^[ㄱ-ㅎ|가-힣|a-z|A-Z]{1,20}$/;

  if (!state_message_regex.test(state_message)){
    res.json({
      status:400,
      message: '상태메세지는 최대 20자까지입니다.'
    });
  } else {
    await query(`UPDATE user SET state_message='${state_message}', place='${place}' where id = '${id}'`)
    res.json(
      {
        status:200,
        message: '변경성공'
      }
    );
  }
});

module.exports = router;
