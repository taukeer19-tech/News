import { NextResponse as Response } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { firestore } from "@/lib/firestore";
import nodemailer from "nodemailer";

const IS_FIREBASE = process.env.DB_PROVIDER === "firebase";
const IS_DEV = process.env.NODE_ENV === "development";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id || (IS_DEV ? "test-user-id" : null);

    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

    let config;
    if (IS_FIREBASE) {
      const configs = await firestore.getSmtpConfigs(userId);
      config = configs.find((c: any) => c.id === params.id);
    } else {
      config = await prisma.smtpConfig.findUnique({
        where: { id: params.id, userId }
      });
    }

    if (!config) return Response.json({ error: "Configuration not found" }, { status: 404 });

    // Send Test Email
    let transporter: any;
    if (config.provider === "resend") {
      transporter = nodemailer.createTransport({ 
        host: "smtp.resend.com", 
        port: 465, 
        secure: true, 
        auth: { 
          user: "resend", 
          pass: config.apiKey || "" 
        }
      });
    } else if (config.provider === "gmail") {
      transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: config.username || config.fromEmail,
          pass: config.password || config.apiKey || ""
        }
      });
    } else if (config.provider === "outlook") {
      transporter = nodemailer.createTransport({
        host: "smtp-mail.outlook.com",
        port: 587,
        secure: false, // TLS
        requireTLS: true,
        auth: {
          user: config.username || config.fromEmail,
          pass: config.password || config.apiKey || ""
        }
      });
    } else if (config.provider === "yahoo") {
      transporter = nodemailer.createTransport({
        host: "smtp.mail.yahoo.com",
        port: 465,
        secure: true,
        auth: {
          user: config.username || config.fromEmail,
          pass: config.password || config.apiKey || ""
        }
      });
    } else {
      transporter = nodemailer.createTransport({
        host: config.host || "localhost",
        port: config.port ? Number(config.port) : 587,
        secure: config.encryption === "ssl",
        auth: {
          user: config.username || config.fromEmail,
          pass: config.password || config.apiKey || ""
        }
      });
    }

    const info = await transporter.sendMail({
      from: config.fromName ? `"${config.fromName}" <${config.fromEmail}>` : config.fromEmail,
      to: config.fromEmail, // Send to self for testing
      subject: "SMTP Connection Test",
      text: "This is a test email to verify your SMTP configuration.",
      html: "<b>This is a test email to verify your SMTP configuration.</b>"
    });

    return Response.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error("SMTP Test Error:", error);
    return Response.json({ error: error.message || "Failed to send test email" }, { status: 500 });
  }
}
