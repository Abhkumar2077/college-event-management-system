function Sidebar() {
  return (
    <aside className="w-full border-r border-gray-200 bg-white p-4 md:w-64">
      <nav>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>Dashboard</li>
          <li>Events</li>
          <li>Attendance</li>
          <li>Profile</li>
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar
