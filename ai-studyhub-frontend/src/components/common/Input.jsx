export default function Input({ label, ...props }) {
  return (
    <label className="input-group">
      {label && <span>{label}</span>}
      <input {...props} />
    </label>
  )
}
