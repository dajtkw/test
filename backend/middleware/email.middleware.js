import User from "../models/user.model.js";
export const verifyEmail = (req, res, next) => {
    const user = User.findOne({ email });
	
	try {
		if (!user) return res.status(401).json({ success: false, message: "Can't find email" });
		next();
	} catch (error) {
		console.log("Error in findEmail ", error);
		return res.status(500).json({ success: false, message: "Server error" });
	}

};