import { Injectable, Logger } from '@nestjs/common'
import axios from 'axios'

/**
 * ZoomService — Creates Zoom meetings via Server-to-Server OAuth
 *
 * Environment variables (optional — falls back gracefully):
 *   ZOOM_ACCOUNT_ID
 *   ZOOM_CLIENT_ID
 *   ZOOM_CLIENT_SECRET
 *
 * If not configured, returns null and the system uses the designer's
 * personal Zoom link stored in designer_zoom field.
 */

interface ZoomMeeting {
  meeting_id: string
  join_url: string
  start_url: string
  password: string
}

@Injectable()
export class ZoomService {
  private readonly logger = new Logger(ZoomService.name)
  private cachedToken: { token: string; expiresAt: number } | null = null

  private get accountId() { return process.env.ZOOM_ACCOUNT_ID }
  private get clientId() { return process.env.ZOOM_CLIENT_ID }
  private get clientSecret() { return process.env.ZOOM_CLIENT_SECRET }
  private get isConfigured() { return !!(this.accountId && this.clientId && this.clientSecret) }

  // ── OAuth token ────────────────────────────────────────────────────────────

  private async getAccessToken(): Promise<string | null> {
    if (!this.isConfigured) return null
    const now = Date.now()
    if (this.cachedToken && this.cachedToken.expiresAt > now + 60_000) {
      return this.cachedToken.token
    }
    try {
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')
      const res = await axios.post(
        `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${this.accountId}`,
        null,
        { headers: { Authorization: `Basic ${credentials}` } },
      )
      this.cachedToken = {
        token: res.data.access_token,
        expiresAt: now + (res.data.expires_in * 1000),
      }
      return this.cachedToken.token
    } catch (e) {
      this.logger.warn(`Zoom OAuth failed: ${e.message}`)
      return null
    }
  }

  // ── Create meeting ─────────────────────────────────────────────────────────

  async createMeeting(options: {
    topic: string
    scheduledAt?: Date
    durationMinutes?: number
    hostEmail?: string
  }): Promise<ZoomMeeting | null> {
    const token = await this.getAccessToken()
    if (!token) {
      this.logger.warn('Zoom not configured — skipping meeting creation')
      return null
    }
    try {
      const body: any = {
        topic: options.topic,
        type: options.scheduledAt ? 2 : 1, // 1=instant, 2=scheduled
        duration: options.durationMinutes ?? 30,
        settings: {
          join_before_host: false,
          waiting_room: true,
          auto_recording: 'none',
        },
      }
      if (options.scheduledAt) {
        body.start_time = options.scheduledAt.toISOString()
        body.timezone = 'Asia/Ulaanbaatar'
      }

      const userEndpoint = options.hostEmail
        ? `https://api.zoom.us/v2/users/${options.hostEmail}/meetings`
        : 'https://api.zoom.us/v2/users/me/meetings'

      const res = await axios.post(userEndpoint, body, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      })

      return {
        meeting_id: String(res.data.id),
        join_url: res.data.join_url,
        start_url: res.data.start_url,
        password: res.data.password || '',
      }
    } catch (e) {
      this.logger.warn(`Zoom meeting creation failed: ${e.message}`)
      return null
    }
  }
}
