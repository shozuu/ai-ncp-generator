// Password strength validation utility
export const validatePasswordStrength = password => {
  const criteria = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }

  const score = Object.values(criteria).filter(Boolean).length

  let strength = 'weak'
  let color = 'bg-red-500'
  let percentage = 20

  if (score >= 5) {
    strength = 'very strong'
    color = 'bg-emerald-500'
    percentage = 100
  } else if (score >= 4) {
    strength = 'strong'
    color = 'bg-green-500'
    percentage = 80
  } else if (score >= 3) {
    strength = 'medium'
    color = 'bg-yellow-500'
    percentage = 60
  } else if (score >= 2) {
    strength = 'fair'
    color = 'bg-orange-500'
    percentage = 40
  }

  return {
    criteria,
    score,
    strength,
    color,
    percentage,
    isValid: score >= 3, // Require at least medium strength
  }
}

export const getPasswordSuggestions = criteria => {
  const suggestions = []

  if (!criteria.length) suggestions.push('Use at least 8 characters')
  if (!criteria.lowercase) suggestions.push('Add lowercase letters (a-z)')
  if (!criteria.uppercase) suggestions.push('Add uppercase letters (A-Z)')
  if (!criteria.number) suggestions.push('Add numbers (0-9)')
  if (!criteria.special) suggestions.push('Add special characters (!@#$%^&*)')

  return suggestions
}
