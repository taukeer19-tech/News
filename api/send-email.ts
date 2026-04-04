import { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { smtpConfig, to, subject, html } = req.body;

  if (!smtpConfig || !to || !subject || !html) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: Number(smtpConfig.port),
      secure: smtpConfig.port === 465, // Typically 465 is secure
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass,
      },
    });

    const from = `${smtpConfig.fromName || 'News'} <${smtpConfig.fromEmail || smtpConfig.user}>`;

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error('SMTP Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to send email' });
  }
}
