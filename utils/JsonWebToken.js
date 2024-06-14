import jwt from "jsonwebtoken";

const validateToken = (req, res, next) => {
    try {
        const userToken = req.headers["authorization"]?.split(' ')[1];
        const userData = jwt.verify(userToken, process.env.JWT_SECRET);
        req.user = userData;
        next()
    } catch (error) {
        res.json({
            status: "fail",
            message: error.message
        })
    }
}
const validateResetToken = (req, res, next) => {
    try {
        const userToken = req.headers["authorization"]?.split(' ')[1];
        const userData = jwt.verify(userToken, process.env.RESET_TOKEN_SECRET_KEY);
        req.user = userData;
        next()
    } catch (error) {
        res.json({
            status: "fail",
            message: "Oops! Your session has expired. Please reauthenticate to continue.😒"
        })
    }
}

const signToken = (payload) => {
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "90d"
    });
    return token;
}
const resetToken = (payload) => {
    const token = jwt.sign(payload, process.env.RESET_TOKEN_SECRET_KEY, {
        expiresIn: "5m"
    });
    return token;
};

export { validateToken, validateResetToken, signToken, resetToken }
