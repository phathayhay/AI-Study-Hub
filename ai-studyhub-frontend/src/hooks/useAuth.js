import { useState } from 'react'

export default function useAuth() {
  const [user] = useState(null)

  return { user, login: () => {}, logout: () => {} }
}
