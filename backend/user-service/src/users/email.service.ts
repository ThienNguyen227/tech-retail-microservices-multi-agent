import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  }

  async sendOtpEmail(email: string, otp: string): Promise<void> {
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Mã OTP xác nhận đăng ký tài khoản',
      html: `
        <h2>Xác nhận đăng ký tài khoản SmartHub</h2>
        <p>Mã OTP của bạn là:</p>
        <h1 style="color: #168b87;">${otp}</h1>
        <p>Mã này sẽ hết hạn sau 1 phút.</p>
        <p>Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này.</p>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }
}
