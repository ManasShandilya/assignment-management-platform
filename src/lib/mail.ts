// Development: prints the link to the server console. Production: plug in a mail provider here
// (Resend, SES, SMTP) before launch, otherwise password reset emails will not be delivered.
export async function sendResetEmail(to: string, link: string) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("sendResetEmail is not configured. Add a mail provider in src/lib/mail.ts");
  }
  console.log(`\n[dev] Password reset link for ${to}:\n${link}\n`);
}
