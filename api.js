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
