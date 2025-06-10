import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { Eta } from 'eta';
import { emailLayoutTemplate } from './templates/emailLayout.template';
import { confirmationTemplate } from './templates/confirmation.template';
import { passwordResetTemplate } from './templates/passwordReset.template';
import { paymentLinkTemplate } from './templates/paymentLink.template';
import { paymentConfirmationTemplate } from './templates/paymentConfirmation.template';

class MailerService {
  private readonly RESEND_API_KEY: string;

  private readonly resend: Resend;

  private readonly etherealTransporter: nodemailer.Transporter | null;

  private readonly eta: Eta;

  constructor() {
    this.RESEND_API_KEY = process.env.RESEND_API_KEY;
    this.resend = new Resend(process.env.RESEND_API_KEY);

    // Initialize Eta template engine without file system
    this.eta = new Eta();

    // Use Ethereal for development
    if (process.env.NODE_ENV === 'development') {
      this.etherealTransporter = nodemailer.createTransport({
        host: process.env.ETHEREAL_HOST,
        port: parseInt(process.env.ETHEREAL_PORT || '587', 10),
        auth: {
          user: process.env.ETHEREAL_USER,
          pass: process.env.ETHEREAL_PASSWORD,
        },
        secure: false, // true for 465, false for other ports
      });
    } else {
      this.etherealTransporter = null;
    }
  }

  /**
   * Sends a confirmation email to a new user
   */
  async sendConfirmationEmail(email: string, otpCode: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const confirmationLink = `${frontendUrl}/confirm?code=${otpCode}`;

    const subject = 'Confirmación de Registro';
    const html = await this.renderConfirmationEmail({
      confirmationLink,
      subject,
    });

    await this.sendMail(email, subject, html);
  }

  /**
   * Sends a password reset email
   */
  async sendPasswordResetEmail(email: string, resetCode: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const resetLink = `${frontendUrl}/reset-password?code=${resetCode}`;

    const subject = 'Solicitud de Restablecimiento de Contraseña';
    const html = await this.renderPasswordResetEmail({
      resetLink,
      resetCode,
      subject,
    });

    await this.sendMail(email, subject, html);
  }

  /**
   * Sends a payment link email for custom trip
   */
  async sendPaymentLinkEmail(
    email: string,
    customerName: string,
    tripName: string,
    description: string | undefined,
    startDateTime: string,
    price: number,
    maxSeats: number,
    paymentToken: string,
  ): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const paymentLink = `${frontendUrl}/payment/${paymentToken}`;

    const subject = 'Enlace de Pago - Reserva Grupal';
    const html = await this.renderPaymentLinkEmail({
      customerName,
      tripName,
      description,
      startDateTime,
      price,
      maxSeats,
      paymentLink,
      subject,
    });

    await this.sendMail(email, subject, html);
  }

  /**
   * Sends a payment confirmation email for custom trip
   */
  async sendPaymentConfirmationEmail(
    email: string,
    customerName: string,
    tripName: string,
    description: string | undefined,
    startDateTime: string,
    price: number,
    maxSeats: number,
    route: Array<{ name: string; address: string }> | undefined,
    paymentToken: string,
  ): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const tripUrl = `${frontendUrl}/payment/${paymentToken}`;

    const subject = 'Pago Confirmado - Reserva Grupal';
    const html = await this.renderPaymentConfirmationEmail({
      customerName,
      tripName,
      description,
      startDateTime,
      price,
      maxSeats,
      route,
      tripUrl,
      subject,
    });

    await this.sendMail(email, subject, html);
  }

  /**
   * Renders a confirmation email using the Eta template
   */
  private async renderConfirmationEmail(data: {
    confirmationLink: string;
    subject: string;
  }): Promise<string> {
    try {
      // Render the confirmation email content
      const content = await this.eta.renderString(confirmationTemplate, {
        confirmationLink: data.confirmationLink,
      });

      // Render the content inside the layout
      return this.eta.renderString(emailLayoutTemplate, {
        content,
        subject: data.subject,
      });
    } catch (error) {
      console.error('Error rendering confirmation email:', error);
      throw new Error(`Failed to render confirmation email: ${error.message}`);
    }
  }

  /**
   * Renders a password reset email using the Eta template
   */
  private async renderPasswordResetEmail(data: {
    resetLink: string;
    resetCode: string;
    subject: string;
  }): Promise<string> {
    try {
      // Render the password reset email content
      const content = await this.eta.renderString(passwordResetTemplate, {
        resetLink: data.resetLink,
        resetCode: data.resetCode,
      });

      // Render the content inside the layout
      return this.eta.renderString(emailLayoutTemplate, {
        content,
        subject: data.subject,
      });
    } catch (error) {
      console.error('Error rendering password reset email:', error);
      throw new Error(`Failed to render password reset email: ${error.message}`);
    }
  }

  /**
   * Renders a payment link email using the Eta template
   */
  private async renderPaymentLinkEmail(data: {
    customerName: string;
    tripName: string;
    description?: string;
    startDateTime: string;
    price: number;
    maxSeats: number;
    paymentLink: string;
    subject: string;
  }): Promise<string> {
    try {
      // Render the payment link email content
      const content = await this.eta.renderString(paymentLinkTemplate, {
        customerName: data.customerName,
        tripName: data.tripName,
        description: data.description,
        startDateTime: data.startDateTime,
        price: data.price,
        maxSeats: data.maxSeats,
        paymentLink: data.paymentLink,
      });

      // Render the content inside the layout
      return this.eta.renderString(emailLayoutTemplate, {
        content,
        subject: data.subject,
      });
    } catch (error) {
      console.error('Error rendering payment link email:', error);
      throw new Error(`Failed to render payment link email: ${error.message}`);
    }
  }

  /**
   * Renders a payment confirmation email using the Eta template
   */
  private async renderPaymentConfirmationEmail(data: {
    customerName: string;
    tripName: string;
    description?: string;
    startDateTime: string;
    price: number;
    maxSeats: number;
    route?: Array<{ name: string; address: string }>;
    tripUrl: string;
    subject: string;
  }): Promise<string> {
    try {
      // Render the payment confirmation email content
      const content = await this.eta.renderString(paymentConfirmationTemplate, {
        customerName: data.customerName,
        tripName: data.tripName,
        description: data.description,
        startDateTime: data.startDateTime,
        price: data.price,
        maxSeats: data.maxSeats,
        route: data.route,
        tripUrl: data.tripUrl,
      });

      // Render the content inside the layout
      return this.eta.renderString(emailLayoutTemplate, {
        content,
        subject: data.subject,
      });
    } catch (error) {
      console.error('Error rendering payment confirmation email:', error);
      throw new Error(`Failed to render payment confirmation email: ${error.message}`);
    }
  }

  /**
   * Generic method to send emails, using Ethereal in development and Resend in production
   */
  private async sendMail(to: string, subject: string, html: string): Promise<void> {
    try {
      const isDevelopment = process.env.NODE_ENV === 'development';

      // Use different email addresses depending on the mode
      const fromEmail = isDevelopment
        ? process.env.ETHEREAL_USER
        : 'no-reply@updates.veretragna.ivaliev.dev';

      if (isDevelopment && this.etherealTransporter) {
        // Send via Ethereal in development mode
        const info = await this.etherealTransporter.sendMail({
          from: `Veretragna <${fromEmail}>`,
          to,
          subject,
          html,
        });

        // Output email details to console
        console.log('\n--- Email sent via Ethereal ---');
        console.log(`From: Veretragna <${fromEmail}>`);
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
        console.log('------------------------\n');
      } else {
        // Send via Resend in production mode
        await this.resend.emails.send({
          from: `Veretragna <${fromEmail}>`,
          to,
          subject,
          html,
        });
      }
    } catch (error) {
      console.error('Error sending email:', error);

      // Continue in development mode without blocking process
      if (process.env.NODE_ENV === 'development') {
        console.warn('Email sending failed, but continuing in development mode');
        return;
      }

      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
}

export const mailerService = new MailerService();
