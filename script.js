const form = document.getElementById('formAtendimento');
const statusBox = document.getElementById('status');
const selectHorarios = document.getElementById('horarios');
const inputData = document.getElementById('data');

const BASE_URL = 'https://n8n.srv1352561.hstgr.cloud/webhook';

// Bloquear datas passadas
const hoje = new Date().toISOString().split('T')[0];
inputData.min = hoje;

// ============================
// CARREGAR HORÁRIOS
// ============================
async function carregarHorarios() {
  try {
    const dataSelecionada = inputData.value;

    if (!dataSelecionada) {
      selectHorarios.innerHTML = `<option>Selecione uma data</option>`;
      return;
    }

    selectHorarios.innerHTML = `<option>Carregando...</option>`;

    const response = await fetch(`${BASE_URL}/disponibilidade?data=${dataSelecionada}`);

    if (!response.ok) {
      throw new Error("Erro na API");
    }

    const data = await response.json();

    selectHorarios.innerHTML = `<option value="">Selecione um horário</option>`;

    if (!data.slots || data.slots.length === 0) {
      selectHorarios.innerHTML = `<option>Sem horários disponíveis</option>`;
      return;
    }

    data.slots.forEach(slot => {
      const option = document.createElement('option');
      option.value = slot.inicio;
      option.textContent = slot.hora;
      selectHorarios.appendChild(option);
    });

  } catch (error) {
    console.error(error);
    selectHorarios.innerHTML = `<option>Erro ao carregar horários</option>`;
  }
}

// ============================
// VALIDA DATA + CARREGA
// ============================
inputData.addEventListener('change', () => {
  if (!inputData.value) return;

  const [ano, mes, dia] = inputData.value.split('-');
  const data = new Date(ano, mes - 1, dia);

  const diaSemana = data.getDay();

  if (diaSemana === 0 || diaSemana === 6) {
    alert("Selecione apenas dias úteis (segunda a sexta).");
    inputData.value = "";
    selectHorarios.innerHTML = `<option>Selecione uma data válida</option>`;
    return;
  }

  carregarHorarios();
});

// ============================
// SUBMIT
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

    if (!response.ok) {
      throw new Error("Erro ao agendar");
    }

    form.classList.add('hidden');
    statusBox.classList.remove('hidden');

  } catch (error) {
    console.error(error);
    alert("Erro de conexão com o servidor.");
  }
});
