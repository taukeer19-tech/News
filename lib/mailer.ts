import nodemailer from 'nodemailer';
import { prisma } from './prisma';

export async function createMailer(smtpConfigId: string) {
  const config = await prisma.smtpConfig.findUnique({
    where: { id: smtpConfigId }
  });

  if (!config) {
    throw new Error('SMTP Configuration not found');
  }

  // Create reusable transporter object using the default SMTP transport
  const transportOptions: nodemailer.TransportOptions = {
    host: config.host ?? undefined,
    port: config.port ?? 587,
    secure: config.port === 465 || config.encryption === 'ssl',
    auth: {
      user: config.username ?? undefined,
      pass: config.password ?? undefined,
    },
  } as any;

  const transporter = nodemailer.createTransport(transportOptions);

  return {
    transporter,
    from: `"${config.fromName}" <${config.fromEmail}>`
  };
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  smtpConfigId
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  smtpConfigId: string;
}) {
  const { transporter, from } = await createMailer(smtpConfigId);

  const info = await transporter.sendMail({
    from, // sender address
    to, // list of receivers
    subject, // Subject line
    text: text || "HTML is required to view this email.", // plain text body
    html, // html body
  });

  return info;
}
