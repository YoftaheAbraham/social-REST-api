import { Router } from "express";
import { login, signup, virtualRegistery, resetPass, resetIntegration, checkResetToken } from "../Handlers/authHandlers.js";
import { validateResetToken } from "../utils/JsonWebToken.js";


const router = Router();


router.post('/virtual', virtualRegistery);
router.post('/signup', signup);
router.post('/login', login);
router.post('/resetPass', resetPass);
router.post('/check', validateResetToken, checkResetToken)
router.post('/reset/:id', validateResetToken, resetIntegration)



export default router;