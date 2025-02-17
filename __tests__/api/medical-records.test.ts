import { NextRequest } from 'next/server'
import { GET, POST, PUT, DELETE } from '@/app/api/medical-records/[patientId]/route'
import { POST as createMedicalRecord } from '@/app/api/medical-records/route'
import { prisma } from '@/lib/db'
import { getMedicalRecord, createMedicalRecord as createMongoRecord, updateMedicalRecord, deleteMedicalRecord } from '@/lib/mongodb'
import { verifyAuth } from '@/lib/auth'
import { logActivity } from '@/lib/activity-logger'
import { expect } from '@jest/globals'

// Add Jest matchers type augmentation
declare global {
  namespace jest {
    interface Matchers<R> {
      toBe(expected: any): R;
      toEqual(expected: any): R;
      toHaveBeenCalled(): R;
      toHaveBeenCalledWith(...args: any[]): R;
      toContain(expected: any): R;
      toHaveProperty(property: string, value?: any): R;
    }
  }
}

// Mock dependencies
jest.mock('@/lib/db', () => ({
  prisma: {
    patient: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('@/lib/mongodb', () => ({
  getMedicalRecord: jest.fn(),
  createMedicalRecord: jest.fn(),
  updateMedicalRecord: jest.fn(),
  deleteMedicalRecord: jest.fn(),
}))

jest.mock('@/lib/auth', () => ({
  verifyAuth: jest.fn(),
}))

jest.mock('@/lib/activity-logger', () => ({
  logActivity: jest.fn(),
}))

describe('Medical Records API', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    role: 'ADMIN',
  }

  const mockPatient = {
    id: 'patient-1',
    name: 'John Doe',
    userId: 'user-1',
    medicalRecordId: null,
  }

  const mockMedicalRecord = {
    patientId: 'patient-1',
    history: { bloodType: 'A+' },
    allergies: ['Penicillin'],
    medications: [
      {
        name: 'Aspirin',
        dosage: '100mg',
        frequency: 'daily',
        startDate: new Date(),
      },
    ],
    conditions: [
      {
        name: 'Hypertension',
        diagnosisDate: new Date(),
        status: 'active' as const,
      },
    ],
    procedures: [],
    vitals: [],
    notes: [],
    attachments: [],
  }

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    
    // Mock successful auth
    ;(verifyAuth as jest.Mock).mockResolvedValue(mockUser)
    ;(prisma.patient.findFirst as jest.Mock).mockResolvedValue(mockPatient)
  })

  describe('GET /api/medical-records/[patientId]', () => {
    it('should return 401 if user is not authenticated', async () => {
      ;(verifyAuth as jest.Mock).mockResolvedValue(null)

      const req = new NextRequest(new Request('http://localhost/api/medical-records/patient-1'))
      const response = await GET(req, { params: { patientId: 'patient-1' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 404 if patient is not found', async () => {
      ;(prisma.patient.findFirst as jest.Mock).mockResolvedValue(null)

      const req = new NextRequest(new Request('http://localhost/api/medical-records/patient-1'))
      const response = await GET(req, { params: { patientId: 'patient-1' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Patient not found')
    })

    it('should return 404 if medical record is not found', async () => {
      ;(prisma.patient.findFirst as jest.Mock).mockResolvedValue(mockPatient)
      ;(getMedicalRecord as jest.Mock).mockResolvedValue(null)

      const req = new NextRequest(new Request('http://localhost/api/medical-records/patient-1'))
      const response = await GET(req, { params: { patientId: 'patient-1' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Medical record not found')
    })

    it('should return medical record if found', async () => {
      ;(prisma.patient.findFirst as jest.Mock).mockResolvedValue(mockPatient)
      ;(getMedicalRecord as jest.Mock).mockResolvedValue(mockMedicalRecord)

      const req = new NextRequest(new Request('http://localhost/api/medical-records/patient-1'))
      const response = await GET(req, { params: { patientId: 'patient-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockMedicalRecord)
    })
  })

  describe('POST /api/medical-records', () => {
    const mockCreateData = {
      patientId: 'patient-1',
      history: {},
      allergies: ['Peanuts'],
      medications: [
        {
          name: 'Aspirin',
          dosage: '100mg',
          frequency: 'daily',
          startDate: new Date().toISOString(),
        },
      ],
      conditions: [
        {
          name: 'Hypertension',
          diagnosisDate: new Date().toISOString(),
          status: 'active',
        },
      ],
      vitals: [],
      notes: [],
      attachments: [],
    }

    it('should create a new medical record', async () => {
      ;(prisma.patient.findFirst as jest.Mock).mockResolvedValue({
        ...mockPatient,
        medicalRecordId: null,
      })
      ;(createMongoRecord as jest.Mock).mockResolvedValue({
        insertedId: 'record-1',
      })
      ;(prisma.patient.update as jest.Mock).mockResolvedValue(mockPatient)

      const req = new NextRequest(
        new Request('http://localhost/api/medical-records', {
          method: 'POST',
          body: JSON.stringify(mockCreateData),
        })
      )
      const response = await createMedicalRecord(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.medicalRecordId).toBe('record-1')
      expect(createMongoRecord).toHaveBeenCalled()
      expect(prisma.patient.update).toHaveBeenCalled()
    })

    it('should return 400 if medical record already exists', async () => {
      ;(prisma.patient.findFirst as jest.Mock).mockResolvedValue(mockPatient)

      const req = new NextRequest(
        new Request('http://localhost/api/medical-records', {
          method: 'POST',
          body: JSON.stringify(mockCreateData),
        })
      )
      const response = await createMedicalRecord(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Medical record already exists for this patient')
    })
  })

  describe('PUT /api/medical-records/[patientId]', () => {
    const mockUpdateData = {
      allergies: ['Peanuts', 'Shellfish'],
    }

    it('should update an existing medical record', async () => {
      ;(prisma.patient.findFirst as jest.Mock).mockResolvedValue(mockPatient)
      ;(updateMedicalRecord as jest.Mock).mockResolvedValue({
        modifiedCount: 1,
      })

      const req = new NextRequest(
        new Request('http://localhost/api/medical-records/patient-1', {
          method: 'PUT',
          body: JSON.stringify(mockUpdateData),
        })
      )
      const response = await PUT(req, { params: { patientId: 'patient-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(updateMedicalRecord).toHaveBeenCalled()
    })

    it('should return 404 if patient is not found', async () => {
      ;(prisma.patient.findFirst as jest.Mock).mockResolvedValue(null)

      const req = new NextRequest(
        new Request('http://localhost/api/medical-records/patient-1', {
          method: 'PUT',
          body: JSON.stringify(mockUpdateData),
        })
      )
      const response = await PUT(req, { params: { patientId: 'patient-1' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Patient not found')
    })
  })

  describe('DELETE /api/medical-records/[patientId]', () => {
    it('should delete a medical record', async () => {
      ;(prisma.patient.findUnique as jest.Mock).mockResolvedValue(mockPatient)
      ;(deleteMedicalRecord as jest.Mock).mockResolvedValue({
        deletedCount: 1,
      })
      ;(prisma.patient.update as jest.Mock).mockResolvedValue(mockPatient)

      const req = new NextRequest(
        new Request('http://localhost/api/medical-records/patient-1', {
          method: 'DELETE',
        })
      )
      const response = await DELETE(req, { params: { patientId: 'patient-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(deleteMedicalRecord).toHaveBeenCalled()
      expect(prisma.patient.update).toHaveBeenCalled()
    })

    it('should return 403 if user is not admin', async () => {
      ;(verifyAuth as jest.Mock).mockResolvedValue({
        ...mockUser,
        role: 'USER',
      })

      const req = new NextRequest(
        new Request('http://localhost/api/medical-records/patient-1', {
          method: 'DELETE',
        })
      )
      const response = await DELETE(req, { params: { patientId: 'patient-1' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Only administrators can delete medical records')
    })

    it('should return 404 if patient is not found', async () => {
      ;(prisma.patient.findUnique as jest.Mock).mockResolvedValue(null)

      const req = new NextRequest(
        new Request('http://localhost/api/medical-records/patient-1', {
          method: 'DELETE',
        })
      )
      const response = await DELETE(req, { params: { patientId: 'patient-1' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Patient not found')
    })
  })
}) 