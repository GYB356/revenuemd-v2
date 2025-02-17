import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verify() {
  const users = await prisma.user.findMany()
  const patients = await prisma.patient.findMany({
    include: { claims: true }
  })
  const claims = await prisma.claim.findMany({
    include: { patient: true }
  })

  console.log('\nDatabase Verification:')
  console.log('==================')
  
  console.log('\nUsers:', users.length)
  users.forEach(user => {
    console.log(`- ${user.name} (${user.email}): ${user.role}`)
  })

  console.log('\nPatients:', patients.length)
  patients.forEach(patient => {
    console.log(`- ${patient.name} (${patient.gender}), DOB: ${patient.dateOfBirth.toLocaleDateString()}`)
    console.log(`  Claims: ${patient.claims.length}`)
  })

  console.log('\nClaims:', claims.length)
  claims.forEach(claim => {
    console.log(`- $${claim.amount} (${claim.status}): ${claim.notes}`)
    console.log(`  Patient: ${claim.patient.name}`)
  })

  // Validation checks
  console.log('\nValidation Checks:')
  console.log('==================')
  
  // Check if admin exists
  const adminExists = users.some(user => user.role === 'ADMIN')
  console.log('✓ Admin user exists:', adminExists)

  // Check if all patients have valid users
  const validPatients = patients.every(patient => 
    users.some(user => user.id === patient.userId)
  )
  console.log('✓ All patients have valid users:', validPatients)

  // Check if all claims have valid patients
  const validClaims = claims.every(claim => 
    patients.some(patient => patient.id === claim.patientId)
  )
  console.log('✓ All claims have valid patients:', validClaims)

  // Check claim status distribution
  const claimStatuses = claims.reduce((acc, claim) => {
    acc[claim.status] = (acc[claim.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  console.log('✓ Claim status distribution:', claimStatuses)

  await prisma.$disconnect()
}

verify()