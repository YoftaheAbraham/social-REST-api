import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { generateOTP } from '../utils/security.js';

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true
    },
    password: {
        type: String,
        select: false
    },
    username: {
        type: String,
        unique: true,
        validate: {
            validator: function (val) {
                return !val.includes(" ")
            },
            message: "User name can't have spaces"
        }
    },
    userID: {
        type: String
    },
    Account_name: {
        type: String,
        trim: true,
        default: `user${generateOTP()}`
    },
    bio: {
        type: String,
        default: ""
    },
    profile_picture: {
        type: String,
        trim: true,
        default: "http://localhost:6050/api/files/profileImages/default"
    },
    saves: {
        type: Array,
        default: [],
        select: false
    },
    isNewUser: {
        type: Boolean,
        default: true
    },
    followers: {
        type: Array,
        default: []
    },
    following: {
        type: Array,
        default: []
    }
});

userSchema.methods.checkPassword = async function (candidatePassword, hashedPassword) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
}
userSchema.pre("save", function (next) {
    this.userID = this._id
    next()
})


const userModel = mongoose.model('user', userSchema);


export default userModel;