/**
 * Sistema de Lista de Presença - Registro Oficial
 * Integrado ao Google Forms & Google Sheets em Tempo Real
 * com Painel Administrativo Protegido
 */

const ADMIN_PASSWORD = "admin123";

const DEFAULT_CONFIG = {
  formUrl: "https://docs.google.com/forms/d/e/1FAIpQLSd7uCn6oryJkV4UGpQdMiRa0a3CUW-gqqPPMlXy2EWx06zEYA/formResponse",
  entryEscola: "entry.285930433",
  entryProfessor: "entry.278265355",
  sheetUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQng9IxPZEAbQsrdWBqfNi5FMTdXOKAzySIgw8zMtHk0LeiD2A9BRc71m7GSnWyCD7IHGMDVCNR9mqY/pub?output=csv"
};

const appState = {
  config: { ...DEFAULT_CONFIG },
  history: [],
  isAdmin: false,
  isSyncing: false,
  lastSyncTime: null,
  syncTimer: null
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

  // Sincronização em Tempo Real (Admin)
  syncStatusBar: document.getElementById('syncStatusBar'),
  syncStatusIcon: document.getElementById('syncStatusIcon'),
  syncStatusTitle: document.getElementById('syncStatusTitle'),
  syncStatusDesc: document.getElementById('syncStatusDesc'),
  btnSyncNow: document.getElementById('btnSyncNow'),
  btnOpenSheetLink: document.getElementById('btnOpenSheetLink'),
  syncPromptBanner: document.getElementById('syncPromptBanner'),
  btnIrParaConfig: document.getElementById('btnIrParaConfig'),
  syncModeBadge: document.getElementById('syncModeBadge'),

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
  cfgSheetUrl: document.getElementById('cfgSheetUrl'),
  btnSalvarConfig: document.getElementById('btnSalvarConfig'),
  btnRestaurarPadrao: document.getElementById('btnRestaurarPadrao'),
  btnTestarSincronizacao: document.getElementById('btnTestarSincronizacao'),
  
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

  // Se já tiver URL da planilha configurada, tenta sincronizar em segundo plano
  if (appState.config.sheetUrl) {
    syncRealTime(false);
  }
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
  if (elements.cfgFormUrl) elements.cfgFormUrl.value = appState.config.formUrl || DEFAULT_CONFIG.formUrl;
  if (elements.cfgEntryEscola) elements.cfgEntryEscola.value = appState.config.entryEscola || DEFAULT_CONFIG.entryEscola;
  if (elements.cfgEntryProfessor) elements.cfgEntryProfessor.value = appState.config.entryProfessor || DEFAULT_CONFIG.entryProfessor;
  if (elements.cfgSheetUrl) elements.cfgSheetUrl.value = appState.config.sheetUrl || '';
}

function saveConfig() {
  appState.config = {
    formUrl: (elements.cfgFormUrl ? elements.cfgFormUrl.value.trim() : '') || DEFAULT_CONFIG.formUrl,
    entryEscola: (elements.cfgEntryEscola ? elements.cfgEntryEscola.value.trim() : '') || DEFAULT_CONFIG.entryEscola,
    entryProfessor: (elements.cfgEntryProfessor ? elements.cfgEntryProfessor.value.trim() : '') || DEFAULT_CONFIG.entryProfessor,
    sheetUrl: (elements.cfgSheetUrl ? elements.cfgSheetUrl.value.trim() : '')
  };
  localStorage.setItem('presenca_gforms_cfg', JSON.stringify(appState.config));
  showToast("Configurações salvas com sucesso!", "success");

  // Re-executa sincronização com as novas configurações
  syncRealTime(true);
}

function restoreDefaultConfig() {
  if (confirm("Deseja restaurar as configurações originais do Google Forms?")) {
    appState.config = { ...DEFAULT_CONFIG };
    localStorage.removeItem('presenca_gforms_cfg');
    loadConfig();
    showToast("Configurações padrão restauradas!", "info");
    syncRealTime(false);
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
  // Evita duplicatas exatas na lista
  const exists = appState.history.some(h => 
    normalizeName(h.professor) === normalizeName(record.professor) && 
    (h.date === record.date || h.timestamp === record.timestamp)
  );

  if (!exists) {
    appState.history.unshift(record);
    if (appState.history.length > 500) appState.history.pop();
    localStorage.setItem('presenca_history_records', JSON.stringify(appState.history));
  }
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

// Verifica se o professor já realizou registro (tanto local quanto vindo do Google Sheets)
function findDuplicateRecord(professorName) {
  loadHistory();
  const normalizedTarget = normalizeName(professorName);
  return appState.history.find(record => normalizeName(record.professor) === normalizedTarget);
}

// ==========================================================================
// Motor de Sincronização em Tempo Real (Google Sheets)
// ==========================================================================

/**
 * Normaliza qualquer link do Google Sheets para o endpoint CSV/Export
 */
function getNormalizedSheetCsvUrl(rawUrl) {
  if (!rawUrl) return '';
  let url = rawUrl.trim();

  // Caso 1: Link publicado da web como CSV
  if (url.includes('/pub') && url.includes('output=csv')) {
    return url;
  }
  // Caso 2: Link publicado da web sem output=csv
  if (url.includes('/pub?')) {
    return url.replace(/output=[a-z]+/i, 'output=csv');
  }
  if (url.includes('/pub')) {
    return url + '?output=csv';
  }

  // Caso 3: Link padrão de planilha do Google Docs: https://docs.google.com/spreadsheets/d/ID/...
  const matchId = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (matchId && matchId[1]) {
    const sheetId = matchId[1];
    let gidParam = '';
    const matchGid = url.match(/[?&#]gid=([0-9]+)/);
    if (matchGid && matchGid[1]) {
      gidParam = `&gid=${matchGid[1]}`;
    }
    // Tenta export via gviz que aceita planilhas compartilhadas
    return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${gidParam}`;
  }

  return url;
}

/**
 * Parser de CSV robusto compatível com aspas, quebras e vírgula/ponto-e-vírgula
 */
function parseCSV(text) {
  const lines = [];
  let row = [];
  let currentToken = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentToken += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === ',' || char === ';') && !inQuotes) {
      row.push(currentToken.trim());
      currentToken = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      row.push(currentToken.trim());
      if (row.some(field => field.length > 0)) {
        lines.push(row);
      }
      row = [];
      currentToken = '';
    } else {
      currentToken += char;
    }
  }

  if (currentToken.length > 0 || row.length > 0) {
    row.push(currentToken.trim());
    if (row.some(field => field.length > 0)) {
      lines.push(row);
    }
  }

  return lines;
}

/**
 * Extrai registros das linhas da planilha do Google Forms
 */
function extractRecordsFromRows(rows) {
  if (!rows || rows.length < 2) return [];

  const rawHeaders = rows[0].map(h => 
    (h || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
  );

  let timeIdx = rawHeaders.findIndex(h => h.includes('carimbo') || h.includes('data') || h.includes('hora') || h.includes('time'));
  let escolaIdx = rawHeaders.findIndex(h => h.includes('escola') || h.includes('unidade'));
  let profIdx = rawHeaders.findIndex(h => h.includes('professor') || h.includes('nome') || h.includes('docente'));

  // Índices padrão do Google Forms se não identificados por nome
  if (timeIdx === -1) timeIdx = 0;
  if (escolaIdx === -1) escolaIdx = 1;
  if (profIdx === -1) profIdx = 2;

  const records = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length <= 1) continue;

    const timestampRaw = row[timeIdx] || '';
    const escola = (row[escolaIdx] || '').trim();
    const professor = (row[profIdx] || '').trim();

    if (!professor && !escola) continue;

    records.push({
      id: `remote_${i}_${normalizeName(professor)}`,
      professor: professor.toUpperCase(),
      escola: escola.toUpperCase(),
      timestamp: timestampRaw,
      isRemote: true
    });
  }

  // Ordena os mais recentes primeiro
  return records.reverse();
}

/**
 * Executa a sincronização em tempo real com o Google Sheets
 */
async function syncRealTime(showFeedback = false) {
  const sheetUrl = appState.config.sheetUrl;

  if (elements.syncStatusIcon) {
    elements.syncStatusIcon.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i>`;
  }
  if (elements.syncStatusTitle) {
    elements.syncStatusTitle.textContent = "Sincronizando em Tempo Real...";
  }

  // Se não houver link da planilha configurado
  if (!sheetUrl) {
    if (elements.syncStatusBar) {
      elements.syncStatusBar.className = "sync-status-bar warning";
    }
    if (elements.syncStatusIcon) {
      elements.syncStatusIcon.innerHTML = `<i class="fa-solid fa-cloud-slash"></i>`;
    }
    if (elements.syncStatusTitle) {
      elements.syncStatusTitle.textContent = "Modo Local Ativo";
    }
    if (elements.syncStatusDesc) {
      elements.syncStatusDesc.textContent = "Para sincronizar entre todos os aparelhos, conecte sua Planilha Google na aba Configurações.";
    }
    if (elements.syncPromptBanner) {
      elements.syncPromptBanner.classList.remove('hidden');
    }
    if (elements.btnOpenSheetLink) {
      elements.btnOpenSheetLink.classList.add('hidden');
    }
    if (elements.syncModeBadge) {
      elements.syncModeBadge.innerHTML = `<i class="fa-solid fa-hard-drive"></i> Local`;
      elements.syncModeBadge.className = "badge badge-warning";
    }
    renderHistoryTable();
    return;
  }

  // Configura botão para abrir planilha
  if (elements.btnOpenSheetLink) {
    elements.btnOpenSheetLink.href = sheetUrl;
    elements.btnOpenSheetLink.classList.remove('hidden');
  }
  if (elements.syncPromptBanner) {
    elements.syncPromptBanner.classList.add('hidden');
  }

  const csvUrl = getNormalizedSheetCsvUrl(sheetUrl);
  appState.isSyncing = true;

  try {
    const response = await fetch(csvUrl, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Status ${response.status}`);
    }

    const csvText = await response.text();
    const rows = parseCSV(csvText);
    const remoteRecords = extractRecordsFromRows(rows);

    // Carrega registros locais
    loadHistory();
    const localRecords = appState.history.filter(h => !h.isRemote);

    // Mescla registros remotos com locais evitando duplicatas
    const merged = [...remoteRecords];
    localRecords.forEach(loc => {
      const isAlreadyInRemote = merged.some(rem => 
        normalizeName(rem.professor) === normalizeName(loc.professor)
      );
      if (!isAlreadyInRemote) {
        merged.push(loc);
      }
    });

    appState.history = merged;
    localStorage.setItem('presenca_history_records', JSON.stringify(appState.history));
    
    appState.lastSyncTime = new Date();
    const timeStr = appState.lastSyncTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Atualiza barra de status para Sucesso
    if (elements.syncStatusBar) {
      elements.syncStatusBar.className = "sync-status-bar synced";
    }
    if (elements.syncStatusIcon) {
      elements.syncStatusIcon.innerHTML = `<i class="fa-solid fa-circle-check"></i>`;
    }
    if (elements.syncStatusTitle) {
      elements.syncStatusTitle.textContent = `Sincronizado com Google Planilhas (${remoteRecords.length} da nuvem)`;
    }
    if (elements.syncStatusDesc) {
      elements.syncStatusDesc.textContent = `Última atualização em tempo real às ${timeStr}`;
    }
    if (elements.syncModeBadge) {
      elements.syncModeBadge.innerHTML = `<i class="fa-solid fa-cloud-arrow-down"></i> Em Tempo Real`;
      elements.syncModeBadge.className = "badge badge-success";
    }

    renderHistoryTable();

    if (showFeedback) {
      showToast(`Sincronizado! ${merged.length} presenças atualizadas.`, "success");
    }

  } catch (err) {
    console.warn("Sincronização em tempo real:", err);

    if (elements.syncStatusBar) {
      elements.syncStatusBar.className = "sync-status-bar warning";
    }
    if (elements.syncStatusIcon) {
      elements.syncStatusIcon.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i>`;
    }
    if (elements.syncStatusTitle) {
      elements.syncStatusTitle.textContent = "Atenção na Conexão da Planilha";
    }
    if (elements.syncStatusDesc) {
      elements.syncStatusDesc.textContent = "Não foi possível carregar a planilha automaticamente. Verifique se ela está 'Publicada na Web' como CSV.";
    }
    if (elements.syncModeBadge) {
      elements.syncModeBadge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Erro Sync`;
      elements.syncModeBadge.className = "badge badge-warning";
    }

    renderHistoryTable();

    if (showFeedback) {
      showToast("Verifique se a planilha foi publicada como CSV na Web (Arquivo > Compartilhar > Publicar na Web).", "warning");
    }
  } finally {
    appState.isSyncing = false;
  }
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

  // REGRA: APENAS UM REGISTRO POR PROFESSOR (Checa histórico global e local)
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
    time: now.toLocaleTimeString('pt-BR'),
    isRemote: false
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
    showToast("Presença confirmada e enviada!", "success");

    // Sincroniza em segundo plano se tiver a planilha
    if (appState.config.sheetUrl) {
      setTimeout(() => syncRealTime(false), 2000);
    }

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
  stopSyncTimer();
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

  // Executa sincronização em tempo real e inicia ciclo a cada 15 segundos
  syncRealTime(false);
  startSyncTimer();
}

function startSyncTimer() {
  stopSyncTimer();
  appState.syncTimer = setInterval(() => {
    if (appState.config.sheetUrl && !appState.isSyncing) {
      syncRealTime(false);
    }
  }, 15000);
}

function stopSyncTimer() {
  if (appState.syncTimer) {
    clearInterval(appState.syncTimer);
    appState.syncTimer = null;
  }
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
        <p>${appState.history.length === 0 ? 'Nenhum registro de presença encontrado.' : 'Nenhum registro encontrado para a busca.'}</p>
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
        <th style="width: 110px; text-align: center;">Origem</th>
      </tr>
    </thead>
    <tbody>
      ${filtered.map((h, i) => `
        <tr>
          <td style="font-weight:700; color:#64748b;">${i + 1}</td>
          <td style="font-weight:600;">${escapeHtml(h.professor)}</td>
          <td><span class="badge" style="background:#f1f5f9; color:#334155; font-weight:600;">${escapeHtml(h.escola)}</span></td>
          <td style="color:#64748b; font-size:0.82rem;"><i class="fa-regular fa-clock"></i> ${escapeHtml(h.timestamp)}</td>
          <td style="text-align:center;">
            ${h.isRemote 
              ? `<span class="badge badge-success" title="Sincronizado da Nuvem Google"><i class="fa-solid fa-cloud"></i> Nuvem</span>`
              : `<span class="badge" style="background:#f8fafc; color:#64748b;" title="Salvo neste dispositivo"><i class="fa-solid fa-hard-drive"></i> Local</span>`
            }
          </td>
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
  let csv = "\uFEFFProfessor;Escola;DataHoraCompleta;Origem\n";
  appState.history.forEach(h => {
    csv += `"${h.professor}";"${h.escola}";"${h.timestamp || ''}";"${h.isRemote ? 'Nuvem' : 'Local'}"\n`;
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
    appState.history = appState.history.filter(h => h.isRemote);
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

  // Botões de Sincronização (Header, Barra de Ações, Painel)
  document.querySelectorAll('.btn-sync-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      syncRealTime(true);
    });
  });

  // Atalho do banner para ir à aba de configurações
  if (elements.btnIrParaConfig) {
    elements.btnIrParaConfig.addEventListener('click', () => switchAdminTab('tabConfig'));
  }

  // Botão Testar Sincronização na aba Config
  if (elements.btnTestarSincronizacao) {
    elements.btnTestarSincronizacao.addEventListener('click', () => {
      const testUrl = elements.cfgSheetUrl ? elements.cfgSheetUrl.value.trim() : '';
      if (!testUrl) {
        showToast("Insira o link da Planilha Google ou CSV acima primeiro.", "warning");
        elements.cfgSheetUrl.focus();
        return;
      }
      appState.config.sheetUrl = testUrl;
      syncRealTime(true);
    });
  }

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
    elements.btnCloseAdminPanel.addEventListener('click', () => {
      stopSyncTimer();
      closeModal(elements.modalAdminPanel);
    });
  }
  if (elements.btnFecharAdminPanel) {
    elements.btnFecharAdminPanel.addEventListener('click', () => {
      stopSyncTimer();
      closeModal(elements.modalAdminPanel);
    });
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
        if (e.target === modal) {
          stopSyncTimer();
          closeModal(modal);
        }
      });
    }
  });

  // Tecla ESC fecha modais
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      stopSyncTimer();
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



