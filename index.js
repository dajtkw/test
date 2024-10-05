// server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

dotenv.config();
const app = express();
app.use(bodyParser.json());

// Kết nối tới MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Định tuyến đơn giản
app.get('/', (req, res) => {
    res.send('Hệ thống thi online');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server chạy trên port ${PORT}`));
// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    faceId: { type: String }, // Chứa thông tin khuôn mặt (face encoding)
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Đăng ký người dùng
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'Người dùng đã tồn tại' });
        }
        user = new User({ name, email, password });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
        res.status(201).json({ msg: 'Đăng ký thành công' });
    } catch (err) {
        res.status(500).json({ msg: 'Lỗi server' });
    }
});

// Đăng nhập người dùng
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Thông tin đăng nhập không hợp lệ' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Thông tin đăng nhập không hợp lệ' });
        }
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (err) {
        res.status(500).json({ msg: 'Lỗi server' });
    }
});

module.exports = router;
// server.js (cập nhật)
const authRoute = require('./routes/auth');
app.use('/api/auth', authRoute);
