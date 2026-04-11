import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email, redirectTo } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'E-mail é obrigatório.' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Configuração do servidor incompleta.' }, { status: 500 })
    }

    const adminSupabase = createClient(supabaseUrl, serviceKey)

    // Verifica se o e-mail está cadastrado no Supabase Auth
    const { data: { users }, error: listError } = await adminSupabase.auth.admin.listUsers()

    if (listError) {
      return NextResponse.json({ error: 'Erro interno. Tente novamente.' }, { status: 500 })
    }

    const userExists = users.some(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    )

    if (!userExists) {
      return NextResponse.json(
        { error: 'E-mail não encontrado. Verifique o endereço e tente novamente.' },
        { status: 404 }
      )
    }

    // Usuário existe — envia o e-mail de recuperação
    const { error: resetError } = await adminSupabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (resetError) {
      const isRateLimit = resetError.message?.toLowerCase().includes('rate') ||
        resetError.message?.toLowerCase().includes('limit') ||
        resetError.status === 429
      const msg = isRateLimit
        ? 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
        : `Erro ao enviar e-mail: ${resetError.message}`
      return NextResponse.json({ error: msg }, { status: isRateLimit ? 429 : 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno. Tente novamente.' }, { status: 500 })
  }
}
