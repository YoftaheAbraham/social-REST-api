import validator from "validator";
import userModel from "../models/user.js";
import { hashPassword, generateOTP, comparePass } from "../utils/security.js";
import { signToken, resetToken } from "../utils/JsonWebToken.js";
import virtualUserModel from "../models/virtualUser.js";
import mailSender from "../utils/mailSender.js";


export const virtualRegistery = async (req, res, next) => {
    const body = { ...req.body };
    body.password = await hashPassword(body.password);
    const userData = {
        username: body.username,
        email: body.email,
        password: body.password,
        Account_name: body.Account_name
        // Account_name: body.Account_name || "",
        // bio: body.bio || ""
    };
    const alreadyExistes = await userModel.findOne({ $or: [{ email: userData.email }, { username: userData.username }] })
    try {
        if (!body.password || !body.email) {
            res.status(401).json({
                status: 'fail',
                message: 'Please Provide email and password'
            })
        } else if (!validator.isEmail(body.email)) {
            res.status(401).json({
                status: 'fail',
                message: 'Please provide valid email'
            })
        } else if (alreadyExistes) {
            if (body.email == alreadyExistes.email) {
                res.status(401).json({
                    status: 'fail',
                    message: 'User with the same Email already exists'
                })
            } else if (body.username == alreadyExistes.username) {
                res.status(401).json({
                    status: 'fail',
                    message: 'The username is already used, please provide a unique one'
                })
            }

        }
        else {
            const otp = generateOTP();
            const hashedOtp = await hashPassword(otp);
            await virtualUserModel.findOneAndDelete({ $or: [{ email: userData.email }, { username: userData.username }] })
            await virtualUserModel.create({
                OTP: hashedOtp,
                email: userData.email,
                password: userData.password,
                username: userData.username,
                Account_name: userData.Account_name
            });
            await mailSender(userData.email, "One-time verification", `

            To verify your account, please use the following verification code: 
            <br><h2 style="color: purple">${otp}</h2>

            If you did not request this verification code, please ignore this email. 

            Thank you, 
            Yoftahe Abraham
            `);
            res.json({
                status: "success",
                message: `Verification code99 is send to ${userData.email}`
            })
            // res.cookie('email', body.email, { maxAge: 900000, httpOnly: true });
        }
    } catch (error) {
        if (error.code == 11000) {
            res.status(401).json({
                status: 'fail',
                message: 'user with the same email or username already existed'
            })
        } else {
            res.status(403).json({
                status: 'error',
                message: error.message.replace("virtual_user validation failed: username:", "")
            })
        }
    }
}


export const signup = async (req, res) => {
    const { otp, email } = { ...req.body };
    try {
        const realUser = await userModel.findOne({ email }).select("+password");
        const virtualUser = await virtualUserModel.findOne({ email }).select("+password");
        if (realUser) {
            res.json({
                status: "fail",
                message: "User is already registered"
            })
        }
        if (virtualUser) {
            const correctOtp = await comparePass(virtualUser.OTP, otp);
            if (correctOtp) {
                await userModel.create({
                    email: virtualUser.email,
                    username: virtualUser.username,
                    password: virtualUser.password,
                    Account_name: virtualUser.Account_name
                });
                await virtualUserModel.findByIdAndDelete(virtualUser._id)
                res.json({
                    status: "success",
                    message: "user is successfully registered"
                });
            } else {
                res.json({
                    status: "fail",
                    message: "OTP code invalid"
                })
            }
        } else {
            res.json({
                status: "fail",
                message: "Can't find user"
            })
        }
    } catch (error) {
        if (error.code == 11000) {
            res.status(401).json({
                status: 'fail',
                message: 'user with the same email or username already existed'
            })
        } else {
            res.status(500).json({
                status: 'error',
                message: "Internal Error occured"
            })
        }
    }
};

export const login = async (req, res) => {
    const body = { ...req.body };
    try {
        if (!body.password || !body.email) {
            res.status(401).json({
                status: 'fail',
                message: 'Please provide email and password'
            })
        } else if (!validator.isEmail(body.email)) {
            res.status(401).json({
                status: 'fail',
                message: 'Please Provide valid email and password'
            })
        } else {
            const data = await userModel.findOne({ email: body.email }).select("+password");
            if (!data) {
                res.status(401).json({
                    status: 'fail',
                    message: "User with the provided email does no longer exist.",
                })
            }
            const correctPassword = await data?.checkPassword(body.password, data.password);
            if (!correctPassword) {
                res.status(401).json({
                    status: 'fail',
                    message: "Email and password mismatched",
                })
            } else {
                const token = signToken({ id: data._id, email: data.email })
                res.status(200).json({
                    status: 'success',
                    message: "successfully logged in",
                    token
                })
            }
        }
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'internal error occured'
        })

    }
};
export const resetPass = async (req, res) => {
    const body = { ...req.body };
    try {
        if (!body.email) {
            res.status(401).json({
                status: 'fail',
                message: 'Please provide your email'
            })
        } else if (!validator.isEmail(body.email)) {
            res.status(401).json({
                status: 'fail',
                message: 'Please Provide valid email'
            })
        } else {
            const data = await userModel.findOne({ email: body.email }).select("+password");
            if (!data) {
                res.status(401).json({
                    status: 'fail',
                    message: "User with the provided email does no longer exist.",
                })
            } else {
                const token = resetToken({
                    email: body.email,
                    id: data.id
                });
                let url = `http://${body.clientURL}/#/reset/${token}`;

                
                await mailSender(body.email, "Reset Your Password", `
                Dear ${data.username},
                <br>
                <br>
                We have received a request to reset your password for your account. To proceed with the password reset, please click
                on the following link:
                <br>
                <br>
                <a style="padding: 7px; color: #fff; background: #337ab7; text-decoration: none;"
                    href="${url}">Reset Password</a>
                <br>
                <br>

                If you did not request this password reset, please ignore this email. Your account security is important to us.
                <br>
                Thank you, Yofigram
                            `)
                res.json({
                    status: "success",
                    message: `successfully send the reset page link to ${body.email}`,
                })
            }
        }
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'internal error occured'
        })

    }
};
export const checkResetToken = (req, res) => {
    const user = req.user;
    res.json({
        status: "success",
        message: "Session is Available",
        email: user.email,
        userID: user.id
    })
}
export const resetIntegration = async (req, res) => {
    const { id } = req.params;
    req.body.password = await hashPassword(req.body.password)
    try {
        const data = await userModel.findByIdAndUpdate(id, {
            password: req.body.password
        });
        res.json({
            status: "success",
            message: "user password is successfully reset",
            data
        });

    } catch (error) {
        res.json({
            error: error.message
        })
    }
}