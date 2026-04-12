export async function getDeviceId({ API_URL }) {
    const makeId = () =>
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

    let id

    try {
        id = localStorage.getItem('deviceId') || makeId()
        localStorage.setItem('deviceId', id)
    } catch {
        id = makeId()
    }

    const res = await fetch(`${API_URL}/api/cookies/create-cookie-by-local-storage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ deviceId: id }),
    })

    if (!res.ok) {
        throw new Error(`Cookie endpoint failed: ${res.status}`)
    }

    return id
}

export function parseJsonResponse(text) {
    try {
        return JSON.parse(text)
    } catch {
        return null
    }
}
