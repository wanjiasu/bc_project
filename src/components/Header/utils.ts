export const getInitials = (name?: string | null, email?: string | null) => {
  if (name && name.trim().length > 0) {
    return name.trim().slice(0, 1).toUpperCase()
  }
  if (email && email.trim().length > 0) {
    return email.trim().slice(0, 1).toUpperCase()
  }
  return "U"
}
