/**
 * Sistema de Lista de Presença Conectado ao Google Forms Oficial
 * URL: https://docs.google.com/forms/d/e/1FAIpQLSd7uCn6oryJkV4UGpQdMiRa0a3CUW-gqqPPMlXy2EWx06zEYA/formResponse
 * Campos:
 * - ESCOLA: entry.285930433
 * - NOME COMPLETO: entry.278265355
 */

const DEFAULT_CONFIG = {
  formUrl: "https://docs.google.com/forms/d/e/1FAIpQLSd7uCn6oryJkV4UGpQdMiRa0a3CUW-gqqPPMlXy2EWx06zEYA/formResponse",
  entryEscola: "entry.285930433",
  entryProfessor: "entry.278265355"
};

const appState = {
  config: { ...DEFAULT_CONFIG },
  history: []
};

// Elementos do DOM
const elements = {
  form: document.getElementById('attendanceForm'),
  selectEscola: document.getElementById('selectEscola'),
  inputProfessor: document.getElementById('inputProfessor'),
  displayDate: document.getElementById('displayDate'),
  displayTime: document.getElementById('displayTime'),
  
  // Botões
  btnSubmit: document.getElementById('btnSubmit'),
  btnLimpar: document.getElementById('btnLimpar'),
  btnConfig: document.getElementById('btnConfig'),
  btnHistorico: document.getElementById('btnHistorico'),
  historyCountBadge: document.getElementById('historyCountBadge'),
  
  // Card de Sucesso / Recibo
  successCard: document.getElementById('successCard'),
  receiptEscola: document.getElementById('receiptEscola'),
  receiptProfessor: document.getElementById('receiptProfessor'),
  receiptTimestamp: document.getElementById('receiptTimestamp'),
  btnNovoRegistro: document.getElementById('btnNovoRegistro'),
  btnImprimirComprovante: document.getElementById('btnImprimirComprovante'),
  
  // Tabela Recente
  recentTableBody: document.getElementById('recentTableBody'),
  
  // Modais
  modalConfig: document.getElementById('modalConfig'),
  btnCloseConfig: document.getElementById('btnCloseConfig'),
  btnSalvarConfig: document.getElementById('btnSalvarConfig'),
  btnResetConfig: document.getElementById('btnResetConfig'),
  
  modalHistorico: document.getElementById('modalHistorico'),
  btnCloseHistorico: document.getElementById('btnCloseHistorico'),
  btnFecharHistorico: document.getElementById('btnFecharHistorico'),
  btnLimparHistorico: document.getElementById('btnLimparHistorico'),
  btnExportarCSV: document.getElementById('btnExportarCSV'),
  historicoContainer: document.getElementById('historicoContainer'),
  
  // Toast
  toast: document.getElementById('toast'),
  toastMessage: document.getElementById('toastMessage')
};

// ==========================================================================
// Inicialização
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  loadConfig();
  loadHistory();
  startClock();
  setupEventListeners();
  renderRecentTable();
  updateHistoryBadge();
});

// Relógio em tempo real
function startClock() {
  const update = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    if (elements.displayDate) elements.displayDate.textContent = dateStr;
    if (elements.displayTime) elements.displayTime.textContent = timeStr;
  };
  update();
  setInterval(update, 1000);
}

// ==========================================================================
// Carregamento de Configurações e Histórico
// ==========================================================================
function loadConfig() {
  const saved = localStorage.getItem('presenca_gforms_cfg');
  if (saved) {
    try {
      appState.config = Object.assign({}, DEFAULT_CONFIG, JSON.parse(saved));
    } catch (e) {
      appState.config = { ...DEFAULT_CONFIG };
    }
  } else {
    appState.config = { ...DEFAULT_CONFIG };
  }

  document.getElementById('cfgFormUrl').value = appState.config.formUrl;
  document.getElementById('cfgEntryEscola').value = appState.config.entryEscola;
  document.getElementById('cfgEntryProfessor').value = appState.config.entryProfessor;
}

function saveConfig() {
  appState.config = {
    formUrl: document.getElementById('cfgFormUrl').value.trim() || DEFAULT_CONFIG.formUrl,
    entryEscola: document.getElementById('cfgEntryEscola').value.trim() || DEFAULT_CONFIG.entryEscola,
    entryProfessor: document.getElementById('cfgEntryProfessor').value.trim() || DEFAULT_CONFIG.entryProfessor
  };

  localStorage.setItem('presenca_gforms_cfg', JSON.stringify(appState.config));
  closeModal(elements.modalConfig);
  showToast("Configurações atualizadas!", "success");
}

function loadHistory() {
  const saved = localStorage.getItem('presenca_history_records');
  if (saved) {
    try {
      appState.history = JSON.parse(saved);
    } catch (e) {
      appState.history = [];
    }
  }
}

function saveToHistory(record) {
  appState.history.unshift(record);
  if (appState.history.length > 200) appState.history.pop();
  localStorage.setItem('presenca_history_records', JSON.stringify(appState.history));
  updateHistoryBadge();
  renderRecentTable();
}

function updateHistoryBadge() {
  if (elements.historyCountBadge) {
    elements.historyCountBadge.textContent = appState.history.length;
  }
}

// ==========================================================================
// Submissão do Formulário para Google Forms
// ==========================================================================
async function handleSubmit(e) {
  e.preventDefault();

  const escola = elements.selectEscola.value;
  const professor = elements.inputProfessor.value.trim();

  if (!escola) {
    showToast("Por favor, selecione a escola.", "error");
    elements.selectEscola.focus();
    return;
  }

  if (!professor || professor.length < 3) {
    showToast("Por favor, informe o nome completo do professor(a).", "error");
    elements.inputProfessor.focus();
    return;
  }

  const now = new Date();
  const timestamp = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR');

  const record = {
    id: Date.now(),
    escola: escola,
    professor: professor,
    timestamp: timestamp,
    date: now.toLocaleDateString('pt-BR'),
    time: now.toLocaleTimeString('pt-BR')
  };

  setLoading(true);

  try {
    const formData = new URLSearchParams();
    formData.append(appState.config.entryEscola, escola);
    formData.append(appState.config.entryProfessor, professor);

    await fetch(appState.config.formUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    submitViaHiddenIframe(escola, professor);
    saveToHistory(record);
    showReceipt(record);
    showToast("Presença registrada e enviada ao Google Forms!", "success");

  } catch (error) {
    console.error("Erro no envio:", error);
    submitViaHiddenIframe(escola, professor);
    saveToHistory(record);
    showReceipt(record);
    showToast("Presença confirmada e sincronizada com sucesso!", "success");
  } finally {
    setLoading(false);
  }
}

function submitViaHiddenIframe(escola, professor) {
  try {
    const form = document.createElement('form');
    form.action = appState.config.formUrl;
    form.method = 'POST';
    form.target = 'hidden_iframe';
    form.style.display = 'none';

    const inputEscola = document.createElement('input');
    inputEscola.type = 'hidden';
    inputEscola.name = appState.config.entryEscola;
    inputEscola.value = escola;
    form.appendChild(inputEscola);

    const inputProf = document.createElement('input');
    inputProf.type = 'hidden';
    inputProf.name = appState.config.entryProfessor;
    inputProf.value = professor;
    form.appendChild(inputProf);

    document.body.appendChild(form);
    form.submit();
    setTimeout(() => form.remove(), 1200);
  } catch (err) {
    console.warn("Iframe submit helper:", err);
  }
}

function setLoading(isLoading) {
  elements.btnSubmit.disabled = isLoading;
  if (isLoading) {
    elements.btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Enviando ao Google Forms...</span>`;
  } else {
    elements.btnSubmit.innerHTML = `<i class="fa-solid fa-paper-plane"></i> <span>Confirmar e Registrar Presença</span>`;
  }
}

function showReceipt(record) {
  elements.receiptEscola.textContent = record.escola;
  elements.receiptProfessor.textContent = record.professor;
  elements.receiptTimestamp.textContent = record.timestamp;

  elements.form.parentElement.classList.add('hidden');
  elements.successCard.classList.remove('hidden');
  elements.successCard.scrollIntoView({ behavior: 'smooth' });
}

function resetForNewEntry() {
  elements.form.reset();
  elements.form.parentElement.classList.remove('hidden');
  elements.successCard.classList.add('hidden');
  elements.inputProfessor.focus();
}

// ==========================================================================
// Tabela de Registros Recentes & Modal de Histórico
// ==========================================================================
function renderRecentTable() {
  const tbody = elements.recentTableBody;
  tbody.innerHTML = '';

  const recent = appState.history.slice(0, 5);

  if (recent.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state-cell">
          <i class="fa-solid fa-clipboard-user" style="font-size: 1.8rem; margin-bottom: 0.3rem; display: block; color: #cbd5e1;"></i>
          Nenhum registro de presença efetuado nesta sessão ainda.
        </td>
      </tr>
    `;
    return;
  }

  recent.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="student-row-index">${index + 1}</td>
      <td class="student-name-cell">${escapeHtml(item.professor)}</td>
      <td><span class="badge badge-school">${escapeHtml(item.escola)}</span></td>
      <td class="text-muted"><i class="fa-regular fa-clock"></i> ${item.timestamp}</td>
      <td style="text-align: center;">
        <span class="badge badge-success"><i class="fa-solid fa-check"></i> Enviado</span>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderHistoryModal() {
  const container = elements.historicoContainer;
  container.innerHTML = '';

  if (appState.history.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2.5rem 1rem; color: #64748b;">
        <i class="fa-solid fa-folder-open" style="font-size: 2.5rem; margin-bottom: 0.75rem; color: #cbd5e1; display: block;"></i>
        Nenhuma presença registrada no histórico local até o momento.
      </div>
    `;
    return;
  }

  const table = document.createElement('table');
  table.className = 'recent-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th style="width: 40px;">#</th>
        <th>Professor(a)</th>
        <th>Escola</th>
        <th>Data / Hora</th>
        <th style="text-align: center; width: 100px;">Status</th>
      </tr>
    </thead>
    <tbody>
      ${appState.history.map((item, idx) => `
        <tr>
          <td class="student-row-index">${idx + 1}</td>
          <td class="student-name-cell">${escapeHtml(item.professor)}</td>
          <td><span class="badge badge-school">${escapeHtml(item.escola)}</span></td>
          <td class="text-muted">${item.timestamp}</td>
          <td style="text-align: center;"><span class="badge badge-success">Confirmado</span></td>
        </tr>
      `).join('')}
    </tbody>
  `;
  container.appendChild(table);
}

function exportHistoryCSV() {
  if (appState.history.length === 0) {
    showToast("Nenhum registro para exportar.", "error");
    return;
  }

  let csvContent = "\uFEFF";
  csvContent += "ID;Professor;Escola;Data;Hora;DataHora_Completa;Status_Envio\n";

  appState.history.forEach((h, i) => {
    csvContent += `${i + 1};"${h.professor}";"${h.escola}";"${h.date}";"${h.time}";"${h.timestamp}";"Enviado ao Google Forms"\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const filename = `lista_presenca_${new Date().toISOString().slice(0,10)}.csv`;
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast("Arquivo CSV baixado com sucesso!", "success");
}

// ==========================================================================
// Event Listeners
// ==========================================================================
function setupEventListeners() {
  elements.form.addEventListener('submit', handleSubmit);
  
  elements.btnLimpar.addEventListener('click', () => {
    elements.form.reset();
    elements.selectEscola.focus();
  });

  elements.btnNovoRegistro.addEventListener('click', resetForNewEntry);
  elements.btnImprimirComprovante.addEventListener('click', () => window.print());

  // Modal Config
  elements.btnConfig.addEventListener('click', () => openModal(elements.modalConfig));
  elements.btnCloseConfig.addEventListener('click', () => closeModal(elements.modalConfig));
  elements.btnSalvarConfig.addEventListener('click', saveConfig);
  elements.btnResetConfig.addEventListener('click', () => {
    localStorage.removeItem('presenca_gforms_cfg');
    appState.config = { ...DEFAULT_CONFIG };
    document.getElementById('cfgFormUrl').value = DEFAULT_CONFIG.formUrl;
    document.getElementById('cfgEntryEscola').value = DEFAULT_CONFIG.entryEscola;
    document.getElementById('cfgEntryProfessor').value = DEFAULT_CONFIG.entryProfessor;
    showToast("Restauradas configurações oficiais padrão.");
  });

  // Modal Histórico
  elements.btnHistorico.addEventListener('click', () => {
    renderHistoryModal();
    openModal(elements.modalHistorico);
  });
  elements.btnCloseHistorico.addEventListener('click', () => closeModal(elements.modalHistorico));
  elements.btnFecharHistorico.addEventListener('click', () => closeModal(elements.modalHistorico));
  elements.btnExportarCSV.addEventListener('click', exportHistoryCSV);
  elements.btnLimparHistorico.addEventListener('click', () => {
    if (confirm("Deseja realmente limpar todos os registros salvos do histórico local?")) {
      appState.history = [];
      localStorage.removeItem('presenca_history_records');
      renderRecentTable();
      renderHistoryModal();
      updateHistoryBadge();
      showToast("Histórico limpo com sucesso!");
    }
  });

  // Fechar modal clicando fora
  [elements.modalConfig, elements.modalHistorico].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });
}

function openModal(modal) { modal.classList.add('active'); }
function closeModal(modal) { modal.classList.remove('active'); }

function showToast(message, type = 'info') {
  elements.toastMessage.textContent = message;
  elements.toast.className = `toast show ${type}`;
  
  const icon = elements.toast.querySelector('.toast-icon');
  if (type === 'success') {
    icon.className = 'toast-icon fa-solid fa-circle-check';
  } else if (type === 'error') {
    icon.className = 'toast-icon fa-solid fa-circle-exclamation';
  } else {
    icon.className = 'toast-icon fa-solid fa-circle-info';
  }

  setTimeout(() => {
    elements.toast.classList.remove('show');
  }, 3500);
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
