import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import { CheckCircle, XCircle } from 'lucide-react'

function EventApprovals() {
  const pendingEvents = []

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Event Approvals</h1>
      
      {pendingEvents.length === 0 ? (
        <Card>
          <p className="text-gray-600 text-center py-8">No pending approvals</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingEvents.map((event) => (
            <Card key={event.id}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">{event.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button variant="danger" className="flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default EventApprovals
