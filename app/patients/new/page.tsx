import { PatientForm } from "@/components/PatientForm"

export default function NewPatientPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Add New Patient</h1>
      <div className="max-w-2xl">
        <PatientForm />
      </div>
    </div>
  )
} 