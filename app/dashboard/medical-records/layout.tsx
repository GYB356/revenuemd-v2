import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Medical Records | RevenueMD",
  description: "View and manage patient medical records",
}

interface MedicalRecordsLayoutProps {
  children: React.ReactNode
}

export default function MedicalRecordsLayout({
  children,
}: MedicalRecordsLayoutProps) {
  return (
    <div className="flex-1 space-y-4">
      <div className="flex-1 flex-col space-y-4">
        {children}
      </div>
    </div>
  )
} 