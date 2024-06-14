import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    posted_by: {
        type: String,
    },
    Account_name: {
        type: String
    },
    email: String,
    content: {
        type: String,
        trim: false
    },

    liked_users: {
        type: Array,
        default: []
    },
    savedBy: {
        type: Array,
        default: []
    },
    fileUrl: {
        type: String
    },
    fileType: {
        type: String
    },
    postID: {
        type: String
    }
}, {
    timestamps: true
});

postSchema.pre("save", function (next) {
    this.postID = this._id
    next()
})

const postModel = mongoose.model("post", postSchema);

export default postModel;