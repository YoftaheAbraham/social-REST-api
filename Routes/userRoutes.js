import { Router } from "express";
import { followUser, getMultipleUsersNoToken, getSingleUserNoToken, getConnections, getCurrentUser, retrieveSaved, getMultipleUsers, getSingleUser, unfollowUser, updateUser } from "../Handlers/userHandlers.js";
import { validateToken } from '../utils/JsonWebToken.js';
import multer from "multer";

const router = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: 20 * 1024 * 1024 })

router.get('/notoken', getMultipleUsersNoToken);
router.get('/notoken/:username', getSingleUserNoToken);
router.get('/', validateToken, getMultipleUsers);
router.get('/currentUser', validateToken, getCurrentUser)
router.get('/connections', validateToken, getConnections)
router.get('/saved', validateToken, retrieveSaved);
router.put('/update', validateToken, upload.single("image"), updateUser);
router.post('/follow/:id', validateToken, followUser);
router.post('/unfollow/:id', validateToken, unfollowUser);
router.get('/:username', validateToken, getSingleUser);


export default router;