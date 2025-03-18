import cookieParser from "cookie-parser";
import cors from 'cors';
import "dotenv/config";
import express from "express";
import connectDB from "./config/mongodb.js";
import authRouter from "./routes/authRoute.js"

const app = express();

const port = process.env.PORT || 4000;

connectDB();

app.use(express.json());
app.use(cookieParser());
app.use(cors({credentials: true}));

// API Endpoints
app.get('/', (req,res) => {
   res.status(200).json({ message: 'API Working'})
})
app.use('/api/auth', authRouter)

app.listen(port, () => console.log(`Server started on PORT: ${port}`)
);