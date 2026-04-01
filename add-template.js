const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const htmlContent = `
<div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
  <!-- Header -->
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #CE1126; margin: 0; font-size: 36px; font-style: italic; font-weight: 900; letter-spacing: 1px;">BOMBINO</h1>
    <div style="background-color: #CE1126; color: white; padding: 4px 15px; display: inline-block; font-style: italic; font-weight: bold; letter-spacing: 4px; font-size: 14px;">EXPRESS</div>
    <p style="font-size: 13px; color: #666; margin-top: 8px; font-style: italic;">Bringing the world closer</p>
  </div>
  
  <p>Dear Customer,</p>
  <p>We're excited to announce a <strong>limited-time promotional offer</strong> from <strong>Bombino Express Worldwide Inc.</strong>, your trusted partner for fast, reliable, and affordable international shipping.</p>
  
  <p style="margin: 25px 0;">
    🌍 <strong>Ship from New York & New Jersey to ANYWHERE in India and UAE</strong><br>
    💰 <strong style="color: #CE1126;">Special Rate: As Low As $5 per LB!</strong><br>
    ✨ Fast transit | Secure handling | Trusted service | Door-to-door delivery options available
  </p>

  <p>Whether you're sending personal items, gifts, documents, or commercial shipments, Bombino Express ensures <strong>speed, safety, and unbeatable value.</strong></p>

  <p style="margin-top: 25px;">For bookings or inquiries, feel free to contact us anytime:</p>
  <p>
    📧 <strong>Email:</strong> <a href="mailto:bombino@bombinoexp.com">bombino@bombinoexp.com</a><br>
    📞 <strong>Toll-Free:</strong> 1-800-987-3977
  </p>

  <p style="margin-top: 25px; font-weight: bold;">Don't miss out—these rates won't last long!</p>
  <p>We look forward to serving you.</p>

  <hr style="border: none; border-top: 1px solid #ddd; margin: 40px 0;">

  <!-- Footer -->
  <div style="text-align: center; font-size: 12px; color: #555; line-height: 1.6;">
    <strong>Bombino Express Pvt Ltd.</strong><br>
    Corporate Centre B, 1 & 2, Ground Floor, Marol Pipe Line,<br>
    Andheri Kurla Road, Mumbai - 400 059.<br>
    Telephone: <strong>+91 22 6640 0000</strong><br>
    Toll-Free: <strong>1800 266 6401</strong><br>
    Email: <a href="mailto:bombino@bombinoexp.com" style="color: #0000ee;">bombino@bombinoexp.com</a> | Website: <a href="http://www.bombinoexp.com" style="color: #0000ee;">www.bombinoexp.com</a>
    
    <div style="margin-top: 20px;">
      <h3 style="margin: 0 0 10px 0; font-size: 16px;">FOLLOW US</h3>
      <div style="display: flex; justify-content: center; gap: 10px;">
        <span style="background: #E1306C; color: white; padding: 5px 8px; border-radius: 4px; font-weight: bold;">IG</span>
        <span style="background: #4267B2; color: white; padding: 5px 8px; border-radius: 4px; font-weight: bold;">FB</span>
        <span style="background: #0077b5; color: white; padding: 5px 8px; border-radius: 4px; font-weight: bold;">IN</span>
        <span style="background: #1DA1F2; color: white; padding: 5px 8px; border-radius: 4px; font-weight: bold;">TW</span>
      </div>
    </div>
  </div>
</div>
`;

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'taukeer@bombinoexp.com' }
  });

  if (!user) {
    console.error('User taukeer@bombinoexp.com not found. Create the user first.');
    process.exit(1);
  }

  const template = await prisma.template.create({
    data: {
      userId: user.id,
      name: 'Promotional Offer (USA to IND/UAE)',
      subject: 'Limited-Time Offer: Ship from NY & NJ to India/UAE from $5/LB!',
      contentHtml: htmlContent,
      contentText: 'Special Promotional Offer from Bombino Express'
    }
  });

  console.log('Template created successfully:', template.id);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
