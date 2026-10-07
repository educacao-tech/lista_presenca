/**
 * Sistema de Lista de Presença - Registro Oficial
 * Integrado ao Google Forms com Painel Administrativo Protegido
 */

const ADMIN_PASSWORD = "admin123";

const DEFAULT_CONFIG = {
  formUrl: "https://docs.google.com/forms/d/e/1FAIpQLSd7uCn6oryJkV4UGpQdMiRa0a3CUW-gqqPPMlXy2EWx06zEYA/formResponse",
  entryEscola: "entry.285930433",
  entryProfessor: "entry.278265355"
};

const appState = {
  config: { ...DEFAULT_CONFIG },
  history: [],
  isAdmin: false
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
  
  // Header Admin & Badges
  adminBadge: document.getElementById('adminBadge'),
  btnAdminGear: document.getElementById('btnAdminGear'),
  btnAdminLogout: document.getElementById('btnAdminLogout'),

  // Modal Autenticação de Senha
  modalAdminAuth: document.getElementById('modalAdminAuth'),
  formAdminAuth: document.getElementById('formAdminAuth'),
  adminPasswordInput: document.getElementById('adminPasswordInput'),
  btnTogglePassword: document.getElementById('btnTogglePassword'),
  passwordToggleIcon: document.getElementById('passwordToggleIcon'),
  authErrorMessage: document.getElementById('authErrorMessage'),
  btnCloseAdminAuth: document.getElementById('btnCloseAdminAuth'),
  btnCancelarAuth: document.getElementById('btnCancelarAuth'),

  // Modal Painel Administrativo
  modalAdminPanel: document.getElementById('modalAdminPanel'),
  btnCloseAdminPanel: document.getElementById('btnCloseAdminPanel'),
  btnFecharAdminPanel: document.getElementById('btnFecharAdminPanel'),
  adminTabBtns: document.querySelectorAll('.admin-tab-btn'),
  adminTabContents: document.querySelectorAll('.admin-tab-content'),

  // Aba Histórico
  filtroHistorico: document.getElementById('filtroHistorico'),
  totalPresencasBadge: document.getElementById('totalPresencasBadge'),
  btnExportarCSV: document.getElementById('btnExportarCSV'),
  btnLimparHistorico: document.getElementById('btnLimparHistorico'),
  historicoContainer: document.getElementById('historicoContainer'),

  // Aba Configurações
  cfgFormUrl: document.getElementById('cfgFormUrl'),
  cfgEntryEscola: document.getElementById('cfgEntryEscola'),
  cfgEntryProfessor: document.getElementById('cfgEntryProfessor'),
  btnSalvarConfig: document.getElementById('btnSalvarConfig'),
  btnRestaurarPadrao: document.getElementById('btnRestaurarPadrao'),
  
  // Modal Registro Duplicado
  modalDuplicado: document.getElementById('modalDuplicado'),
  dupNomeProfessor: document.getElementById('dupNomeProfessor'),
  dupEscola: document.getElementById('dupEscola'),
  dupTimestamp: document.getElementById('dupTimestamp'),
  btnVerComprovanteDuplicado: document.getElementById('btnVerComprovanteDuplicado'),
  btnFecharDuplicado: document.getElementById('btnFecharDuplicado'),
  btnCloseDuplicado: document.getElementById('btnCloseDuplicado'),

  // Toast
  toast: document.getElementById('toast'),
  toastMessage: document.getElementById('toastMessage')
};

let currentDuplicateRecord = null;

// ==========================================================================
// Inicialização
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  loadConfig();
  loadHistory();
  startClock();
  checkStoredAdminSession();
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

// Verifica sessão salva de admin
function checkStoredAdminSession() {
  const isAuth = sessionStorage.getItem('presenca_admin_auth') === 'true';
  if (isAuth) {
    setAdminState(true);
  }

  // Se passou ?admin=1 na URL e não está logado, abre modal de senha
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('admin') === '1' || urlParams.get('admin') === 'true') {
    if (!appState.isAdmin) {
      openAuthModal();
    } else {
      openAdminPanel();
    }
  }
}

function setAdminState(isAdmin) {
  appState.isAdmin = isAdmin;
  if (isAdmin) {
    sessionStorage.setItem('presenca_admin_auth', 'true');
    if (elements.adminBadge) elements.adminBadge.classList.remove('hidden');
    if (elements.btnAdminLogout) elements.btnAdminLogout.classList.remove('hidden');
  } else {
    sessionStorage.removeItem('presenca_admin_auth');
    if (elements.adminBadge) elements.adminBadge.classList.add('hidden');
    if (elements.btnAdminLogout) elements.btnAdminLogout.classList.add('hidden');
  }
}

// ==========================================================================
// Gestão de Configurações
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

  // Preenche inputs
  if (elements.cfgFormUrl) elements.cfgFormUrl.value = appState.config.formUrl;
  if (elements.cfgEntryEscola) elements.cfgEntryEscola.value = appState.config.entryEscola;
  if (elements.cfgEntryProfessor) elements.cfgEntryProfessor.value = appState.config.entryProfessor;
}

function saveConfig() {
  appState.config = {
    formUrl: elements.cfgFormUrl.value.trim() || DEFAULT_CONFIG.formUrl,
    entryEscola: elements.cfgEntryEscola.value.trim() || DEFAULT_CONFIG.entryEscola,
    entryProfessor: elements.cfgEntryProfessor.value.trim() || DEFAULT_CONFIG.entryProfessor
  };
  localStorage.setItem('presenca_gforms_cfg', JSON.stringify(appState.config));
  showToast("Configurações salvas com sucesso!", "success");
}

function restoreDefaultConfig() {
  if (confirm("Deseja restaurar as configurações originais do Google Forms?")) {
    appState.config = { ...DEFAULT_CONFIG };
    localStorage.removeItem('presenca_gforms_cfg');
    loadConfig();
    showToast("Configurações padrão restauradas!", "info");
  }
}

// ==========================================================================
// Gestão de Histórico
// ==========================================================================
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
  if (appState.history.length > 500) appState.history.pop();
  localStorage.setItem('presenca_history_records', JSON.stringify(appState.history));
}

// Normalização de nomes para comparação sem case e sem acento
function normalizeName(name) {
  if (!name) return '';
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, ' ');
}

// Verifica se o professor já realizou registro
function findDuplicateRecord(professorName) {
  loadHistory();
  const normalizedTarget = normalizeName(professorName);
  return appState.history.find(record => normalizeName(record.professor) === normalizedTarget);
}

// ==========================================================================
// Submissão do Formulário de Presença
// ==========================================================================
async function handleSubmit(e) {
  e.preventDefault();

  const escola = elements.selectEscola.value;
  const professor = elements.inputProfessor.value.trim();

  if (!escola) {
    showToast("Selecione sua unidade escolar.", "error");
    elements.selectEscola.focus();
    return;
  }

  if (!professor || professor.length < 3) {
    showToast("Por favor, digite seu nome completo.", "error");
    elements.inputProfessor.focus();
    return;
  }

  // REGRA: APENAS UM REGISTRO POR PROFESSOR
  const existingRecord = findDuplicateRecord(professor);
  if (existingRecord) {
    currentDuplicateRecord = existingRecord;
    if (elements.dupNomeProfessor) elements.dupNomeProfessor.textContent = existingRecord.professor;
    if (elements.dupEscola) elements.dupEscola.textContent = existingRecord.escola;
    if (elements.dupTimestamp) elements.dupTimestamp.textContent = existingRecord.timestamp;
    
    openModal(elements.modalDuplicado);
    showToast("Atenção: Presença já registrada para este professor!", "warning");
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
    showToast("Presença confirmada com sucesso!", "success");
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

    // Campo Escola
    const inputEscola = document.createElement('input');
    inputEscola.type = 'hidden';
    inputEscola.name = appState.config.entryEscola;
    inputEscola.value = escola;
    form.appendChild(inputEscola);

    // Campo Professor
    const inputProf = document.createElement('input');
    inputProf.type = 'hidden';
    inputProf.name = appState.config.entryProfessor;
    inputProf.value = professor;
    form.appendChild(inputProf);

    // Parâmetros de integridade do Google Forms
    const inputFvv = document.createElement('input');
    inputFvv.type = 'hidden';
    inputFvv.name = 'fvv';
    inputFvv.value = '1';
    form.appendChild(inputFvv);

    const inputPage = document.createElement('input');
    inputPage.type = 'hidden';
    inputPage.name = 'pageHistory';
    inputPage.value = '0';
    form.appendChild(inputPage);

    document.body.appendChild(form);
    form.submit();
    setTimeout(() => form.remove(), 1500);
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
// Autenticação Administrativa (Senha: admin123)
// ==========================================================================
function openAuthModal() {
  if (elements.adminPasswordInput) {
    elements.adminPasswordInput.value = '';
    elements.adminPasswordInput.type = 'password';
  }
  if (elements.passwordToggleIcon) {
    elements.passwordToggleIcon.className = 'fa-regular fa-eye';
  }
  if (elements.authErrorMessage) {
    elements.authErrorMessage.classList.add('hidden');
  }
  openModal(elements.modalAdminAuth);
  setTimeout(() => {
    if (elements.adminPasswordInput) elements.adminPasswordInput.focus();
  }, 100);
}

function handleAuthSubmit(e) {
  e.preventDefault();
  const inputPass = elements.adminPasswordInput.value;

  if (inputPass === ADMIN_PASSWORD) {
    setAdminState(true);
    closeModal(elements.modalAdminAuth);
    showToast("Acesso administrativo liberado!", "success");
    openAdminPanel();
  } else {
    if (elements.authErrorMessage) {
      elements.authErrorMessage.classList.remove('hidden');
    }
    if (elements.adminPasswordInput) {
      elements.adminPasswordInput.focus();
      elements.adminPasswordInput.select();
    }
  }
}

function togglePasswordVisibility() {
  if (!elements.adminPasswordInput) return;
  const isPass = elements.adminPasswordInput.type === 'password';
  elements.adminPasswordInput.type = isPass ? 'text' : 'password';
  if (elements.passwordToggleIcon) {
    elements.passwordToggleIcon.className = isPass ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
  }
}

function handleAdminLogout() {
  setAdminState(false);
  closeModal(elements.modalAdminPanel);
  closeModal(elements.modalAdminAuth);
  closeModal(elements.modalDuplicado);
  showToast("Você saiu da área administrativa.", "info");
}

// ==========================================================================
// Painel Administrativo
// ==========================================================================
function openAdminPanel() {
  loadConfig();
  renderHistoryTable();
  openModal(elements.modalAdminPanel);
}

function switchAdminTab(targetTabId) {
  elements.adminTabBtns.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === targetTabId);
  });
  elements.adminTabContents.forEach(content => {
    content.classList.toggle('active', content.id === targetTabId);
  });
}

function renderHistoryTable() {
  loadHistory();
  const container = elements.historicoContainer;
  const filter = (elements.filtroHistorico ? elements.filtroHistorico.value.trim().toLowerCase() : '');

  const filtered = appState.history.filter(item => {
    if (!filter) return true;
    return (item.professor && item.professor.toLowerCase().includes(filter)) ||
           (item.escola && item.escola.toLowerCase().includes(filter)) ||
           (item.timestamp && item.timestamp.toLowerCase().includes(filter));
  });

  if (elements.totalPresencasBadge) {
    elements.totalPresencasBadge.textContent = `${filtered.length} registro${filtered.length !== 1 ? 's' : ''}`;
  }

  container.innerHTML = '';

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 2.5rem 1.5rem; color: #64748b;">
        <i class="fa-solid fa-folder-open" style="font-size: 2rem; margin-bottom: 0.5rem; color: #cbd5e1;"></i>
        <p>${appState.history.length === 0 ? 'Nenhum registro de presença salvo localmente.' : 'Nenhum registro encontrado para a busca.'}</p>
      </div>
    `;
    return;
  }

  const table = document.createElement('table');
  table.className = 'historico-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th style="width: 45px;">#</th>
        <th>Professor(a)</th>
        <th>Unidade Escolar</th>
        <th>Data / Horário</th>
      </tr>
    </thead>
    <tbody>
      ${filtered.map((h, i) => `
        <tr>
          <td style="font-weight:700; color:#64748b;">${i + 1}</td>
          <td style="font-weight:600;">${escapeHtml(h.professor)}</td>
          <td><span class="badge" style="background:#f1f5f9; color:#334155; font-weight:600;">${escapeHtml(h.escola)}</span></td>
          <td style="color:#64748b; font-size:0.82rem;"><i class="fa-regular fa-clock"></i> ${escapeHtml(h.timestamp)}</td>
        </tr>
      `).join('')}
    </tbody>
  `;
  container.appendChild(table);
}

function exportCSV() {
  loadHistory();
  if (appState.history.length === 0) {
    showToast("Não há registros para exportar.", "info");
    return;
  }
  let csv = "\uFEFFProfessor;Escola;Data;Hora;DataHoraCompleta\n";
  appState.history.forEach(h => {
    csv += `"${h.professor}";"${h.escola}";"${h.date || ''}";"${h.time || ''}";"${h.timestamp || ''}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lista_presenca_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast("Planilha CSV baixada com sucesso!", "success");
}

function clearHistory() {
  if (confirm("Tem certeza que deseja apagar os registros locais deste dispositivo? Essa ação não afeta a planilha do Google Forms.")) {
    appState.history = [];
    localStorage.removeItem('presenca_history_records');
    renderHistoryTable();
    showToast("Histórico local limpo.", "info");
  }
}

// ==========================================================================
// Event Listeners
// ==========================================================================
function setupEventListeners() {
  // Conversão automática para maiúsculas ao digitar o nome do professor
  if (elements.inputProfessor) {
    elements.inputProfessor.addEventListener('input', (e) => {
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      e.target.value = e.target.value.toUpperCase();
      if (start !== null && end !== null) {
        e.target.setSelectionRange(start, end);
      }
    });
  }

  // Envio do formulário principal
  elements.form.addEventListener('submit', handleSubmit);
  elements.btnNovoRegistro.addEventListener('click', resetForNewEntry);

  // Clique na engrenagem: pede senha admin123 ou abre painel se já autenticado
  if (elements.btnAdminGear) {
    elements.btnAdminGear.addEventListener('click', () => {
      if (appState.isAdmin) {
        openAdminPanel();
      } else {
        openAuthModal();
      }
    });
  }

  // Logout Admin
  if (elements.btnAdminLogout) {
    elements.btnAdminLogout.addEventListener('click', handleAdminLogout);
  }

  // Autenticação de Senha Admin
  if (elements.formAdminAuth) {
    elements.formAdminAuth.addEventListener('submit', handleAuthSubmit);
  }
  if (elements.btnTogglePassword) {
    elements.btnTogglePassword.addEventListener('click', togglePasswordVisibility);
  }
  if (elements.btnCloseAdminAuth) {
    elements.btnCloseAdminAuth.addEventListener('click', () => closeModal(elements.modalAdminAuth));
  }
  if (elements.btnCancelarAuth) {
    elements.btnCancelarAuth.addEventListener('click', () => closeModal(elements.modalAdminAuth));
  }

  // Abas do Painel Administrativo
  elements.adminTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      switchAdminTab(tabId);
    });
  });

  // Fechar Painel Administrativo
  if (elements.btnCloseAdminPanel) {
    elements.btnCloseAdminPanel.addEventListener('click', () => closeModal(elements.modalAdminPanel));
  }
  if (elements.btnFecharAdminPanel) {
    elements.btnFecharAdminPanel.addEventListener('click', () => closeModal(elements.modalAdminPanel));
  }

  // Ações do Modal de Registro Duplicado
  if (elements.btnCloseDuplicado) {
    elements.btnCloseDuplicado.addEventListener('click', () => closeModal(elements.modalDuplicado));
  }
  if (elements.btnFecharDuplicado) {
    elements.btnFecharDuplicado.addEventListener('click', () => closeModal(elements.modalDuplicado));
  }
  if (elements.btnVerComprovanteDuplicado) {
    elements.btnVerComprovanteDuplicado.addEventListener('click', () => {
      closeModal(elements.modalDuplicado);
      if (currentDuplicateRecord) {
        showReceipt(currentDuplicateRecord);
      }
    });
  }

  // Ações da Aba Histórico
  if (elements.filtroHistorico) {
    elements.filtroHistorico.addEventListener('input', renderHistoryTable);
  }
  if (elements.btnExportarCSV) {
    elements.btnExportarCSV.addEventListener('click', exportCSV);
  }
  if (elements.btnLimparHistorico) {
    elements.btnLimparHistorico.addEventListener('click', clearHistory);
  }

  // Ações da Aba Configurações
  if (elements.btnSalvarConfig) {
    elements.btnSalvarConfig.addEventListener('click', saveConfig);
  }
  if (elements.btnRestaurarPadrao) {
    elements.btnRestaurarPadrao.addEventListener('click', restoreDefaultConfig);
  }

  // Fechar modais ao clicar no backdrop
  [elements.modalAdminAuth, elements.modalAdminPanel, elements.modalDuplicado].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
      });
    }
  });

  // Tecla ESC fecha modais
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal(elements.modalAdminAuth);
      closeModal(elements.modalAdminPanel);
      closeModal(elements.modalDuplicado);
    }
  });
}

function openModal(modal) {
  if (modal) modal.classList.add('active');
}

function closeModal(modal) {
  if (modal) modal.classList.remove('active');
}

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


