import { z } from 'zod'

export const logQuerySchema = z.object({
  page: z.string().optional().transform(val => parseInt(val || '1')),
  limit: z.string().optional().transform(val => parseInt(val || '10')),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export type LogQueryParams = z.infer<typeof logQuerySchema>