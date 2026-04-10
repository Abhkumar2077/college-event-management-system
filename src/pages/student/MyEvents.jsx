import Card from '../../components/common/Card'

function MyEvents() {
  const events = []

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">My Events</h1>
      
      {events.length === 0 ? (
        <Card>
          <p className="text-gray-600">No events registered yet</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((event) => (
            <Card key={event.id} title={event.name}>
              <p className="text-gray-600">{event.date}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyEvents
