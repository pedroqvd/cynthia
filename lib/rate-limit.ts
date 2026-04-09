import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Instância singleton do Redis
let redis: Redis | null = null
let ratelimit: Ratelimit | null = null

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  }
  return redis
}

/** Rate limiter: 10 requisições por minuto por IP (APIs públicas) */
export function getRateLimiter(): Ratelimit {
  if (!ratelimit) {
    ratelimit = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      analytics: true,
      prefix: 'cynthia:rl',
    })
  }
  return ratelimit
}

/** Extrai IP do request (compatível com Vercel) */
export function getClientIP(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1'
  )
}

/** Verifica e aplica rate limit; retorna null se OK, Response 429 se excedido */
export async function checkRateLimit(
  identifier: string
): Promise<Response | null> {
  try {
    const limiter = getRateLimiter()
    const { success, limit, reset, remaining } = await limiter.limit(identifier)

    if (!success) {
      return new Response(
        JSON.stringify({ data: null, error: 'Muitas requisições. Tente novamente em instantes.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': String(remaining),
            'X-RateLimit-Reset': String(reset),
          },
        }
      )
    }
  } catch {
    // Se Redis não estiver configurado, não bloqueia
  }

  return null
}
