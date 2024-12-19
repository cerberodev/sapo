import { Metadata } from 'next'
import { Card } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Sapo Admin',
  description: 'Admin dashboard for Sapo',
}

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-yellow-400 p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Total Messages</h3>
            <p className="text-3xl font-bold">503</p>
          </Card>
          
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Verified Users</h3>
            <p className="text-3xl font-bold">128</p>
          </Card>
          
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Messages Today</h3>
            <p className="text-3xl font-bold">42</p>
          </Card>
          
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Active Users</h3>
            <p className="text-3xl font-bold">89</p>
          </Card>
        </div>
      </div>
    </div>
  )
}

