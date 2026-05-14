import { z } from "zod"

export const applySchema = z.object({
  type_id: z.string().min(1, "請選擇委託項目"),
  client_name: z.string().min(1, "請填寫姓名").max(50),
  client_email: z.string().email("請填寫有效的 Email"),
  detail: z.string().min(20, "需求說明至少 20 字").max(2000),
  selected_options: z.string().default("[]"),
  estimated_price: z.coerce.number().min(0),
  honeypot: z.string().max(0, "").optional(),
})

export type ApplyInput = z.infer<typeof applySchema>
