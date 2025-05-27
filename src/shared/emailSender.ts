import nodemailer from "nodemailer";
import config from "../config";

const emailSender = async (email: string, html: string, subject: string) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.titan.email",
    port: 465,
    secure: true,
    auth: {
      user: "pixelteam@smtech24.com", 
      pass: "@pixel321team", 
    },
  });
  

  const info = await transporter.sendMail({
    from: "pixelteam@smtech24.com",
    to: email,
    subject: subject,
    html,
  });
console.log("test");
  
};

export default emailSender;
