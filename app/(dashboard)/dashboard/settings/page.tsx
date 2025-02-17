import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Account Settings */}
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold">Account Settings</h3>
          <p className="text-sm text-muted-foreground">
            Update your account information and preferences
          </p>
        </div>
        <div className="grid gap-6">
          <div className="flex items-center justify-between space-x-4">
            <div className="space-y-1">
              <label
                className="text-sm font-medium leading-none"
                htmlFor="name"
              >
                Full Name
              </label>
              <input
                id="name"
                type="text"
                defaultValue="John Doe"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="space-y-1">
              <label
                className="text-sm font-medium leading-none"
                htmlFor="email"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                defaultValue="john@example.com"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
          <Button className="w-fit">
            Save Changes
          </Button>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold">Notification Settings</h3>
          <p className="text-sm text-muted-foreground">
            Choose how you want to be notified
          </p>
        </div>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="emailNotifications"
              defaultChecked
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label
              htmlFor="emailNotifications"
              className="text-sm font-medium leading-none"
            >
              Email Notifications
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="smsNotifications"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label
              htmlFor="smsNotifications"
              className="text-sm font-medium leading-none"
            >
              SMS Notifications
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="browserNotifications"
              defaultChecked
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label
              htmlFor="browserNotifications"
              className="text-sm font-medium leading-none"
            >
              Browser Notifications
            </label>
          </div>
          <Button className="w-fit">
            Update Preferences
          </Button>
        </div>
      </div>

      {/* Security Settings */}
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold">Security Settings</h3>
          <p className="text-sm text-muted-foreground">
            Manage your security preferences
          </p>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">Two-Factor Authentication</h4>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <Button variant="outline">
              Enable 2FA
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">Change Password</h4>
              <p className="text-sm text-muted-foreground">
                Update your password regularly to keep your account secure
              </p>
            </div>
            <Button variant="outline">
              Change Password
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">Active Sessions</h4>
              <p className="text-sm text-muted-foreground">
                Manage your active sessions across devices
              </p>
            </div>
            <Button variant="outline">
              View Sessions
            </Button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-lg border border-destructive/50 p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-destructive">Danger Zone</h3>
            <p className="text-sm text-muted-foreground">
              Irreversible and destructive actions
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">Delete Account</h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button variant="destructive">
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 