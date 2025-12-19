/**
 * Email message builder
 */

import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { SendEmailParams } from '../types/email.types.js';
import { validateEmailArray } from '../utils/validation.util.js';

/**
 * Builder for creating RFC822-compliant email messages
 */
export class EmailBuilder {
  /**
   * Encodes email headers containing non-ASCII characters according to RFC 2047
   * @param text - Header text to encode
   * @returns Encoded header text
   */
  private encodeHeader(text: string): string {
    // Only encode if the text contains non-ASCII characters
    if (/[^\x00-\x7F]/.test(text)) {
      // Use MIME Words encoding (RFC 2047)
      return '=?UTF-8?B?' + Buffer.from(text).toString('base64') + '?=';
    }
    return text;
  }

  /**
   * Builds a plain text email message
   * @param params - Email parameters
   * @returns RFC822-compliant email message
   */
  buildPlainTextEmail(params: SendEmailParams): string {
    validateEmailArray(params.to);
    if (params.cc) validateEmailArray(params.cc);
    if (params.bcc) validateEmailArray(params.bcc);

    const encodedSubject = this.encodeHeader(params.subject);
    const emailParts = [
      'From: me',
      `To: ${params.to.join(', ')}`,
      params.cc ? `Cc: ${params.cc.join(', ')}` : '',
      params.bcc ? `Bcc: ${params.bcc.join(', ')}` : '',
      `Subject: ${encodedSubject}`,
      params.inReplyTo ? `In-Reply-To: ${params.inReplyTo}` : '',
      params.inReplyTo ? `References: ${params.inReplyTo}` : '',
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      params.body,
    ].filter(Boolean);

    return emailParts.join('\r\n');
  }

  /**
   * Builds an HTML email message
   * @param params - Email parameters
   * @returns RFC822-compliant email message
   */
  buildHTMLEmail(params: SendEmailParams): string {
    validateEmailArray(params.to);
    if (params.cc) validateEmailArray(params.cc);
    if (params.bcc) validateEmailArray(params.bcc);

    const encodedSubject = this.encodeHeader(params.subject);
    const emailParts = [
      'From: me',
      `To: ${params.to.join(', ')}`,
      params.cc ? `Cc: ${params.cc.join(', ')}` : '',
      params.bcc ? `Bcc: ${params.bcc.join(', ')}` : '',
      `Subject: ${encodedSubject}`,
      params.inReplyTo ? `In-Reply-To: ${params.inReplyTo}` : '',
      params.inReplyTo ? `References: ${params.inReplyTo}` : '',
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      params.htmlBody || params.body,
    ].filter(Boolean);

    return emailParts.join('\r\n');
  }

  /**
   * Builds a multipart/alternative email message (plain text + HTML)
   * @param params - Email parameters
   * @returns RFC822-compliant email message
   */
  buildMultipartEmail(params: SendEmailParams): string {
    validateEmailArray(params.to);
    if (params.cc) validateEmailArray(params.cc);
    if (params.bcc) validateEmailArray(params.bcc);

    const encodedSubject = this.encodeHeader(params.subject);
    const boundary = `----=_NextPart_${Math.random().toString(36).substring(2)}`;

    const emailParts = [
      'From: me',
      `To: ${params.to.join(', ')}`,
      params.cc ? `Cc: ${params.cc.join(', ')}` : '',
      params.bcc ? `Bcc: ${params.bcc.join(', ')}` : '',
      `Subject: ${encodedSubject}`,
      params.inReplyTo ? `In-Reply-To: ${params.inReplyTo}` : '',
      params.inReplyTo ? `References: ${params.inReplyTo}` : '',
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      params.body,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      params.htmlBody || params.body,
      '',
      `--${boundary}--`,
    ].filter(Boolean);

    return emailParts.join('\r\n');
  }

  /**
   * Builds an email message with attachments using Nodemailer
   * @param params - Email parameters
   * @returns RFC822-compliant email message
   */
  async buildEmailWithAttachments(params: SendEmailParams): Promise<string> {
    validateEmailArray(params.to);
    if (params.cc) validateEmailArray(params.cc);
    if (params.bcc) validateEmailArray(params.bcc);

    if (!params.attachments || params.attachments.length === 0) {
      throw new Error('No attachments provided');
    }

    // Create a nodemailer transporter (we won't actually send, just generate the message)
    const transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });

    // Prepare attachments for nodemailer
    const attachments = [];
    for (const filePath of params.attachments) {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File does not exist: ${filePath}`);
      }

      const fileName = path.basename(filePath);
      attachments.push({
        filename: fileName,
        path: filePath,
      });
    }

    const mailOptions = {
      from: 'me', // Gmail API will replace this with the authenticated user
      to: params.to.join(', '),
      cc: params.cc?.join(', '),
      bcc: params.bcc?.join(', '),
      subject: params.subject,
      text: params.body,
      html: params.htmlBody,
      attachments: attachments,
      inReplyTo: params.inReplyTo,
      references: params.inReplyTo,
    };

    // Generate the raw message
    const info = await transporter.sendMail(mailOptions);
    const rawMessage = info.message.toString();

    return rawMessage;
  }

  /**
   * Builds an email message based on the provided parameters
   * @param params - Email parameters
   * @returns RFC822-compliant email message
   */
  async buildEmail(params: SendEmailParams): Promise<string> {
    // If attachments are present, use Nodemailer
    if (params.attachments && params.attachments.length > 0) {
      return this.buildEmailWithAttachments(params);
    }

    // Determine content type
    const mimeType = params.mimeType || 'text/plain';

    // If htmlBody is provided and mimeType isn't explicitly set to text/plain,
    // use multipart/alternative to include both versions
    if (params.htmlBody && mimeType !== 'text/plain') {
      return this.buildMultipartEmail(params);
    }

    if (mimeType === 'text/html') {
      return this.buildHTMLEmail(params);
    }

    return this.buildPlainTextEmail(params);
  }
}

