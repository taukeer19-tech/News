const nodemailer = require('nodemailer');
const fs = require('fs');

async function main() {
  console.log("Generating Ethereal test account...");
  let testAccount = await nodemailer.createTestAccount();

  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, 
    auth: {
      user: testAccount.user, 
      pass: testAccount.pass, 
    },
  });

  const htmlContent = fs.readFileSync('bombino-template.html', 'utf8');

  console.log("Sending email...");
  let info = await transporter.sendMail({
    from: '"Bombino Express System 🚀" <system@bombinoexp.com>', 
    to: "taukeer@bombinoexp.com", 
    subject: "Limited-Time Offer: Ship from NY & NJ ✔", 
    html: htmlContent,
  });

  console.log("Preview_URL=" + nodemailer.getTestMessageUrl(info));
}

main().catch(console.error);
