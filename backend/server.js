import express from "express";
import path from "path";
import bcryptjs from "bcryptjs";
import User from "./models/user.model.js";
import Question from "./models/question.model.js";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import crypto from "crypto";

import { connectDB } from "./lib/db.js";
import { fileURLToPath } from "url";
import { verifyToken } from "./middleware/verifyToken.js";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "./mail/email.js";

const generateTokenAndSetCookie = (res, userId) => {
  const token = jwt.sign({ userId }, `your_secret_key`, {
    expiresIn: "7d",
  });

  res.cookie("token", token, {
    httpOnly: true, //prevents XSS attacks, cross site scripting attack
    secure: true,
    sameSite: "strict", // prevents CSRF attack, cross site request forfery
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return token;
};

// Lấy __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

//convert data into Json
app.use(express.json());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("frontend/pages"));
app.use(cookieParser());

const PORT = 5000;

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/pages/Welcome.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/pages/Login.html"));
});

app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/pages/SignUp.html"));
});

app.get("/verify-email", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../frontend/pages/VerifyEmailSignUp.html")
  );
});

app.get("/verify-email-login", (req, res) => {
	res.sendFile(
	  path.join(__dirname, "../frontend/pages/VerifyEmailLogin.html")
	);
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

    const hashedPassword = await bcryptjs.hash(password, 10);
    const verificationToken = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const user = await User.create({
      fullname,
      DayOfBirth,
      phonenumber,
      cccd,
      email,
      password: hashedPassword,
      verificationToken,
      verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 tiếng
    });

    await user.save();

    generateTokenAndSetCookie(res, user._id);

    await sendVerificationEmail(user.email, verificationToken);

    res.status(201).json({
      redirectUrl: `/verify-email?email=${encodeURIComponent(user.email)}`,
    });
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: error.message });
  }
});

app.post("/verify-email", async (req, res) => {
  const { code } = req.body;
  try {
    const user = await User.findOne({
      verificationToken: code,
      verificationTokenExpiresAt: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;
    await user.save();

    await sendWelcomeEmail(user.email, user.name);

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (error) {
    console.log("error in verifyEmail ", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/verify-email-login", async (req, res) => {
	const { code } = req.body;
	try {
	  const user = await User.findOne({
		verificationToken: code,
		verificationTokenExpiresAt: { $gt: Date.now() },
	  });
  
	  if (!user) {
		return res.status(400).json({
		  success: false,
		  message: "Invalid or expired verification code",
		});
	  }
  
	  user.isLoggedIn = true;
	  user.verificationToken = undefined;
	  user.verificationTokenExpiresAt = undefined;
	  await user.save();
  
	  await sendWelcomeEmail(user.email, user.name);
  
	  res.status(200).json({
		success: true,
		message: "Email verified successfully",
		user: {
		  ...user._doc,
		  password: undefined,
		},
	  });
	} catch (error) {
	  console.log("error in verifyEmail ", error);
	  res.status(500).json({ success: false, message: "Server error" });
	}
  });

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    generateTokenAndSetCookie(res, user._id);
	const verificationToken = Math.floor(
		100000 + Math.random() * 900000
	  ).toString();

	  user.verificationToken = verificationToken;
	  user.verificationTokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours



	await sendVerificationEmail(user.email, verificationToken);
    user.lastLogin = new Date();
    await user.save();
    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: error.message });
  }
});

app.get("/forgot-password", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/pages/ForgotPassword.html"));
});

app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000; // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiresAt = resetTokenExpiresAt;

    await user.save();

    // send email
    await sendPasswordResetEmail(
      user.email,
      `http://localhost:5000/reset-password/${resetToken}`
    );

    res.status(200).json({
      success: true,
      message: "Password reset link sent to your email",
    });
  } catch (error) {
    console.log("Error in forgotPassword ", error);
    res.status(400).json({ success: false, message: error.message });
  }
});

app.get("/send-successful-email", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/pages/SendFPSuccess.html"));
});

app.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiresAt: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset token" });
    }

    // update password
    const hashedPassword = await bcryptjs.hash(password, 10);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresAt = undefined;
    await user.save();

    await sendResetSuccessEmail(user.email);

    res
      .status(200)
      .json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.log("Error in resetPassword ", error);
    res.status(400).json({ success: false, message: error.message });
  }
});

app.get("check-auth", async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.log("Error in checkAuth ", error);
    res.status(400).json({ success: false, message: error.message });
  }
});

//Thêm câu hỏi
app.post("/api/questions", async (req, res) => {
  const questions = req.body; // expecting an array of question objects
  console.log("Received:", questions);

  // Check if the request body is an array and it has at least one question
  if (!Array.isArray(questions) || questions.length === 0) {
    return res
      .status(400)
      .send("Invalid request body. Expected an array of questions.");
  }

  // Validate each question in the array
  for (let questionObj of questions) {
    const { question, options, answer } = questionObj;
    if (!question || !options || !answer) {
      return res.status(400).send("Missing fields in one or more questions.");
    }
  }

  try {
    // Insert all questions using insertMany
    const newQuestions = await Question.insertMany(questions);
    res
      .status(201)
      .send(`${newQuestions.length} questions added successfully!`);
  } catch (err) {
    console.error("Error adding questions:", err);
    res.status(500).send("Error adding questions");
  }
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

app.get("/api/prepareToExam", verifyToken, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/pages/prepareToExam.html"));
});

app.post("/api/prepareToExam", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res
        .status(403)
        .json({ success: false, message: "Người dùng không hợp lệ." });
    }

    res
      .status(200)
      .json({ success: true, message: "Đã chuẩn bị xong cho kỳ thi." });
  } catch (error) {
    console.error("Lỗi trong quá trình chuẩn bị thi:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/questions", verifyToken, async (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/pages/question.html"));
});

app.get("/api/questions", verifyToken, async (req, res) => {
  try {
    const questions = await Question.aggregate([{ $sample: { size: 10 } }]); // Lấy ngẫu nhiên 10 câu hỏi
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: "Có lỗi xảy ra khi lấy câu hỏi." });
  }
});

app.get("/api/questions", verifyToken, async (req, res) => {
    try {
        const questions = await Question.aggregate([{ $sample: { size: 10 } }]); // Lấy ngẫu nhiên 10 câu hỏi
        res.json(questions); // Gửi câu hỏi đến client
    } catch (error) {
        res.status(500).json({ message: "Có lỗi xảy ra khi lấy câu hỏi." });
    }
});

app.post("/api/result", verifyToken, async (req, res) => {
    try {
        const userAnswers = req.body;  // Nhận câu trả lời của người dùng
        const questionIds = Object.keys(userAnswers)

        // Lấy các câu hỏi từ database
        const questions = await Question.find({ _id: { $in: questionIds } });

        let score = 0;
        questions.forEach((question) => {
            const userAnswer = userAnswers[question._id]; // Lấy câu trả lời của người dùng theo _id
            console.log(`User answer: ${userAnswer}, Correct answer: ${question.answer}`);
            if (userAnswer === question.answer) {
                score++;
            }
        });

        // Cập nhật điểm số cho người dùng
        const user = await User.findById(req.userId);
        user.score = score; // Cập nhật điểm
        await user.save();

        res.json({ score, total: questions.length }); // Trả về điểm số và tổng số câu hỏi
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Có lỗi xảy ra khi xử lý kết quả." });
    }
});
app.post("/logout", verifyToken, async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ success: true, message: "Logged out successfully" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});
