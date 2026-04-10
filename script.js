const form = document.getElementById('formAtendimento');
const statusBox = document.getElementById('status');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const dados = Object.fromEntries(new FormData(form));

  try {
    // Note que removemos o "-test" para usar a URL de produção ativa
    const response = await fetch('https://n8n.srv1352561.hstgr.cloud/webhook/balcao-virtual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });

    if (response.ok) {
      alert("Você irá receber o link para o atendimento no e-mail indicado.");
      form.classList.add('hidden'); // Certifique-se de ter .hidden { display: none; } no CSS
      statusBox.classList.remove('hidden');
    } else {
      alert("O servidor recebeu os dados, mas retornou um erro.");
    }
  } catch (error) {
    console.error("Erro na requisição:", error);
    alert("Não foi possível conectar ao servidor. Verifique se o Workflow está ATIVO no n8n.");
  }
});
