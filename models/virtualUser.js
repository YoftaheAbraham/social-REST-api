import mongoose from "mongoose";
import { validate } from "uuid";

const virtualUserSchema = new mongoose.Schema({
    OTP: String,
    email: {
        type: String
    },
    password: {
        type: String,
        select: false
    },
    username: {
        type: String,
        validate: {
            validator: function (val) {
                return !val.includes(" ")
            },
            message: "User name can't have spaces"
        }
    },
    Account_name: {
        type: String
    }
});

const virtualUserModel = mongoose.model('virtual_user', virtualUserSchema);

export default virtualUserModel;