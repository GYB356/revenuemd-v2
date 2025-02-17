'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "react-hot-toast"

const claimFormSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  serviceDate: z.string(),
  procedureCodes: z.string().min(1, "At least one procedure code is required"),
  diagnosisCodes: z.string().min(1, "At least one diagnosis code is required"),
  claimAmount: z.string().min(1, "Claim amount is required"),
  notes: z.string().optional(),
})

export function ClaimForm() {
  const form = useForm<z.infer<typeof claimFormSchema>>({
    resolver: zodResolver(claimFormSchema),
    defaultValues: {
      patientId: "",
      serviceDate: "",
      procedureCodes: "",
      diagnosisCodes: "",
      claimAmount: "",
      notes: "",
    },
  })

  async function onSubmit(values: z.infer<typeof claimFormSchema>) {
    try {
      const response = await fetch('/api/claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create claim')
      }
      
      toast.success('Claim submitted successfully')
      form.reset()
    } catch (error) {
      console.error('Error creating claim:', error)
      toast.error('Failed to submit claim. Please try again.')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="patientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Patient ID</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="serviceDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="procedureCodes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Procedure Codes</FormLabel>
              <FormControl>
                <Input placeholder="Enter procedure codes" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="claimAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Claim Amount</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit Claim</Button>
      </form>
    </Form>
  )
} 