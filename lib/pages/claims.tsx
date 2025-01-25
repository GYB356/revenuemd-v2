import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { getAllClaims, supabase } from '../lib/supabase'
import ProtectedRoute from '../components/ProtectedRoute'
import RoleBasedAccess from '../components/RoleBasedAccess'
import ClaimForm from '../components/ClaimForm'

const Claims: React.FC = () => {
  // ... (existing code)

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Claims</h1>
          <RoleBasedAccess allowedRoles={['admin', 'billing_staff']}>
            <button
              onClick={() => router.push('/submit-claim')}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Submit New Claim
            </button>
          </RoleBasedAccess>
        </div>
        {/* ... (rest of the component) */}
      </div>
    </ProtectedRoute>
  )
}

export default Claims
