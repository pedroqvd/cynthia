import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiResponse, apiError } from '@/lib/utils'

export async function POST(_request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('Não autorizado', 401)

  const clientId = process.env.PLUGGY_CLIENT_ID
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET

  if (!clientId) {
    return apiError(
      'Pluggy não configurado. Configure PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET no .env.',
      503
    )
  }

  try {
    // Step 1: get API key
    const authRes = await fetch('https://api.pluggy.ai/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, clientSecret }),
    })
    if (!authRes.ok) {
      const msg = await authRes.text()
      return apiError(`Pluggy auth error: ${msg}`, 502)
    }
    const { apiKey } = await authRes.json()

    // Step 2: get connect token
    const tokenRes = await fetch('https://api.pluggy.ai/connect_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
    })
    if (!tokenRes.ok) {
      const msg = await tokenRes.text()
      return apiError(`Pluggy connect token error: ${msg}`, 502)
    }
    const { accessToken } = await tokenRes.json()

    return apiResponse({ accessToken })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return apiError(`Erro ao conectar com Pluggy: ${message}`, 500)
  }
}
