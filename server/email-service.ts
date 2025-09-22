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

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });
  }

  async sendVerificationEmail(to: string, verificationCode: string, firstName?: string, userType?: string): Promise<boolean> {
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
        html: this.getVerificationEmailTemplate(verificationCode, firstName || 'Utilisateur', userType)
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

  async sendPasswordResetEmail(to: string, resetToken: string, firstName?: string): Promise<boolean> {
    if (!this.transporter) {
      console.log('Email service not available - using console reset link');
      console.log(`=== PASSWORD RESET LINK FOR ${to} ===`);
      console.log(`Reset link: ${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`);
      console.log(`This link expires in 1 hour.`);
      console.log('======================================');
      return true;
    }

    try {
      const mailOptions = {
        from: `"Ekrili Platform" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: 'Réinitialisez votre mot de passe - Ekrili',
        html: this.getPasswordResetEmailTemplate(resetToken, firstName || 'Utilisateur')
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to ${to}`);
      return true;
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return false;
    }
  }

  private getPasswordResetEmailTemplate(resetToken: string, firstName: string): string {
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Réinitialisation de mot de passe - Ekrili</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .btn { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Réinitialisation de mot de passe</h1>
            <p>Ekrili - Plateforme de location</p>
          </div>
          <div class="content">
            <h2>Bonjour ${firstName},</h2>
            <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Ekrili.</p>
            
            <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" class="btn">Réinitialiser mon mot de passe</a>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important :</strong>
              <ul>
                <li>Ce lien expire dans <strong>1 heure</strong></li>
                <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
                <li>Ne partagez jamais ce lien avec quelqu'un d'autre</li>
              </ul>
            </div>
            
            <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
            <p style="word-break: break-all; background: #e9e9e9; padding: 10px; border-radius: 5px; font-family: monospace;">${resetLink}</p>
            
            <p>Si vous rencontrez des problèmes, contactez notre support.</p>
            
            <p>Cordialement,<br>L'équipe Ekrili</p>
          </div>
          <div class="footer">
            <p>© 2024 Ekrili. Tous droits réservés.</p>
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getVerificationEmailTemplate(code: string, firstName: string, userType?: string): string {
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
            <p>Merci de vous être inscrit sur Ekrili en tant que <strong>${this.getUserTypeText(userType)}</strong>. Pour compléter votre inscription, veuillez vérifier votre adresse email en utilisant le code ci-dessous :</p>
            
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

  private getUserTypeText(userType?: string): string {
    switch (userType) {
      case 'tenant':
        return 'Locataire';
      case 'owner':
        return 'Propriétaire';
      default:
        return 'Utilisateur';
    }
  }
}

export const emailService = new EmailService();