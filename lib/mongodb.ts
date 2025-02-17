import { MongoClient, ObjectId } from 'mongodb'

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env')
}

const uri = process.env.MONGODB_URI
const options = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export interface MedicalRecord {
  _id: ObjectId
  patientId: string
  history: any
  allergies: string[]
  medications: Array<{
    name: string
    dosage: string
    frequency: string
    startDate: Date
    endDate?: Date
  }>
  conditions: Array<{
    name: string
    diagnosisDate: Date
    status: 'active' | 'resolved'
    notes?: string
  }>
  procedures: Array<{
    name: string
    date: Date
    provider: string
    notes?: string
  }>
  vitals: Array<{
    type: string
    value: number
    unit: string
    date: Date
  }>
  notes: Array<{
    content: string
    author: string
    date: Date
  }>
  attachments: Array<{
    name: string
    type: string
    url: string
    uploadDate: Date
  }>
  createdAt: Date
  updatedAt: Date
}

export async function getMedicalRecord(patientId: string) {
  const client = await clientPromise
  const collection = client.db().collection<MedicalRecord>('medical_records')
  return collection.findOne({ patientId })
}

export async function createMedicalRecord(data: Omit<MedicalRecord, '_id' | 'createdAt' | 'updatedAt'>) {
  const client = await clientPromise
  const collection = client.db().collection<MedicalRecord>('medical_records')
  const now = new Date()
  
  const result = await collection.insertOne({
    ...data,
    createdAt: now,
    updatedAt: now,
  } as MedicalRecord)
  
  return result
}

export async function updateMedicalRecord(patientId: string, data: Partial<MedicalRecord>) {
  const client = await clientPromise
  const collection = client.db().collection<MedicalRecord>('medical_records')
  
  const result = await collection.updateOne(
    { patientId },
    { 
      $set: {
        ...data,
        updatedAt: new Date()
      }
    }
  )
  
  return result
}

export async function deleteMedicalRecord(patientId: string) {
  const client = await clientPromise
  const collection = client.db().collection<MedicalRecord>('medical_records')
  return collection.deleteOne({ patientId })
}

// Export the clientPromise for use in other files
export default clientPromise

