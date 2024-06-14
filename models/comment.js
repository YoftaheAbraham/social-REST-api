import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    post_id: String,
    commentedById: String,
    Account_name: String,
    profile_picture: String,
    commentText: String,
    username: String,
    liked_users: {
        type: Array
    },
    comment_id: {
        type: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});


const commentModel = mongoose.model("comment", commentSchema);

export default commentModel;