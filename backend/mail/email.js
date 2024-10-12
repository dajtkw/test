import {
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  VERIFICATION_EMAIL_TEMPLATE,
} from "./emailTemplates.js";
import nodemailer from "nodemailer";

const email1 = "btd1462004@gmail.com";
const pass1 = "lcff pzfo xzse kkhc" ;


export const sendVerificationEmail = async (email, verificationToken) => {
   //email người dùng

  let transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for port 465, false for other ports
    auth: {
      user: email1,
      pass: pass1,
    },
  });

  try {
    let info = await transport.sendMail({
      from: '"DDH Team" <btd1462004@gmail.com>',
      to: email,
      subject: "Verify your email",
      html: VERIFICATION_EMAIL_TEMPLATE.replace(
        "{verificationCode}",
        verificationToken
      ),
      category: "Email Verification",
    });

    console.log("Email sent successfully", info);

  } catch (error) {
    console.error(`Error sending verification`, error);
    throw new Error(`Error sending verification email: ${error}`);
  }
};

export const sendWelcomeEmail = async (email, name) => {

  let transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for port 465, false for other ports
    auth: {
      user: email1,
      pass: pass1,
    },
  });

  try {
    let info = await transport.sendMail({
      from: '"DDH Team" <btd1462004@gmail.com>',
      to: email,
      template_uuid: "2e435233-9af9-4836-94fc-943c25b7b06d",
      template_variables: {
        company_info_name: "DDH Team",
        name: name,
      },
    });

    console.log("Email sent successfully", info);

   
  } catch (error) {
    console.log("Error seding welcome email", error);

    throw new Error(`Error sending welcome email: ${error}`);
  }
};

export const sendPasswordResetEmail = async (email, resetURL) => {


  let transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for port 465, false for other ports
    auth: {
      user: email1,
      pass: pass1,
    },
  });

  try {
    let info = await transport.sendMail({
      from: "DDH Team <btd1462004@gmail.com>",
      to: email,
      subject: "Reset your password",
      html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
      category: "Password Reset",
    });
  } catch (error) {
    console.error(`Error sending password email`, error);

    throw new Error(`Error sending password reset email ${error}`);
  }
};

export const sendResetSuccessEmail = async (email) => {


  let transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for port 465, false for other ports
    auth: {
      user: email1,
      pass: pass1,
    },
  });

  try {
    let info = await transport.sendMail({
      from: '"DDH Team" <btd1462004@gmail.com>',
      to: email,
      subject: "Password Reset Successfully",
      html: PASSWORD_RESET_SUCCESS_TEMPLATE,
      category: "Password Reset",
    });

    console.log("Password reset email sent successfully", info);
  } catch (error) {
    console.error(`Error sending password reset success email`, error);

    throw new Error(`Error sending password reset success email: ${error}`);
  }
};

//lccw xcwc dpgu nqjx
