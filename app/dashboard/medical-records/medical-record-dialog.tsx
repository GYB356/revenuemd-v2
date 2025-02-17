'use client'

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Plus, X, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

const medicalRecordSchema = z.object({
  history: z.any(),
  allergies: z.array(z.string()),
  medications: z.array(z.object({
    name: z.string().min(1, "Name is required"),
    dosage: z.string().min(1, "Dosage is required"),
    frequency: z.string().min(1, "Frequency is required"),
    startDate: z.string(),
    endDate: z.string().optional(),
  })),
  conditions: z.array(z.object({
    name: z.string().min(1, "Name is required"),
    diagnosisDate: z.string(),
    status: z.enum(["active", "resolved"]),
    notes: z.string().optional(),
  })),
  vitals: z.array(z.object({
    type: z.string().min(1, "Type is required"),
    value: z.number(),
    unit: z.string().min(1, "Unit is required"),
    date: z.string(),
  })),
  notes: z.array(z.object({
    content: z.string().min(1, "Content is required"),
    author: z.string().min(1, "Author is required"),
    date: z.string(),
  })),
})

type MedicalRecordFormData = z.infer<typeof medicalRecordSchema>

interface MedicalRecordDialogProps {
  isOpen: boolean
  patientId: string | null
  onClose: (success?: boolean) => void
}

export function MedicalRecordDialog({
  isOpen,
  patientId,
  onClose,
}: MedicalRecordDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const form = useForm<MedicalRecordFormData>({
    resolver: zodResolver(medicalRecordSchema),
    defaultValues: {
      history: {},
      allergies: [],
      medications: [],
      conditions: [],
      vitals: [],
      notes: [],
    },
  })

  useEffect(() => {
    if (isOpen && patientId) {
      loadMedicalRecord(patientId)
    }
  }, [isOpen, patientId])

  const loadMedicalRecord = async (id: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/medical-records/${id}`)
      if (!response.ok) throw new Error("Failed to load medical record")
      const data = await response.json()
      form.reset(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load medical record",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: MedicalRecordFormData) => {
    try {
      setIsLoading(true)
      const url = patientId
        ? `/api/medical-records/${patientId}`
        : "/api/medical-records"
      const method = patientId ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("Failed to save medical record")

      onClose(true)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save medical record",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {patientId ? "Edit Medical Record" : "New Medical Record"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="medications" className="w-full">
              <TabsList>
                <TabsTrigger value="medications">Medications</TabsTrigger>
                <TabsTrigger value="conditions">Conditions</TabsTrigger>
                <TabsTrigger value="vitals">Vitals</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="allergies">Allergies</TabsTrigger>
              </TabsList>

              <TabsContent value="medications" className="space-y-4">
                <FormField
                  control={form.control}
                  name="medications"
                  render={({ field }) => (
                    <FormItem>
                      <div className="space-y-4">
                        {field.value.map((medication, index) => (
                          <div key={index} className="flex gap-2 items-start">
                            <Input
                              placeholder="Name"
                              value={medication.name}
                              onChange={(e) => {
                                const newMedications = [...field.value]
                                newMedications[index].name = e.target.value
                                field.onChange(newMedications)
                              }}
                            />
                            <Input
                              placeholder="Dosage"
                              value={medication.dosage}
                              onChange={(e) => {
                                const newMedications = [...field.value]
                                newMedications[index].dosage = e.target.value
                                field.onChange(newMedications)
                              }}
                            />
                            <Input
                              placeholder="Frequency"
                              value={medication.frequency}
                              onChange={(e) => {
                                const newMedications = [...field.value]
                                newMedications[index].frequency = e.target.value
                                field.onChange(newMedications)
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              type="button"
                              onClick={() => {
                                const newMedications = field.value.filter((_, i) => i !== index)
                                field.onChange(newMedications)
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            field.onChange([
                              ...field.value,
                              {
                                name: "",
                                dosage: "",
                                frequency: "",
                                startDate: new Date().toISOString(),
                              },
                            ])
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Medication
                        </Button>
                      </div>
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="conditions" className="space-y-4">
                <FormField
                  control={form.control}
                  name="conditions"
                  render={({ field }) => (
                    <FormItem>
                      <div className="space-y-4">
                        {field.value.map((condition, index) => (
                          <div key={index} className="flex gap-2 items-start">
                            <Input
                              placeholder="Condition Name"
                              value={condition.name}
                              onChange={(e) => {
                                const newConditions = [...field.value]
                                newConditions[index].name = e.target.value
                                field.onChange(newConditions)
                              }}
                            />
                            <Input
                              type="date"
                              value={condition.diagnosisDate.split('T')[0]}
                              onChange={(e) => {
                                const newConditions = [...field.value]
                                newConditions[index].diagnosisDate = e.target.value
                                field.onChange(newConditions)
                              }}
                            />
                            <select
                              value={condition.status}
                              onChange={(e) => {
                                const newConditions = [...field.value]
                                newConditions[index].status = e.target.value as "active" | "resolved"
                                field.onChange(newConditions)
                              }}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            >
                              <option value="active">Active</option>
                              <option value="resolved">Resolved</option>
                            </select>
                            <Textarea
                              placeholder="Notes"
                              value={condition.notes || ""}
                              onChange={(e) => {
                                const newConditions = [...field.value]
                                newConditions[index].notes = e.target.value
                                field.onChange(newConditions)
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              type="button"
                              onClick={() => {
                                const newConditions = field.value.filter((_, i) => i !== index)
                                field.onChange(newConditions)
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            field.onChange([
                              ...field.value,
                              {
                                name: "",
                                diagnosisDate: new Date().toISOString().split('T')[0],
                                status: "active",
                                notes: "",
                              },
                            ])
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Condition
                        </Button>
                      </div>
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="vitals" className="space-y-4">
                <FormField
                  control={form.control}
                  name="vitals"
                  render={({ field }) => (
                    <FormItem>
                      <div className="space-y-4">
                        {field.value.map((vital, index) => (
                          <div key={index} className="flex gap-2 items-start">
                            <Input
                              placeholder="Type (e.g., Blood Pressure)"
                              value={vital.type}
                              onChange={(e) => {
                                const newVitals = [...field.value]
                                newVitals[index].type = e.target.value
                                field.onChange(newVitals)
                              }}
                            />
                            <Input
                              type="number"
                              placeholder="Value"
                              value={vital.value}
                              onChange={(e) => {
                                const newVitals = [...field.value]
                                newVitals[index].value = parseFloat(e.target.value)
                                field.onChange(newVitals)
                              }}
                            />
                            <Input
                              placeholder="Unit"
                              value={vital.unit}
                              onChange={(e) => {
                                const newVitals = [...field.value]
                                newVitals[index].unit = e.target.value
                                field.onChange(newVitals)
                              }}
                            />
                            <Input
                              type="date"
                              value={vital.date.split('T')[0]}
                              onChange={(e) => {
                                const newVitals = [...field.value]
                                newVitals[index].date = e.target.value
                                field.onChange(newVitals)
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              type="button"
                              onClick={() => {
                                const newVitals = field.value.filter((_, i) => i !== index)
                                field.onChange(newVitals)
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            field.onChange([
                              ...field.value,
                              {
                                type: "",
                                value: 0,
                                unit: "",
                                date: new Date().toISOString().split('T')[0],
                              },
                            ])
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Vital
                        </Button>
                      </div>
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="notes" className="space-y-4">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <div className="space-y-4">
                        {field.value.map((note, index) => (
                          <div key={index} className="flex gap-2 items-start">
                            <Textarea
                              placeholder="Note content"
                              value={note.content}
                              onChange={(e) => {
                                const newNotes = [...field.value]
                                newNotes[index].content = e.target.value
                                field.onChange(newNotes)
                              }}
                              className="flex-1"
                            />
                            <Input
                              placeholder="Author"
                              value={note.author}
                              onChange={(e) => {
                                const newNotes = [...field.value]
                                newNotes[index].author = e.target.value
                                field.onChange(newNotes)
                              }}
                            />
                            <Input
                              type="date"
                              value={note.date.split('T')[0]}
                              onChange={(e) => {
                                const newNotes = [...field.value]
                                newNotes[index].date = e.target.value
                                field.onChange(newNotes)
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              type="button"
                              onClick={() => {
                                const newNotes = field.value.filter((_, i) => i !== index)
                                field.onChange(newNotes)
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            field.onChange([
                              ...field.value,
                              {
                                content: "",
                                author: "",
                                date: new Date().toISOString().split('T')[0],
                              },
                            ])
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Note
                        </Button>
                      </div>
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="allergies" className="space-y-4">
                <FormField
                  control={form.control}
                  name="allergies"
                  render={({ field }) => (
                    <FormItem>
                      <div className="space-y-4">
                        {field.value.map((allergy, index) => (
                          <div key={index} className="flex gap-2 items-start">
                            <Input
                              placeholder="Allergy"
                              value={allergy}
                              onChange={(e) => {
                                const newAllergies = [...field.value]
                                newAllergies[index] = e.target.value
                                field.onChange(newAllergies)
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              type="button"
                              onClick={() => {
                                const newAllergies = field.value.filter((_, i) => i !== index)
                                field.onChange(newAllergies)
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            field.onChange([...field.value, ""])
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Allergy
                        </Button>
                      </div>
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onClose()}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 