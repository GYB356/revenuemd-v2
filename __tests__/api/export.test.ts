import { createMocks } from 'node-mocks-http'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'
import { logActivity } from '@/lib/activity-logger'
import { exportToCSV, exportToJSON } from '@/lib/export'

// Mock dependencies
jest.mock('@/lib/db')
jest.mock('@/lib/auth')
jest.mock('@/lib/activity-logger')
jest.mock('@/lib/export')

describe('Export API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/export/[type]', () => {
    it('exports patients data as CSV', async () => {
      const mockPatients = [
        {
          id: '1',
          name: 'John Doe',
          dateOfBirth: '1990-01-01',
          gender: 'MALE',
          contactInfo: 'john@example.com',
          _count: { claims: 2 },
        },
      ]

      ;(verifyAuth as jest.Mock).mockResolvedValueOnce({ id: 'user-1', role: 'ADMIN' })
      ;(prisma.patient.findMany as jest.Mock).mockResolvedValueOnce(mockPatients)
      ;(exportToCSV as jest.Mock).mockResolvedValueOnce('name,dateOfBirth,gender\nJohn Doe,1990-01-01,MALE')

      const { req, res } = createMocks({
        method: 'GET',
        query: { format: 'csv' },
      })

      await require('@/app/api/export/[type]/route').GET(req, { params: { type: 'patients' } })

      expect(res._getStatusCode()).toBe(200)
      expect(res.getHeader('Content-Type')).toBe('text/csv')
      expect(res.getHeader('Content-Disposition')).toBe('attachment; filename=patients-export.csv')
      expect(logActivity).toHaveBeenCalledWith({
        userId: 'user-1',
        type: 'EXPORT_DATA',
        details: 'Exported patients data as CSV',
      })
    })

    it('exports claims data as JSON', async () => {
      const mockClaims = [
        {
          id: '1',
          patientId: '1',
          amount: 100,
          status: 'APPROVED',
          patient: {
            name: 'John Doe',
            contactInfo: 'john@example.com',
          },
        },
      ]

      ;(verifyAuth as jest.Mock).mockResolvedValueOnce({ id: 'user-1', role: 'ADMIN' })
      ;(prisma.claim.findMany as jest.Mock).mockResolvedValueOnce(mockClaims)
      ;(exportToJSON as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockClaims))

      const { req, res } = createMocks({
        method: 'GET',
        query: { format: 'json' },
      })

      await require('@/app/api/export/[type]/route').GET(req, { params: { type: 'claims' } })

      expect(res._getStatusCode()).toBe(200)
      expect(res.getHeader('Content-Type')).toBe('application/json')
      expect(res.getHeader('Content-Disposition')).toBe('attachment; filename=claims-export.json')
      expect(logActivity).toHaveBeenCalledWith({
        userId: 'user-1',
        type: 'EXPORT_DATA',
        details: 'Exported claims data as JSON',
      })
    })

    it('handles invalid export type', async () => {
      ;(verifyAuth as jest.Mock).mockResolvedValueOnce({ id: 'user-1', role: 'ADMIN' })

      const { req, res } = createMocks({
        method: 'GET',
      })

      await require('@/app/api/export/[type]/route').GET(req, { params: { type: 'invalid' } })

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Invalid export type',
      })
    })

    it('handles unauthorized access', async () => {
      ;(verifyAuth as jest.Mock).mockResolvedValueOnce(null)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await require('@/app/api/export/[type]/route').GET(req, { params: { type: 'patients' } })

      expect(res._getStatusCode()).toBe(401)
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Unauthorized',
      })
    })

    it('handles export errors', async () => {
      ;(verifyAuth as jest.Mock).mockResolvedValueOnce({ id: 'user-1', role: 'ADMIN' })
      ;(prisma.patient.findMany as jest.Mock).mockRejectedValueOnce(new Error('Database error'))

      const { req, res } = createMocks({
        method: 'GET',
        query: { format: 'csv' },
      })

      await require('@/app/api/export/[type]/route').GET(req, { params: { type: 'patients' } })

      expect(res._getStatusCode()).toBe(500)
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Failed to export data',
      })
    })
  })
}) 