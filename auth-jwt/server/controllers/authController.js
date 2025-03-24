import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import transporter from "../config/nodemailer.js";
import userModel from "../models/userModel.js";

// Register Controller
export const register = async (req, res) => {
    const { name, email, password } = req.body;

    // Validate input fields
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }

    try {
        const normalizedEmail = email.toLowerCase(); // Prevent case-sensitive duplicates

        // Check if user already exists
        const existingUser = await userModel.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Email already in use" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = new userModel({ name, email: normalizedEmail, password: hashedPassword });
        await user.save();

        // Generate JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "default_secret", {
            expiresIn: "7d",
        });

        // Set cookie with token
        try {
            res.cookie("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });
        } catch (cookieError) {
            console.error("Error setting cookie:", cookieError);
        }

        // Send welcome email
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: "Welcome to Ray",
            text: `Welcome to Ray! Your account has been successfully created with email: ${email}.`,
        };
        await transporter.sendMail(mailOptions);

        return res.status(201).json({ success: true, message: "User registered successfully" });

    } catch (error) {
        console.error("Registration Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Login Controller
export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    try {
        // Find user by email
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        // Compare entered password with stored hash
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

        // Set cookie with token
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({ success: true, message: "Login successful" });

    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// Logout Controller
export const logout = async (req, res) => {
    try {
        // Clear the authentication token cookie
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        });

        return res.status(200).json({ success: true, message: "Logged out successfully" });

    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// Send Verification otp to the user email
export const sendVerifyOtp = async (req, res) => {
    try {
        const {userId} = req.body;

        const user = await userModel.findById(userId);

        if (user.isAccountVerified) {
            return res.json({
                success: false,
                message: "Account Already verified"
            })
        }

       const otp = String(Math.floor(100000 + Math.random() * 900000))

       user.verifyOtp = otp;
       user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;

       await user.save();

       const mailOption = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: "Account Verification OTP",
            text: `Your OTP is ${otp}. Verify your account using this OTP. `,
       }

       await transporter.sendMail(mailOption);

       res.json({
        success: true,
        message: 'Verification OTP Sent on Email'
       })

    } catch (error) {
        res.json({ success: false, message: error.message})
    }
}

// verify email by otp
export const verifyEmail = async (req, res) => {
    const {userId, otp} = req.body;

    if(!userId || !otp ) {
        return res.json({
            success: false,
            message: "Missing Details"
        });
    }
    
    try {
        
        const user = await userModel.findById(userId);

        if (!user) {
            return res.json({
                success: false,
                message: "User not found"
            });
        }

        if (user.verifyOtp === '' || user.verifyOtp != otp) {
            return res.json({
                success: false,
                message: "Invalid OTP"
            });
        }

        if (user.verifyOtpExpireAt < Date.now()) {
            return res.json({
                success: false,
                message: "OTP Expired"
            });
        }

        user.isAccountVerified = true;

        user.verifyOtp = '';
        user.verifyOtpExpireAt = 0;

        await user.save();

        return res.json({
            success: true,
            message: "Email verified successfully"
        });

    } catch (error) {
        return res.json({
            success: false,
            message: error.message
        });
    }

}

// Check if user is authenticated
export const isAuthenticated = async (req, res) => {
    
    try {
        return res.json({success: true});
    } catch (error) {
        return res.json({
            success: false,
            message: error.message
        })
    }
}

// Send Password Reset OTP
export const sendResetOtp = async (req, res) => {
    const {email} = req.body;

    if(!email) {
        return res.json({ success: false, message: "Email is requied"});
    }

    try {

        const user = await userModel.findOne({email})
        if(!user){
            return res.json({ success: false, message: "User not found"
            })
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000))

       user.resetOtp = otp;
       user.resetOtpExpireAt = Date.now() + 15 * 60 *  1000;

       await user.save();

       const mailOption = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: "Password Reset OTP",
            text: `Your OTP for resetting your password is ${otp}. Use this OTP to procced with resetting your password `,
       }

       await transporter.sendMail(mailOption);

       return res.json({success: true, message: "OTP sent to your email"})
        
    } catch (error) {
        return res.json({message: false, message: error.message});
    }

}

// Reset User Password 
export const resetPassword = async (req, res) => {
    const {email, otp, newPassword} = req.body;

    if (!email || !otp || !newPassword) {
        return res.json({
            success: false,
            message: "Email, OTP and new passowrd are required"
        });
    }

    try {

        const user = await userModel.findOne({email})
        if(!user) {
            return res.json({
                success: false,
                message: "User not found"
            });
        }

        if (user.resetOtp === '' || user.resetOtp != otp) {
            return res.json({
                success: false,
                message: "Invalid OTP"
            });
        }

        if (user.resetOtpExpireAt < Date.now()) {
            return res.json({
                success: false,
                message: "OTP Expired"
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;

        user.resetOtp = '';
        user.resetOtpExpireAt = 0;

        await user.save();

        return res.json({
            success: true,
            message: "Password has been reset successflly"
        });
        
    } catch (error) {
        return res.json({success: false, message: error.message});
    }
}