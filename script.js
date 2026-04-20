const form = document.getElementById('formAtendimento');
const statusBox = document.getElementById('status');
const selectHorarios = document.getElementById('horarios');
const inputData = document.getElementById('data');

// 🔁 URL DE PRODUÇÃO
const BASE_URL = 'https://n8n.srv1352561.hstgr.cloud/webhook';

// 🔁 URL DE TESTE
//const BASE_URL = 'https://n8n.srv1352561.hstgr.cloud/webhook-test';

// ============================
// DATA - PRÓXIMO DIA ÚTIL
// ============================
//function getProximoDiaUtil() {
//  const hoje = new Date();
//
//  do {
//    hoje.setDate(hoje.getDate() + 1);
//  } while (hoje.getDay() === 0 || hoje.getDay() === 6);
//
//  return hoje;
//}

function getProximoDiaUtil(feriados = [], diasBloqueados = [0, 3, 6]) {
  const hoje = new Date();

const feriados = [
  '2026-01-01', // Ano Novo
  '2026-04-21', // Tiradentes
  '2026-09-07', // Independência
  '2026-12-25'  // Natal
  ];

const proximoDia = getProximoDiaUtil(feriados);
console.log(proximoDia);  
  
  const normalizar = (data) => {
    const d = new Date(data);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };

  const feriadosSet = new Set(feriados.map(f => normalizar(f)));

  while (true) {
    hoje.setDate(hoje.getDate() + 1);

    const diaSemana = hoje.getDay(); // 0=Dom, 1=Seg, 2=Ter, 3=Qua...

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

// Define automaticamente no campo
const proximoDiaUtil = getProximoDiaUtil();
inputData.value = formatarDataISO(proximoDiaUtil);

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
    //const response = await fetch(`https://n8n.srv1352561.hstgr.cloud/webhook-test/disponibilidade?data=2026-04-15`);
    
    if (!response.ok) {
      throw new Error("Erro na API");
    }

    const data = await response.json();

    // 🔄 Compatível com { slots: [] } OU []
    const slots = data.slots || data;

    selectHorarios.innerHTML = `<option value="">Selecione um horário</option>`;

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
    console.error("Erro ao carregar horários:", error);
    //selectHorarios.innerHTML = `<option>16:00</option>`;
    selectHorarios.innerHTML = `<option>Não foi possível carregar horários</option>`;
  }
}

// 🔥 CARREGA AUTOMATICAMENTE AO INICIAR
carregarHorarios();

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

    //form.classList.add('hidden');
    //statusBox.classList.remove('hidden');
    form.style.display = 'none';
    statusBox.style.display = 'block';
    statusBox.scrollIntoView({ behavior: 'smooth' });

  } catch (error) {
    console.error("Erro no agendamento:", error);
    alert("Erro de conexão com o servidor.");
  }
});
