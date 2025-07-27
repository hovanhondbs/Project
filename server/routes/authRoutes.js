const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Đăng ký
router.post('/register', authController.register);

// ✅ Đăng nhập
router.post('/login', authController.login); // 👈 THÊM DÒNG NÀY

module.exports = router;

//API cập nhật vai trò
const { updateRole } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.put('/update-role', authMiddleware, updateRole);
