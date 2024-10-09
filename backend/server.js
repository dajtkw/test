import express from "express";
import path from "path";
import bcrypt from 'bcryptjs';
import User from "./models/user.model.js";
import Question from "./models/question.model.js";
import bodyParser from "body-parser";
import session from "express-session";
import jwt from "jsonwebtoken";
import { redis } from "./lib/redis.js";
import cookieParser from 'cookie-parser';


import { connectDB } from "./lib/db.js";
import { fileURLToPath } from "url";

// Middleware để xác thực người dùng
const authenticateToken = (req, res, next) => {
    const token = req.cookies.accessToken; // Lấy token từ cookie

    if (!token) {
        return res.redirect('/login'); // Không có token, chuyển hướng đến trang đăng nhập
    }

    jwt.verify(token, 'access_token_secret', (err, user) => {
        if (err) {
            return res.redirect('/login'); // Token không hợp lệ, chuyển hướng đến trang đăng nhập
        }
        req.user = user; // Lưu thông tin người dùng vào `req.user`
        next(); // Tiếp tục tới route tiếp theo nếu xác thực thành công
    });
};

const generateTokens = (userId) => {
	const accessToken = jwt.sign({ userId },`access_token_secret` , {
		expiresIn: "15m",
	});

	const refreshToken = jwt.sign({ userId },`refresh_token_secret`, {
		expiresIn: "7d",
	});

	return { accessToken, refreshToken };
};


const storeRefreshToken = async (userId, refreshToken) => {
  await redis.set(
    `refresh_token:${userId}`,
    refreshToken,
    "EX",
    7 * 24 * 60 * 60
  ); //7 days
};

const setCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true, //prevents XSS attacks, cross site scripting attack
    secure: true,
    sameSite: "strict", // prevents CSRF attack, cross site request forfery
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true, //prevents XSS attacks, cross site scripting attack
    secure: true,
    sameSite: "strict", // prevents CSRF attack, cross site request forfery
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// Lấy __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

//convert data into Json
app.use(express.json());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("frontend/pages"));
app.use(cookieParser());


const PORT = 5000;

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/pages/Login.html"));
});

app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/pages/SignUp.html"));
});

app.post("/signup", async (req, res) => {
  const { fullname, DayOfBirth, phonenumber, cccd, email, password } = req.body;

  if (
    !fullname ||
    !DayOfBirth ||
    !phonenumber ||
    !cccd ||
    !email ||
    !password
  ) {
    return res.status(400).json({ message: "All fields are required." });
  }
  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    const user = await User.create({
      fullname,
      DayOfBirth,
      phonenumber,
      cccd,
      email,
      password,
    });

    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken);

    setCookie(res, accessToken, refreshToken);

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
});

app.post("/login", async (req, res) => {
    try {
		const { email, password } = req.body;
		const user = await User.findOne({ email });

		if (user && (await user.comparePassword(password))) {
			const { accessToken, refreshToken } = generateTokens(user._id);
			await storeRefreshToken(user._id, refreshToken);
			setCookies(res, accessToken, refreshToken);

			res.json({
				_id: user._id,
				name: user.name,
				email: user.email,
				role: user.role,
			});

		} else {
			res.status(400).json({ message: "Invalid email or password" });
		}
	} catch (error) {
		console.log("Error in login controller", error.message);
		res.status(500).json({ message: error.message });
	}
});


//Thêm câu hỏi
app.post("/api/questions", async (req, res) => {
  const { question, options, answer } = req.body;
  console.log("Received:", { question, options, answer });

  if (!question || !options || !answer) {
    return res.status(400).send("Missing fields");
  }

  const newQuestion = new Question({
    question,
    options,
    answer,
  });

  await newQuestion.save();
  res.status(201).send("Question added successfully!");
});

// API sửa câu hỏi
app.put("/api/questions/:id", async (req, res) => {
  const { question, options, answer } = req.body;
  await Question.findByIdAndUpdate(req.params.id, {
    question,
    options,
    answer,
  });
  res.send("Question updated successfully!");
});

app.get("/prepareToExam",authenticateToken, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/pages/prepareToExam.html"));
});

app.get("/api/questions", async (req, res) => {
  const questions = await Question.find();
  res.json(questions);
});

app.post("/api/result",authenticateToken, async (req, res) => {
  const userAnswers = req.body;
  const questions = await Question.find();
  let score = 0;

  questions.forEach((question, index) => {
    if (userAnswers[`question${index}`] === question.answer) {
      score++;
    }
  });

  // Gửi dữ liệu kết quả ra client
  res.json({ score, total: questions.length });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});
