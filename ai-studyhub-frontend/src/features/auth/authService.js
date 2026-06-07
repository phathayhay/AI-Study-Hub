export function login(credentials) {
  return Promise.resolve({ user: { email: credentials.email } })
}

export function register(data) {
  return Promise.resolve({ user: { email: data.email } })
}
