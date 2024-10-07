import mongoose from "mongoose";
// import bcrypt from "bcryptjs";


const userSchema = new mongoose.Schema(
	{
		fullname: {
			type: String,
			required: [true, "Name is required"],
		},

        DayOfBirth: {
			type: Date,
			required: [true, "DayOfBirth is required"],
		},

        cccd: {
			type: String,
			required: [true, "cccd is required"],
		},

        phonenumber: {
			type: String,
			required: [true, "Phone Number is required"],
		},

		email: {
			type: String,
			required: [true, "Email is required"],
			unique: true,
			lowercase: true,
			trim: true,
		},

        
		password: {
			type: String,
			required: [true, "Password is required"],
			minlength: [6, "Password must be at least 6 characters long"],
		},
		role: {
			type: String,
			enum: ["Học sinh", "admin"],
			default: "Học sinh",
		},
	},
	{
		timestamps: true,
	}
);

// Pre-save hook to hash password before saving to database
// userSchema.pre("save", async function (next) {
// 	if (!this.isModified("password")) return next();

// 	try {
// 		const salt = await bcrypt.genSalt(10);
// 		this.password = await bcrypt.hash(this.password, salt);
// 		next();
// 	} catch (error) {
// 		next(error);
// 	}
// });

// userSchema.methods.comparePassword = async function (password) {
// 	return bcrypt.compare(password, this.password);
// };

const User = mongoose.model("User", userSchema);

export default User;