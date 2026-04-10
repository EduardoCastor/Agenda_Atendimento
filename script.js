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

    const dataSelecionada = inputData.value;
    const response = await fetch(`${BASE_URL}/disponibilidade?data=${dataSelecionada}`);
    

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
inputData.addEventListener('change', carregarHorarios);

// Bloquear datas anteriores a hoje
const hoje = new Date().toISOString().split('T')[0];
inputData.min = hoje;

inputData.addEventListener('change', () => {
  const data = new Date(inputData.value);
  const diaSemana = data.getDay();

  // 0 = domingo | 6 = sábado
  if (diaSemana === 0 || diaSemana === 6) {
    alert("Selecione apenas dias úteis (segunda a sexta).");
    inputData.value = "";
    selectHorarios.innerHTML = `<option>Selecione uma data válida</option>`;
    return;
  }

  carregarHorarios();
});


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
