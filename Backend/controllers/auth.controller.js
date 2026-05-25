import { User } from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import redis from "../config/redis.js";

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

export const signup = async (req, res) => {
  try {
    const { username, email, password, phone } = req.body;

    if (!username || !email || !password || !phone) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: "Phone number must be exactly 10 digits" });
    }

    const phoneNum = await User.findOne({ phone: req.body.phone });
    if (phoneNum) {
      return res.status(400).json({ message: "User already exists with this phone number" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, phone, password: hashed });

    const token = generateToken(user);

    try {
     await redis.setex(
  `activeSession:${user._id}`,
  7 * 24 * 60 * 60,
  token
);
      console.log("✅ Session stored for:", user._id.toString());
    } catch (redisErr) {
      console.error("❌ Redis set failed:", redisErr.message);
    }

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    }).json({ user, token, success: "Signup Successfully" });

  } catch (err) {
    console.error("Signup error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user);

    try {
    await redis.setex(
  `activeSession:${user._id}`,
  7 * 24 * 60 * 60,
  token
);
      console.log("✅ Session stored for:", user._id.toString());
    } catch (redisErr) {
      console.error("❌ Redis set failed:", redisErr.message);
    }

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    }).json({ user, token, success: "Login Successfully" });

  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

export const logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { lastSeen: new Date() });

    try {
      await redis.del(`activeSession:${req.user._id}`);
      console.log("✅ Session deleted for:", req.user._id.toString());
    } catch (redisErr) {
      console.error("❌ Redis del failed:", redisErr.message);
    }

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.json({ message: "Logged out" });
  } catch (err) {
    console.error("Logout error:", err.message);
    res.status(500).json({ message: err.message });
  }
};