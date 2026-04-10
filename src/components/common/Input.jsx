function Input({ label, id, className = '', ...props }) {
  return (
    <div className="space-y-2">
      {label ? (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      ) : null}
      <input id={id} className={`input-field ${className}`.trim()} {...props} />
    </div>
  )
}

export default Input
