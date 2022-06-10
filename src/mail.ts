import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

export class Mailer {
  private transport: nodemailer.Transporter;
  private email: string;
  constructor(options: SMTPTransport.Options) {
    this.email = options.auth?.user;
    this.transport = nodemailer.createTransport(options);
  }

  async send(to: string, subject: string, text: string) {
    return this.transport.sendMail({
      to,
      subject,
      text,
    });
  }

  async sendToSelf(subject: string, text: string) {
    return this.transport.sendMail({
      to: this.email,
      subject,
      text,
    });
  }
}
