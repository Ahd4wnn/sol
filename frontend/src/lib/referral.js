// Store referral info from URL or manually entered code
export const REFERRAL_KEY = 'sol_referral'

export function captureRefFromURL() {
  const params = new URLSearchParams(window.location.search)
  const ref = params.get('ref')
  if (ref) {
    sessionStorage.setItem(REFERRAL_KEY, JSON.stringify({
      source: 'link',
      value: ref,
    }))
  }
}

export function setPromoCode(code) {
  sessionStorage.setItem(REFERRAL_KEY, JSON.stringify({
    source: 'code',
    value: code.toUpperCase(),
  }))
}

export function getReferral() {
  try {
    const stored = sessionStorage.getItem(REFERRAL_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export function clearReferral() {
  sessionStorage.removeItem(REFERRAL_KEY)
}
