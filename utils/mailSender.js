import nodemailer from 'nodemailer';

const MailSender = async (toWhome, subject, html) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD
            }
        });
        await transporter.sendMail({
            from: process.env.EMAIL,
            to: toWhome,
            subject: subject,
            html: html
        });
    } catch (error) {
        return
    }
}
export default MailSender;