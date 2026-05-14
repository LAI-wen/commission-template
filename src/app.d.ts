declare global {
  namespace App {
    interface Platform {
      env: Env
      cf: CfProperties
      ctx: ExecutionContext
    }
  }

  interface Env extends Cloudflare.Env {
    DB: D1Database
    KV: KVNamespace
    R2: R2Bucket
    DASHBOARD_PASSWORD: string
    SESSION_SECRET: string
    ORIGIN: string
    EMAIL_DOMAIN: string
    ARTIST_EMAIL: string | undefined
    HUB_URL: string | undefined
  }
}

export {}
