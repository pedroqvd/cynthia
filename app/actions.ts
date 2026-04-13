'use server'

import { revalidatePath } from 'next/cache'

export async function revalidateSite() {
  // Limpa o cache tanto da home principal quanto de qualquer pagina interna para refletir as imagens/configuraçoes imediatamente.
  revalidatePath('/', 'layout')
}
