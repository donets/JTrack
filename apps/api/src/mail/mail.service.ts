import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Resend } from 'resend'
import { randomUUID } from 'node:crypto'

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name)
  private readonly provider: string
  private readonly from: string
  private resend: Resend | null = null

  constructor(private readonly configService: ConfigService) {
    this.provider = this.configService.get<string>('MAIL_PROVIDER') ?? 'console'
    this.from = this.configService.get<string>('MAIL_FROM') ?? 'JTrack <no-reply@jtrack.local>'

    if (this.provider === 'resend') {
      const apiKey = this.configService.getOrThrow<string>('RESEND_API_KEY')
      this.resend = new Resend(apiKey)
    }
  }

  async sendVerificationCode(to: string, code: string): Promise<void> {
    const subject = 'Your verification code — JTrack'
    const text = [
      'Welcome to JTrack!',
      '',
      `Your verification code is: ${code}`,
      '',
      'Enter this code to verify your email address.',
      'This code expires in 15 minutes.',
      '',
      "If you didn't create an account, you can safely ignore this email."
    ].join('\n')

    const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Welcome to JTrack!</h2>
        <p>Your verification code is:</p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; background: #f1f5f9; padding: 16px 24px; border-radius: 8px; display: inline-block; font-family: monospace;">${code}</span>
        </div>
        <p style="text-align: center; font-size: 13px; color: #64748b;">Enter this code to verify your email address.</p>
        <p style="text-align: center; font-size: 13px; color: #64748b;">This code expires in 15 minutes.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8;">If you didn't create an account, you can safely ignore this email.</p>
      </div>
    `

    await this.send({ to, subject, text, html })
  }

  async sendPasswordResetCode(to: string, code: string): Promise<void> {
    const subject = 'Your password reset code — JTrack'
    const text = [
      'You requested a password reset for your JTrack account.',
      '',
      `Your reset code is: ${code}`,
      '',
      'Enter this code to set a new password.',
      'This code expires in 15 minutes.',
      '',
      "If you didn't request this, you can safely ignore this email."
    ].join('\n')

    const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Reset your password</h2>
        <p>You requested a password reset for your JTrack account.</p>
        <p>Your reset code is:</p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; background: #f1f5f9; padding: 16px 24px; border-radius: 8px; display: inline-block; font-family: monospace;">${code}</span>
        </div>
        <p style="text-align: center; font-size: 13px; color: #64748b;">Enter this code to set a new password.</p>
        <p style="text-align: center; font-size: 13px; color: #64748b;">This code expires in 15 minutes.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `

    await this.send({ to, subject, text, html })
  }

  async sendPasswordChangedNotification(to: string): Promise<void> {
    const subject = 'Your password was changed — JTrack'
    const text = [
      'Your JTrack account password was recently changed.',
      '',
      'If you made this change, no further action is needed.',
      '',
      "If you didn't change your password, please reset it immediately or contact support."
    ].join('\n')

    const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Password changed</h2>
        <p>Your JTrack account password was recently changed.</p>
        <p>If you made this change, no further action is needed.</p>
        <p style="font-size: 13px; color: #64748b;">If you didn't change your password, please reset it immediately or contact support.</p>
      </div>
    `

    await this.send({ to, subject, text, html })
  }

  private async send(params: { to: string; subject: string; text: string; html: string }): Promise<void> {
    const idempotencyKey = randomUUID()

    if (this.provider === 'noop') {
      return
    }

    if (this.provider === 'console') {
      this.logger.log(`[Mail] To: ${params.to} | Subject: ${params.subject}`)
      this.logger.debug(`[Mail] Body:\n${params.text}`)
      return
    }

    if (this.provider === 'resend' && this.resend) {
      const { error } = await this.resend.emails.send({
        from: this.from,
        to: params.to,
        subject: params.subject,
        text: params.text,
        html: params.html,
        headers: {
          'X-Idempotency-Key': idempotencyKey
        }
      })

      if (error) {
        this.logger.error(`Failed to send email to ${params.to}: ${error.message}`)
        throw new Error(`Email send failed: ${error.message}`)
      }

      return
    }

    this.logger.warn(`Unknown mail provider: ${this.provider}, email not sent`)
  }
}
