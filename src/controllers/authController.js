import prisma from "../config/database.js"
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt.js";

const SALT_ROUNDS = 10;

// post /auth/register


export const register = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        //  Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(409).json({
                message: "User already exists",
            });
        }

        // hashed password
        const hashedPassword = await bcrypt.hash(password.SALT_ROUNDS);

        //create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
            }
        });

        //generate jwt
        const token = generateToken({
            id: user.id,
            email: user.email,
        });

        return res.status(201).json({
            message: "User registered successfully",
            token,
        });

    } catch (error) {
        console.error("Register error:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
}

// POST /auth/login

export const login = async (req, res) => {
  try {

    const { email, password } = req.body;

    // 1️⃣ Validate input
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // 2️⃣ Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    // 3️⃣ Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    // 4️⃣ Generate JWT
    const token = generateToken({
      id: user.id,
      email: user.email,
    });

    return res.status(200).json({
      message: "Login successful",
      token,
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

