import type { Metadata } from 'next'
import { Nav } from '@/components/site/Nav'
import { Hero } from '@/components/site/Hero'
import { Diferencial } from '@/components/site/Diferencial'
import { Sobre } from '@/components/site/Sobre'
import { Especialidades } from '@/components/site/Especialidades'
import { Resultados } from '@/components/site/Resultados'
import { Depoimentos } from '@/components/site/Depoimentos'
import { Agendamento } from '@/components/site/Agendamento'
import { Footer } from '@/components/site/Footer'
import { createAdminClient } from '@/lib/supabase/server'

export const revalidate = 3600 // ISR: revalida a cada 1h

export const metadata: Metadata = {
  title: 'Dra. Cynthia — Especialista em Estética, Cirurgia e Prótese Dental | Brasília',
}

// Structured data para SEO (schema.org)
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': ['Dentist', 'MedicalBusiness', 'LocalBusiness'],
  name: 'Dra. Cynthia — Clínica Odontológica',
  description:
    'Especialista em Estética Dental, Cirurgia Bucomaxilofacial e Prótese em Brasília-DF.',
  url: 'https://dracynthia.com.br',
  telephone: '+55-61-9999-9999',
  priceRange: '$$$',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Brasília',
    addressRegion: 'DF',
    addressCountry: 'BR',
  },
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '08:00',
    closes: '18:00',
  },
  medicalSpecialty: ['Dentistry', 'OralSurgery', 'CosmeticDentistry'],
}

async function getData() {
  try {
    const supabase = createAdminClient()

    const [{ data: beforeAfter }, { data: testimonials }, { data: rawConfig }] = await Promise.all([
      supabase
        .from('before_after')
        .select('*')
        .eq('ativo', true)
        .order('ordem'),
      supabase
        .from('testimonials')
        .select('*')
        .eq('ativo', true)
        .order('ordem'),
      supabase.from('site_config').select('key, value'),
    ])

    const config: Record<string, string> = {}
    if (rawConfig) {
      rawConfig.forEach((row) => { config[row.key] = row.value })
    }

    return { beforeAfter: beforeAfter ?? [], testimonials: testimonials ?? [], config }
  } catch {
    return { beforeAfter: [], testimonials: [], config: {} }
  }
}

export default async function HomePage() {
  const { beforeAfter, testimonials, config } = await getData()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Nav />
      <Hero imgUrl={config.img_hero} />
      <Diferencial />
      <Sobre imgUrl={config.img_sobre} />
      <Especialidades />
      <Resultados items={beforeAfter.length > 0 ? beforeAfter : undefined} />
      <Depoimentos items={testimonials.length > 0 ? testimonials : undefined} />
      <Agendamento imgUrl={config.img_cta} />
      <Footer />
    </>
  )
}
