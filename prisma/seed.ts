import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminPassword = await hash('admin123', 12)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@revenuemd.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN' as const,
    },
  })

  // Create regular user
  const userPassword = await hash('user123', 12)
  const user = await prisma.user.create({
    data: {
      email: 'user@revenuemd.com',
      password: userPassword,
      name: 'Regular User',
      role: 'USER' as const,
    },
  })

  // Create multiple patients
  const patients = await Promise.all([
    prisma.patient.create({
      data: {
        name: 'John Doe',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'MALE' as const,
        contactInfo: {
          email: 'john@example.com',
          phone: '123-456-7890',
          address: '123 Main St'
        },
        userId: admin.id,
      },
    }),
    prisma.patient.create({
      data: {
        name: 'Jane Smith',
        dateOfBirth: new Date('1985-05-15'),
        gender: 'FEMALE' as const,
        contactInfo: {
          email: 'jane@example.com',
          phone: '098-765-4321',
          address: '456 Oak Ave'
        },
        userId: user.id,
      },
    }),
    prisma.patient.create({
      data: {
        name: 'Bob Wilson',
        dateOfBirth: new Date('1978-12-25'),
        gender: 'MALE' as const,
        contactInfo: {
          email: 'bob@example.com',
          phone: '555-555-5555',
          address: '789 Pine Rd'
        },
        userId: admin.id,
      },
    }),
  ])

  // Create multiple claims
  await Promise.all([
    prisma.claim.create({
      data: {
        patientId: patients[0].id,
        amount: 1000.00,
        status: 'PENDING' as const,
        procedureCodes: ['CODE1', 'CODE2'],
        diagnosisCodes: ['ICD1', 'ICD2'],
        notes: 'Initial claim',
      },
    }),
    prisma.claim.create({
      data: {
        patientId: patients[1].id,
        amount: 2500.50,
        status: 'APPROVED' as const,
        procedureCodes: ['CODE3'],
        diagnosisCodes: ['ICD3'],
        notes: 'Routine checkup',
      },
    }),
    prisma.claim.create({
      data: {
        patientId: patients[2].id,
        amount: 750.25,
        status: 'DENIED' as const,
        procedureCodes: ['CODE4', 'CODE5'],
        diagnosisCodes: ['ICD4', 'ICD5'],
        notes: 'Missing documentation',
      },
    }),
    prisma.claim.create({
      data: {
        patientId: patients[0].id,
        amount: 1250.75,
        status: 'PENDING' as const,
        procedureCodes: ['CODE6'],
        diagnosisCodes: ['ICD6'],
        notes: 'Follow-up visit',
      },
    }),
  ])

  console.log('Database seeded!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })