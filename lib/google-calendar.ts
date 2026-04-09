/**
 * Integração com Google Calendar via Service Account
 * A service account deve ter acesso ao calendário da Dra. Cynthia
 */
import { google, calendar_v3 } from 'googleapis'

const CALENDAR_SCOPES = ['https://www.googleapis.com/auth/calendar']

/** Inicializa o cliente autenticado via Service Account */
function getCalendarClient(): calendar_v3.Calendar {
  const serviceAccountJson = Buffer.from(
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON!,
    'base64'
  ).toString('utf-8')

  const credentials = JSON.parse(serviceAccountJson)

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: CALENDAR_SCOPES,
  })

  return google.calendar({ version: 'v3', auth })
}

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID!

/** Tipo de evento retornado pela API */
export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  description: string | null
  leadId: string | null
  procedimento: string | null
  colorId: string | null
}

/** Cor por tipo de procedimento */
const PROCEDURE_COLORS: Record<string, string> = {
  estetica: '5',   // amarelo/banana
  cirurgia: '11',  // vermelho tomate
  protese: '9',    // mirtilo
  dtm: '9',
  bloqueado: '8',  // grafite
}

/** Lista eventos dos próximos N dias */
export async function listEvents(days = 30): Promise<CalendarEvent[]> {
  const calendar = getCalendarClient()
  const now = new Date()
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

  const res = await calendar.events.list({
    calendarId: CALENDAR_ID,
    timeMin: now.toISOString(),
    timeMax: future.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 200,
  })

  return (res.data.items ?? []).map(mapEvent)
}

/** Cria um evento no Google Calendar */
export async function createEvent(params: {
  title: string
  description: string
  startIso: string
  endIso: string
  procedimento: string
  leadId?: string
  guestEmail?: string
}): Promise<CalendarEvent> {
  const calendar = getCalendarClient()

  const colorId = PROCEDURE_COLORS[params.procedimento.toLowerCase()] ?? '5'

  const event: calendar_v3.Schema$Event = {
    summary: params.title,
    description: params.description,
    start: { dateTime: params.startIso, timeZone: 'America/Sao_Paulo' },
    end: { dateTime: params.endIso, timeZone: 'America/Sao_Paulo' },
    colorId,
    extendedProperties: {
      private: {
        lead_id: params.leadId ?? '',
        procedimento: params.procedimento,
      },
    },
    attendees: params.guestEmail
      ? [{ email: params.guestEmail }]
      : undefined,
    conferenceData: undefined, // consulta presencial — sem Google Meet
  }

  const res = await calendar.events.insert({
    calendarId: CALENDAR_ID,
    requestBody: event,
  })

  return mapEvent(res.data)
}

/** Atualiza um evento existente */
export async function updateEvent(
  eventId: string,
  params: Partial<{
    title: string
    description: string
    startIso: string
    endIso: string
  }>
): Promise<CalendarEvent> {
  const calendar = getCalendarClient()

  const patch: calendar_v3.Schema$Event = {}
  if (params.title) patch.summary = params.title
  if (params.description) patch.description = params.description
  if (params.startIso) patch.start = { dateTime: params.startIso, timeZone: 'America/Sao_Paulo' }
  if (params.endIso) patch.end = { dateTime: params.endIso, timeZone: 'America/Sao_Paulo' }

  const res = await calendar.events.patch({
    calendarId: CALENDAR_ID,
    eventId,
    requestBody: patch,
  })

  return mapEvent(res.data)
}

/** Cancela / exclui um evento */
export async function deleteEvent(eventId: string): Promise<void> {
  const calendar = getCalendarClient()
  await calendar.events.delete({ calendarId: CALENDAR_ID, eventId })
}

/** Retorna horários disponíveis em um dia (em slots de 60 min) */
export async function getAvailability(date: string): Promise<string[]> {
  const calendar = getCalendarClient()

  // Horário de funcionamento: 8h–18h (Brasília)
  const OPEN_HOUR = 8
  const CLOSE_HOUR = 18
  const SLOT_MIN = 60

  const startOfDay = new Date(`${date}T${String(OPEN_HOUR).padStart(2, '0')}:00:00-03:00`)
  const endOfDay = new Date(`${date}T${String(CLOSE_HOUR).padStart(2, '0')}:00:00-03:00`)

  const res = await calendar.events.list({
    calendarId: CALENDAR_ID,
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  })

  const busy = (res.data.items ?? []).map((e) => ({
    start: new Date(e.start?.dateTime ?? e.start?.date ?? ''),
    end: new Date(e.end?.dateTime ?? e.end?.date ?? ''),
  }))

  // Gera slots e filtra os ocupados
  const slots: string[] = []
  const cursor = new Date(startOfDay)

  while (cursor.getTime() + SLOT_MIN * 60000 <= endOfDay.getTime()) {
    const slotEnd = new Date(cursor.getTime() + SLOT_MIN * 60000)
    const overlaps = busy.some(
      (b) => cursor < b.end && slotEnd > b.start
    )
    if (!overlaps) {
      slots.push(cursor.toISOString())
    }
    cursor.setMinutes(cursor.getMinutes() + SLOT_MIN)
  }

  return slots
}

/** Registra webhook push notification do Google Calendar */
export async function watchCalendar(webhookUrl: string): Promise<void> {
  const calendar = getCalendarClient()
  const channelId = `cynthia-${Date.now()}`

  await calendar.events.watch({
    calendarId: CALENDAR_ID,
    requestBody: {
      id: channelId,
      type: 'web_hook',
      address: webhookUrl,
      expiration: String(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
    },
  })
}

function mapEvent(e: calendar_v3.Schema$Event): CalendarEvent {
  return {
    id: e.id ?? '',
    title: e.summary ?? '(sem título)',
    start: e.start?.dateTime ?? e.start?.date ?? '',
    end: e.end?.dateTime ?? e.end?.date ?? '',
    description: e.description ?? null,
    leadId: e.extendedProperties?.private?.['lead_id'] ?? null,
    procedimento: e.extendedProperties?.private?.['procedimento'] ?? null,
    colorId: e.colorId ?? null,
  }
}
