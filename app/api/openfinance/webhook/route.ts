import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET: Pluggy webhook verification
export async function GET() {
  return new Response('OK', { status: 200 })
}

// POST: Pluggy webhook events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event, item } = body

    if (!item?.id) {
      return new Response('OK', { status: 200 })
    }

    const itemId = item.id

    // Get API key from Pluggy
    const clientId = process.env.PLUGGY_CLIENT_ID
    const clientSecret = process.env.PLUGGY_CLIENT_SECRET

    let itemDetails: Record<string, unknown> | null = null

    if (clientId && clientSecret) {
      try {
        const authRes = await fetch('https://api.pluggy.ai/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId, clientSecret }),
        })
        if (authRes.ok) {
          const { apiKey } = await authRes.json()

          const itemRes = await fetch(`https://api.pluggy.ai/items/${itemId}`, {
            headers: { 'X-API-KEY': apiKey },
          })
          if (itemRes.ok) {
            itemDetails = await itemRes.json()
          }
        }
      } catch {
        // non-fatal — continue with basic item data
      }
    }

    const supabase = createAdminClient()

    const connector = (itemDetails as any)?.connector
    const accounts: any[] = (itemDetails as any)?.accounts ?? []
    const firstAccount = accounts[0] ?? {}

    const upsertData = {
      item_id: itemId,
      connector_name: connector?.name ?? item.connector?.name ?? 'Banco',
      account_name: firstAccount.name ?? item.accountName ?? null,
      account_number: firstAccount.number ?? item.accountNumber ?? null,
      account_type: firstAccount.type ?? 'CHECKING',
      balance: firstAccount.balance ?? 0,
      status: (itemDetails as any)?.status === 'UPDATED' ? 'active'
        : (itemDetails as any)?.status === 'UPDATING' ? 'updating'
        : event?.includes('error') ? 'error'
        : 'active',
      last_sync: new Date().toISOString(),
    }

    await supabase
      .from('bank_connections')
      .upsert(upsertData, { onConflict: 'item_id' })

    return new Response('OK', { status: 200 })
  } catch {
    return new Response('OK', { status: 200 })
  }
}
