import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import AnalyticsManager from '@/components/admin/AnalyticsManager'

export const metadata: Metadata = { title: 'Analytics' }
export const dynamic = 'force-dynamic'

const PLATFORMS = ['instagram', 'tiktok', 'linkedin', 'x', 'facebook']

export default async function AnalyticsPage() {
  const supabase = createClient()

  const results = await Promise.all(
    PLATFORMS.map((platform) =>
      supabase
        .from('social_metrics')
        .select('*')
        .eq('platform', platform)
        .order('periodo', { ascending: false })
        .limit(12)
        .then(({ data }) => ({ platform, data: data ?? [] }))
    )
  )

  const initialData = Object.fromEntries(results.map(({ platform, data }) => [platform, data]))

  return (
    <div style={{ padding: 'clamp(1.25rem, 3vw, 2rem)' }}>
      <AnalyticsManager initialData={initialData} />
    </div>
  )
}
