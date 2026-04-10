function LoadingSpinner({ label = 'Loading...' }) {
  return (
    <div className="flex items-center gap-3 text-gray-600" role="status" aria-live="polite">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-primary-600" />
      <span>{label}</span>
    </div>
  )
}

export default LoadingSpinner
