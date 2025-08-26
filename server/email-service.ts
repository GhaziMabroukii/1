import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Email service using free Gmail SMTP
class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Using Gmail's free SMTP service
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_APP_PASSWORD;

    if (!emailUser || !emailPass) {
      console.log('Email service not configured - EMAIL_USER and EMAIL_APP_PASSWORD required for free Gmail SMTP');
      return;
    }

    this.transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });
  }

  async sendVerificationEmail(to: string, verificationCode: string, firstName?: string): Promise<boolean> {
    if (!this.transporter) {
      console.log('Email service not available - using console verification code');
      console.log(`=== EMAIL VERIFICATION CODE FOR ${to} ===`);
      console.log(`Code: ${verificationCode}`);
      console.log(`This code expires in 24 hours.`);
      console.log('=======================================');
      return true; // Return true for development mode
    }

    try {
      const mailOptions = {
        from: `"Ekrili Platform" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: 'Vérifiez votre adresse email - Ekrili',
        html: this.getVerificationEmailTemplate(verificationCode, firstName || 'Utilisateur')
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Verification email sent to ${to}`);
      return true;
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Fallback to console logging in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`=== EMAIL VERIFICATION CODE FOR ${to} ===`);
        console.log(`Code: ${verificationCode}`);
        console.log(`This code expires in 24 hours.`);
        console.log('=======================================');
        return true;
      }
      return false;
    }
  }

  private getVerificationEmailTemplate(code: string, firstName: string): string {
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vérification Email - Ekrili</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FF6B35, #F7931E); color: white; text-align: center; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .code { background: #FF6B35; color: white; font-size: 24px; font-weight: bold; text-align: center; padding: 20px; border-radius: 5px; margin: 20px 0; letter-spacing: 3px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          .btn { display: inline-block; background: #FF6B35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏠 Ekrili</h1>
            <p>Plateforme de location en Tunisie</p>
          </div>
          <div class="content">
            <h2>Bonjour ${firstName} !</h2>
            <p>Merci de vous être inscrit sur Ekrili. Pour compléter votre inscription, veuillez vérifier votre adresse email en utilisant le code ci-dessous :</p>
            
            <div class="code">${code}</div>
            
            <p>Ce code expire dans <strong>24 heures</strong>.</p>
            
            <p>Si vous n'avez pas créé de compte sur Ekrili, vous pouvez ignorer cet email.</p>
            
            <p>Bienvenue sur Ekrili ! 🎉</p>
          </div>
          <div class="footer">
            <p>© 2025 Ekrili - Plateforme de location en Tunisie</p>
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateVerificationCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  isCodeExpired(expiryDate: Date): boolean {
    return new Date() > expiryDate;
  }

  getCodeExpiryDate(): Date {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24); // 24 hours from now
    return expiry;
  }
}

export const emailService = new EmailService();