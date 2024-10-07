import express from 'express';
import path from 'path';
import bcrypt from "bcryptjs";
import User from './models/user.model.js';

import { connectDB } from "./lib/db.js";
import { fileURLToPath } from 'url';

// Lấy __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

//convert data into Json
app.use(express.json());

app.use(express.urlencoded({ extended: false }));

const PORT = 5000;

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../Login.html')); 
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '../SignUp.html')); 
})

app.post('/signup', async (req, res) => {
    const { fullname, DayOfBirth, phonenumber, cccd, email, password } = req.body;

    
    if (!fullname || !DayOfBirth || !phonenumber || !cccd || !email || !password) {
        return res.status(400).json({ message: "All fields are required." });
    }
        try {
		const userExists = await User.findOne({ email });

		if (userExists) {
			return res.status(400).json({ message: "User already exists" });
		}
		const user = await User.create({ fullname, DayOfBirth, phonenumber, cccd, email, password });
        
        
		// res.status(201).json({
		// 	fullname: user.fullname,
        //     DayOfBirth: user.DayOfBirth,
        //     phonenumber: user.phonenumber,
        //     cccd: user.cccd,    
        //     email: user.email,
        //     password: user.password
             //chuyển hướng login
		// });
        res.send(`
            <script>
                alert("Đăng ký thành công! Bạn sẽ được chuyển hướng tới trang đăng nhập.");
                window.location.href = "/login"; // Chuyển hướng sau khi hiển thị alert
            </script>
        `);
        
	} catch (error) {
		console.log("Error in signup controller", error.message);
		res.status(500).json({ message: error.message });
	}
    
})

app.post('/login', async (req, res) => {
	try {
		const { email, password } = req.body;
		const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "User does not exist" });
        }

        // Kiểm tra mật khẩu (bạn cần xác thực mật khẩu ở đây)
        const isPasswordMatch = password === user.password; // Chú ý: Nên sử dụng băm mật khẩu
        if (!isPasswordMatch) {
            return res.status(400).json({ message: "Invalid password" });
        }

        // Nếu đăng nhập thành công, bạn có thể trả về thông tin người dùng hoặc chuyển hướng
        // res.json({
        // 	name: user.fullname,
        // 	email: user.email,
        // 	role: user.role,
        // });

        return res.status(200).json({ message: "Login successful" });

	} catch (error) {
		console.log("Error in login controller", error.message);
		res.status(500).json({ message: error.message });
	}
});

app.get('/submit-quiz', (req, res) => {
    res.sendFile(path.join(__dirname, '../question.html')); 
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connectDB();
});

