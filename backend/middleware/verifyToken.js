// import express from "express";
// import cookieParser from 'cookie-parser';
import jwt from "jsonwebtoken";
// const app = express(); 
// app.use(cookieParser());
export const verifyToken = (req, res, next) => {
	const token = req.cookies.token;
	console.log(token);
	if (!token) {
		
		return res.redirect('/login');
	} 
	try {
		const decoded = jwt.verify(token, 'your_secret_key');

		if (!decoded) {
			
			return res.redirect('/login');
		} 

		req.userId = decoded.userId;
		next();
	} catch (error) {
		console.log("Error in verifyToken ", error);
		return res.status(500).json({ success: false, message: "Server error" });
	}
};