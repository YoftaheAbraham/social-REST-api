import { Router } from "express";
import { v4 } from "uuid";
import { validateToken } from "../utils/JsonWebToken.js";
import { createPost, getMultiplePosts, getMultiplePostsNoToken, getSinglePost, likePost, addComments, updatePost, dislikePost, likeComment, dislikeComment, getSinglePostNoToken, savePost, unSavePost } from "../Handlers/postHandlers.js";
import multer from 'multer';

const router = Router();



const upload = multer({ storage: multer.memoryStorage(), limits: 20 * 1024 * 1024 })




router.get('/', validateToken, getMultiplePosts);
router.get('/notoken', getMultiplePostsNoToken);
router.post('/createpost', validateToken, upload.single("file"), createPost);
router.get('/notoken/:id', getSinglePostNoToken);
router.get('/:id', validateToken, getSinglePost);
router.post('/like/:id', validateToken, likePost);
router.post('/dislike/:id', validateToken, dislikePost);
router.post('/comments/add/:id', validateToken, addComments);
router.post('/comments/like/:id', validateToken, likeComment);
router.post('/savepost/:id', validateToken, savePost);
router.post('/comments/dislike/:id', validateToken, dislikeComment);
router.post('/unsavepost/:id', validateToken, unSavePost);
router.put('/update/:id', validateToken, updatePost)


export default router;