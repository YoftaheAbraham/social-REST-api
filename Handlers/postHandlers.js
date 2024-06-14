import path from "node:path"
import { v4 } from "uuid";
import postModel from "../models/post.js";
import userModel from "../models/user.js";
import commentModel from "../models/comment.js";
import { storage } from './../utils/firebase.js'
import sharp from "sharp"
import { ref, uploadBytes, getDownloadURL } from "@firebase/storage";

export const getMultiplePosts = async (req, res) => {
    const skip = req.query.skip * 1 || 0;
    const limit = req.query.limit * 1 || 10;
    const userID = req.user.id;
    try {
        if (userID) {
            const data = await postModel.aggregate([
                {
                    $lookup: {
                        from: 'users',
                        localField: 'email',
                        foreignField: 'email',
                        as: 'result'
                    }
                },
                {
                    $lookup: {
                        from: 'comments',
                        localField: 'postID',
                        foreignField: 'post_id',
                        as: 'comments'
                    }
                },
                {
                    $addFields: {
                        likes: {
                            $size: "$liked_users"
                        }
                    }
                },
                {
                    $addFields: {
                        NumberOfComments: {
                            $size: "$comments"
                        }
                    }
                }, {
                    $addFields: {
                        isLiked: {
                            $cond: {
                                if: { $in: [userID, "$liked_users"] },
                                then: true,
                                else: false
                            }
                        }
                    }
                }, {
                    $addFields: {
                        isMyPost: {
                            $cond: {
                                if: { $eq: [userID, "$posted_by"] },
                                then: true,
                                else: false
                            }
                        }
                    }
                }, {
                    $addFields: {
                        isSaved: {
                            $cond: {
                                if: { $in: [userID, "$savedBy"] },
                                then: true,
                                else: false
                            }
                        }
                    }
                },
                {
                    $addFields: {
                        user: { $first: "$result" }
                    }
                },
                {
                    $project: {
                        result: 0,
                        comments: 0,
                        "user.password": 0,
                        "user.email": 0,
                        "user.bio": 0,
                        "user.followers": 0,
                        "user.following": 0
                    }
                },
                {
                    $sort: {
                        createdAt: -1
                    }
                },
                {
                    $skip: (skip * limit)
                }
                ,
                {
                    $limit: limit
                }
            ]);
            res.status(200).json({
                status: "success",
                message: "Successfully fetched data",
                results: data.length,
                data: data,
            })
        }
    } catch (error) {
        res.status(403).json({
            status: "fail",
            message: error.message
        })
    }
};
export const getMultiplePostsNoToken = async (req, res) => {
    const skip = req.query.skip * 1 || 0;
    const limit = req.query.limit * 1 || 10;
    try {
        const data = await postModel.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'email',
                    foreignField: 'email',
                    as: 'result'
                }
            },
            {
                $lookup: {
                    from: 'comments',
                    localField: 'postID',
                    foreignField: 'post_id',
                    as: 'comments'
                }
            },
            {
                $addFields: {
                    likes: {
                        $size: "$liked_users"
                    }
                }
            },
            {
                $addFields: {
                    NumberOfComments: {
                        $size: "$comments"
                    }
                }
            },
            {
                $addFields: {
                    user: { $first: "$result" }
                }
            },
            {
                $project: {
                    result: 0,
                    "user.password": 0,
                    "user.email": 0,
                    "user.bio": 0,
                    "user.followers": 0,
                    "user.following": 0
                }
            },
            {
                $skip: skip
            }
            ,
            {
                $sort: {
                    createdAt: -1
                }
            },
            {
                $limit: limit
            }
        ]);
        res.status(200).json({
            status: "success",
            message: "Successfully fetched data",
            results: data.length,
            data: data,
        })
    } catch (error) {
        res.status(403).json({
            status: "fail",
            message: error.message
        })
    }
};

export const getSinglePost = async (req, res) => {
    const body = { ...req.body };
    const { id } = req.params;
    const user = req.user;
    try {
        const post = await postModel.findById(id);
        const comments = await commentModel.aggregate([
            {
                $match: {
                    post_id: id
                }
            },
            {
                $addFields: {
                    likes: {
                        $size: "$liked_users"
                    }
                }
            },
            {
                $addFields: {
                    isLiked: {
                        $cond: {
                            if: { $in: [user.id, "$liked_users"] },
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                $sort: {
                    likes: -1,
                    createdAt: -1
                }
            }
        ])
        if (post) {
            const singlePost = await postModel.aggregate([
                {
                    '$match': {
                        _id: new Object(post._id)
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'email',
                        foreignField: 'email',
                        as: 'result'
                    }
                },
                {
                    $addFields: {
                        user: {
                            $first: "$result"
                        }
                    }
                }, {
                    $addFields: {
                        likes: {
                            $size: "$liked_users"
                        }
                    }
                }, {
                    $addFields: {
                        isLiked: {
                            $cond: {
                                if: { $in: [user.id, "$liked_users"] },
                                then: true,
                                else: false
                            }
                        }
                    }
                },
                {
                    $addFields: {
                        isMyPost: {
                            $cond: {
                                if: { $eq: [user.id, "$posted_by"] },
                                then: true,
                                else: false
                            }
                        }
                    }
                },
                {
                    $project: {
                        result: 0,
                        "user.password": 0,
                        "user.password": 0,
                        "user.email": 0,
                        "user.bio": 0,
                        "user.followers": 0,
                        "user.following": 0
                    }
                }
            ])
            res.status(200).json({
                status: "success",
                message: "Successfully fetched datas",
                post: singlePost,
                comments
            })
        } else {
            res.status(404).json({
                status: "success",
                message: "Post Not found",
            })
        }
    } catch (error) {
        res.status(403).json({
            status: "fail",
            message: "☹️ The specified post is no longer available"
        })
    }
};
export const getSinglePostNoToken = async (req, res) => {
    const body = { ...req.body };
    const { id } = req.params;
    try {
        const post = await postModel.findById(id);
        const comments = await commentModel.aggregate([
            {
                $match: {
                    post_id: id
                }
            },
            {
                $addFields: {
                    likes: {
                        $size: "$liked_users"
                    }
                }
            },
            {
                $sort: {
                    likes: -1,
                    createdAt: -1
                }
            }
        ])
        if (post) {
            const singlePost = await postModel.aggregate([
                {
                    '$match': {
                        _id: new Object(post._id)
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'email',
                        foreignField: 'email',
                        as: 'result'
                    }
                },
                {
                    $addFields: {
                        user: {
                            $first: "$result"
                        }
                    }
                }, {
                    $addFields: {
                        likes: {
                            $size: "$liked_users"
                        }
                    }
                },
                {
                    $project: {
                        result: 0,
                        "user.password": 0,
                        "user.password": 0,
                        "user.email": 0,
                        "user.bio": 0,
                        "user.followers": 0,
                        "user.following": 0
                    }
                }
            ])
            res.status(200).json({
                status: "success",
                message: "Successfully fetched datas",
                post: singlePost,
                comments
            })
        } else {
            res.status(404).json({
                status: "success",
                message: "Post Not found",
            })
        }
    } catch (error) {

        res.status(403).json({
            status: "fail",
            message: error.message
        })
    }
};
export const updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const userID = req.user.id;

        const post = await postModel.findById(id)
        if (!req.body.content || req.body.content == "") {
            res.status(403).json({
                status: "fail",
                message: "Post body can't be empty"
            })
        } else {
            if (userID == post.posted_by) {
                await postModel.findByIdAndUpdate(id, {
                    content: req.body.content
                })
                res.status(200).json({
                    status: "success",
                    message: "succesfully updated the post"
                })
            } else {
                res.status(403).json({
                    status: "fail",
                    message: "You can only update your post..."
                })
            }

        }
    } catch (error) {

        res.status(500).json({
            status: "fail",
            message: error.message
        })
    }
}

export const savePost = async (req, res) => {
    const userID = req.user.id;
    const { id } = req.params

    try {
        const userData = await userModel.findById(userID).select("+saves");
        if (userData.saves.includes(id)) {
            res.json({
                status: "fail",
                message: "You have already saved the post"
            })
        } else {
            await userModel.findByIdAndUpdate(userID, {
                $push: { saves: id }
            })
            await postModel.findByIdAndUpdate(id, {
                $push: { savedBy: userID }
            })
            res.json({
                status: "success",
                message: "successfully saved the post"
            })
        }
    } catch (error) {
  
        res.json({
            status: "fail",
            message: "failed to save the post"
        })

    }
}
export const unSavePost = async (req, res) => {
    const userID = req.user.id;
    const { id } = req.params
    try {
        const userData = await userModel.findById(userID).select("+saves");
        if (userData.saves.includes(id)) {
            await userModel.findByIdAndUpdate(userID, {
                $pull: { saves: id }
            })
            await postModel.findByIdAndUpdate(id, {
                $pull: { savedBy: userID }
            })
            res.json({
                status: "success",
                message: "successfully unsaved the post"
            })
        } else {
            res.json({
                status: "fail",
                message: "You didn't save the post already"
            })
        }
    } catch (error) {
      
        res.json({
            status: "fail",
            message: "failed to save the post"
        })
    }
}

export const createPost = async (req, res) => {
    const { textContent } = { ...req.body };
    const { file } = req;
    const userID = req.user.id;
    try {
        const userExists = await userModel.findById(userID);
        if (userExists) {
            if (!textContent || textContent == "") {
                res.json({
                    status: "fail",
                    message: "Post body can't be empty"
                })
            } else if (file) {
                let message = '';
                let fileSizeSupported = file.size <= (20 * 1024 * 1024);
                if (fileSizeSupported) {
                    if (file.mimetype == "video/mp4" || file.mimetype == "video/webm" || file.mimetype == "image/png" || file.mimetype == "image/jpeg" || file.mimetype == "audio/mpeg" || file.mimetype == "audio/mp4" || file.mimetype == "audio/mp3") {
                        if (file.mimetype == "image/jpeg" && file.size <= (1.5 * 1024 * 1024)) {
                            message = "Successfully Uploaded your post"
                            const imageBuffer = await sharp(req.file.buffer).resize({ width: 800 }).jpeg({ quality: 80 }).toBuffer();
                            const extension = path.extname(file.originalname)
                            const fileName = `${v4()}${extension}`
                            const reference = ref(storage, `/postFiles/${fileName}`);
                            await uploadBytes(reference, imageBuffer)
                            const url = await getDownloadURL(reference)
                            await postModel.create({
                                content: textContent,
                                posted_by: userExists._id,
                                Account_name: userExists.Account_name,
                                email: userExists.email,
                                fileUrl: url,
                                fileType: file.mimetype
                            })
                            res.status(201).json({
                                status: "success",
                                message,
                                username: userExists.username,
                                Account_name: userExists.Account_name,
                                fileType: file.mimetype
                            })
                        } else {
                            message = "Successfully Uploaded your post"
                            const extension = path.extname(file.originalname)
                            const fileName = `${v4()}${extension}`
                            const reference = ref(storage, `/postFiles/${fileName}`);
                            await uploadBytes(reference, file.buffer)
                            const url = await getDownloadURL(reference)
                            await postModel.create({
                                content: textContent,
                                posted_by: userExists._id,
                                Account_name: userExists.Account_name,
                                email: userExists.email,
                                fileUrl: url,
                                fileType: file.mimetype
                            })
                            res.status(201).json({
                                status: "success",
                                message,
                                username: userExists.username,
                                Account_name: userExists.Account_name,
                                fileType: file.mimetype
                            })
                        }
                    } else {
                        message = "File type is not supported"
                        res.status(201).json({
                            status: "fail",
                            message,
                        })
                    }

                } else {
                    message = "Medias morethan 20MB can't be uploaded"
                    res.status(201).json({
                        status: "fail",
                        message,
                    })
                }
            } else {
                await postModel.create({
                    content: textContent,
                    posted_by: userExists._id,
                    Account_name: userExists.Account_name,
                    email: userExists.email
                })
                res.status(201).json({
                    status: "success",
                    message: "Your post is successfully added",
                    username: userExists.username,
                    Account_name: userExists.Account_name
                })
            }

        } else {
            res.status(403).json({
                status: "fail",
                message: "Can't post right now"
            })
        }
    } catch (error) {
        res.status(403).json({
            status: "fail",
            message: error.message
        })
    }

};

export const likePost = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        const alreadyLiked = await postModel.find({
            _id: new Object(id),
            liked_users: user.id
        });
        if (!alreadyLiked.length >= 1) {
            await postModel.findByIdAndUpdate(id, {
                $push: {
                    liked_users: user.id
                }
            });
            res.json({
                status: "success",
                message: "liked the post"
            })
        } else {
            res.json({
                status: "fail",
                message: "You already liked the post"
            })
        }
        // await likeModel
    } catch (error) {
  
        res.status(500).json({
            status: "fail",
            message: error.message
        })
    }
}
export const dislikePost = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        const alreadyLiked = await postModel.find({
            _id: new Object(id),
            liked_users: user.id
        });
        if (alreadyLiked.length >= 1) {
            await postModel.findByIdAndUpdate(id, {
                $pull: {
                    liked_users: user.id
                }
            });
            res.json({
                status: "success",
                message: "disliked the post"
            })
        } else {
            res.json({
                status: "fail",
                message: "You didn't like the post already"
            })
        }
        // await likeModel
    } catch (error) {
        res.status(500).json({
            status: "fail",
            message: error.message
        })
    }
}

export const addComments = async (req, res) => {
    const { id } = req.params;
    const userID = req.user;
    try {
        const user = await userModel.findById(userID.id)
        if (user) {
            const Added = await commentModel.create({
                post_id: id,
                commentedById: userID.id,
                Account_name: user.Account_name,
                profile_picture: user.profile_picture,
                commentText: req.body.text,
                username: user.username
            })
            const comment = await commentModel.aggregate([{
                $match: {
                    _id: new Object(Added._id)
                }
            },
            {
                $addFields: {
                    likes: {
                        $size: "$liked_users"
                    }
                }
            },
            {
                $addFields: {
                    isLiked: {
                        $cond: {
                            if: { $in: [user.id, "$liked_users"] },
                            then: true,
                            else: false
                        }
                    }
                }
            }
            ])

            res.status(200).json({
                status: "success",
                message: "succesfully added the comment",
                comment
            })
        } else {
            res.status(201).json({
                status: "fail",
                message: "can't add the comments"
            })
        }

    } catch (error) {
        res.status(500).json({
            status: "fail",
            message: error.message
        })
    }
}
export const likeComment = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        const alreadyLiked = await commentModel.find({
            _id: new Object(id),
            liked_users: user.id
        });
        if (!alreadyLiked.length >= 1) {
            await commentModel.findByIdAndUpdate(id, {
                $push: {
                    liked_users: user.id
                }
            });
            res.json({
                status: "success",
                message: "liked the comment"
            })
        } else {
            res.json({
                status: "fail",
                message: "You already liked the post"
            })
        }
        // await likeModel
    } catch (error) {
        res.status(500).json({
            status: "fail",
            message: error.message
        })
    }
}

export const dislikeComment = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        const alreadyLiked = await commentModel.find({
            _id: new Object(id),
            liked_users: user.id
        });
        if (alreadyLiked.length >= 1) {
            await commentModel.findByIdAndUpdate(id, {
                $pull: {
                    liked_users: user.id
                }
            });
            res.json({
                status: "success",
                message: "disliked the comment"
            })
        } else {
            res.json({
                status: "fail",
                message: "You didn't like the comment already"
            })
        }
        // await likeModel
    } catch (error) {
        res.status(500).json({
            status: "fail",
            message: error.message
        })
    }
}