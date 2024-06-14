import { Router } from 'express';
import { validateToken } from '../utils/JsonWebToken.js';
import userModel from './../models/user.js'
import postModel from '../models/post.js';

const router = Router();

router.get('/', validateToken, async (req, res) => {
    const { q } = req.query;
    const userID = req.user.id
    const email = req.user.email
    try {
        const foundUsers = await userModel.aggregate([
            {
                $match: {
                    $or: [{ username: { $regex: `${q}` } },
                    { Account_name: { $regex: `${q}` } },
                    { bio: { $regex: `${q}` } }]
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
            }, {
                $match: {
                    isMe: false
                }
            },
            {
                $sort: {
                    isFollowed: -1,
                    followings_number: -1
                }
            },
            {
                $limit: 3
            }
        ])
        res.json({
            status: "success",
            message: "successfully applied data query",
            foundUsers: foundUsers,
        })
    } catch (error) {
        res.json({
            status: 'fail',
            message: error.message
        })
    }
})
router.get('/notoken', async (req, res) => {
    const { q } = req.query;
    try {
        const foundUsers = await userModel.aggregate([
            {
                $match: {
                    $or: [{ username: { $regex: `${q}` } },
                    { Account_name: { $regex: `${q}` } },
                    { bio: { $regex: `${q}` } }]
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
            },
            {
                $sort: {
                    followers_number: -1
                }
            },
            {
                $limit: 3
            }
        ])
        res.json({
            status: "success",
            message: "successfully applied data query",
            foundUsers: foundUsers,
        })
    } catch (error) {
        res.json({
            status: 'fail',
            message: error.message
        })
    }
})

export default router;