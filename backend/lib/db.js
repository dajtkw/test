import mongoose from "mongoose";


export const connectDB = async () => {
	try {
		const conn = await mongoose.connect("mongodb+srv://buithanhdat1462004:dat123@cluster0.yecrk.mongodb.net/test1?retryWrites=true&w=majority&appName=Cluster0");
		console.log(`MongoDB connected: ${conn.connection.host}`);
	} catch (error) {
		console.log("Error connecting to MONGODB", error.message);
		process.exit(1);
	}
};