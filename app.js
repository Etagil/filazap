async function carregarFila() {
  const tbody = document.getElementById('fila-body')

  try {
    const atendimentos = await apiGet('/atendimentos')

    if (!atendimentos.length) {
      tbody.innerHTML = '<tr><td colspan="4">Nenhum atendimento</td></tr>'
      return
    }

    tbody.innerHTML = ''

    atendimentos.forEach(a => {
      const tr = document.createElement('tr')

      tr.style.cursor = 'pointer'
      tr.onclick = () => abrirAtendimento(a)

  tr.innerHTML = `
  <td>${a.nome}</td>
  <td>${a.telefone}</td>
  <td>${a.status}</td>
  <td>${a.ultima_interacao}</td>
`
      tbody.appendChild(tr)
    })

  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="4">Erro ao carregar</td></tr>'
  }
}

carregarFila()

let atendimentoAtual = null

function abrirAtendimento(atendimento) {
  atendimentoAtual = atendimento

  document.getElementById('drawer-nome').innerText = atendimento.nome || atendimento.telefone
  document.getElementById('drawer-telefone').innerText = atendimento.telefone || ''
  document.getElementById('drawer-status').value = atendimento.status || 'novo'

  document.getElementById('drawer').classList.remove('hidden')

  // se você já tem notas, chama aqui
  if (typeof carregarNotas === 'function') carregarNotas()
}

function fecharDrawer() {
  document.getElementById('drawer').classList.add('hidden')
}

async function carregarNotas() {
  const ul = document.getElementById('drawer-notas')
  ul.innerHTML = 'Carregando...'

  try {
    const notas = await apiGet(
      `/atendimentos/${atendimentoAtual.id}/notas`
    )

    ul.innerHTML = ''

    if (!notas.length) {
      ul.innerHTML = '<li>Nenhuma nota</li>'
      return
    }

    notas.forEach(n => {
      const li = document.createElement('li')
      li.innerText = n.texto || n.conteudo || 'Sem texto'
      ul.appendChild(li)
    })

  } catch (err) {
    ul.innerHTML = '<li>Erro ao carregar notas</li>'
  }
}


async function salvarNota() {
  const texto = document.getElementById('nova-nota').value
  if (!texto) return
await fetch(`${API_URL}/atendimentos/${atendimentoAtual.id}/notas`, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ texto })
  })

  document.getElementById('nova-nota').value = ''
  carregarNotas()
}

async function alterarStatus() {
  const status = document.getElementById('drawer-status').value

  await fetch(`${API_URL}/atendimentos/${atendimentoAtual.id}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: 'Bearer ' + TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status })
  })

  carregarFila()
}

function abrirWhatsApp() {
  if (!atendimentoAtual?.telefone) return

  const numero = atendimentoAtual.telefone.replace(/\D/g, '')
  window.open(`https://wa.me/55${numero}`, '_blank')
}

const mensagensProntas = {
  saudacao: (a) =>
    `Olá${a?.nome ? ' ' + a.nome : ''}! 👋\n\nSou do atendimento e estou aqui para te ajudar 😊`,

  espera: () =>
    `⏳ Estou verificando sua solicitação.\nJá já te retorno, tudo bem?`,

  finalizacao: () =>
    `✅ Atendimento finalizado.\nQualquer coisa, é só chamar!`
}

async function copiarMensagem(tipo) {
  const gerar = mensagensProntas[tipo]
  if (!gerar) return

  const texto = gerar(atendimentoAtual)

  try {
    await navigator.clipboard.writeText(texto)
    alert('Mensagem copiada!')
  } catch (e) {
    // fallback (caso clipboard bloqueie)
    prompt('Copie a mensagem:', texto)
  }
}
function abrirWhatsAppDireto(telefone) {
  const numero = String(telefone || '').replace(/\D/g, '')
  window.open(`https://wa.me/55${numero}`, '_blank')
}
function setMsgNovo(tipo, texto) {
  const el = document.getElementById('novoAtendimentoMsg')
  if (!el) return
  el.className = 'msg ' + (tipo || '')
  el.innerText = texto || ''
}

function normalizarTelefone(tel) {
  return String(tel || '').replace(/\D/g, '')
}

async function criarAtendimento() {
  const nome = (document.getElementById('novoNome').value || '').trim()
  const telefoneRaw = (document.getElementById('novoTelefone').value || '').trim()
  const telefone = normalizarTelefone(telefoneRaw)

  if (!telefone || telefone.length < 10) {
    setMsgNovo('err', 'Informe um telefone válido (com DDD).')
    return
  }

  setMsgNovo('', 'Salvando...')

  try {
    // ✅ Seu backend já faz: cria contato + cria atendimento
    const res = await apiPost('/contatos', { nome, telefone })

    setMsgNovo('ok', 'Atendimento criado!')

    // limpa campos
    document.getElementById('novoNome').value = ''
    document.getElementById('novoTelefone').value = ''

    // atualiza lista
    await carregarAtendimentos()

    // opcional: abrir drawer se a API retornar o atendimento criado
    // Ajuste conforme seu backend (id pode vir como res.atendimento_id ou res.id)
    const novoId = res?.atendimento_id || res?.id
    if (novoId) abrirAtendimentoPorId(novoId)

  } catch (e) {
    setMsgNovo('err', e.message || 'Erro ao criar atendimento')
    console.error(e)
  }
}

function abrirAtendimentoPorId(id) {
  const a = atendimentosCache?.find(x => String(x.id) === String(id))
  if (a) abrirAtendimento(a)
}

// binding do botão
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btnCriarAtendimento')
  if (btn) btn.onclick = criarAtendimento
})