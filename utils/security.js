import bcrypt from "bcrypt";

const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10)
    return await bcrypt.hash(password, salt)
}
const comparePass = async (hashed, plain) => {
    return await bcrypt.compare(plain, hashed)
}
const generateOTP = () => {
    let otp = '';
    for(let i = 1; i <= 6; i++) {
        otp += (Math.floor(Math.random() * 9) + 1)
    }
    return otp;
}
export { hashPassword, generateOTP, comparePass };