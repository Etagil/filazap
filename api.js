const API_URL = 'https://filazap.etagilrodrigues.workers.dev'
const TOKEN = 'Me147785'

async function apiGet(path) {
  const res = await fetch(API_URL + path, {
    headers: {
      Authorization: 'Bearer ' + TOKEN
    }
  })

  if (!res.ok) {
    throw new Error('Erro na API')
  }

  return res.json()
}
async function apiPost(path, data) {
  const res = await fetch(API_URL + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + TOKEN
    },
    body: JSON.stringify(data)
  })

  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`API ${res.status}: ${txt}`)
  }

  return res.json()
}