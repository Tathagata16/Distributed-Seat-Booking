import jwt from 'jsonwebtoken'
//generate token (for testing/ login route)
export const generateToken = (payload)=>{
    return jwt.sign(payload, process.env.JWT_SECRET,{
        expiresIn: "1h",
    });
};

//verify token function
export const verifyToken = (token)=>{
    return jwt.verify(token,process.env.JWT_SECRET);
};