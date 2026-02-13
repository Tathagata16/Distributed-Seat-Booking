import { verifyToken } from "../utils/jwt.js"

const authMiddleware = async (req, res, next) => {

    //1. read authorization header
    const authHeader = req.headers.authorization;

    //header fomat: Bearer<token>

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Unauthorized: Missing token",
        });
    }

    try {
        //2. extract token
        const token = authHeader.split(" ")[1];
        //3. verify token

        const decoded = verifyToken(token);

        //4.Attach user to request object
        req.user = decoded;

        //5. continue
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Unauthorized: Invalid or expired token",
        });
    }

};

export default authMiddleware;