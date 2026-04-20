document.addEventListener('DOMContentLoaded', () => {

  const form = document.getElementById('formAtendimento');
  const statusBox = document.getElementById('status');
  const selectHorarios = document.getElementById('horarios');
  const inputData = document.getElementById('data');

  const BASE_URL = 'https://n8n.srv1352561.hstgr.cloud/webhook';

 const feriados = [
    '2026-01-01',
    '2026-04-21',
    '2026-04-23',
    '2026-04-24',
    '2026-05-01',
    '2026-06-04',
    '2026-06-05',
    '2026-09-07',
    '2026-10-12',
    '2026-11-02',
    '2026-11-13',
    '2026-11-20',
    '2026-12-25'
  ];

  const diasBloqueados = [0, 3, 6]; // Dom, Qua, Sáb

  // ============================
  // UTIL
  // ============================
  function formatarDataISO(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  function isDiaUtil(data) {
    const diaSemana = data.getDay();
    const dataISO = formatarDataISO(data);

    return !diasBloqueados.includes(diaSemana) && !feriados.includes(dataISO);
  }

  function getProximoDiaUtil(dataBase = new Date()) {
    const data = new Date(dataBase);

    do {
      data.setDate(data.getDate() + 1);
    } while (!isDiaUtil(data));

    return data;
  }

  function adicionarDiasUteis(dataBase, quantidade) {
    let data = new Date(dataBase);
    let contador = 0;

    while (contador < quantidade) {
      data.setDate(data.getDate() + 1);
      if (isDiaUtil(data)) contador++;
    }

    return data;
  }

  // ============================
  // CONFIGURA CALENDÁRIO
  // ============================
  function configurarCalendario() {
    const hoje = new Date();

    const minDate = getProximoDiaUtil(hoje);
    const maxDate = adicionarDiasUteis(hoje, 5);

    inputData.min = formatarDataISO(minDate);
    inputData.max = formatarDataISO(maxDate);

    inputData.value = formatarDataISO(minDate);

    console.log("📅 Intervalo permitido:", {
      min: inputData.min,
      max: inputData.max
    });
  }

  // ============================
  // VALIDAÇÃO AO ALTERAR DATA
  // ============================
  inputData.addEventListener('change', () => {
    const dataSelecionada = new Date(inputData.value + 'T00:00:00');

    if (!isDiaUtil(dataSelecionada)) {
      alert("Não há atendimento nesse dia. Selecione um dia útil disponível.");

      const novaData = getProximoDiaUtil(dataSelecionada);
      inputData.value = formatarDataISO(novaData);
    }

    carregarHorarios();
  });

  // ============================
  // CARREGAR HORÁRIOS
  // ============================
  async function carregarHorarios() {
    try {
      const dataSelecionada = inputData.value;

      if (!dataSelecionada) return;

      selectHorarios.innerHTML = `<option>Carregando...</option>`;

      const response = await fetch(`${BASE_URL}/disponibilidade?data=${dataSelecionada}`);

      if (!response.ok) throw new Error();

      const data = await response.json();
      const slots = data.slots || data;

      selectHorarios.innerHTML = `<option value="">Selecione o horário</option>`;

      if (!slots || slots.length === 0) {
        selectHorarios.innerHTML = `<option>Sem horários disponíveis</option>`;
        return;
      }

      slots.forEach(slot => {
        const option = document.createElement('option');
        option.value = slot.inicio;
        option.textContent = slot.hora;
        selectHorarios.appendChild(option);
      });

    } catch (error) {
      console.error("Erro horários:", error);
      selectHorarios.innerHTML = `<option>Erro ao carregar</option>`;
    }
  }

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

      if (!response.ok) throw new Error();

      form.style.display = 'none';
      statusBox.style.display = 'block';

    } catch (error) {
      alert("Erro ao agendar");
    }
  });

  // ============================
  // INIT
  // ============================
  configurarCalendario();
  carregarHorarios();

});
