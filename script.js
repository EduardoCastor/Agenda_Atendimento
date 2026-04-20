document.addEventListener('DOMContentLoaded', () => {

  const form = document.getElementById('formAtendimento');
  const statusBox = document.getElementById('status');
  const selectHorarios = document.getElementById('horarios');
  const inputData = document.getElementById('data');

  // ============================
  // CONFIG
  // ============================
  const BASE_URL = 'https://n8n.srv1352561.hstgr.cloud/webhook';
  // const BASE_URL = 'https://n8n.srv1352561.hstgr.cloud/webhook-test';

  const feriados = [
    '2026-01-01',
    '2026-04-21',
    '2026-09-07',
    '2026-12-25'
  ];

  const diasBloqueados = [0, 3, 6]; // Domingo, Quarta, Sábado

  // ============================
  // FUNÇÕES DE DATA
  // ============================
  function getProximoDiaUtil(feriados = [], diasBloqueados = []) {
    const hoje = new Date();

    const normalizar = (data) => {
      const d = new Date(data);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    };

    const feriadosSet = new Set(feriados.map(f => normalizar(f)));

    while (true) {
      hoje.setDate(hoje.getDate() + 1);

      const diaSemana = hoje.getDay();
      const ehDiaBloqueado = diasBloqueados.includes(diaSemana);
      const ehFeriado = feriadosSet.has(normalizar(hoje));

      if (ehDiaBloqueado || ehFeriado) continue;

      break;
    }

    return hoje;
  }

  function formatarDataISO(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  // ============================
  // INICIALIZA DATA
  // ============================
  function inicializarData() {
    const proximoDiaUtil = getProximoDiaUtil(feriados, diasBloqueados);
    const dataFormatada = formatarDataISO(proximoDiaUtil);

    inputData.value = dataFormatada;

    console.log('📅 Data definida:', dataFormatada);
  }

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
        throw new Error(`Erro HTTP: ${response.status}`);
      }

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
      console.error("❌ Erro ao carregar horários:", error);
      selectHorarios.innerHTML = `<option>Erro ao carregar horários</option>`;
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

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      // Sucesso
      form.style.display = 'none';
      statusBox.style.display = 'block';
      statusBox.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
      console.error("❌ Erro no agendamento:", error);
      alert("Erro de conexão com o servidor.");
    }
  });

  // ============================
  // EXECUÇÃO INICIAL
  // ============================
  inicializarData();
  carregarHorarios();

});
