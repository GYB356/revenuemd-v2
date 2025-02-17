import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'

const invoices = [
  {
    id: 'INV001',
    patient: 'John Smith',
    amount: 450.00,
    status: 'Paid',
    date: '2024-02-15',
    dueDate: '2024-03-15',
  },
  {
    id: 'INV002',
    patient: 'Sarah Johnson',
    amount: 850.00,
    status: 'Pending',
    date: '2024-02-10',
    dueDate: '2024-03-10',
  },
  {
    id: 'INV003',
    patient: 'Michael Brown',
    amount: 1250.00,
    status: 'Overdue',
    date: '2024-01-20',
    dueDate: '2024-02-20',
  },
]

export default function BillingPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Billing</h2>
          <p className="text-muted-foreground">
            Manage invoices and payments
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline">
            <Icons.download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
            <Icons.plus className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 text-card-foreground">
          <div className="flex items-center space-x-2">
            <Icons.revenue className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-sm font-medium">Total Outstanding</h3>
          </div>
          <p className="mt-2 text-2xl font-bold">$2,550.00</p>
          <p className="text-xs text-muted-foreground">From 3 invoices</p>
        </div>
        <div className="rounded-lg border bg-card p-6 text-card-foreground">
          <div className="flex items-center space-x-2">
            <Icons.check className="h-5 w-5 text-success" />
            <h3 className="text-sm font-medium">Paid This Month</h3>
          </div>
          <p className="mt-2 text-2xl font-bold">$4,250.00</p>
          <p className="text-xs text-muted-foreground">From 8 invoices</p>
        </div>
        <div className="rounded-lg border bg-card p-6 text-card-foreground">
          <div className="flex items-center space-x-2">
            <Icons.alertTriangle className="h-5 w-5 text-destructive" />
            <h3 className="text-sm font-medium">Overdue</h3>
          </div>
          <p className="mt-2 text-2xl font-bold">$1,250.00</p>
          <p className="text-xs text-muted-foreground">From 1 invoice</p>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-4 py-3 font-medium">Invoice ID</th>
                <th className="px-4 py-3 font-medium">Patient</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Due Date</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b">
                  <td className="px-4 py-3">{invoice.id}</td>
                  <td className="px-4 py-3 font-medium">{invoice.patient}</td>
                  <td className="px-4 py-3">${invoice.amount.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        invoice.status === 'Paid'
                          ? 'bg-success/10 text-success'
                          : invoice.status === 'Pending'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{invoice.date}</td>
                  <td className="px-4 py-3">{invoice.dueDate}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="icon">
                        <Icons.edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Icons.download className="h-4 w-4" />
                        <span className="sr-only">Download</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 