/**
 * Sistema de Lista de Presença - Versão Segura e Direta
 * Integrado ao Google Forms Oficial
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
  formCard: document.getElementById('formCard'),
  form: document.getElementById('attendanceForm'),
  selectEscola: document.getElementById('selectEscola'),
  inputProfessor: document.getElementById('inputProfessor'),
  displayDate: document.getElementById('displayDate'),
  displayTime: document.getElementById('displayTime'),
  btnSubmit: document.getElementById('btnSubmit'),
  
  // Card de Comprovante Individual
  successCard: document.getElementById('successCard'),
  receiptEscola: document.getElementById('receiptEscola'),
  receiptProfessor: document.getElementById('receiptProfessor'),
  receiptTimestamp: document.getElementById('receiptTimestamp'),
  btnNovoRegistro: document.getElementById('btnNovoRegistro'),
  
  // Admin & Modais
  adminHeaderActions: document.getElementById('adminHeaderActions'),
  btnConfig: document.getElementById('btnConfig'),
  btnHistorico: document.getElementById('btnHistorico'),
  modalConfig: document.getElementById('modalConfig'),
  btnCloseConfig: document.getElementById('btnCloseConfig'),
  btnSalvarConfig: document.getElementById('btnSalvarConfig'),
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
  startClock();
  checkAdminMode();
  setupEventListeners();
});

// Relógio em tempo real
function startClock() {
  const update = () => {
    const now = new Date();
    if (elements.displayDate) {
      elements.displayDate.textContent = now.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
    if (elements.displayTime) {
      elements.displayTime.textContent = now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };
  update();
  setInterval(update, 1000);
}

// Verifica se está no modo admin (?admin=1 na URL)
function checkAdminMode() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('admin') === '1' || urlParams.get('admin') === 'true') {
    if (elements.adminHeaderActions) {
      elements.adminHeaderActions.classList.remove('hidden');
    }
    loadHistory();
  }
}

// Carregar Configurações
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
}

function saveConfig() {
  appState.config = {
    formUrl: document.getElementById('cfgFormUrl').value.trim() || DEFAULT_CONFIG.formUrl,
    entryEscola: document.getElementById('cfgEntryEscola').value.trim() || DEFAULT_CONFIG.entryEscola,
    entryProfessor: document.getElementById('cfgEntryProfessor').value.trim() || DEFAULT_CONFIG.entryProfessor
  };
  localStorage.setItem('presenca_gforms_cfg', JSON.stringify(appState.config));
  closeModal(elements.modalConfig);
  showToast("Configuração salva!", "success");
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
  loadHistory();
  appState.history.unshift(record);
  if (appState.history.length > 300) appState.history.pop();
  localStorage.setItem('presenca_history_records', JSON.stringify(appState.history));
}

// ==========================================================================
// Submissão Segura
// ==========================================================================
async function handleSubmit(e) {
  e.preventDefault();

  const escola = elements.selectEscola.value;
  const professor = elements.inputProfessor.value.trim();

  if (!escola) {
    showToast("Selecione sua escola.", "error");
    elements.selectEscola.focus();
    return;
  }

  if (!professor || professor.length < 3) {
    showToast("Por favor, digite seu nome completo.", "error");
    elements.inputProfessor.focus();
    return;
  }

  const now = new Date();
  const timestamp = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

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
    // Envio direto para o Google Forms
    const formData = new URLSearchParams();
    formData.append(appState.config.entryEscola, escola);
    formData.append(appState.config.entryProfessor, professor);

    await fetch(appState.config.formUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });

    submitViaHiddenIframe(escola, professor);
    saveToHistory(record);
    showReceipt(record);
    showToast("Presença confirmada!", "success");

  } catch (error) {
    console.error("Envio:", error);
    submitViaHiddenIframe(escola, professor);
    saveToHistory(record);
    showReceipt(record);
    showToast("Presença registrada!", "success");
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
    elements.btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Registrando Presença...</span>`;
  } else {
    elements.btnSubmit.innerHTML = `<i class="fa-solid fa-paper-plane"></i> <span>Confirmar e Registrar Presença</span>`;
  }
}

function showReceipt(record) {
  elements.receiptEscola.textContent = record.escola;
  elements.receiptProfessor.textContent = record.professor;
  elements.receiptTimestamp.textContent = record.timestamp;

  elements.formCard.classList.add('hidden');
  elements.successCard.classList.remove('hidden');
  elements.successCard.scrollIntoView({ behavior: 'smooth' });
}

function resetForNewEntry() {
  elements.form.reset();
  elements.formCard.classList.remove('hidden');
  elements.successCard.classList.add('hidden');
  elements.selectEscola.focus();
}

// ==========================================================================
// Painel Administrativo (Privado)
// ==========================================================================
function renderHistoryModal() {
  const container = elements.historicoContainer;
  container.innerHTML = '';

  if (appState.history.length === 0) {
    container.innerHTML = `<p style="text-align:center; padding: 2rem; color: #64748b;">Nenhum registro local nesta máquina.</p>`;
    return;
  }

  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.innerHTML = `
    <thead>
      <tr style="background:#f8fafc; text-align:left; font-size:0.8rem; border-bottom:1px solid #e2e8f0;">
        <th style="padding:8px;">#</th>
        <th style="padding:8px;">Professor</th>
        <th style="padding:8px;">Escola</th>
        <th style="padding:8px;">Data/Hora</th>
      </tr>
    </thead>
    <tbody>
      ${appState.history.map((h, i) => `
        <tr style="border-bottom:1px solid #f1f5f9; font-size:0.85rem;">
          <td style="padding:8px; font-weight:bold;">${i + 1}</td>
          <td style="padding:8px;">${escapeHtml(h.professor)}</td>
          <td style="padding:8px;">${escapeHtml(h.escola)}</td>
          <td style="padding:8px; color:#64748b;">${h.timestamp}</td>
        </tr>
      `).join('')}
    </tbody>
  `;
  container.appendChild(table);
}

function exportCSV() {
  if (appState.history.length === 0) return;
  let csv = "\uFEFFProfessor;Escola;Data;Hora\n";
  appState.history.forEach(h => {
    csv += `"${h.professor}";"${h.escola}";"${h.date}";"${h.time}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `presencas_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ==========================================================================
// Event Listeners
// ==========================================================================
function setupEventListeners() {
  elements.form.addEventListener('submit', handleSubmit);
  elements.btnNovoRegistro.addEventListener('click', resetForNewEntry);

  if (elements.btnConfig) {
    elements.btnConfig.addEventListener('click', () => openModal(elements.modalConfig));
    elements.btnCloseConfig.addEventListener('click', () => closeModal(elements.modalConfig));
    elements.btnSalvarConfig.addEventListener('click', saveConfig);
  }

  if (elements.btnHistorico) {
    elements.btnHistorico.addEventListener('click', () => {
      renderHistoryModal();
      openModal(elements.modalHistorico);
    });
    elements.btnCloseHistorico.addEventListener('click', () => closeModal(elements.modalHistorico));
    elements.btnFecharHistorico.addEventListener('click', () => closeModal(elements.modalHistorico));
    elements.btnExportarCSV.addEventListener('click', exportCSV);
    elements.btnLimparHistorico.addEventListener('click', () => {
      if (confirm("Deseja apagar os registros locais deste dispositivo?")) {
        appState.history = [];
        localStorage.removeItem('presenca_history_records');
        renderHistoryModal();
      }
    });
  }

  [elements.modalConfig, elements.modalHistorico].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
      });
    }
  });
}

function openModal(modal) { if (modal) modal.classList.add('active'); }
function closeModal(modal) { if (modal) modal.classList.remove('active'); }

function showToast(message, type = 'info') {
  elements.toastMessage.textContent = message;
  elements.toast.className = `toast show ${type}`;
  setTimeout(() => elements.toast.classList.remove('show'), 3500);
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
