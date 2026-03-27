import { Injectable, Logger } from '@nestjs/common'
import axios from 'axios'

/* ═══════════════════════════════════════
 *  Google Calendar Service
 *  Creates/updates/deletes events via Google Calendar API
 *
 *  Auth: Google Service Account OR OAuth2
 *  Env vars:
 *    GOOGLE_CLIENT_ID
 *    GOOGLE_CLIENT_SECRET
 *    GOOGLE_REFRESH_TOKEN    (from OAuth2 consent flow)
 *    GOOGLE_CALENDAR_ID      (default: 'primary')
 *
 *  Falls back gracefully if not configured (iCalendar .ics email still works)
 * ═══════════════════════════════════════ */

export interface CalendarEvent {
  google_event_id: string
  html_link: string
}

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name)
  private cachedToken: { token: string; expiresAt: number } | null = null

  private get clientId() { return process.env.GOOGLE_CLIENT_ID }
  private get clientSecret() { return process.env.GOOGLE_CLIENT_SECRET }
  private get refreshToken() { return process.env.GOOGLE_REFRESH_TOKEN }
  private get calendarId() { return process.env.GOOGLE_CALENDAR_ID || 'primary' }
  private get isConfigured() { return !!(this.clientId && this.clientSecret && this.refreshToken) }

  /* ═══════════════════════════════════════
   *  OAuth2 Access Token (via refresh token)
   * ═══════════════════════════════════════ */

  private async getAccessToken(): Promise<string | null> {
    if (!this.isConfigured) return null

    const now = Date.now()
    if (this.cachedToken && this.cachedToken.expiresAt > now + 60_000) {
      return this.cachedToken.token
    }

    try {
      const res = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: this.refreshToken,
        grant_type: 'refresh_token',
      })
      this.cachedToken = {
        token: res.data.access_token,
        expiresAt: now + (res.data.expires_in * 1000),
      }
      return this.cachedToken.token
    } catch (e) {
      this.logger.warn(`Google OAuth refresh failed: ${e.message}`)
      return null
    }
  }

  /* ═══════════════════════════════════════
   *  CREATE EVENT
   * ═══════════════════════════════════════ */

  async createEvent(params: {
    summary: string
    description?: string
    startTime: Date
    endTime?: Date
    location?: string      // Zoom join URL
    attendees?: string[]   // email addresses
    meetingLink?: string   // Zoom link for conference data
  }): Promise<CalendarEvent | null> {
    const token = await this.getAccessToken()
    if (!token) {
      this.logger.warn('Google Calendar not configured — skipping event creation')
      return null
    }

    const endTime = params.endTime || new Date(params.startTime.getTime() + 60 * 60 * 1000)

    const event: any = {
      summary: params.summary,
      description: params.description || '',
      start: {
        dateTime: params.startTime.toISOString(),
        timeZone: 'Asia/Ulaanbaatar',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'Asia/Ulaanbaatar',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 30 },
          { method: 'popup', minutes: 15 },
        ],
      },
    }

    if (params.location) {
      event.location = params.location
    }

    if (params.attendees?.length) {
      event.attendees = params.attendees.map(email => ({ email }))
    }

    // Add Zoom link as conference entry point
    if (params.meetingLink) {
      event.description = `${params.description || ''}\n\n🔗 Zoom уулзалт: ${params.meetingLink}`
    }

    try {
      const res = await axios.post(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(this.calendarId)}/events?sendUpdates=all`,
        event,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
      )

      this.logger.log(`Google Calendar event created: ${res.data.id}`)
      return {
        google_event_id: res.data.id,
        html_link: res.data.htmlLink,
      }
    } catch (e) {
      this.logger.warn(`Google Calendar event creation failed: ${e.message}`)
      return null
    }
  }

  /* ═══════════════════════════════════════
   *  UPDATE EVENT (reschedule)
   * ═══════════════════════════════════════ */

  async updateEvent(eventId: string, params: {
    summary?: string
    description?: string
    startTime?: Date
    endTime?: Date
    location?: string
  }): Promise<boolean> {
    const token = await this.getAccessToken()
    if (!token) return false

    const patch: any = {}
    if (params.summary) patch.summary = params.summary
    if (params.description) patch.description = params.description
    if (params.startTime) {
      patch.start = { dateTime: params.startTime.toISOString(), timeZone: 'Asia/Ulaanbaatar' }
      const end = params.endTime || new Date(params.startTime.getTime() + 60 * 60 * 1000)
      patch.end = { dateTime: end.toISOString(), timeZone: 'Asia/Ulaanbaatar' }
    }
    if (params.location) patch.location = params.location

    try {
      await axios.patch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(this.calendarId)}/events/${eventId}?sendUpdates=all`,
        patch,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
      )
      this.logger.log(`Google Calendar event updated: ${eventId}`)
      return true
    } catch (e) {
      this.logger.warn(`Google Calendar event update failed: ${e.message}`)
      return false
    }
  }

  /* ═══════════════════════════════════════
   *  DELETE EVENT (cancel)
   * ═══════════════════════════════════════ */

  async deleteEvent(eventId: string): Promise<boolean> {
    const token = await this.getAccessToken()
    if (!token) return false

    try {
      await axios.delete(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(this.calendarId)}/events/${eventId}?sendUpdates=all`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      this.logger.log(`Google Calendar event deleted: ${eventId}`)
      return true
    } catch (e) {
      this.logger.warn(`Google Calendar event delete failed: ${e.message}`)
      return false
    }
  }
}
