'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { motion, AnimatePresence } from 'framer-motion'

interface Patient {
  id: string
  name: string
  age: number
  gender: string
  email: string
  phone: string
  status: 'Active' | 'Inactive' | 'Pending'
  lastVisit: string
  diagnosis: string
  insurance: string
}

const mockPatients: Patient[] = [
  {
    id: 'P001',
    name: 'John Smith',
    age: 45,
    gender: 'Male',
    email: 'john.smith@example.com',
    phone: '(555) 123-4567',
    status: 'Active',
    lastVisit: '2024-02-15',
    diagnosis: 'Hypertension',
    insurance: 'Blue Cross',
  },
  {
    id: 'P002',
    name: 'Sarah Johnson',
    age: 32,
    gender: 'Female',
    email: 'sarah.j@example.com',
    phone: '(555) 234-5678',
    status: 'Active',
    lastVisit: '2024-02-10',
    diagnosis: 'Diabetes Type 2',
    insurance: 'Aetna',
  },
  {
    id: 'P003',
    name: 'Michael Brown',
    age: 58,
    gender: 'Male',
    email: 'm.brown@example.com',
    phone: '(555) 345-6789',
    status: 'Inactive',
    lastVisit: '2024-01-20',
    diagnosis: 'Arthritis',
    insurance: 'Medicare',
  },
]

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  const filteredPatients = mockPatients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || patient.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Patients</h2>
          <p className="text-muted-foreground">
            Manage and view patient information
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Icons.plus className="mr-2 h-4 w-4" />
              Add Patient
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Patient</DialogTitle>
              <DialogDescription>
                Enter the patient's information below
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="name">Full Name</label>
                <Input id="name" placeholder="John Doe" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="age">Age</label>
                  <Input id="age" type="number" />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="gender">Gender</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <label htmlFor="email">Email</label>
                <Input id="email" type="email" placeholder="john@example.com" />
              </div>
              <div className="grid gap-2">
                <label htmlFor="phone">Phone</label>
                <Input id="phone" placeholder="(555) 123-4567" />
              </div>
              <div className="grid gap-2">
                <label htmlFor="insurance">Insurance Provider</label>
                <Input id="insurance" placeholder="Insurance provider" />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline">Cancel</Button>
              <Button>Save Patient</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:space-x-4">
        <div className="relative flex-1">
          <Icons.search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline">
          <Icons.filter className="mr-2 h-4 w-4" />
          More Filters
        </Button>
      </div>

      {/* Patients Table */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Age</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Last Visit</th>
                <th className="px-4 py-3 font-medium">Diagnosis</th>
                <th className="px-4 py-3 font-medium">Insurance</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredPatients.map((patient) => (
                  <motion.tr
                    key={patient.id}
                    className="border-b"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td className="px-4 py-3">{patient.id}</td>
                    <td className="px-4 py-3 font-medium">{patient.name}</td>
                    <td className="px-4 py-3">{patient.age}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          patient.status === 'Active'
                            ? 'bg-success/10 text-success'
                            : patient.status === 'Pending'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {patient.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{patient.lastVisit}</td>
                    <td className="px-4 py-3">{patient.diagnosis}</td>
                    <td className="px-4 py-3">{patient.insurance}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedPatient(patient)}
                        >
                          <Icons.edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Icons.trash className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Details Dialog */}
      <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Patient Details</DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <p className="mt-1">{selectedPatient.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">ID</label>
                  <p className="mt-1">{selectedPatient.id}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Age</label>
                  <p className="mt-1">{selectedPatient.age}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Gender</label>
                  <p className="mt-1">{selectedPatient.gender}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <p className="mt-1">{selectedPatient.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <p className="mt-1">{selectedPatient.phone}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Insurance</label>
                <p className="mt-1">{selectedPatient.insurance}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Diagnosis</label>
                <p className="mt-1">{selectedPatient.diagnosis}</p>
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setSelectedPatient(null)}>
              Close
            </Button>
            <Button onClick={() => {/* Handle edit */}}>
              Edit Patient
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}