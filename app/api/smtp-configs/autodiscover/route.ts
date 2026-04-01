import { NextResponse as Response } from "next/server";
import dns from "dns/promises";

// STEP A: Static lookup table for well-known domains — instant, no DNS needed
const STATIC_PROVIDERS: Record<string, object> = {
  "gmail.com":        { host: "smtp.gmail.com", port: 465, encryption: "ssl", provider: "gmail", message: "Gmail detected" },
  "googlemail.com":   { host: "smtp.gmail.com", port: 465, encryption: "ssl", provider: "gmail", message: "Gmail detected" },
  "outlook.com":      { host: "smtp-mail.outlook.com", port: 587, encryption: "tls", provider: "outlook", message: "Microsoft Outlook detected" },
  "hotmail.com":      { host: "smtp-mail.outlook.com", port: 587, encryption: "tls", provider: "outlook", message: "Hotmail (Microsoft) detected" },
  "live.com":         { host: "smtp-mail.outlook.com", port: 587, encryption: "tls", provider: "outlook", message: "Live (Microsoft) detected" },
  "msn.com":          { host: "smtp-mail.outlook.com", port: 587, encryption: "tls", provider: "outlook", message: "MSN (Microsoft) detected" },
  "yahoo.com":        { host: "smtp.mail.yahoo.com", port: 465, encryption: "ssl", provider: "yahoo", message: "Yahoo Mail detected" },
  "yahoo.co.uk":      { host: "smtp.mail.yahoo.com", port: 465, encryption: "ssl", provider: "yahoo", message: "Yahoo Mail detected" },
  "yahoo.in":         { host: "smtp.mail.yahoo.com", port: 465, encryption: "ssl", provider: "yahoo", message: "Yahoo Mail detected" },
  "ymail.com":        { host: "smtp.mail.yahoo.com", port: 465, encryption: "ssl", provider: "yahoo", message: "Yahoo Mail detected" },
  "icloud.com":       { host: "smtp.mail.me.com", port: 587, encryption: "tls", provider: "smtp", message: "Apple iCloud Mail detected" },
  "me.com":           { host: "smtp.mail.me.com", port: 587, encryption: "tls", provider: "smtp", message: "Apple iCloud Mail detected" },
  "mac.com":          { host: "smtp.mail.me.com", port: 587, encryption: "tls", provider: "smtp", message: "Apple iCloud Mail detected" },
  "protonmail.com":   { host: "127.0.0.1", port: 1025, encryption: "none", provider: "smtp", message: "ProtonMail detected — requires Proton Mail Bridge" },
  "proton.me":        { host: "127.0.0.1", port: 1025, encryption: "none", provider: "smtp", message: "ProtonMail detected — requires Proton Mail Bridge" },
  "zoho.com":         { host: "smtp.zoho.com", port: 465, encryption: "ssl", provider: "smtp", message: "Zoho Mail detected" },
  "aol.com":          { host: "smtp.aol.com", port: 465, encryption: "ssl", provider: "smtp", message: "AOL Mail detected" },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email || !email.includes("@")) {
    return Response.json({ error: "Valid email is required" }, { status: 400 });
  }

  const domain = email.split("@")[1].toLowerCase();

  // STEP A: Check static table first — zero latency for common providers
  if (STATIC_PROVIDERS[domain]) {
    return Response.json(STATIC_PROVIDERS[domain]);
  }

  // STEP B/C: Perform a DNS MX lookup for custom/private domains
  try {
    const mxRecords = await dns.resolveMx(domain);
    mxRecords.sort((a, b) => a.priority - b.priority);
    const primaryMX = mxRecords[0]?.exchange.toLowerCase() || "";

    if (primaryMX.includes("google.com") || primaryMX.includes("googlemail.com")) {
      return Response.json({ host: "smtp.gmail.com", port: 465, encryption: "ssl", provider: "gmail", message: "Google Workspace detected via MX" });
    }
    if (primaryMX.includes("outlook.com") || primaryMX.includes("protection.outlook.com") || primaryMX.includes("office365.com")) {
      return Response.json({ host: "smtp.office365.com", port: 587, encryption: "tls", provider: "outlook", message: "Microsoft 365 detected via MX" });
    }
    if (primaryMX.includes("yahoo.com") || primaryMX.includes("yahoodns.net")) {
      return Response.json({ host: "smtp.mail.yahoo.com", port: 465, encryption: "ssl", provider: "yahoo", message: "Yahoo Mail detected via MX" });
    }
    if (primaryMX.includes("zoho.com")) {
      return Response.json({ host: "smtp.zoho.com", port: 465, encryption: "ssl", provider: "smtp", message: "Zoho Mail detected via MX" });
    }
    if (primaryMX.includes("secureserver.net")) {
      return Response.json({ host: "smtpout.secureserver.net", port: 465, encryption: "ssl", provider: "smtp", message: "GoDaddy Workspace detected via MX" });
    }
    if (primaryMX.includes("mimecast.com")) {
      return Response.json({ host: `smtp.${domain}`, port: 587, encryption: "tls", provider: "smtp", message: "Custom domain with Mimecast filtering detected" });
    }

    // Generic fallback — educated guess for the domain
    return Response.json({ host: `smtp.${domain}`, port: 465, encryption: "ssl", provider: "smtp", message: `Custom domain detected, using secure defaults for smtp.${domain}` });

  } catch (error: any) {
    // ANY DNS error — still return a sensible fallback instead of crashing
    return Response.json({
      host: `smtp.${domain}`,
      port: 465,
      encryption: "ssl",
      provider: "smtp",
      message: `Could not resolve MX for ${domain}, using smtp.${domain} as default`,
    });
  }
}
