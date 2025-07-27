const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 📌 Đăng ký
exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email đã được sử dụng' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username: name,
      email,
      password: hashedPassword,
      role: role || 'user',
    });

    await newUser.save();
    res.status(201).json({ message: 'Đăng ký thành công' });
  } catch (err) {
    console.error('❌ Lỗi đăng ký:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// 📌 Đăng nhập
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Sai email hoặc mật khẩu' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Sai email hoặc mật khẩu' });

    if (!process.env.JWT_SECRET) {
      throw new Error('Thiếu JWT_SECRET trong .env');
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        dob: user.dob
      }
    });
  } catch (err) {
    console.error('❌ Lỗi đăng nhập:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// 📌 Cập nhật ngày sinh và vai trò
exports.updateRole = async (req, res) => {
  try {
    const userId = req.user.id;
    const { dob, role } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    user.dob = dob;
    user.role = role;
    await user.save();

    res.json({ message: 'Cập nhật thành công' });
  } catch (err) {
    console.error('❌ Lỗi updateRole:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};
