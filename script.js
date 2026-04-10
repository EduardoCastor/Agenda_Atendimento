const form = document.getElementById('formAtendimento');
const statusBox = document.getElementById('status');
const selectHorarios = document.getElementById('horarios');
const inputData = document.getElementById('data');

// 🔹 URL BASE DO N8N
const BASE_URL = 'https://n8n.srv1352561.hstgr.cloud/webhook';

// ============================
// 🔹 CARREGAR HORÁRIOS
// ============================
async function carregarHorarios() {
  try {
    selectHorarios.innerHTML = `<option>Carregando...</option>`;

    const response = await fetch(`${BASE_URL}/disponibilidade`);
    const data = await response.json();

    selectHorarios.innerHTML = `<option value="">Selecione um horário</option>`;

    data.slots.forEach(slot => {
      const option = document.createElement('option');
      option.value = slot.inicio;
      option.textContent = slot.hora;
      selectHorarios.appendChild(option);
    });

  } catch (error) {
    console.error(error);
    selectHorarios.innerHTML = `<option>Erro ao carregar</option>`;
  }
}

// carregar ao abrir
carregarHorarios();

// ============================
// 🔹 SUBMIT FORMULÁRIO
// ============================
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const dados = Object.fromEntries(new FormData(form));

  const inicioSelecionado = selectHorarios.value;

  if (!inicioSelecionado) {
    alert("Selecione um horário");
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/agendar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...dados,
        inicio: inicioSelecionado
      })
    });

    if (response.ok) {
      form.classList.add('hidden');
      statusBox.classList.remove('hidden');
    } else {
      alert("Erro ao agendar.");
    }

  } catch (error) {
    console.error(error);
    alert("Erro de conexão com o servidor.");
  }
});
