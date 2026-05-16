import { getCreator } from "./db"
import { incrementEmailCount } from "./analytics"

type EmailPayload = {
  type: "new_commission" | "commission_status" | "discussion_message" | "artist_discussion_message"
  artist_email?: string
  client_name?: string
  client_email?: string
  type_name?: string
  estimated_price?: number
  detail?: string
  dashboard_url?: string
  status?: "accepted" | "rejected"
  note?: string
  track_url?: string
  message?: string
}

export async function sendNewCommissionEmail(
  env: Env,
  db: D1Database,
  data: {
    clientName: string
    clientEmail: string
    typeName: string
    estimatedPrice: number
    detail: string
    commissionId: string
  }
) {
  const creator = await getCreator(db)
  if (!creator || creator.email_mode === "none") return

  await dispatch(env, creator, {
    type: "new_commission",
    artist_email: env.ARTIST_EMAIL,
    client_name: data.clientName,
    client_email: data.clientEmail,
    type_name: data.typeName,
    estimated_price: data.estimatedPrice,
    detail: data.detail,
    dashboard_url: `${env.ORIGIN}/dashboard/commission/${data.commissionId}`,
  })
}

export async function sendCommissionStatusEmail(
  env: Env,
  db: D1Database,
  data: {
    clientEmail: string
    clientName: string
    typeName: string
    status: "accepted" | "rejected"
    note?: string
    commissionId: string
  }
) {
  const creator = await getCreator(db)
  if (!creator || creator.email_mode === "none") return

  await dispatch(env, creator, {
    type: "commission_status",
    client_email: data.clientEmail,
    client_name: data.clientName,
    type_name: data.typeName,
    status: data.status,
    note: data.note,
    track_url: `${env.ORIGIN}/track/${data.commissionId}`,
  })
}

export async function sendDiscussionMessageEmail(
  env: Env,
  db: D1Database,
  data: {
    clientEmail: string
    clientName: string
    typeName: string
    message: string
    commissionId: string
  }
) {
  const creator = await getCreator(db)
  if (!creator || creator.email_mode === "none") return

  await dispatch(env, creator, {
    type: "discussion_message",
    client_email: data.clientEmail,
    client_name: data.clientName,
    type_name: data.typeName,
    message: data.message,
    track_url: `${env.ORIGIN}/track/${data.commissionId}`,
  })
}

export async function sendClientDiscussionReminderEmail(
  env: Env,
  db: D1Database,
  data: {
    clientName: string
    typeName: string
    message: string
    commissionId: string
  }
) {
  const creator = await getCreator(db)
  if (!creator || creator.email_mode === "none") return

  await dispatch(env, creator, {
    type: "artist_discussion_message",
    artist_email: (creator.contact_email as string | null) ?? env.ARTIST_EMAIL,
    client_name: data.clientName,
    type_name: data.typeName,
    message: data.message,
    dashboard_url: `${env.ORIGIN}/dashboard/commission/${data.commissionId}`,
  })
}

async function dispatch(
  env: Env,
  creator: Record<string, unknown>,
  payload: EmailPayload
) {
  const mode = creator.email_mode as string
  let sent = false

  if (mode === "resend" && creator.resend_api_key) {
    await sendViaResend(
      creator.resend_api_key as string,
      (creator.resend_from as string | null) || "onboarding@resend.dev",
      payload
    )
    sent = true
  } else if (mode === "hub" && env.HUB_URL && creator.hub_token) {
    await fetch(`${env.HUB_URL}/api/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hub-token": creator.hub_token as string,
      },
      body: JSON.stringify(payload),
    }).catch(e => console.error("Hub relay error:", e))
    sent = true
  }

  if (sent && env.KV) {
    await incrementEmailCount(env.KV)
  }
}

async function sendViaResend(apiKey: string, fromAddress: string, payload: EmailPayload) {
  let to: string, subject: string, html: string

  if (payload.type === "new_commission") {
    to = payload.artist_email!
    subject = `New commission: ${payload.type_name} — ${payload.client_name}`
    html = `
      <h2>New commission application</h2>
      <p><strong>${payload.client_name}</strong> (${payload.client_email})</p>
      <table cellpadding="6">
        <tr><td>Type</td><td>${payload.type_name}</td></tr>
        <tr><td>Estimated</td><td>NT$ ${Number(payload.estimated_price).toLocaleString()}</td></tr>
      </table>
      <h3>Details</h3>
      <p>${String(payload.detail).replace(/\n/g, "<br>")}</p>
      <a href="${payload.dashboard_url}" style="display:inline-block;padding:0.5rem 1.2rem;background:#111;color:#fff;text-decoration:none;border-radius:6px;">
        View in Dashboard
      </a>
    `
  } else if (payload.type === "commission_status") {
    const isAccepted = payload.status === "accepted"
    to = payload.client_email!
    subject = `Commission ${isAccepted ? "accepted" : "not accepted"}: ${payload.type_name}`
    html = `
      <p>Hello ${payload.client_name},</p>
      <p>Your commission (${payload.type_name}) has been
        ${isAccepted
          ? "<strong>accepted</strong>. The artist will contact you soon."
          : "<strong>not accepted</strong>. Thank you for your interest."
        }
      </p>
      ${payload.note ? `<p><em>${payload.note}</em></p>` : ""}
      <a href="${payload.track_url}" style="display:inline-block;padding:0.5rem 1.2rem;background:#111;color:#fff;text-decoration:none;border-radius:6px;">
        View status
      </a>
    `
  } else if (payload.type === "discussion_message") {
    to = payload.client_email!
    subject = `Artist message: ${payload.type_name}`
    html = `
      <p>Hello ${payload.client_name},</p>
      <p>The artist sent a new message in your discussion room:</p>
      <blockquote style="margin:12px 0;padding:10px 12px;border-left:4px solid #111;background:#f6f6f6;">
        ${String(payload.message ?? "").replace(/\n/g, "<br>")}
      </blockquote>
      <a href="${payload.track_url}" style="display:inline-block;padding:0.5rem 1.2rem;background:#111;color:#fff;text-decoration:none;border-radius:6px;">
        Open discussion room
      </a>
    `
  } else {
    to = payload.artist_email!
    subject = `Client message: ${payload.type_name}`
    html = `
      <p>您收到一則新的委託人訊息：</p>
      <p><strong>委託人：</strong>${payload.client_name}</p>
      <blockquote style="margin:12px 0;padding:10px 12px;border-left:4px solid #111;background:#f6f6f6;">
        ${String(payload.message ?? "").replace(/\n/g, "<br>")}
      </blockquote>
      <a href="${payload.dashboard_url}" style="display:inline-block;padding:0.5rem 1.2rem;background:#111;color:#fff;text-decoration:none;border-radius:6px;">
        前往後台查看
      </a>
    `
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress,
      to,
      subject,
      html,
    }),
  })
  if (!res.ok) console.error("Resend error:", await res.text())
}
