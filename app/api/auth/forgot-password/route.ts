import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { email, redirectTo } = await req.json()

  if (!email) {
    return NextResponse.json({ error: 'E-mail é obrigatório.' }, { status: 400 })
  }

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

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
    return NextResponse.json({ error: 'Erro ao enviar e-mail. Tente novamente.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
