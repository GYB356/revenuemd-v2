import { createClient } from "@/lib/supabase-client"

const supabase = createClient()

import React, { useEffect, useState } from "react"

const PatientOutcomes = () => {
  const [outcomes, setOutcomes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchOutcomeData() {
      try {
        const { data, error } = await supabase.from("patient_outcomes").select("*").order("date", { ascending: true })
        if (error) {
          setError(error)
        } else {
          setOutcomes(data)
        }
      } catch (error) {
        setError(error)
      } finally {
        setLoading(false)
      }
    }
    fetchOutcomeData()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error.message}</div>
  }

  return (
    <div>
      <h1>Patient Outcomes</h1>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Outcome</th>
          </tr>
        </thead>
        <tbody>
          {outcomes.map((outcome) => (
            <tr key={outcome.id}>
              <td>{outcome.date}</td>
              <td>{outcome.outcome}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default PatientOutcomes

