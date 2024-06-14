import express from 'express';
import cors from "cors";
import dotenv from 'dotenv';
import AuthRoute from './Routes/Auth_Routes.js'
import PostRoute from './Routes/Post_Routes.js';
import UserRoute from './Routes/userRoutes.js';
import SearchRoute from './Routes/Search_Route.js';
import mongoose from 'mongoose';
import helmet from 'helmet'

dotenv.config()

const PORT = process.env.PORT || 6050;


const app = express();
app.use(express.json());
app.use(cors({
    origin: "*"
}));
app.use(helmet())
app.use('/api/users/auth', AuthRoute);
app.use('/api/posts', PostRoute);
app.use('/api/users', UserRoute);
app.use('/api/search', SearchRoute);


app.get('/api/files/profileImages/default', (req, res) => {
    res.sendFile(`C:/Web/Yofigram/server/files/profile_pictures/default_acc_pic.jpg`)
});

mongoose.connect(process.env.MONGODB_CONNECTION_STRING).then(() => {
    app.listen(PORT, () => {
        console.log(`App is running at port ${PORT}`);
    })
}).catch(err => console.log(err.message))
