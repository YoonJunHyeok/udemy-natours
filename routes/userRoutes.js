const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);
// forgot-password로 email 보내면 token을 그 email로 보내준다.
// mailtrap.io에서 보낸(받은) 메일과 토큰 확인 가능
// 이 토큰을 reset-password/토큰 주소로 password, passwordConfirm를 보낸다.

router.use(authController.protect);

router.patch('/update-my-password', authController.updatePassword);
router.get('/me', userController.getMe);
router.patch('/update-me', userController.updateMe);
router.delete('/delete-me', userController.deleteMe);

router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
