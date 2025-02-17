import { vi } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended'
import { beforeEach } from 'vitest'

import { prisma } from '@/lib/db'

vi.mock('@/lib/db', () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}))

beforeEach(() => {
  mockReset(prismaMock)
})

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>