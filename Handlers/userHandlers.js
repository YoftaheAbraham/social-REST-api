import { v4 } from "uuid";
import userModel from "../models/user.js";
import postModel from "../models/post.js";
import sharp from "sharp"
import path from "node:path"
import { uploadBytes, ref, getDownloadURL } from "@firebase/storage";
import { storage } from "../utils/firebase.js";

export const getMultipleUsers = async (req, res) => {
    const userID = req.user.id;
    const email = req.user.email

    try {
        const data = await userModel.aggregate([
            {
                $addFields: {
                    isFollowed: {
                        $cond: {
                            if: { $in: [userID, "$followers"] },
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                $addFields: {
                    isMe: {
                        $cond: {
                            if: { $eq: [email, "$email"] },
                            then: true,
                            else: false
                        }
                    }
                }
            }
            , {
                $project: {
                    email: 0,
                    password: 0,
                    followers: 0,
                    following: 0
                }
            },
            {
                $match: {
                    isMe: false
                }
            },
            {
                $project: {
                    saves: 0
                }
            }
            ,
            {
                $sort: {
                    followers_number: 1,
                    isFollowed: 1,
                }
            },
            {
                $limit: 10
            }
        ]);
        res.json({
            status: "success",
            data: data
        })
    } catch (error) {
        res.json({
            status: "fail",
            message: error.message
        })
    }


}
export const getMultipleUsersNoToken = async (req, res) => {
    try {
        const data = await userModel.aggregate([
            {
                $addFields: {
                    followers_number: {
                        $size: "$followers"
                    }
                }
            },
            {
                $project: {
                    email: 0,
                    password: 0,
                    following: 0
                }
            },
            {
                $sort: {
                    followers_number: -1
                }
            },
            {
                $limit: 10
            }
        ]);

        res.json({
            status: "success",
            data: data
        })
    } catch (error) {
        res.json({
            status: "fail",
            message: error.message
        })

    }
}

export const getCurrentUser = async (req, res) => {
    const userID = req.user.id;
    try {
        const userData = await userModel.findById(userID);
        const data = await userModel.aggregate([
            {
                $match: {
                    _id: new Object(userData._id)
                }
            },
            {
                $addFields: {
                    followings_number: {
                        $size: "$following"
                    }
                }
            },
            {
                $addFields: {
                    followers_number: {
                        $size: "$followers"
                    }
                }
            }
        ])
        res.json({
            status: "success",
            message: "Succes fully fetched Data",
            data: data[0]
        })
    } catch (error) {
        res.json({
            status: "fail",
            message: "Can't get user",
            error: error.message
        })
    }
}
export const retrieveSaved = async (req, res) => {
    const userID = req.user.id
    const user = await userModel.findById(userID).select("+saves");
    try {
        if (user) {
            const data = await userModel.aggregate([
                {
                    $match: {
                        userID: user.userID,
                    },
                },
                {
                    $lookup: {
                        from: "posts",
                        localField: "saves",
                        foreignField: "postID",
                        as: "data",
                    },
                }
            ])
            res.json({
                status: "success",
                message: "success fully retrieved data",
                data: data[0].data
            })
        } else {
            res.json({
                status: "fail",
                message: 'Oops!😒 user is not found'
            });
        }
    } catch (err) {
        res.json({
            status: "fail",
            message: err.message
        });
    }
}
export const getConnections = async (req, res) => {
    try {
        const data = await userModel.aggregate([
            {
                $match: {
                    $or: [{ followers: req.user.id }]
                }
            }
        ])
        res.json({
            status: "success",
            message: "successfully fetched Data",
            results: data.length,
            data
        })
    } catch (error) {
        res.json({
            status: "fail",
            message: error.message
        })
    }
}

export const getSingleUser = async (req, res) => {
    const { username } = req.params
    const userID = req.user.id;
    const email = req.user.email;
    try {
        const data = await userModel.findOne({
            username: username
        });
        if (data) {
            const aggr = await userModel.aggregate([
                {
                    $match: {
                        _id: data._id
                    }
                },
                {
                    $addFields: {
                        isFollowed: {
                            $cond: {
                                if: { $in: [userID, "$followers"] },
                                then: true,
                                else: false
                            }
                        }
                    }
                },
                {
                    $addFields: {
                        isMe: {
                            $cond: {
                                if: { $eq: [email, "$email"] },
                                then: true,
                                else: false
                            }
                        }
                    }
                },
                {
                    $addFields: {
                        followings_number: {
                            $size: "$following"
                        }
                    }
                },
                {
                    $addFields: {
                        followers_number: {
                            $size: "$followers"
                        }
                    }
                }
            ])
            const posts = await postModel.aggregate([
                {
                    $lookup: {
                        from: 'users',
                        localField: 'email',
                        foreignField: 'email',
                        as: 'result'
                    }
                },
                {
                    $match: {
                        posted_by: data.userID
                    }
                },
                {
                    $addFields: {
                        likes: {
                            $size: "$liked_users"
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
                },
                {
                    $addFields: {
                        user: { $first: "$result" }
                    }
                },
                {
                    $sort: {
                        createdAt: -1
                    }
                }
            ]);
            res.json({
                status: "success",
                data: aggr,
                posts,
            })
        } else {
            res.json({
                status: 'fail',
                message: "😤 User is no longer available"
            })
        }
    } catch (error) {
        res.json({
            status: "fail",
            message: error.message
        })
    }

}
export const getSingleUserNoToken = async (req, res) => {
    const { username } = req.params
    try {
        const data = await userModel.findOne({
            username: username
        });
        if (data) {
            const aggr = await userModel.aggregate([
                {
                    $match: {
                        _id: data._id
                    }
                },
                {
                    $addFields: {
                        followings_number: {
                            $size: "$following"
                        }
                    }
                },
                {
                    $addFields: {
                        followers_number: {
                            $size: "$followers"
                        }
                    }
                }
            ])
            const posts = await postModel.aggregate([
                {
                    $lookup: {
                        from: 'users',
                        localField: 'email',
                        foreignField: 'email',
                        as: 'result'
                    }
                },
                {
                    $match: {
                        posted_by: data.userID
                    }
                },
                {
                    $addFields: {
                        likes: {
                            $size: "$liked_users"
                        }
                    }
                }, {
                    $addFields: {
                        isLiked: false
                    }
                }, {
                    $addFields: {
                        isMyPost: false
                    }
                },
                {
                    $addFields: {
                        user: { $first: "$result" }
                    }
                },
                {
                    $sort: {
                        createdAt: -1
                    }
                }
            ]);
            res.json({
                status: "success",
                data: aggr,
                posts,
            })
        } else {
            res.json({
                status: 'fail',
                message: "user is not found"
            })
        }
    } catch (error) {
        res.json({
            status: "fail",
            message: error.message
        })

    }

}

export const updateUser = async (req, res) => {
    const userID = req.user.id;
    const foundUser = await userModel.findById(userID)
    const username = req.body.username || foundUser.username;
    const Account_name = req.body.account_name || foundUser.Account_name;
    const bio = req.body.bio || foundUser.bio
    try {
        if (foundUser) {
            if (req.file) {
                if (req.file.mimetype == "image/jpeg") {
                    const imageBuffer = await sharp(req.file.buffer).resize({ width: 800 }).jpeg({ quality: 80 }).toBuffer();
                    const extension = path.extname(req.file.originalname)
                    const fileName = `${v4()}${extension}`
                    const reference = ref(storage, `/userFiles/${fileName}`);
                    await uploadBytes(reference, imageBuffer)
                    const url = await getDownloadURL(reference)
                    await userModel.findByIdAndUpdate(userID, {
                        username, Account_name, bio,
                        profile_picture: url,
                        isNewUser: false
                    })
                    res.status(200).json({
                        status: "success",
                        message: "successfully updated your profile",
                        url
                    })
                } else {
                    const extension = path.extname(file.originalname)
                    const fileName = `${v4()}${extension}`
                    const reference = ref(storage, `/userFiles/${fileName}`);
                    await uploadBytes(reference, req.file.buffer)
                    const url = await getDownloadURL(reference)
                    await userModel.findByIdAndUpdate(userID, {
                        username, Account_name, bio,
                        profile_picture: url,
                        isNewUser: false
                    })
                    res.status(200).json({
                        status: "success",
                        message: "successfully updated your profile",
                        url
                    })
                }
            } else {
                await userModel.findByIdAndUpdate(userID, {
                    username, Account_name, bio,

                })
                res.status(200).json({
                    status: "success",
                    message: "successfully updated your profile"
                })
            }
        } else {
            res.status(403).json({
                status: "fail",
                message: "can't update your profile"
            })
        }
    } catch (error) {
        if (error.code == 11000) {
            res.status(403).json({
                status: "fail",
                message: "This username is already in use, Please provide a unique one"
            })
        } else {
            res.status(403).json({
                status: "fail",
                message: error.message
            })
        }
    }
}

export const followUser = async (req, res) => {
    const { id } = req.params
    const userID = req.user.id;
    try {
        const foundUser = await userModel.findById(id)
        const aggr = await userModel.aggregate([
            {
                $match: {
                    _id: new Object(foundUser._id)
                }
            },
            {
                $addFields: {
                    isFollowed: {
                        $cond: {
                            if: { $in: [userID, "$followers"] },
                            then: true,
                            else: false
                        }
                    }
                }
            }
        ]);
        if (userID == id) {
            res.json({
                status: "fail",
                message: "You can't follow your self"
            });
        } else if (!foundUser) {
            res.json({
                status: "fail",
                message: "Followed user does no longer exist"
            });
        } else if (aggr[0].isFollowed == false) {
            await userModel.findByIdAndUpdate(id, {
                $push: { followers: userID }
            }
            );
            await userModel.findByIdAndUpdate(userID, {
                $push: { following: id }
            }
                // following: { $push: userID }
            );

            res.json({
                status: "success",
                message: "Successfully followed the user"
            })
        } else {
            res.json({
                status: "fail",
                message: "You are already following the user"
            })
        }

    } catch (error) {
        res.json({
            status: 'fail',
            message: error.message
        })
    }
}

export const unfollowUser = async (req, res) => {
    const { id } = req.params
    const userID = req.user.id;
    const foundUser = await userModel.findById(id)
    const aggr = await userModel.aggregate([
        {
            $match: {
                _id: new Object(foundUser._id)
            }
        },
        {
            $addFields: {
                isFollowed: {
                    $cond: {
                        if: { $in: [userID, "$followers"] },
                        then: true,
                        else: false
                    }
                }
            }
        }
    ]);
    try {
        if (userID == id) {
            res.json({
                status: "fail",
                message: "You can't unfollow your self"
            });
        } else if (!foundUser) {
            res.json({
                status: "fail",
                message: "unFollowed user does no longer exist"
            });
        } else if (aggr[0].isFollowed == true) {
            await userModel.findByIdAndUpdate(id, {
                $pull: { followers: userID }
            }
            );
            await userModel.findByIdAndUpdate(userID, {
                $pull: { following: id }
            }
                // following: { $push: userID }
            );

            res.json({
                status: "success",
                message: "Successfully unfollowed the user"
            })
        } else {
            res.json({
                status: "fail",
                message: "You are not following the user already "
            })
        }

    } catch (error) {
        res.json({
            status: 'fail',
            message: error.message
        })
    }
}