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
  sheetUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQng9IxPZEAbQsrdWBqfNi5FMTdXOKAzySIgw8zMtHk0LeiD2A9BRc71m7GSnWyCD7IHGMDVCNR9mqY/pub?output=csv",
  appsScriptUrl: "https://script.google.com/macros/s/AKfycby9lsXXrEUX_49aTYfcjQhgHD1xmB7DFODzXgk0691auDIBOTDEzScBPnu9PUUcgni9/exec",
  firestoreUrl: "https://firestore.googleapis.com/v1/projects/edmprofessor-1542b/databases/(default)/documents/professores?pageSize=300",
  googleClientId: "",
  isFormOpen: true,
  collectEmailInForms: false
};

const appState = {
  config: { ...DEFAULT_CONFIG },
  history: [],
  cadastrados: [],
  auditoriaFilterSchool: '',
  auditoriaFilterStatus: 'faltas',
  auditoriaFilterSearch: '',
  isAdmin: false,
  isSyncing: false,
  isSyncingEDM: false,
  lastSyncTime: null,
  lastSyncEDMTime: null,
  syncTimer: null,
  googleUser: null
};

// Elementos do DOM
const elements = {
  formCard: document.getElementById('formCard'),
  formClosedBanner: document.getElementById('formClosedBanner'),
  form: document.getElementById('attendanceForm'),
  selectEscola: document.getElementById('selectEscola'),
  inputProfessor: document.getElementById('inputProfessor'),
  listaSugestoesProfessores: document.getElementById('listaSugestoesProfessores'),
  inputEmail: document.getElementById('inputEmail'),
  displayDate: document.getElementById('displayDate'),
  displayTime: document.getElementById('displayTime'),
  btnSubmit: document.getElementById('btnSubmit'),
  
  // Portal do Docente (Minhas Presenças & Atestado - Painel Admin)
  listaSugestoesAtestado: document.getElementById('listaSugestoesAtestado'),
  tabAtestados: document.getElementById('tabAtestados'),
  portalEmailInput: document.getElementById('portalEmailInput'),
  btnBuscarPresencasDocente: document.getElementById('btnBuscarPresencasDocente'),
  portalEmptyState: document.getElementById('portalEmptyState'),
  portalNotFoundState: document.getElementById('portalNotFoundState'),
  portalNotFoundMsg: document.getElementById('portalNotFoundMsg'),
  portalResultContainer: document.getElementById('portalResultContainer'),
  portalAvatarBadge: document.getElementById('portalAvatarBadge'),
  portalNomeDocente: document.getElementById('portalNomeDocente'),
  portalStatusBadge: document.getElementById('portalStatusBadge'),
  portalEmailDocente: document.getElementById('portalEmailDocente'),
  portalEscolaDocente: document.getElementById('portalEscolaDocente'),
  portalKpiTotalEncontros: document.getElementById('portalKpiTotalEncontros'),
  portalKpiPresencas: document.getElementById('portalKpiPresencas'),
  portalKpiTaxa: document.getElementById('portalKpiTaxa'),
  portalKpiCargaHoraria: document.getElementById('portalKpiCargaHoraria'),
  portalTimelineList: document.getElementById('portalTimelineList'),
  btnEmitirAtestadoDocente: document.getElementById('btnEmitirAtestadoDocente'),
  btnImprimirAtestadoDocente: document.getElementById('btnImprimirAtestadoDocente'),

  // Documento Timbrado de Atestado / Declaração
  atestadoDocumentWrapper: document.getElementById('atestadoDocumentWrapper'),
  atestadoDocumentCard: document.getElementById('atestadoDocumentCard'),
  certDocenteNome: document.getElementById('certDocenteNome'),
  certDocenteEmail: document.getElementById('certDocenteEmail'),
  certDocenteEscola: document.getElementById('certDocenteEscola'),
  certDocenteTaxa: document.getElementById('certDocenteTaxa'),
  certDocenteCarga: document.getElementById('certDocenteCarga'),
  certTbodyEncontros: document.getElementById('certTbodyEncontros'),
  certDataEmissao: document.getElementById('certDataEmissao'),
  certCodigoAutenticidade: document.getElementById('certCodigoAutenticidade'),
  certSigDocenteNome: document.getElementById('certSigDocenteNome'),

  // Card de Comprovante Individual
  successCard: document.getElementById('successCard'),
  receiptEmail: document.getElementById('receiptEmail'),
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

  // Aba Histórico & KPIs
  filtroHistorico: document.getElementById('filtroHistorico'),
  filtroEscolaSelect: document.getElementById('filtroEscolaSelect'),
  filtroDataSelect: document.getElementById('filtroDataSelect'),
  ordemHistoricoSelect: document.getElementById('ordemHistoricoSelect'),
  totalPresencasBadge: document.getElementById('totalPresencasBadge'),
  btnNovaPresencaAdmin: document.getElementById('btnNovaPresencaAdmin'),
  btnExportarCSV: document.getElementById('btnExportarCSV'),
  btnLimparHistorico: document.getElementById('btnLimparHistorico'),
  historicoContainer: document.getElementById('historicoContainer'),
  schoolBadgesContainer: document.getElementById('schoolBadgesContainer'),

  // Modal Edição / Criação de Presença no Modo Admin
  modalEditarRegistro: document.getElementById('modalEditarRegistro'),
  btnCloseEditarRegistro: document.getElementById('btnCloseEditarRegistro'),
  btnCancelarEdicao: document.getElementById('btnCancelarEdicao'),
  formEditarRegistro: document.getElementById('formEditarRegistro'),
  modalEditarTitulo: document.getElementById('modalEditarTitulo'),
  editRecordId: document.getElementById('editRecordId'),
  editNomeProfessor: document.getElementById('editNomeProfessor'),
  editEmailProfessor: document.getElementById('editEmailProfessor'),
  editSelectEscola: document.getElementById('editSelectEscola'),
  editDataEncontro: document.getElementById('editDataEncontro'),
  editHoraEncontro: document.getElementById('editHoraEncontro'),
  btnExcluirDentroDoModal: document.getElementById('btnExcluirDentroDoModal'),
  btnSalvarEdicao: document.getElementById('btnSalvarEdicao'),
  kpiTotalPresencas: document.getElementById('kpiTotalPresencas'),
  kpiTotalSub: document.getElementById('kpiTotalSub'),
  kpiEscolasAtivas: document.getElementById('kpiEscolasAtivas'),
  kpiNuvemStatus: document.getElementById('kpiNuvemStatus'),
  kpiNuvemSub: document.getElementById('kpiNuvemSub'),
  kpiUltimoRegistro: document.getElementById('kpiUltimoRegistro'),
  kpiUltimoNome: document.getElementById('kpiUltimoNome'),

  // Aba Cruzamento & Auditoria de Faltas (EDM Firestore)
  edmStatusBar: document.getElementById('edmStatusBar'),
  edmStatusIcon: document.getElementById('edmStatusIcon'),
  edmStatusTitle: document.getElementById('edmStatusTitle'),
  edmStatusDesc: document.getElementById('edmStatusDesc'),
  btnSyncEDMNow: document.getElementById('btnSyncEDMNow'),
  btnOpenEDMSite: document.getElementById('btnOpenEDMSite'),
  kpiAuditoriaCadastrados: document.getElementById('kpiAuditoriaCadastrados'),
  kpiAuditoriaPresentes: document.getElementById('kpiAuditoriaPresentes'),
  kpiAuditoriaPresentesSub: document.getElementById('kpiAuditoriaPresentesSub'),
  kpiAuditoriaFaltas: document.getElementById('kpiAuditoriaFaltas'),
  kpiAuditoriaFaltasSub: document.getElementById('kpiAuditoriaFaltasSub'),
  kpiAuditoriaTaxa: document.getElementById('kpiAuditoriaTaxa'),
  kpiAuditoriaExtrasSub: document.getElementById('kpiAuditoriaExtrasSub'),
  auditoriaSchoolsContainer: document.getElementById('auditoriaSchoolsContainer'),
  totalAuditoriaBadge: document.getElementById('totalAuditoriaBadge'),
  badgeFaltasDestaque: document.getElementById('badgeFaltasDestaque'),
  auditoriaFiltroEscolaSelect: document.getElementById('auditoriaFiltroEscolaSelect'),
  auditoriaFiltroDataSelect: document.getElementById('auditoriaFiltroDataSelect'),
  auditoriaFiltroStatusSelect: document.getElementById('auditoriaFiltroStatusSelect'),
  auditoriaFiltroBusca: document.getElementById('auditoriaFiltroBusca'),
  btnGerarPDFFaltas: document.getElementById('btnGerarPDFFaltas'),
  btnCopiarFaltasWhatsApp: document.getElementById('btnCopiarFaltasWhatsApp'),
  btnExportarAuditoriaCSV: document.getElementById('btnExportarAuditoriaCSV'),
  auditoriaTabelaContainer: document.getElementById('auditoriaTabelaContainer'),
  repFaltasEncontroData: document.getElementById('repFaltasEncontroData'),

  // Aba Relatório para Gestão
  relatorioEscolaSelect: document.getElementById('relatorioEscolaSelect'),
  relatorioDataSelect: document.getElementById('relatorioDataSelect'),
  btnGerarPDF: document.getElementById('btnGerarPDF'),
  btnImprimirRelatorio: document.getElementById('btnImprimirRelatorio'),
  btnCopiarWhatsApp: document.getElementById('btnCopiarWhatsApp'),
  btnExportarRelatorioCSV: document.getElementById('btnExportarRelatorioCSV'),
  repDataEmissao: document.getElementById('repDataEmissao'),
  repEscolaNome: document.getElementById('repEscolaNome'),
  repEncontroData: document.getElementById('repEncontroData'),
  repTotalPresentes: document.getElementById('repTotalPresentes'),
  repUnidadesCount: document.getElementById('repUnidadesCount'),
  repPrimeiroRegistro: document.getElementById('repPrimeiroRegistro'),
  repUltimoRegistro: document.getElementById('repUltimoRegistro'),
  repQuadroEscolas: document.getElementById('repQuadroEscolas'),
  repTabelaContainer: document.getElementById('repTabelaContainer'),
  repFooterTimestamp: document.getElementById('repFooterTimestamp'),

  // Google Sign-In (Captura Automática)
  googleAuthSection: document.getElementById('googleAuthSection'),
  googleBtnWrapper: document.getElementById('googleBtnWrapper'),
  btnGoogleSignInAction: document.getElementById('btnGoogleSignInAction'),
  googleConnectedCard: document.getElementById('googleConnectedCard'),
  googleUserPhoto: document.getElementById('googleUserPhoto'),
  googleUserAvatarFallback: document.getElementById('googleUserAvatarFallback'),
  googleUserName: document.getElementById('googleUserName'),
  googleUserEmail: document.getElementById('googleUserEmail'),
  btnGoogleDisconnect: document.getElementById('btnGoogleDisconnect'),
  cfgGoogleClientId: document.getElementById('cfgGoogleClientId'),

  // Modal Identificação Rápida
  modalGoogleQuickAuth: document.getElementById('modalGoogleQuickAuth'),
  formGoogleQuickAuth: document.getElementById('formGoogleQuickAuth'),
  quickAuthEmail: document.getElementById('quickAuthEmail'),
  quickAuthNome: document.getElementById('quickAuthNome'),
  quickRecentProfilesWrap: document.getElementById('quickRecentProfilesWrap'),
  quickRecentProfilesList: document.getElementById('quickRecentProfilesList'),
  btnCloseGoogleQuickAuth: document.getElementById('btnCloseGoogleQuickAuth'),
  btnCancelarQuickAuth: document.getElementById('btnCancelarQuickAuth'),

  // Aba Configurações
  cfgFormStatusSelect: document.getElementById('cfgFormStatusSelect'),
  cfgFormUrl: document.getElementById('cfgFormUrl'),
  cfgEntryEscola: document.getElementById('cfgEntryEscola'),
  cfgEntryProfessor: document.getElementById('cfgEntryProfessor'),
  cfgSheetUrl: document.getElementById('cfgSheetUrl'),
  cfgAppsScriptUrl: document.getElementById('cfgAppsScriptUrl'),
  cfgFirestoreUrl: document.getElementById('cfgFirestoreUrl'),
  btnSalvarConfig: document.getElementById('btnSalvarConfig'),
  btnRestaurarPadrao: document.getElementById('btnRestaurarPadrao'),
  btnTestarSincronizacao: document.getElementById('btnTestarSincronizacao'),
  btnTestarEDM: document.getElementById('btnTestarEDM'),
  
  // Modal Registro Duplicado
  modalDuplicado: document.getElementById('modalDuplicado'),
  dupNomeProfessor: document.getElementById('dupNomeProfessor'),
  dupEmail: document.getElementById('dupEmail'),
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

// Inicializa o tema imediatamente para evitar flash de tela clara/escura
initTheme();

// ==========================================================================
// Inicialização
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadConfig();
  loadHistory();
  updateRelatorioDateSelect();
  updateAuditoriaDateSelect();
  loadCachedCadastrados();
  startClock();
  checkStoredAdminSession();
  setupEventListeners();

  // Carrega identidade salva do docente ou inicializa o Google Identity
  loadSavedDocenteIdentity();
  setTimeout(initGoogleIdentity, 400);

  // Sincroniza Base Oficial de Professores (Firestore EDM)
  syncCadastradosEDM(false);

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
  if (elements.cfgFormStatusSelect) {
    elements.cfgFormStatusSelect.value = (appState.config.isFormOpen !== false) ? 'open' : 'closed';
  }
  if (elements.cfgFormUrl) elements.cfgFormUrl.value = appState.config.formUrl || DEFAULT_CONFIG.formUrl;
  if (elements.cfgEntryEscola) elements.cfgEntryEscola.value = appState.config.entryEscola || DEFAULT_CONFIG.entryEscola;
  if (elements.cfgEntryProfessor) elements.cfgEntryProfessor.value = appState.config.entryProfessor || DEFAULT_CONFIG.entryProfessor;
  if (elements.cfgSheetUrl) elements.cfgSheetUrl.value = appState.config.sheetUrl || '';
  if (elements.cfgAppsScriptUrl) elements.cfgAppsScriptUrl.value = appState.config.appsScriptUrl || DEFAULT_CONFIG.appsScriptUrl;
  if (elements.cfgFirestoreUrl) elements.cfgFirestoreUrl.value = appState.config.firestoreUrl || DEFAULT_CONFIG.firestoreUrl;
  if (elements.cfgGoogleClientId) elements.cfgGoogleClientId.value = appState.config.googleClientId || '';

  updateFormStatusUI();
}

function updateFormStatusUI() {
  const isOpen = appState.config.isFormOpen !== false;
  const closedBanner = document.getElementById('formClosedBanner');
  const googleAuthSection = document.getElementById('googleAuthSection');
  const formDividers = document.querySelectorAll('.form-divider');
  const form = document.getElementById('attendanceForm');

  if (isOpen) {
    if (closedBanner) closedBanner.classList.add('hidden');
    if (googleAuthSection) googleAuthSection.classList.remove('hidden');
    formDividers.forEach(el => el.classList.remove('hidden'));
    if (form) form.classList.remove('hidden');
  } else {
    if (closedBanner) closedBanner.classList.remove('hidden');
    if (googleAuthSection) googleAuthSection.classList.add('hidden');
    formDividers.forEach(el => el.classList.add('hidden'));
    if (form) form.classList.add('hidden');
  }

  if (elements.cfgFormStatusSelect) {
    elements.cfgFormStatusSelect.value = isOpen ? 'open' : 'closed';
  }
}

function saveConfig() {
  const oldClientId = appState.config.googleClientId;
  const isFormOpen = elements.cfgFormStatusSelect ? (elements.cfgFormStatusSelect.value === 'open') : true;

  appState.config = {
    formUrl: (elements.cfgFormUrl ? elements.cfgFormUrl.value.trim() : '') || DEFAULT_CONFIG.formUrl,
    entryEscola: (elements.cfgEntryEscola ? elements.cfgEntryEscola.value.trim() : '') || DEFAULT_CONFIG.entryEscola,
    entryProfessor: (elements.cfgEntryProfessor ? elements.cfgEntryProfessor.value.trim() : '') || DEFAULT_CONFIG.entryProfessor,
    sheetUrl: (elements.cfgSheetUrl ? elements.cfgSheetUrl.value.trim() : ''),
    appsScriptUrl: (elements.cfgAppsScriptUrl ? elements.cfgAppsScriptUrl.value.trim() : '') || DEFAULT_CONFIG.appsScriptUrl,
    firestoreUrl: (elements.cfgFirestoreUrl ? elements.cfgFirestoreUrl.value.trim() : '') || DEFAULT_CONFIG.firestoreUrl,
    googleClientId: (elements.cfgGoogleClientId ? elements.cfgGoogleClientId.value.trim() : ''),
    isFormOpen: isFormOpen
  };
  localStorage.setItem('presenca_gforms_cfg', JSON.stringify(appState.config));
  updateFormStatusUI();
  showToast("Configurações salvas com sucesso!", "success");

  if (oldClientId !== appState.config.googleClientId) {
    initGoogleIdentity();
  }

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
  const recEmail = (record.email || '').trim().toLowerCase();
  const recProf = normalizeName(record.professor);
  const recDate = record.date || extractDateFromTimestamp(record.timestamp);

  // Evita duplicatas na lista por e-mail ou nome no mesmo dia
  const exists = appState.history.some(h => {
    const hDate = h.date || extractDateFromTimestamp(h.timestamp);
    if (recDate && hDate && recDate !== hDate) return false;

    const hEmail = (h.email || '').trim().toLowerCase();
    const hProf = normalizeName(h.professor);
    if (recEmail && hEmail && recEmail === hEmail) return true;
    if (recProf && hProf && recProf === hProf) return true;
    return false;
  });

  if (!exists) {
    appState.history.unshift(record);
    if (appState.history.length > 500) appState.history.pop();
    localStorage.setItem('presenca_history_records', JSON.stringify(appState.history));
  }
}

// ==========================================================================
// Utilitários de Data dos Encontros Formativos
// ==========================================================================
function normalizeDateBR(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const parts = dateStr.trim().split('/');
  if (parts.length === 3) {
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    const y = parts[2];
    return `${d}/${m}/${y}`;
  }
  return dateStr.trim();
}

function parseDateBR(dateStr) {
  if (!dateStr) return 0;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    return new Date(y, m, d).getTime();
  }
  return 0;
}

function extractDateFromTimestamp(timestamp, dateField) {
  if (dateField && typeof dateField === 'string' && dateField.trim()) {
    const m = dateField.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
    if (m) return normalizeDateBR(m[1]);
  }
  if (!timestamp || typeof timestamp !== 'string') return '';
  // Formato BR: DD/MM/AAAA
  const mBR = timestamp.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
  if (mBR) return normalizeDateBR(mBR[1]);
  // Formato ISO: AAAA-MM-DD
  const mISO = timestamp.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (mISO) {
    const d = mISO[3].padStart(2, '0');
    const m = mISO[2].padStart(2, '0');
    const y = mISO[1];
    return `${d}/${m}/${y}`;
  }
  // Formato com traço: DD-MM-AAAA
  const mHyphen = timestamp.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (mHyphen) return normalizeDateBR(`${mHyphen[1]}/${mHyphen[2]}/${mHyphen[3]}`);
  return '';
}

function formatDateDisplayPT(dateStr) {
  if (!dateStr) return 'Data Não Definida';
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    const dateObj = new Date(y, m, d, 12, 0, 0);
    if (!isNaN(dateObj.getTime())) {
      const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
      const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
      return `${String(d).padStart(2, '0')} de ${meses[m]} de ${y} (${diasSemana[dateObj.getDay()]})`;
    }
  }
  return dateStr;
}

function getUniqueMeetingDates(records = null) {
  const history = records || appState.history || [];
  const datesSet = new Set();
  history.forEach(item => {
    const d = extractDateFromTimestamp(item.timestamp, item.date);
    if (d) datesSet.add(d);
  });
  return Array.from(datesSet).sort((a, b) => parseDateBR(a) - parseDateBR(b));
}

function updateRelatorioDateSelect() {
  const select = elements.relatorioDataSelect || document.getElementById('relatorioDataSelect');
  if (!select) return;

  const currentVal = select.value;
  const dates = getUniqueMeetingDates();

  let html = `<option value="">📅 Todos os Encontros (Separar por Dia)</option>`;
  dates.forEach(d => {
    const label = formatDateDisplayPT(d);
    html += `<option value="${escapeHtml(d)}">${escapeHtml(label)}</option>`;
  });

  select.innerHTML = html;
  if (currentVal && dates.includes(currentVal)) {
    select.value = currentVal;
  }
}

function updateAuditoriaDateSelect() {
  const select = elements.auditoriaFiltroDataSelect || document.getElementById('auditoriaFiltroDataSelect');
  if (!select) return;

  const currentVal = select.value;
  const dates = getUniqueMeetingDates();

  let html = `<option value="">📅 Todos os Encontros</option>`;
  dates.forEach(d => {
    const label = formatDateDisplayPT(d);
    html += `<option value="${escapeHtml(d)}">${escapeHtml(label)}</option>`;
  });

  select.innerHTML = html;
  if (currentVal && dates.includes(currentVal)) {
    select.value = currentVal;
  }
}

function updateHistoricoDateSelect() {
  const select = elements.filtroDataSelect || document.getElementById('filtroDataSelect');
  if (!select) return;

  const currentVal = select.value;
  const dates = getUniqueMeetingDates();

  // Se as opções existentes já são idênticas, não recria o DOM
  const existingValues = Array.from(select.options).map(o => o.value).filter(Boolean);
  if (existingValues.length === dates.length && dates.every((d, i) => d === existingValues[i])) {
    return;
  }

  let html = `<option value="">📅 Todas as Datas</option>`;
  dates.forEach(d => {
    const label = formatDateDisplayPT(d);
    html += `<option value="${escapeHtml(d)}">${escapeHtml(label)}</option>`;
  });

  select.innerHTML = html;
  if (currentVal && dates.includes(currentVal)) {
    select.value = currentVal;
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

// Verifica se já realizou registro no mesmo dia (por E-mail como chave prioritária ou por Nome)
function findDuplicateRecord(target, explicitDate = '') {
  loadHistory();
  const targetEmail = typeof target === 'object' ? (target.email || '').trim().toLowerCase() : '';
  const targetProf = typeof target === 'object' ? normalizeName(target.professor) : normalizeName(target);

  // Determina a data de referência para comparação (apenas no mesmo dia do encontro)
  let refDate = '';
  if (explicitDate) {
    refDate = normalizeDateBR(explicitDate);
  } else if (typeof target === 'object' && target) {
    if (target.date) refDate = normalizeDateBR(target.date);
    else if (target.timestamp) refDate = extractDateFromTimestamp(target.timestamp);
  }
  if (!refDate) {
    refDate = normalizeDateBR(new Date().toLocaleDateString('pt-BR'));
  }

  return appState.history.find(record => {
    // REGRA: Só é duplicado se for no MESMO DIA do encontro formativo
    const recDate = extractDateFromTimestamp(record.timestamp, record.date);
    if (recDate && refDate && recDate !== refDate) {
      return false; // Dias diferentes -> Permite novo registro para o novo encontro!
    }

    const recEmail = (record.email || '').trim().toLowerCase();
    const recProf = normalizeName(record.professor);

    // 1. Chave prioritária: E-mail idêntico no mesmo dia
    if (targetEmail && recEmail && targetEmail === recEmail) {
      return true;
    }
    // 2. Chave secundária: Nome Completo idêntico no mesmo dia
    if (targetProf && recProf && targetProf === recProf) {
      return true;
    }
    return false;
  });
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

// ==========================================================================
// Persistência de Edições e Exclusões Administrativas (Nuvem / Local)
// ==========================================================================
function getDeletedSignatures() {
  try {
    const raw = localStorage.getItem('presenca_deleted_signatures');
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch (e) {
    return new Set();
  }
}

function saveDeletedSignature(sig) {
  if (!sig) return;
  const set = getDeletedSignatures();
  set.add(sig);
  try {
    localStorage.setItem('presenca_deleted_signatures', JSON.stringify(Array.from(set)));
  } catch (e) {}
}

function getEditedRecords() {
  try {
    const raw = localStorage.getItem('presenca_edited_records');
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveEditedRecord(id, rec) {
  if (!id || !rec) return;
  const obj = getEditedRecords();
  obj[id] = rec;
  try {
    localStorage.setItem('presenca_edited_records', JSON.stringify(obj));
  } catch (e) {}
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
  let emailIdx = rawHeaders.findIndex(h => h.includes('email') || h.includes('e-mail') || h.includes('correio'));
  let escolaIdx = rawHeaders.findIndex(h => h.includes('escola') || h.includes('unidade'));
  let profIdx = rawHeaders.findIndex(h => h.includes('professor') || h.includes('nome') || h.includes('docente'));

  // Índices padrão do Google Forms se não identificados por nome
  if (timeIdx === -1) timeIdx = 0;
  if (emailIdx === -1) emailIdx = 1;
  if (escolaIdx === -1) escolaIdx = 2;
  if (profIdx === -1) profIdx = 3;

  const records = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length <= 1) continue;

    const timestampRaw = row[timeIdx] || '';
    let email = (emailIdx !== -1 && row[emailIdx]) ? row[emailIdx].trim().toLowerCase() : '';
    let escola = (row[escolaIdx] || '').trim();
    let professor = (row[profIdx] || '').trim();

    // Detecção inteligente caso as colunas na planilha estejam em ordem diferente
    const knownSchools = [
      "ALZIRA ACRA", "ANNA BONAGURA", "BRAGA MORATO", 
      "CAIC", "CÉLIA BUENO", "ESTHER VIANNA", "PADRE BENITO"
    ];
    const values = [email, escola, professor].filter(Boolean);
    const emailCandidate = values.find(v => v.includes('@'));
    const schoolCandidate = values.find(v => {
      const vNorm = normalizeName(v);
      return knownSchools.some(ks => normalizeName(ks) === vNorm || vNorm.includes(normalizeName(ks)));
    });
    const profCandidate = values.find(v => v !== emailCandidate && v !== schoolCandidate);

    if (emailCandidate) email = emailCandidate.toLowerCase();
    if (schoolCandidate) escola = schoolCandidate;
    if (profCandidate) professor = profCandidate;

    if (!professor && !escola && !email) continue;

    const mDate = extractDateFromTimestamp(timestampRaw);
    records.push({
      id: `remote_${i}_${email || normalizeName(professor)}_${mDate ? mDate.replace(/\//g, '') : ''}`,
      email: email,
      professor: professor.toUpperCase(),
      escola: escola.toUpperCase(),
      timestamp: timestampRaw,
      date: mDate,
      isRemote: true
    });
  }

  // Ordena os mais recentes primeiro
  const reversed = records.reverse();

  // DEDUPLICAÇÃO ESTRITA: Apenas 1 registro por docente em cada dia de encontro
  const uniqueRecords = [];
  const seenKeys = new Set();
  const deletedSigs = getDeletedSignatures();
  const editedMap = getEditedRecords();

  reversed.forEach(rec => {
    const profNorm = normalizeName(rec.professor);
    const emailNorm = (rec.email || '').trim().toLowerCase();
    const dateVal = rec.date || extractDateFromTimestamp(rec.timestamp);

    // 1. Ignora se foi excluído pelo Administrador
    const sig1 = `${emailNorm}_${dateVal}`;
    const sig2 = `${profNorm}_${dateVal}`;
    const sigTime = `${emailNorm || profNorm}_${rec.timestamp}`;
    if (deletedSigs.has(sig1) || deletedSigs.has(sig2) || deletedSigs.has(sigTime) || deletedSigs.has(rec.id)) {
      return;
    }

    // 2. Aplica edições salvas pelo Administrador
    if (editedMap[rec.id]) {
      Object.assign(rec, editedMap[rec.id]);
    }

    const emailKey = emailNorm && dateVal ? `${emailNorm}_${dateVal}` : '';
    const profKey = profNorm && dateVal ? `${profNorm}_${dateVal}` : '';

    if (emailKey && seenKeys.has(emailKey)) return;
    if (profKey && seenKeys.has(profKey)) return;

    if (emailKey) seenKeys.add(emailKey);
    if (profKey) seenKeys.add(profKey);

    uniqueRecords.push(rec);
  });

  return uniqueRecords;
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

    // Mescla registros remotos com locais evitando duplicatas no mesmo dia
    const merged = [...remoteRecords];
    localRecords.forEach(loc => {
      const locEmail = (loc.email || '').trim().toLowerCase();
      const locProf = normalizeName(loc.professor);
      const locDate = extractDateFromTimestamp(loc.timestamp, loc.date);

      const isAlreadyInRemote = merged.some(rem => {
        const remEmail = (rem.email || '').trim().toLowerCase();
        const remProf = normalizeName(rem.professor);
        const remDate = extractDateFromTimestamp(rem.timestamp, rem.date);

        // Se forem de dias diferentes do encontro, NÃO são duplicados
        if (locDate && remDate && locDate !== remDate) return false;

        if (locEmail && remEmail && locEmail === remEmail) return true;
        if (locProf && remProf && locProf === remProf) return true;
        return false;
      });

      if (!isAlreadyInRemote) {
        merged.push(loc);
      }
    });

    // Garante unicidade absoluta: máximo 1 presença por professor em cada dia de encontro
    const finalMerged = [];
    const seenMergeKeys = new Set();
    merged.forEach(item => {
      const pNorm = normalizeName(item.professor);
      const eNorm = (item.email || '').trim().toLowerCase();
      const dNorm = item.date || extractDateFromTimestamp(item.timestamp);

      const k1 = eNorm && dNorm ? `${eNorm}_${dNorm}` : '';
      const k2 = pNorm && dNorm ? `${pNorm}_${dNorm}` : '';

      if (k1 && seenMergeKeys.has(k1)) return;
      if (k2 && seenMergeKeys.has(k2)) return;

      if (k1) seenMergeKeys.add(k1);
      if (k2) seenMergeKeys.add(k2);

      finalMerged.push(item);
    });

    appState.history = finalMerged;
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
    updateRelatorioDateSelect();
    updateAuditoriaDateSelect();
    renderAuditoriaUI();
    const activeTab = document.querySelector('.admin-tab-btn.active')?.getAttribute('data-tab');
    if (activeTab === 'tabRelatorios') {
      const selectedSchool = elements.relatorioEscolaSelect ? elements.relatorioEscolaSelect.value : '';
      const selectedDate = elements.relatorioDataSelect ? elements.relatorioDataSelect.value : '';
      renderManagementReport(selectedSchool, selectedDate);
    }

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
    updateRelatorioDateSelect();
    updateAuditoriaDateSelect();
    renderAuditoriaUI();
    const activeTab = document.querySelector('.admin-tab-btn.active')?.getAttribute('data-tab');
    if (activeTab === 'tabRelatorios') {
      const selectedSchool = elements.relatorioEscolaSelect ? elements.relatorioEscolaSelect.value : '';
      const selectedDate = elements.relatorioDataSelect ? elements.relatorioDataSelect.value : '';
      renderManagementReport(selectedSchool, selectedDate);
    }

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

  if (appState.config.isFormOpen === false) {
    showToast("A lista de presença está encerrada e não aceita novos envios.", "warning");
    updateFormStatusUI();
    return;
  }

  const escola = elements.selectEscola.value;
  const professor = elements.inputProfessor.value.trim();
  const email = elements.inputEmail ? elements.inputEmail.value.trim().toLowerCase() : '';

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

  if (!email || !email.includes('@')) {
    showToast("Por favor, digite um e-mail válido.", "error");
    if (elements.inputEmail) elements.inputEmail.focus();
    return;
  }

  const now = new Date();
  const todayBR = normalizeDateBR(now.toLocaleDateString('pt-BR'));
  const timestamp = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // REGRA: CHAVE ÚNICA (E-mail prioritário ou Nome Completo) APENAS NO MESMO DIA DO ENCONTRO
  const existingRecord = findDuplicateRecord({ email, professor, date: todayBR });
  if (existingRecord) {
    currentDuplicateRecord = existingRecord;
    if (elements.dupNomeProfessor) elements.dupNomeProfessor.textContent = existingRecord.professor;
    if (elements.dupEmail) elements.dupEmail.textContent = existingRecord.email || email;
    if (elements.dupEscola) elements.dupEscola.textContent = existingRecord.escola;
    if (elements.dupTimestamp) elements.dupTimestamp.textContent = existingRecord.timestamp;
    
    openModal(elements.modalDuplicado);
    showToast(`Atenção: Presença já registrada para este docente no encontro de hoje (${todayBR})!`, "warning");
    return;
  }

  const record = {
    id: Date.now(),
    email: email,
    escola: escola,
    professor: professor,
    timestamp: timestamp,
    date: todayBR,
    isRemote: false
  };

  setLoading(true);

  try {
    // 1. Gravação DIRETA e instantânea na Planilha Google via Apps Script Web App
    const appsScriptUrl = appState.config.appsScriptUrl || DEFAULT_CONFIG.appsScriptUrl;
    if (appsScriptUrl) {
      try {
        await fetch(appsScriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            escola: escola,
            professor: professor,
            email: email,
            timestamp: timestamp
          })
        });
      } catch (appsErr) {
        console.warn("Apps Script envio aviso:", appsErr);
      }
    }

    // 2. Envio complementar para o Google Forms
    const formData = new URLSearchParams();
    formData.append(appState.config.entryEscola, escola);
    formData.append(appState.config.entryProfessor, professor);

    if (appState.config.collectEmailInForms && email) {
      formData.append('emailAddress', email);
    }

    try {
      await fetch(appState.config.formUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });
    } catch (fetchErr) {
      console.warn("Fetch no-cors aviso:", fetchErr);
    }

    // Submissão complementar via iframe (garante compatibilidade total com Google Forms)
    submitViaHiddenIframe(escola, professor, email);
    saveToHistory(record);
    showReceipt(record);
    showToast("Presença confirmada e gravada! Comprovante enviado por e-mail.", "success");

    // Sincroniza em segundo plano se tiver a planilha
    if (appState.config.sheetUrl) {
      setTimeout(() => syncRealTime(false), 2000);
    }

  } catch (error) {
    console.error("Envio:", error);
    submitViaHiddenIframe(escola, professor, email);
    saveToHistory(record);
    showReceipt(record);
    showToast("Presença confirmada com sucesso!", "success");
  } finally {
    setLoading(false);
  }
}

function submitViaHiddenIframe(escola, professor, email) {
  try {
    const form = document.createElement('form');
    form.action = appState.config.formUrl;
    form.method = 'POST';
    form.target = 'hidden_iframe';
    form.style.display = 'none';

    // Campo E-mail (somente se habilitado no Google Forms)
    if (appState.config.collectEmailInForms && email) {
      const inputEmail = document.createElement('input');
      inputEmail.type = 'hidden';
      inputEmail.name = 'emailAddress';
      inputEmail.value = email;
      form.appendChild(inputEmail);
    }

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

// ==========================================================================
// Módulo de Autenticação Google Identity & Identificação Rápida
// ==========================================================================

/**
 * Decodifica o token JWT retornado pelo Google Identity
 */
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Erro ao decodificar JWT Google:", e);
    return null;
  }
}

/**
 * Carrega a identidade do docente salva localmente neste dispositivo
 */
function loadSavedDocenteIdentity() {
  try {
    const saved = localStorage.getItem('presenca_saved_docente');
    if (saved) {
      const profile = JSON.parse(saved);
      if (profile && (profile.name || profile.email)) {
        setGoogleAuthenticatedUser(profile, false);
      }
    }
  } catch (err) {
    console.warn("Erro ao carregar docente salvo:", err);
  }
}

/**
 * Inicializa o Google Identity Services (GSI)
 */
function initGoogleIdentity() {
  // Se já estiver conectado, não precisa reinicializar
  if (appState.googleUser) return;

  if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) {
    return;
  }

  const clientId = appState.config.googleClientId;
  if (!clientId) {
    // Sem client ID oficial configurado, o botão personalizado chamará a identificação rápida
    return;
  }

  try {
    google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true
    });

    const btnContainer = document.getElementById('g_id_signin_button');
    if (btnContainer) {
      btnContainer.innerHTML = '';
      google.accounts.id.renderButton(btnContainer, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: 320
      });
    }

    if (!appState.googleUser) {
      google.accounts.id.prompt(() => {});
    }
  } catch (err) {
    console.warn("Google Identity Init:", err);
  }
}

/**
 * Clique no botão "Conectar com a Conta Google"
 */
function handleGoogleSignInClick() {
  // 1. Se o Google GSI estiver disponível com Client ID, tenta disparar o prompt
  if (appState.config.googleClientId && typeof google !== 'undefined' && google.accounts && google.accounts.id) {
    try {
      google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          openGoogleQuickAuthModal();
        }
      });
      return;
    } catch (e) {
      console.warn("Falha no prompt do Google:", e);
    }
  }

  // 2. Fallback interativo e infalível: Modal de Identificação Rápida
  openGoogleQuickAuthModal();
}

/**
 * Abre o Modal de Identificação Rápida
 */
function openGoogleQuickAuthModal() {
  loadHistory();

  // Lista os perfis recentes registrados no histórico local
  const uniqueProfiles = [];
  const seenEmails = new Set();

  if (Array.isArray(appState.history)) {
    appState.history.forEach(item => {
      const email = (item.email || '').trim().toLowerCase();
      const prof = (item.professor || '').trim().toUpperCase();
      if (email && prof && !seenEmails.has(email)) {
        seenEmails.add(email);
        uniqueProfiles.push({ professor: prof, email: email, escola: item.escola });
      }
    });
  }

  const quickRecentProfilesWrap = elements.quickRecentProfilesWrap || document.getElementById('quickRecentProfilesWrap');
  const quickRecentProfilesList = elements.quickRecentProfilesList || document.getElementById('quickRecentProfilesList');

  if (quickRecentProfilesWrap && quickRecentProfilesList) {
    if (uniqueProfiles.length > 0) {
      quickRecentProfilesWrap.classList.remove('hidden');
      quickRecentProfilesList.innerHTML = uniqueProfiles.slice(0, 4).map(p => `
        <button type="button" class="quick-profile-chip" onclick="selectQuickProfile('${escapeHtml(p.professor)}', '${escapeHtml(p.email)}')">
          <div class="quick-chip-info">
            <span class="quick-chip-name">${escapeHtml(p.professor)}</span>
            <span class="quick-chip-email">${escapeHtml(p.email)} • ${escapeHtml(p.escola || '')}</span>
          </div>
          <span class="quick-chip-action"><i class="fa-solid fa-arrow-right"></i> Usar</span>
        </button>
      `).join('');
    } else {
      quickRecentProfilesWrap.classList.add('hidden');
      quickRecentProfilesList.innerHTML = '';
    }
  }

  const quickAuthEmail = elements.quickAuthEmail || document.getElementById('quickAuthEmail');
  const quickAuthNome = elements.quickAuthNome || document.getElementById('quickAuthNome');
  const inputEmail = elements.inputEmail || document.getElementById('inputEmail');
  const inputProfessor = elements.inputProfessor || document.getElementById('inputProfessor');

  // Pré-preenche se o usuário já tiver digitado algo nos campos
  if (quickAuthEmail && inputEmail) {
    quickAuthEmail.value = inputEmail.value || '';
  }
  if (quickAuthNome && inputProfessor) {
    quickAuthNome.value = inputProfessor.value || '';
  }

  const modal = elements.modalGoogleQuickAuth || document.getElementById('modalGoogleQuickAuth');
  openModal(modal);

  setTimeout(() => {
    if (quickAuthEmail && !quickAuthEmail.value) {
      quickAuthEmail.focus();
    } else if (quickAuthNome) {
      quickAuthNome.focus();
    }
  }, 150);
}

/**
 * Seleciona um perfil rápido da lista
 */
function selectQuickProfile(nome, email) {
  closeModal(elements.modalGoogleQuickAuth);
  setGoogleAuthenticatedUser({ name: nome, email: email }, true);
}

/**
 * Submissão do formulário de identificação rápida
 */
function handleQuickAuthSubmit(e) {
  if (e) e.preventDefault();

  const email = (elements.quickAuthEmail ? elements.quickAuthEmail.value : '').toLowerCase().trim();
  const nome = (elements.quickAuthNome ? elements.quickAuthNome.value : '').toUpperCase().trim();

  if (!email || !email.includes('@')) {
    showToast("Por favor, insira um e-mail válido.", "warning");
    if (elements.quickAuthEmail) elements.quickAuthEmail.focus();
    return;
  }

  if (!nome || nome.length < 3) {
    showToast("Por favor, insira o seu nome completo.", "warning");
    if (elements.quickAuthNome) elements.quickAuthNome.focus();
    return;
  }

  closeModal(elements.modalGoogleQuickAuth);
  setGoogleAuthenticatedUser({ name: nome, email: email }, true);
}

/**
 * Callback executado após o professor selecionar a conta Google via GSI
 */
window.handleGoogleCredentialResponse = function(response) {
  if (!response || !response.credential) return;

  const profile = parseJwt(response.credential);
  if (profile && profile.email) {
    setGoogleAuthenticatedUser(profile, true);
  }
};

/**
 * Preenche e trava os dados oficiais da conta do docente
 */
function setGoogleAuthenticatedUser(profile, showFeedback = true) {
  appState.googleUser = profile;

  const email = (profile.email || '').toLowerCase().trim();
  const nome = (profile.name || '').toUpperCase().trim();

  // Salva no armazenamento local para preenchimento com 1 clique sempre
  try {
    localStorage.setItem('presenca_saved_docente', JSON.stringify({
      name: nome,
      email: email,
      picture: profile.picture || ''
    }));
  } catch (e) {
    console.warn("Storage:", e);
  }

  // Preenche os campos do formulário principal
  if (elements.inputEmail) {
    elements.inputEmail.value = email;
    elements.inputEmail.readOnly = true;
    elements.inputEmail.classList.add('input-verified');
  }

  if (elements.inputProfessor) {
    elements.inputProfessor.value = nome;
    elements.inputProfessor.readOnly = true;
    elements.inputProfessor.classList.add('input-verified');
  }

  // Atualiza o card de perfil conectado
  if (elements.googleUserName) elements.googleUserName.textContent = profile.name || nome;
  if (elements.googleUserEmail) elements.googleUserEmail.textContent = email;

  if (profile.picture && elements.googleUserPhoto) {
    elements.googleUserPhoto.src = profile.picture;
    elements.googleUserPhoto.classList.remove('hidden');
    if (elements.googleUserAvatarFallback) elements.googleUserAvatarFallback.classList.add('hidden');
  } else {
    if (elements.googleUserPhoto) elements.googleUserPhoto.classList.add('hidden');
    if (elements.googleUserAvatarFallback) {
      elements.googleUserAvatarFallback.textContent = getInitials(nome || email);
      elements.googleUserAvatarFallback.classList.remove('hidden');
    }
  }

  if (elements.googleBtnWrapper) elements.googleBtnWrapper.classList.add('hidden');
  if (elements.googleConnectedCard) elements.googleConnectedCard.classList.remove('hidden');

  if (showFeedback) {
    showToast(`Identificado como ${profile.name || email}!`, "success");

    // Verifica imediatamente se já existe presença registrada para esse e-mail no encontro de hoje
    const todayBR = normalizeDateBR(new Date().toLocaleDateString('pt-BR'));
    const dup = findDuplicateRecord({ email, professor: nome, date: todayBR });
    if (dup) {
      currentDuplicateRecord = dup;
      if (elements.dupNomeProfessor) elements.dupNomeProfessor.textContent = dup.professor;
      if (elements.dupEmail) elements.dupEmail.textContent = dup.email || email;
      if (elements.dupEscola) elements.dupEscola.textContent = dup.escola;
      if (elements.dupTimestamp) elements.dupTimestamp.textContent = dup.timestamp;
      openModal(elements.modalDuplicado);
      showToast(`Atenção: Presença já registrada para esta conta no encontro de hoje (${todayBR})!`, "warning");
    } else {
      if (elements.selectEscola && !elements.selectEscola.value) {
        elements.selectEscola.focus();
      }
    }
  }
}

/**
 * Desconecta a conta para permitir troca de e-mail / docente
 */
function disconnectGoogleUser() {
  appState.googleUser = null;
  try {
    localStorage.removeItem('presenca_saved_docente');
  } catch (e) {}

  if (elements.inputEmail) {
    elements.inputEmail.readOnly = false;
    elements.inputEmail.classList.remove('input-verified');
    elements.inputEmail.value = '';
  }

  if (elements.inputProfessor) {
    elements.inputProfessor.readOnly = false;
    elements.inputProfessor.classList.remove('input-verified');
    elements.inputProfessor.value = '';
  }

  if (elements.googleConnectedCard) elements.googleConnectedCard.classList.add('hidden');
  if (elements.googleBtnWrapper) {
    elements.googleBtnWrapper.classList.remove('hidden');
  }

  showToast("Identificação limpa. Você pode conectar outra conta ou digitar.", "info");
}

function showReceipt(record) {
  if (elements.receiptEmail) elements.receiptEmail.textContent = record.email || '-';
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
  
  if (appState.googleUser) {
    // Mantém preenchido se o mesmo usuário for registrar novamente ou reseta
    elements.inputEmail.value = appState.googleUser.email || '';
    elements.inputProfessor.value = (appState.googleUser.name || '').toUpperCase();
  }
  
  elements.selectEscola.focus();
}

// ==========================================================================
// Portal do Docente (Minhas Presenças, Histórico & Atestado de Horas)
// ==========================================================================
let currentPortalDocenteData = null;

function switchMainView(viewName) {
  if (viewName === 'portal') {
    // Se invocado, direciona para o painel administrativo se autorizado ou abre modal
    if (appState.isAdminLoggedIn) {
      openAdminPanel();
      switchAdminTab('tabAtestados');
    } else {
      openAdminAuthModal();
    }
    return;
  }

  // Visualização padrão do usuário: Formulário de Presença
  if (elements.successCard && !elements.successCard.classList.contains('hidden')) {
    // Deixa successCard visível se o professor acabou de enviar
  } else {
    if (elements.formCard) elements.formCard.classList.remove('hidden');
  }
}

// Atualiza datalist de sugestões de professores para o atestado no Admin
function atualizarSugestoesAtestado() {
  const datalist = document.getElementById('listaSugestoesAtestado');
  if (!datalist) return;

  const namesSet = new Set();
  const options = [];

  // Docentes do histórico de presenças
  (appState.history || []).forEach(h => {
    const prof = (h.professor || '').trim();
    if (prof && !namesSet.has(prof.toUpperCase())) {
      namesSet.add(prof.toUpperCase());
      options.push({ nome: prof.toUpperCase(), email: (h.email || '').trim().toLowerCase() });
    }
  });

  // Docentes cadastrados no Firestore (base oficial EDM)
  (appState.cadastrados || []).forEach(c => {
    const prof = (c.nome || '').trim();
    if (prof && !namesSet.has(prof.toUpperCase())) {
      namesSet.add(prof.toUpperCase());
      options.push({ nome: prof.toUpperCase(), email: (c.email || '').trim().toLowerCase() });
    }
  });

  options.sort((a, b) => a.nome.localeCompare(b.nome));

  datalist.innerHTML = options.map(opt => {
    const label = opt.email ? `${opt.nome} (${opt.email})` : opt.nome;
    return `<option value="${escapeHtml(opt.nome)}">${escapeHtml(label)}</option>`;
  }).join('');
}

// Abre diretamente o atestado de um docente no Painel Admin
window.abrirAtestadoDocenteAdmin = function(emailOuNome) {
  if (!emailOuNome) return;
  switchAdminTab('tabAtestados');
  if (elements.portalEmailInput) {
    elements.portalEmailInput.value = emailOuNome;
  }
  executarBuscaPortalDocente(emailOuNome);
};

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
}

function executarBuscaPortalDocente(forcedQuery = '') {
  loadHistory();
  const query = (forcedQuery || (elements.portalEmailInput ? elements.portalEmailInput.value : '')).trim();

  if (!query) {
    showToast("Por favor, digite seu e-mail ou nome completo para consultar.", "warning");
    if (elements.portalEmailInput) elements.portalEmailInput.focus();
    return;
  }

  const queryNorm = normalizeName(query);
  const isEmailQuery = query.includes('@');

  // Encontra todos os encontros formativos únicos registrados no sistema
  const allMeetingDates = getUniqueMeetingDates(appState.history);
  const effectiveDates = allMeetingDates.length > 0 ? allMeetingDates : [normalizeDateBR(new Date().toLocaleDateString('pt-BR'))];

  // Busca registros do professor (remotos e locais)
  const teacherRecords = appState.history.filter(record => {
    const recEmail = (record.email || '').trim().toLowerCase();
    const recProf = normalizeName(record.professor);

    if (isEmailQuery) {
      return recEmail === query.toLowerCase();
    }
    return recProf === queryNorm || recProf.includes(queryNorm) || queryNorm.includes(recProf);
  });

  // Tenta cruzar com o cadastro oficial (Firestore)
  let cadastroOficial = null;
  if (appState.cadastrados && appState.cadastrados.length > 0) {
    cadastroOficial = appState.cadastrados.find(cad => {
      const cadNorm = normalizeName(cad.nome);
      return cadNorm === queryNorm || (teacherRecords.length > 0 && normalizeName(teacherRecords[0].professor) === cadNorm);
    });
  }

  if (teacherRecords.length === 0) {
    if (elements.portalEmptyState) elements.portalEmptyState.classList.add('hidden');
    if (elements.portalResultContainer) elements.portalResultContainer.classList.add('hidden');
    if (elements.portalNotFoundState) {
      elements.portalNotFoundState.classList.remove('hidden');
      if (elements.portalNotFoundMsg) {
        elements.portalNotFoundMsg.textContent = `Não localizamos presenças computadas para "${query}".`;
      }
    }
    currentPortalDocenteData = null;
    return;
  }

  // Identifica nome, e-mail e unidade escolar
  const primaryRecord = teacherRecords[0];
  const nomeFinal = primaryRecord.professor || (cadastroOficial ? cadastroOficial.nome : query.toUpperCase());
  const emailFinal = primaryRecord.email || query.toLowerCase();
  const escolaFinal = primaryRecord.escola || (cadastroOficial ? cadastroOficial.escola : 'Não informada');

  // Mapeia presenças por data única
  const presencasPorDia = new Map();
  teacherRecords.forEach(rec => {
    const d = extractDateFromTimestamp(rec.timestamp, rec.date);
    if (d && !presencasPorDia.has(d)) {
      presencasPorDia.set(d, rec);
    }
  });

  const totalEncontros = effectiveDates.length;
  const presencasConfirmadas = presencasPorDia.size;
  const taxaPresenca = Math.min(100, Math.round((presencasConfirmadas / totalEncontros) * 100));
  const cargaHorariaPorEncontro = 4; // 4 horas por encontro presencial
  const cargaHorariaTotal = presencasConfirmadas * cargaHorariaPorEncontro;

  currentPortalDocenteData = {
    nome: nomeFinal,
    email: emailFinal,
    escola: escolaFinal,
    totalEncontros: totalEncontros,
    presencasCount: presencasConfirmadas,
    taxa: taxaPresenca,
    cargaHoraria: cargaHorariaTotal,
    dates: effectiveDates,
    presencasPorDia: presencasPorDia,
    rawRecords: teacherRecords
  };

  renderPortalDocenteUI(currentPortalDocenteData);
}

function renderPortalDocenteUI(data) {
  if (!data) return;

  if (elements.portalEmptyState) elements.portalEmptyState.classList.add('hidden');
  if (elements.portalNotFoundState) elements.portalNotFoundState.classList.add('hidden');
  if (elements.portalResultContainer) elements.portalResultContainer.classList.remove('hidden');

  if (elements.portalAvatarBadge) {
    elements.portalAvatarBadge.textContent = getInitials(data.nome);
  }
  if (elements.portalNomeDocente) elements.portalNomeDocente.textContent = data.nome;
  if (elements.portalEmailDocente) elements.portalEmailDocente.textContent = data.email;
  if (elements.portalEscolaDocente) {
    elements.portalEscolaDocente.innerHTML = `<i class="fa-solid fa-school"></i> ${data.escola}`;
  }

  if (elements.portalKpiTotalEncontros) elements.portalKpiTotalEncontros.textContent = data.totalEncontros;
  if (elements.portalKpiPresencas) elements.portalKpiPresencas.textContent = data.presencasCount;
  if (elements.portalKpiTaxa) elements.portalKpiTaxa.textContent = `${data.taxa}%`;
  if (elements.portalKpiCargaHoraria) elements.portalKpiCargaHoraria.textContent = `${data.cargaHoraria}h`;

  // Renderiza a lista de encontros
  if (elements.portalTimelineList) {
    elements.portalTimelineList.innerHTML = '';

    data.dates.forEach((mDate, idx) => {
      const presenca = data.presencasPorDia.get(mDate);
      const isPresente = !!presenca;

      const item = document.createElement('div');
      item.className = `portal-meeting-item ${isPresente ? 'presente' : 'ausente'}`;
      
      item.innerHTML = `
        <div class="portal-meeting-left">
          <div class="portal-meeting-date">
            <i class="fa-regular fa-calendar-check text-primary"></i>
            <span>${idx + 1}º Encontro Formativo • ${formatDateDisplayPT(mDate)}</span>
          </div>
          <div class="portal-meeting-detail">
            ${isPresente 
              ? `<i class="fa-solid fa-check text-success"></i> Registrado em ${presenca.timestamp} • Unidade: <strong>${presenca.escola}</strong> • Carga: <strong>4 horas</strong>` 
              : `<i class="fa-solid fa-xmark text-danger"></i> Ausência registrada neste encontro formativo`}
          </div>
        </div>
        <div class="portal-meeting-right">
          ${isPresente 
            ? `<span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> Presente</span>` 
            : `<span class="badge badge-danger"><i class="fa-solid fa-circle-xmark"></i> Ausente</span>`}
        </div>
      `;
      elements.portalTimelineList.appendChild(item);
    });
  }

  // Prepara o documento timbrado do atestado
  prepararAtestadoDocumento(data);
}

function prepararAtestadoDocumento(data) {
  if (!data) return;

  if (elements.certDocenteNome) elements.certDocenteNome.textContent = data.nome;
  if (elements.certDocenteEmail) elements.certDocenteEmail.textContent = data.email;
  if (elements.certDocenteEscola) elements.certDocenteEscola.textContent = data.escola;
  if (elements.certDocenteTaxa) elements.certDocenteTaxa.textContent = `${data.taxa}%`;
  if (elements.certDocenteCarga) elements.certDocenteCarga.textContent = `${data.cargaHoraria} horas`;
  if (elements.certSigDocenteNome) elements.certSigDocenteNome.textContent = data.nome;

  const now = new Date();
  const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const dataExtenso = `${now.getDate()} de ${meses[now.getMonth()]} de ${now.getFullYear()}`;
  if (elements.certDataEmissao) elements.certDataEmissao.textContent = dataExtenso;

  const authCode = `EDM-CERT-${hashString(data.email + data.nome + data.presencasCount)}`;
  if (elements.certCodigoAutenticidade) elements.certCodigoAutenticidade.textContent = authCode;

  // Preenche a tabela do atestado
  if (elements.certTbodyEncontros) {
    elements.certTbodyEncontros.innerHTML = '';
    data.dates.forEach((mDate, idx) => {
      const presenca = data.presencasPorDia.get(mDate);
      const isPresente = !!presenca;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight: bold; width: 40px; text-align: center;">${idx + 1}</td>
        <td><strong>${idx + 1}º Encontro Formativo EDM</strong></td>
        <td>${mDate}</td>
        <td>${isPresente ? presenca.timestamp : '-'}</td>
        <td style="font-weight: bold;">${isPresente ? '4 horas' : '0 horas'}</td>
        <td>
          <span style="font-weight: bold; color: ${isPresente ? '#15803d' : '#b91c1c'};">
            ${isPresente ? '✔ Presença Confirmada' : '✖ Não Compareceu'}
          </span>
        </td>
      `;
      elements.certTbodyEncontros.appendChild(tr);
    });
  }
}

async function emitirAtestadoDocente() {
  if (!currentPortalDocenteData) {
    showToast("Consulte seus dados primeiro para gerar a declaração.", "warning");
    return;
  }

  if (currentPortalDocenteData.presencasCount === 0) {
    showToast("Nenhuma presença confirmada para emissão do atestado.", "warning");
    return;
  }

  prepararAtestadoDocumento(currentPortalDocenteData);

  const docEl = document.getElementById('atestadoDocumentCard');
  if (!docEl) return;

  showToast("Gerando Declaração Oficial em PDF...", "info");

  const safeName = currentPortalDocenteData.nome.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const opt = {
    margin: [8, 8, 8, 8],
    filename: `Declaracao_Frequencia_EDM_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  try {
    if (window.html2pdf) {
      await window.html2pdf().set(opt).from(docEl).save();
      showToast("Declaração Oficial baixada com sucesso!", "success");
    } else {
      window.print();
    }
  } catch (err) {
    console.error("Erro ao gerar PDF do atestado:", err);
    window.print();
  }
}

function imprimirAtestadoDocente() {
  if (!currentPortalDocenteData) {
    showToast("Consulte seus dados primeiro para imprimir o atestado.", "warning");
    return;
  }
  prepararAtestadoDocumento(currentPortalDocenteData);
  document.body.classList.add('printing-atestado');
  window.print();
  setTimeout(() => {
    document.body.classList.remove('printing-atestado');
  }, 1000);
}

window.executarBuscaPortalDocente = executarBuscaPortalDocente;
window.emitirAtestadoDocente = emitirAtestadoDocente;
window.imprimirAtestadoDocente = imprimirAtestadoDocente;
window.switchMainView = switchMainView;

// ==========================================================================
// Autenticação Administrativa (Senha: admin123)
// ==========================================================================
function openAuthModal() {
  openModal(elements.modalAdminAuth || 'modalAdminAuth');
  try {
    const passInput = elements.adminPasswordInput || document.getElementById('adminPasswordInput');
    if (passInput) {
      passInput.value = '';
      passInput.type = 'password';
      setTimeout(() => passInput.focus(), 100);
    }
    const icon = elements.passwordToggleIcon || document.getElementById('passwordToggleIcon');
    if (icon) icon.className = 'fa-regular fa-eye';
    const err = elements.authErrorMessage || document.getElementById('authErrorMessage');
    if (err) err.classList.add('hidden');
  } catch (e) {}
}

function handleAuthSubmit(e) {
  e.preventDefault();
  const inputPass = elements.adminPasswordInput ? elements.adminPasswordInput.value : (document.getElementById('adminPasswordInput')?.value || '');

  if (inputPass === ADMIN_PASSWORD) {
    setAdminState(true);
    closeModal(elements.modalAdminAuth || 'modalAdminAuth');
    showToast("Acesso administrativo liberado!", "success");
    openAdminPanel();
  } else {
    const err = elements.authErrorMessage || document.getElementById('authErrorMessage');
    if (err) err.classList.remove('hidden');
    const passInput = elements.adminPasswordInput || document.getElementById('adminPasswordInput');
    if (passInput) {
      passInput.focus();
      passInput.select();
    }
  }
}

function togglePasswordVisibility() {
  const passInput = elements.adminPasswordInput || document.getElementById('adminPasswordInput');
  if (!passInput) return;
  const isPass = passInput.type === 'password';
  passInput.type = isPass ? 'text' : 'password';
  const icon = elements.passwordToggleIcon || document.getElementById('passwordToggleIcon');
  if (icon) {
    icon.className = isPass ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
  }
}

function handleAdminLogout() {
  setAdminState(false);
  stopSyncTimer();
  closeModal(elements.modalAdminPanel || 'modalAdminPanel');
  closeModal(elements.modalAdminAuth || 'modalAdminAuth');
  closeModal(elements.modalDuplicado || 'modalDuplicado');
  showToast("Você saiu da área administrativa.", "info");
}

function toggleAdminPanelDirect() {
  try {
    if (appState.isAdmin || sessionStorage.getItem('presenca_admin_auth') === 'true') {
      appState.isAdmin = true;
      openAdminPanel();
    } else {
      openAuthModal();
    }
  } catch (err) {
    console.error("Erro ao abrir painel admin:", err);
    openModal('modalAdminPanel');
  }
}

window.toggleAdminPanelDirect = toggleAdminPanelDirect;
window.openAuthModal = openAuthModal;
window.openAdminPanel = openAdminPanel;
window.handleAdminLogout = handleAdminLogout;

// ==========================================================================
// Painel Administrativo
// ==========================================================================
function openAdminPanel() {
  loadConfig();

  // 1. Abre o modal PRIMEIRO para garantir visibilidade imediata
  openModal(elements.modalAdminPanel || 'modalAdminPanel');

  // 2. Restaura preferência de KPIs colapsados se salvo
  try {
    if (localStorage.getItem('admin_kpis_collapsed') === 'true') {
      const tab = document.getElementById('tabHistorico');
      const label = document.getElementById('toggleKPIsLabel');
      if (tab) tab.classList.add('kpis-collapsed');
      if (label) label.textContent = 'Mostrar Métricas';
    }
  } catch (e) {}

  // 3. Renderiza tabela com proteção contra erros
  try {
    renderHistoryTable();
  } catch (err) {
    console.error("Erro ao renderizar tabela no painel:", err);
  }

  // 4. Executa sincronização em tempo real e inicia ciclo de atualização
  try {
    syncRealTime(false);
    startSyncTimer();
  } catch (err) {
    console.warn("Erro ao iniciar sincronização:", err);
  }
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

  if (targetTabId === 'tabRelatorios') {
    updateRelatorioDateSelect();
    const selectedSchool = elements.relatorioEscolaSelect ? elements.relatorioEscolaSelect.value : '';
    const selectedDate = elements.relatorioDataSelect ? elements.relatorioDataSelect.value : '';
    renderManagementReport(selectedSchool, selectedDate);
  } else if (targetTabId === 'tabHistorico') {
    renderHistoryTable();
  } else if (targetTabId === 'tabAuditoriaFaltas') {
    updateAuditoriaDateSelect();
    renderAuditoriaUI();
  } else if (targetTabId === 'tabAtestados') {
    atualizarSugestoesAtestado();
  }
}

// Retorna iniciais do nome para o avatar
function getInitials(name) {
  if (!name) return 'PR';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Atualiza os Cards de KPIs e as pílulas de contagem por escola
function updateKPIsAndSchools(records) {
  records = records || appState.history || [];
  const total = records.length;
  const ALL_SCHOOLS = ["ALZIRA ACRA", "ANNA BONAGURA", "BRAGA MORATO", "CAIC", "CÉLIA BUENO", "ESTHER VIANNA", "PADRE BENITO"];

  // Contagem por escola
  const schoolCounts = {};
  ALL_SCHOOLS.forEach(s => schoolCounts[s] = 0);
  
  records.forEach(r => {
    const sName = (r.escola || '').trim().toUpperCase();
    if (schoolCounts[sName] !== undefined) {
      schoolCounts[sName]++;
    } else if (sName) {
      schoolCounts[sName] = (schoolCounts[sName] || 0) + 1;
    }
  });

  const activeSchoolsCount = Object.values(schoolCounts).filter(c => c > 0).length;
  const remoteCount = records.filter(r => r.isRemote).length;
  const remotePercent = total > 0 ? Math.round((remoteCount / total) * 100) : 100;

  // Atualiza KPIs
  if (elements.kpiTotalPresencas) elements.kpiTotalPresencas.textContent = total;
  if (elements.kpiTotalSub) elements.kpiTotalSub.textContent = `${total} docente${total !== 1 ? 's' : ''} registrado${total !== 1 ? 's' : ''}`;
  if (elements.kpiEscolasAtivas) elements.kpiEscolasAtivas.textContent = `${activeSchoolsCount} / ${ALL_SCHOOLS.length}`;
  if (elements.kpiNuvemStatus) elements.kpiNuvemStatus.textContent = `${remotePercent}% Nuvem`;
  if (elements.kpiNuvemSub) elements.kpiNuvemSub.textContent = `${remoteCount} da planilha Google`;

  if (records.length > 0) {
    const latest = records[0];
    const timeMatch = (latest.timestamp || '').match(/([0-9]{2}:[0-9]{2})/);
    const displayTimeStr = timeMatch ? timeMatch[1] : (latest.time || '--:--');
    if (elements.kpiUltimoRegistro) elements.kpiUltimoRegistro.textContent = displayTimeStr;
    if (elements.kpiUltimoNome) elements.kpiUltimoNome.textContent = latest.professor ? latest.professor.split(' ')[0] : 'Registrado';
  } else {
    if (elements.kpiUltimoRegistro) elements.kpiUltimoRegistro.textContent = '--:--';
    if (elements.kpiUltimoNome) elements.kpiUltimoNome.textContent = 'Aguardando envios';
  }

  // Renderiza Pílulas de Escolas
  if (elements.schoolBadgesContainer) {
    const currentSchoolFilter = elements.filtroEscolaSelect ? elements.filtroEscolaSelect.value : '';
    
    let html = `
      <div class="school-pill ${!currentSchoolFilter ? 'active' : ''}" data-school="">
        <span>🏫 Todas</span>
        <span class="school-pill-count">${total}</span>
      </div>
    `;

    ALL_SCHOOLS.forEach(school => {
      const count = schoolCounts[school] || 0;
      const isActive = currentSchoolFilter === school;
      html += `
        <div class="school-pill ${isActive ? 'active' : ''}" data-school="${escapeHtml(school)}">
          <span>${escapeHtml(school)}</span>
          <span class="school-pill-count">${count}</span>
        </div>
      `;
    });

    elements.schoolBadgesContainer.innerHTML = html;

    // Adiciona evento de clique nas pílulas para filtrar a tabela
    elements.schoolBadgesContainer.querySelectorAll('.school-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const targetSchool = pill.getAttribute('data-school');
        if (elements.filtroEscolaSelect) {
          elements.filtroEscolaSelect.value = targetSchool;
        }
        renderHistoryTable();
      });
    });
  }
}

// Renderiza a Tabela do Histórico Geral com visual moderno
function renderHistoryTable() {
  loadHistory();
  updateHistoricoDateSelect();
  const container = elements.historicoContainer;
  const textFilter = (elements.filtroHistorico ? elements.filtroHistorico.value.trim().toLowerCase() : '');
  const schoolFilter = (elements.filtroEscolaSelect ? elements.filtroEscolaSelect.value.trim().toUpperCase() : '');
  const dateFilter = (elements.filtroDataSelect ? elements.filtroDataSelect.value.trim() : '');
  const sortOrder = (elements.ordemHistoricoSelect ? elements.ordemHistoricoSelect.value : 'recent');

  // Atualiza KPIs com registros da data selecionada (ou todos se nenhuma data estiver selecionada)
  const recordsForKPIs = dateFilter
    ? appState.history.filter(item => extractDateFromTimestamp(item.timestamp, item.date) === dateFilter)
    : appState.history;
  updateKPIsAndSchools(recordsForKPIs);

  // Filtra registros
  let filtered = appState.history.filter(item => {
    // Filtro por Data do Encontro
    if (dateFilter) {
      const itemDate = extractDateFromTimestamp(item.timestamp, item.date);
      if (itemDate !== dateFilter) {
        return false;
      }
    }

    // Filtro por Escola
    if (schoolFilter && (item.escola || '').trim().toUpperCase() !== schoolFilter) {
      return false;
    }

    // Filtro por Texto (Nome, E-mail, Escola, Horário)
    if (textFilter) {
      const matchName = item.professor && item.professor.toLowerCase().includes(textFilter);
      const matchEmail = item.email && item.email.toLowerCase().includes(textFilter);
      const matchSchool = item.escola && item.escola.toLowerCase().includes(textFilter);
      const matchTime = item.timestamp && item.timestamp.toLowerCase().includes(textFilter);
      if (!matchName && !matchEmail && !matchSchool && !matchTime) {
        return false;
      }
    }

    return true;
  });

  // Ordenação
  filtered = [...filtered];
  if (sortOrder === 'oldest') {
    filtered.reverse();
  } else if (sortOrder === 'name_asc') {
    filtered.sort((a, b) => (a.professor || '').localeCompare(b.professor || ''));
  } else if (sortOrder === 'name_desc') {
    filtered.sort((a, b) => (b.professor || '').localeCompare(a.professor || ''));
  } else if (sortOrder === 'school') {
    filtered.sort((a, b) => (a.escola || '').localeCompare(b.escola || '') || (a.professor || '').localeCompare(b.professor || ''));
  }

  if (elements.totalPresencasBadge) {
    elements.totalPresencasBadge.textContent = `${filtered.length} registro${filtered.length !== 1 ? 's' : ''}`;
  }

  const targetContainer = container || elements.historicoContainer || document.getElementById('historicoContainer');
  if (!targetContainer) return;

  targetContainer.innerHTML = '';

  if (filtered.length === 0) {
    targetContainer.innerHTML = `
      <div style="text-align:center; padding: 3rem 1.5rem; color: #64748b;">
        <i class="fa-solid fa-folder-open" style="font-size: 2.25rem; margin-bottom: 0.75rem; color: #cbd5e1;"></i>
        <p style="font-weight:600; font-size:1rem;">Nenhum registro encontrado para os filtros selecionados.</p>
        <p style="font-size:0.85rem; color:#94a3b8; margin-top:0.25rem;">Tente limpar a busca ou selecionar outra escola.</p>
      </div>
    `;
    return;
  }

  const table = document.createElement('table');
  table.className = 'historico-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th style="width: 36px; min-width: 36px; text-align: center;">#</th>
        <th style="min-width: 170px;">Professor(a)</th>
        <th style="min-width: 170px;">E-mail</th>
        <th style="min-width: 130px;">Unidade Escolar</th>
        <th style="width: 135px; min-width: 135px;">Data / Horário</th>
        <th style="width: 75px; min-width: 75px; text-align: center;">Origem</th>
        <th style="width: 75px; min-width: 75px; text-align: center;">Ações</th>
      </tr>
    </thead>
    <tbody>
      ${filtered.map((h, i) => {
        const initials = getInitials(h.professor);
        return `
          <tr>
            <td style="font-weight:700; color:#64748b; text-align:center;">${i + 1}</td>
            <td>
              <div class="user-cell">
                <div class="user-avatar-circle">${escapeHtml(initials)}</div>
                <div class="user-details">
                  <span class="user-name-text">${escapeHtml(h.professor)}</span>
                  ${h.isEdited ? `<span class="badge badge-sm" style="background:#fef3c7; color:#b45309; font-size:0.65rem; margin-top:2px;"><i class="fa-solid fa-pen"></i> Editado</span>` : ''}
                </div>
              </div>
            </td>
            <td>
              <div class="email-cell-wrapper">
                <span class="email-text" title="${escapeHtml(h.email || '')}">${escapeHtml(h.email || '-')}</span>
                ${h.email ? `
                  <button type="button" class="btn-copy-email" onclick="copyEmailToClipboard('${escapeHtml(h.email)}', this)" title="Copiar e-mail">
                    <i class="fa-regular fa-copy"></i>
                  </button>
                ` : ''}
              </div>
            </td>
            <td>
              <span class="school-badge-tag">
                <i class="fa-solid fa-school"></i> ${escapeHtml(h.escola)}
              </span>
            </td>
            <td style="color:#475569; font-size:0.8rem; white-space:nowrap;">
              <i class="fa-regular fa-clock" style="color:#94a3b8; margin-right:4px;"></i>${escapeHtml(h.timestamp)}
            </td>
            <td style="text-align:center;">
              ${h.isRemote 
                ? `<span class="badge badge-success" style="font-size:0.7rem; padding: 2px 6px;" title="Sincronizado da Nuvem Google"><i class="fa-solid fa-cloud"></i> Nuvem</span>`
                : `<span class="badge" style="background:#f1f5f9; color:#475569; font-size:0.7rem; padding: 2px 6px;" title="Salvo neste dispositivo"><i class="fa-solid fa-hard-drive"></i> Local</span>`
              }
            </td>
            <td style="text-align:center; white-space:nowrap;">
              <button type="button" class="btn-table-action" onclick="abrirAtestadoDocenteAdmin('${escapeHtml(h.email || h.professor)}')" title="Ver Presenças & Atestado deste Professor">
                <i class="fa-solid fa-graduation-cap text-success"></i>
              </button>
              <button type="button" class="btn-table-action" onclick="abrirModalEdicaoRegistro('${escapeHtml(h.id)}')" title="Editar Registro">
                <i class="fa-solid fa-pen-to-square text-primary"></i>
              </button>
              <button type="button" class="btn-table-action" onclick="excluirRegistroAdmin('${escapeHtml(h.id)}')" title="Excluir Presença">
                <i class="fa-solid fa-trash-can text-danger"></i>
              </button>
            </td>
          </tr>
        `;
      }).join('')}
    </tbody>
  `;
  container.appendChild(table);
}

// Copia o e-mail para a área de transferência com feedback
window.copyEmailToClipboard = function(email, btn) {
  if (!email) return;
  navigator.clipboard.writeText(email).then(() => {
    if (btn) {
      btn.innerHTML = `<i class="fa-solid fa-check text-success"></i>`;
      setTimeout(() => {
        btn.innerHTML = `<i class="fa-regular fa-copy"></i>`;
      }, 1500);
    }
    showToast(`E-mail ${email} copiado!`, "success");
  }).catch(() => {
    showToast("Não foi possível copiar o e-mail.", "error");
  });
};

// Alterna Tela Cheia no Painel Administrativo
window.toggleAdminFullscreen = function() {
  const modalDialog = document.querySelector('#modalAdminPanel .modal-dialog');
  const btn = document.getElementById('btnAdminFullscreen');
  if (modalDialog) {
    modalDialog.classList.toggle('modal-fullscreen');
    const isFull = modalDialog.classList.contains('modal-fullscreen');
    if (btn) {
      btn.innerHTML = isFull 
        ? `<i class="fa-solid fa-compress"></i> <span>Restaurar</span>`
        : `<i class="fa-solid fa-expand"></i> <span>Tela Cheia</span>`;
      btn.title = isFull ? 'Restaurar tamanho padrão' : 'Alternar Tela Cheia para ver todos os registros';
    }
  }
};

// Alterna Exibição dos KPIs para maximizar a área da tabela
window.toggleKPIsVisibility = function() {
  const tab = document.getElementById('tabHistorico');
  const label = document.getElementById('toggleKPIsLabel');
  if (tab) {
    tab.classList.toggle('kpis-collapsed');
    const isCollapsed = tab.classList.contains('kpis-collapsed');
    if (label) {
      label.textContent = isCollapsed ? 'Mostrar Métricas' : 'Ocultar Métricas';
    }
    try {
      localStorage.setItem('admin_kpis_collapsed', isCollapsed ? 'true' : 'false');
    } catch (e) {}
  }
};

// ==========================================================================
// Módulo de Edição e Gestão Administrativa de Presenças
// ==========================================================================
function abrirModalEdicaoRegistro(recordId) {
  loadHistory();
  if (recordId) {
    const record = appState.history.find(h => String(h.id) === String(recordId));
    if (!record) {
      showToast("Registro não localizado.", "error");
      return;
    }
    if (elements.modalEditarTitulo) elements.modalEditarTitulo.textContent = "Editar Registro de Presença";
    if (elements.editRecordId) elements.editRecordId.value = record.id;
    if (elements.editNomeProfessor) elements.editNomeProfessor.value = record.professor || '';
    if (elements.editEmailProfessor) elements.editEmailProfessor.value = record.email || '';
    if (elements.editSelectEscola) elements.editSelectEscola.value = record.escola || 'ALZIRA ACRA';
    
    const recDate = record.date || extractDateFromTimestamp(record.timestamp) || normalizeDateBR(new Date().toLocaleDateString('pt-BR'));
    if (elements.editDataEncontro) elements.editDataEncontro.value = recDate;

    // Extrai horário
    let recTime = '';
    if (record.timestamp) {
      const match = record.timestamp.match(/(\d{1,2}:\d{2}(?::\d{2})?)/);
      if (match) recTime = match[1];
    }
    if (!recTime) {
      recTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    if (elements.editHoraEncontro) elements.editHoraEncontro.value = recTime;

    if (elements.btnExcluirDentroDoModal) elements.btnExcluirDentroDoModal.classList.remove('hidden');
  } else {
    // Modo Nova Presença Manual
    if (elements.modalEditarTitulo) elements.modalEditarTitulo.textContent = "Lançar Nova Presença Oficial";
    if (elements.editRecordId) elements.editRecordId.value = '';
    if (elements.editNomeProfessor) elements.editNomeProfessor.value = '';
    if (elements.editEmailProfessor) elements.editEmailProfessor.value = '';
    if (elements.editSelectEscola) elements.editSelectEscola.value = 'ALZIRA ACRA';
    if (elements.editDataEncontro) elements.editDataEncontro.value = normalizeDateBR(new Date().toLocaleDateString('pt-BR'));
    if (elements.editHoraEncontro) elements.editHoraEncontro.value = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (elements.btnExcluirDentroDoModal) elements.btnExcluirDentroDoModal.classList.add('hidden');
  }

  openModal(elements.modalEditarRegistro);
}

function salvarEdicaoRegistro(e) {
  if (e) e.preventDefault();

  const id = elements.editRecordId ? elements.editRecordId.value : '';
  const professor = (elements.editNomeProfessor ? elements.editNomeProfessor.value : '').trim().toUpperCase();
  const email = (elements.editEmailProfessor ? elements.editEmailProfessor.value : '').trim().toLowerCase();
  const escola = elements.editSelectEscola ? elements.editSelectEscola.value : 'ALZIRA ACRA';
  const dataRaw = (elements.editDataEncontro ? elements.editDataEncontro.value : '').trim();
  const horaRaw = (elements.editHoraEncontro ? elements.editHoraEncontro.value : '').trim();

  if (!professor || professor.length < 3) {
    showToast("Por favor, digite o nome completo do docente.", "warning");
    if (elements.editNomeProfessor) elements.editNomeProfessor.focus();
    return;
  }

  if (!email || !email.includes('@')) {
    showToast("Por favor, digite um e-mail válido.", "warning");
    if (elements.editEmailProfessor) elements.editEmailProfessor.focus();
    return;
  }

  const dateNorm = normalizeDateBR(dataRaw) || normalizeDateBR(new Date().toLocaleDateString('pt-BR'));
  const timeNorm = horaRaw || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const timestampFinal = `${dateNorm} às ${timeNorm}`;

  loadHistory();

  if (id) {
    // Atualização de registro existente
    const idx = appState.history.findIndex(h => String(h.id) === String(id));
    if (idx !== -1) {
      const updated = {
        ...appState.history[idx],
        professor: professor,
        email: email,
        escola: escola,
        date: dateNorm,
        timestamp: timestampFinal,
        isEdited: true
      };
      appState.history[idx] = updated;
      saveEditedRecord(id, updated);
      showToast("Registro de presença atualizado com sucesso!", "success");
    }
  } else {
    // Inserção de novo registro manual
    const newRecord = {
      id: `admin_manual_${Date.now()}`,
      professor: professor,
      email: email,
      escola: escola,
      date: dateNorm,
      timestamp: timestampFinal,
      isRemote: false,
      isEdited: true
    };
    appState.history.unshift(newRecord);
    saveEditedRecord(newRecord.id, newRecord);
    showToast("Nova presença lançada com sucesso!", "success");
  }

  localStorage.setItem('presenca_history_records', JSON.stringify(appState.history));
  closeModal(elements.modalEditarRegistro);

  renderHistoryTable();
  updateRelatorioDateSelect();
  updateAuditoriaDateSelect();
  renderAuditoriaUI();
  const activeTab = document.querySelector('.admin-tab-btn.active')?.getAttribute('data-tab');
  if (activeTab === 'tabRelatorios') {
    const selectedSchool = elements.relatorioEscolaSelect ? elements.relatorioEscolaSelect.value : '';
    const selectedDate = elements.relatorioDataSelect ? elements.relatorioDataSelect.value : '';
    renderManagementReport(selectedSchool, selectedDate);
  }
}

function excluirRegistroAdmin(recordId) {
  if (!recordId) return;
  loadHistory();
  const record = appState.history.find(h => String(h.id) === String(recordId));
  if (!record) {
    showToast("Registro não localizado.", "error");
    return;
  }

  const confirmMsg = `Tem certeza que deseja excluir permanentemente a presença de:\n\n• Docente: ${record.professor}\n• Unidade: ${record.escola}\n• Data: ${record.date || record.timestamp}?`;
  if (!confirm(confirmMsg)) return;

  // Salva assinatura da exclusão para persistir em futuras sincronizações da nuvem
  const profNorm = normalizeName(record.professor);
  const emailNorm = (record.email || '').trim().toLowerCase();
  const dateNorm = record.date || extractDateFromTimestamp(record.timestamp);

  if (emailNorm && dateNorm) saveDeletedSignature(`${emailNorm}_${dateNorm}`);
  if (profNorm && dateNorm) saveDeletedSignature(`${profNorm}_${dateNorm}`);
  if (record.timestamp) saveDeletedSignature(`${emailNorm || profNorm}_${record.timestamp}`);
  if (record.id) saveDeletedSignature(String(record.id));

  // Remove de appState.history
  appState.history = appState.history.filter(h => String(h.id) !== String(recordId));
  localStorage.setItem('presenca_history_records', JSON.stringify(appState.history));

  closeModal(elements.modalEditarRegistro);
  showToast("Presença excluída com sucesso!", "info");

  renderHistoryTable();
  updateRelatorioDateSelect();
  updateAuditoriaDateSelect();
  renderAuditoriaUI();
  const activeTab = document.querySelector('.admin-tab-btn.active')?.getAttribute('data-tab');
  if (activeTab === 'tabRelatorios') {
    const selectedSchool = elements.relatorioEscolaSelect ? elements.relatorioEscolaSelect.value : '';
    const selectedDate = elements.relatorioDataSelect ? elements.relatorioDataSelect.value : '';
    renderManagementReport(selectedSchool, selectedDate);
  }
}

window.abrirModalEdicaoRegistro = abrirModalEdicaoRegistro;
window.excluirRegistroAdmin = excluirRegistroAdmin;
window.salvarEdicaoRegistro = salvarEdicaoRegistro;

// ==========================================================================
// Módulo de Relatório Executivo para a Gestão Escolar
// ==========================================================================
function renderManagementReport(schoolFilter = '', dateFilter = '') {
  loadHistory();
  const ALL_SCHOOLS = ["ALZIRA ACRA", "ANNA BONAGURA", "BRAGA MORATO", "CAIC", "CÉLIA BUENO", "ESTHER VIANNA", "PADRE BENITO"];

  const effectiveSchool = schoolFilter !== undefined && schoolFilter !== null ? schoolFilter : (elements.relatorioEscolaSelect ? elements.relatorioEscolaSelect.value : '');
  const effectiveDate = dateFilter !== undefined && dateFilter !== null ? dateFilter : (elements.relatorioDataSelect ? elements.relatorioDataSelect.value : '');

  // 1. Filtra registros por escola
  const schoolRecords = appState.history.filter(item => {
    if (!effectiveSchool) return true;
    return (item.escola || '').trim().toUpperCase() === effectiveSchool.trim().toUpperCase();
  });

  // 2. Extrai datas de encontro disponíveis
  const availableDates = getUniqueMeetingDates(schoolRecords);

  // 3. Filtra registros finais se uma data específica foi selecionada
  let filtered = schoolRecords;
  if (effectiveDate) {
    filtered = schoolRecords.filter(item => extractDateFromTimestamp(item.timestamp, item.date) === effectiveDate);
  }

  const now = new Date();
  const emissaoStr = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Metadados do Relatório
  if (elements.repDataEmissao) elements.repDataEmissao.textContent = emissaoStr;
  if (elements.repEscolaNome) elements.repEscolaNome.textContent = effectiveSchool || "Todas as Unidades Escolares";
  if (elements.repTotalPresentes) elements.repTotalPresentes.textContent = filtered.length;
  if (elements.repFooterTimestamp) {
    elements.repFooterTimestamp.textContent = `Documento emitido em ${emissaoStr} | Total: ${filtered.length} participantes homologados.`;
  }

  // Rótulo dinâmico do Encontro Formativo no cabeçalho
  if (elements.repEncontroData) {
    if (effectiveDate) {
      elements.repEncontroData.textContent = formatDateDisplayPT(effectiveDate);
    } else if (availableDates.length > 1) {
      elements.repEncontroData.textContent = `Encontros Formativos (${availableDates.length} dias de encontro)`;
    } else if (availableDates.length === 1) {
      elements.repEncontroData.textContent = formatDateDisplayPT(availableDates[0]);
    } else {
      elements.repEncontroData.textContent = 'Data Não Registrada';
    }
  }

  // Contagem por escola
  const schoolCounts = {};
  ALL_SCHOOLS.forEach(s => schoolCounts[s] = 0);
  filtered.forEach(r => {
    const sName = (r.escola || '').trim().toUpperCase();
    if (schoolCounts[sName] !== undefined) {
      schoolCounts[sName]++;
    } else if (sName) {
      schoolCounts[sName] = (schoolCounts[sName] || 0) + 1;
    }
  });

  const activeCount = Object.values(schoolCounts).filter(c => c > 0).length;
  if (elements.repUnidadesCount) elements.repUnidadesCount.textContent = `${activeCount} unidade${activeCount !== 1 ? 's' : ''}`;

  if (filtered.length > 0) {
    const firstReg = filtered[filtered.length - 1];
    const lastReg = filtered[0];
    const firstTimeMatch = (firstReg.timestamp || '').match(/([0-9]{2}:[0-9]{2})/);
    const lastTimeMatch = (lastReg.timestamp || '').match(/([0-9]{2}:[0-9]{2})/);
    if (elements.repPrimeiroRegistro) elements.repPrimeiroRegistro.textContent = firstTimeMatch ? firstTimeMatch[1] : '--:--';
    if (elements.repUltimoRegistro) elements.repUltimoRegistro.textContent = lastTimeMatch ? lastTimeMatch[1] : '--:--';
  } else {
    if (elements.repPrimeiroRegistro) elements.repPrimeiroRegistro.textContent = '--:--';
    if (elements.repUltimoRegistro) elements.repUltimoRegistro.textContent = '--:--';
  }

  // Quadro Geral de Escolas no Relatório (quando consolidado)
  if (elements.repQuadroEscolas) {
    if (!effectiveSchool && filtered.length > 0) {
      let gridHtml = `<div class="rep-schools-grid">`;
      ALL_SCHOOLS.forEach(school => {
        const count = schoolCounts[school] || 0;
        gridHtml += `
          <div class="rep-school-card">
            <span class="rep-school-name" title="${escapeHtml(school)}">${escapeHtml(school)}</span>
            <strong class="rep-school-total">${count} <span style="font-size:0.75rem; font-weight:normal; color:#64748b;">presentes</span></strong>
          </div>
        `;
      });
      gridHtml += `</div>`;
      elements.repQuadroEscolas.innerHTML = gridHtml;
      elements.repQuadroEscolas.classList.remove('hidden');
    } else {
      elements.repQuadroEscolas.innerHTML = '';
      elements.repQuadroEscolas.classList.add('hidden');
    }
  }

  // Tabela Nominal / Grupos Separados por Dia do Encontro
  if (elements.repTabelaContainer) {
    if (filtered.length === 0) {
      elements.repTabelaContainer.innerHTML = `
        <div style="text-align:center; padding: 2.5rem 1.5rem; color: #64748b; background: #f8fafc; border-radius: 6px; border: 1px dashed #cbd5e1;">
          <i class="fa-regular fa-folder-open" style="font-size: 2rem; color: #94a3b8; margin-bottom: 0.5rem; display: block;"></i>
          <p style="margin: 0; font-weight: 600;">Nenhuma presença registrada para os filtros selecionados até o momento.</p>
        </div>
      `;
      return;
    }

    // Se uma data específica foi selecionada, OU se há apenas 1 dia de encontro:
    if (effectiveDate || availableDates.length <= 1) {
      const sortedForReport = [...filtered].sort((a, b) => 
        (a.escola || '').localeCompare(b.escola || '') || (a.professor || '').localeCompare(b.professor || '')
      );

      let tableHtml = `
        <table class="report-formal-table">
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">Nº</th>
              <th>Nome do Docente</th>
              <th>E-mail</th>
              <th>Unidade Escolar</th>
              <th style="width: 140px;">Data / Horário</th>
              <th style="width: 100px; text-align: center;">Situação</th>
            </tr>
          </thead>
          <tbody>
      `;

      sortedForReport.forEach((item, idx) => {
        tableHtml += `
          <tr>
            <td style="text-align: center; font-weight: 700; color: #64748b;">${idx + 1}</td>
            <td style="font-weight: 700; color: #0f172a;">${escapeHtml(item.professor)}</td>
            <td style="font-size: 0.8rem; color: #475569;">${escapeHtml(item.email || '-')}</td>
            <td><span style="font-weight: 600;">${escapeHtml(item.escola)}</span></td>
            <td style="font-size: 0.8rem; color: #475569;">${escapeHtml(item.timestamp)}</td>
            <td style="text-align: center;">
              <span class="badge badge-success" style="font-size: 0.72rem;">Confirmado</span>
            </td>
          </tr>
        `;
      });

      tableHtml += `
          </tbody>
        </table>
      `;

      elements.repTabelaContainer.innerHTML = tableHtml;
      return;
    }

    // Múltiplos Encontros: Separação por Dia do Encontro
    let multiGroupHtml = '';

    availableDates.forEach((mDate) => {
      const dayRecords = schoolRecords.filter(item => extractDateFromTimestamp(item.timestamp, item.date) === mDate);
      if (dayRecords.length === 0) return;

      const sortedDayRecords = [...dayRecords].sort((a, b) => 
        (a.escola || '').localeCompare(b.escola || '') || (a.professor || '').localeCompare(b.professor || '')
      );

      const firstReg = dayRecords[dayRecords.length - 1];
      const lastReg = dayRecords[0];
      const firstTimeMatch = (firstReg.timestamp || '').match(/([0-9]{2}:[0-9]{2})/);
      const lastTimeMatch = (lastReg.timestamp || '').match(/([0-9]{2}:[0-9]{2})/);
      const dayFirstTime = firstTimeMatch ? firstTimeMatch[1] : '--:--';
      const dayLastTime = lastTimeMatch ? lastTimeMatch[1] : '--:--';

      // Mini-resumo por escola neste dia específico
      const daySchoolCounts = {};
      ALL_SCHOOLS.forEach(s => daySchoolCounts[s] = 0);
      dayRecords.forEach(r => {
        const sName = (r.escola || '').trim().toUpperCase();
        if (daySchoolCounts[sName] !== undefined) daySchoolCounts[sName]++;
        else if (sName) daySchoolCounts[sName] = (daySchoolCounts[sName] || 0) + 1;
      });

      let miniSchoolsHtml = '';
      if (!effectiveSchool) {
        miniSchoolsHtml = `<div class="report-meeting-schools-mini">`;
        ALL_SCHOOLS.forEach(s => {
          if (daySchoolCounts[s] > 0) {
            miniSchoolsHtml += `
              <span class="rep-mini-school-pill">
                <span>${escapeHtml(s)}:</span>
                <strong>${daySchoolCounts[s]}</strong>
              </span>
            `;
          }
        });
        miniSchoolsHtml += `</div>`;
      }

      multiGroupHtml += `
        <div class="report-meeting-group">
          <div class="report-meeting-header">
            <div class="report-meeting-title">
              <i class="fa-solid fa-calendar-day"></i>
              <span>Encontro Formativo: <strong>${escapeHtml(formatDateDisplayPT(mDate))}</strong></span>
            </div>
            <div class="report-meeting-badges">
              <span class="badge badge-primary"><i class="fa-solid fa-users"></i> ${dayRecords.length} presente${dayRecords.length > 1 ? 's' : ''}</span>
              <span class="badge badge-outline"><i class="fa-regular fa-clock"></i> ${dayFirstTime} às ${dayLastTime}</span>
            </div>
          </div>

          ${miniSchoolsHtml}

          <table class="report-formal-table">
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">Nº</th>
                <th>Nome do Docente</th>
                <th>E-mail</th>
                <th>Unidade Escolar</th>
                <th style="width: 140px;">Data / Horário</th>
                <th style="width: 100px; text-align: center;">Situação</th>
              </tr>
            </thead>
            <tbody>
      `;

      sortedDayRecords.forEach((item, idx) => {
        multiGroupHtml += `
          <tr>
            <td style="text-align: center; font-weight: 700; color: #64748b;">${idx + 1}</td>
            <td style="font-weight: 700; color: #0f172a;">${escapeHtml(item.professor)}</td>
            <td style="font-size: 0.8rem; color: #475569;">${escapeHtml(item.email || '-')}</td>
            <td><span style="font-weight: 600;">${escapeHtml(item.escola)}</span></td>
            <td style="font-size: 0.8rem; color: #475569;">${escapeHtml(item.timestamp)}</td>
            <td style="text-align: center;">
              <span class="badge badge-success" style="font-size: 0.72rem;">Confirmado</span>
            </td>
          </tr>
        `;
      });

      multiGroupHtml += `
            </tbody>
          </table>
        </div>
      `;
    });

    elements.repTabelaContainer.innerHTML = multiGroupHtml;
  }
}

// Copia texto para a área de transferência de forma universal (com fallback)
function copyTextToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  } else {
    return new Promise((resolve, reject) => {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        textArea.remove();
        if (successful) resolve();
        else reject(new Error("Falha ao copiar"));
      } catch (err) {
        reject(err);
      }
    });
  }
}

// Gera e Baixa o Arquivo PDF do Relatório Oficial
async function exportReportPDF() {
  try {
    const schoolSelect = document.getElementById('relatorioEscolaSelect');
    const dateSelect = document.getElementById('relatorioDataSelect');
    const selectedSchool = schoolSelect ? schoolSelect.value : '';
    const selectedDate = dateSelect ? dateSelect.value : '';
    renderManagementReport(selectedSchool, selectedDate);

    const reportElement = document.getElementById('relatorioDocumento');
    if (!reportElement) {
      showToast("Elemento do relatório não encontrado.", "error");
      return;
    }

    showToast("Gerando arquivo PDF para a gestão...", "info");

    const schoolLabel = selectedSchool ? selectedSchool.replace(/[^a-zA-Z0-9]/g, '_') : 'todas_escolas';
    const dateLabel = selectedDate ? selectedDate.replace(/[^a-zA-Z0-9]/g, '_') : 'todos_encontros';
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `Relatorio_Gestao_${schoolLabel}_${dateLabel}_${dateStr}.pdf`;

    if (window.html2pdf) {
      // Cria um container visível e desvinculado dos modais para renderização perfeita
      const exportWrap = document.createElement('div');
      exportWrap.id = 'exportPdfRoot';
      exportWrap.className = 'official-report-document';
      exportWrap.style.position = 'fixed';
      exportWrap.style.left = '0';
      exportWrap.style.top = '0';
      exportWrap.style.width = '780px';
      exportWrap.style.backgroundColor = '#ffffff';
      exportWrap.style.color = '#0f172a';
      exportWrap.style.zIndex = '9999999';
      exportWrap.style.padding = '24px';
      exportWrap.style.boxSizing = 'border-box';
      exportWrap.innerHTML = reportElement.innerHTML;

      document.body.appendChild(exportWrap);

      const opt = {
        margin: [8, 10, 8, 10],
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true, 
          backgroundColor: '#ffffff',
          logging: false,
          scrollY: 0,
          scrollX: 0
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
      };

      try {
        await window.html2pdf().set(opt).from(exportWrap).save();
        if (exportWrap.parentNode) exportWrap.parentNode.removeChild(exportWrap);
        showToast("Relatório em PDF baixado com sucesso!", "success");
      } catch (pdfErr) {
        if (exportWrap.parentNode) exportWrap.parentNode.removeChild(exportWrap);
        throw pdfErr;
      }
    } else {
      // Fallback para impressão/salvar em PDF via navegador
      showToast("Abrindo diálogo de impressão/PDF...", "info");
      window.print();
    }
  } catch (err) {
    console.error("Erro ao gerar PDF:", err);
    showToast("Abrindo diálogo de impressão...", "info");
    window.print();
  }
}

// Dispara a Impressão / Salvar em PDF pelo navegador
function printManagementReport() {
  const schoolSelect = document.getElementById('relatorioEscolaSelect');
  const dateSelect = document.getElementById('relatorioDataSelect');
  const selectedSchool = schoolSelect ? schoolSelect.value : '';
  const selectedDate = dateSelect ? dateSelect.value : '';
  renderManagementReport(selectedSchool, selectedDate);
  setTimeout(() => {
    window.print();
  }, 50);
}

// Copia o Resumo Formatado com Emojis para o WhatsApp da Gestão (Separado por Dia)
function copyWhatsAppSummary() {
  loadHistory();
  const schoolSelect = document.getElementById('relatorioEscolaSelect');
  const dateSelect = document.getElementById('relatorioDataSelect');
  const selectedSchool = schoolSelect ? schoolSelect.value : '';
  const selectedDate = dateSelect ? dateSelect.value : '';

  let filtered = appState.history.filter(item => {
    if (!selectedSchool) return true;
    return (item.escola || '').trim().toUpperCase() === selectedSchool.trim().toUpperCase();
  });

  const availableDates = getUniqueMeetingDates(filtered);

  if (selectedDate) {
    filtered = filtered.filter(item => extractDateFromTimestamp(item.timestamp, item.date) === selectedDate);
  }

  if (filtered.length === 0) {
    showToast("Não há registros para compartilhar para os filtros selecionados.", "warning");
    return;
  }

  const ALL_SCHOOLS = ["ALZIRA ACRA", "ANNA BONAGURA", "BRAGA MORATO", "CAIC", "CÉLIA BUENO", "ESTHER VIANNA", "PADRE BENITO"];
  const now = new Date();
  const emissaoStr = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  let text = `📋 *RELATÓRIO DE FREQUÊNCIA - ENCONTROS FORMATIVOS*\n`;
  text += `💻 *Disciplina:* EDM — Educação Digital e Midiática\n`;

  if (selectedDate) {
    text += `📅 *Dia do Encontro:* ${formatDateDisplayPT(selectedDate)}\n`;
  } else if (availableDates.length > 1) {
    text += `📅 *Encontros Formativos:* Separados por Dia (${availableDates.length} dias de encontro)\n`;
  } else if (availableDates.length === 1) {
    text += `📅 *Dia do Encontro:* ${formatDateDisplayPT(availableDates[0])}\n`;
  }

  text += `🏢 *Escola:* ${selectedSchool || "Consolidado (Todas as 7 Escolas)"}\n`;
  text += `👥 *Total de Presentes:* ${filtered.length} docente${filtered.length > 1 ? 's' : ''}\n`;
  text += `⏱️ *Emissão:* ${emissaoStr}\n\n`;

  if (selectedDate || availableDates.length <= 1) {
    if (!selectedSchool) {
      text += `🏫 *RESUMO POR UNIDADE ESCOLAR:*\n`;
      const schoolCounts = {};
      ALL_SCHOOLS.forEach(s => schoolCounts[s] = 0);
      filtered.forEach(r => {
        const sName = (r.escola || '').trim().toUpperCase();
        if (schoolCounts[sName] !== undefined) schoolCounts[sName]++;
        else if (sName) schoolCounts[sName] = (schoolCounts[sName] || 0) + 1;
      });

      ALL_SCHOOLS.forEach(s => {
        if (schoolCounts[s] > 0) {
          text += `• *${s}:* ${schoolCounts[s]} presente${schoolCounts[s] > 1 ? 's' : ''}\n`;
        }
      });
      text += `\n`;
    }

    text += `📝 *RELAÇÃO NOMINAL:*\n`;
    const sorted = [...filtered].sort((a, b) => 
      (a.escola || '').localeCompare(b.escola || '') || (a.professor || '').localeCompare(b.professor || '')
    );

    sorted.forEach((item, i) => {
      text += `${i + 1}. ${item.professor} - ${item.escola} (${item.timestamp})\n`;
    });
  } else {
    // Múltiplos encontros separados por dia
    availableDates.forEach((mDate, idx) => {
      const dayRecords = filtered.filter(item => extractDateFromTimestamp(item.timestamp, item.date) === mDate);
      if (dayRecords.length === 0) return;

      text += `════════════════════════════════\n`;
      text += `📅 *ENCONTRO FORMATIVO (${idx + 1}/${availableDates.length}):* ${formatDateDisplayPT(mDate)}\n`;
      text += `👥 *Presentes neste dia:* ${dayRecords.length} docente${dayRecords.length > 1 ? 's' : ''}\n`;

      if (!selectedSchool) {
        const daySchoolCounts = {};
        ALL_SCHOOLS.forEach(s => daySchoolCounts[s] = 0);
        dayRecords.forEach(r => {
          const sName = (r.escola || '').trim().toUpperCase();
          if (daySchoolCounts[sName] !== undefined) daySchoolCounts[sName]++;
          else if (sName) daySchoolCounts[sName] = (daySchoolCounts[sName] || 0) + 1;
        });
        const activeSchools = ALL_SCHOOLS.filter(s => daySchoolCounts[s] > 0);
        if (activeSchools.length > 0) {
          text += `🏫 *Escolas:* ` + activeSchools.map(s => `${s} (${daySchoolCounts[s]})`).join(' | ') + `\n`;
        }
      }

      text += `\n📝 *Relação Nominal:*\n`;
      const daySorted = [...dayRecords].sort((a, b) => 
        (a.escola || '').localeCompare(b.escola || '') || (a.professor || '').localeCompare(b.professor || '')
      );
      daySorted.forEach((item, i) => {
        text += `${i + 1}. ${item.professor} - ${item.escola} (${item.timestamp})\n`;
      });
      text += `\n`;
    });
  }

  text += `\n_Lista oficial sincronizada com Google Forms & Planilhas._`;

  copyTextToClipboard(text).then(() => {
    showToast("Resumo formatado copiado! Cole no WhatsApp da gestão.", "success");
  }).catch(() => {
    showToast("Não foi possível copiar automaticamente.", "error");
  });
}

// Exporta CSV do Relatório com coluna do Dia do Encontro
function exportReportCSV() {
  loadHistory();
  const schoolSelect = document.getElementById('relatorioEscolaSelect');
  const dateSelect = document.getElementById('relatorioDataSelect');
  const selectedSchool = schoolSelect ? schoolSelect.value : '';
  const selectedDate = dateSelect ? dateSelect.value : '';

  let filtered = appState.history.filter(item => {
    if (!selectedSchool) return true;
    return (item.escola || '').trim().toUpperCase() === selectedSchool.trim().toUpperCase();
  });

  if (selectedDate) {
    filtered = filtered.filter(item => extractDateFromTimestamp(item.timestamp, item.date) === selectedDate);
  }

  if (filtered.length === 0) {
    showToast("Não há registros para exportar com os filtros selecionados.", "warning");
    return;
  }

  let csv = "\uFEFFNº;Disciplina;DiaDoEncontro;Professor;Email;Escola;DataHoraCompleta;Situacao\n";
  const sorted = [...filtered].sort((a, b) => 
    (a.escola || '').localeCompare(b.escola || '') || (a.professor || '').localeCompare(b.professor || '')
  );

  sorted.forEach((h, idx) => {
    const mDate = extractDateFromTimestamp(h.timestamp, h.date) || '-';
    csv += `"${idx + 1}";"EDM - Educação Digital e Midiática";"${mDate}";"${(h.professor || '').replace(/"/g, '""')}";"${(h.email || '').replace(/"/g, '""')}";"${(h.escola || '').replace(/"/g, '""')}";"${(h.timestamp || '').replace(/"/g, '""')}";"Confirmado"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fileNameSuffix = selectedSchool ? selectedSchool.replace(/[^a-zA-Z0-9]/g, '_') : 'todas_escolas';
  const dateSuffix = selectedDate ? selectedDate.replace(/[^a-zA-Z0-9]/g, '_') : 'todos_encontros';
  a.download = `relatorio_frequencia_${fileNameSuffix}_${dateSuffix}_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (a.parentNode) document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
  showToast("Relatório CSV baixado com sucesso!", "success");
}

// Expõe globalmente no objeto window para execução imediata via onclick
window.exportReportPDF = exportReportPDF;
window.printManagementReport = printManagementReport;
window.copyWhatsAppSummary = copyWhatsAppSummary;
window.exportReportCSV = exportReportCSV;

// Exporta o Histórico Geral de Presenças em formato CSV (respeitando filtros ativos)
function exportCSV() {
  loadHistory();
  const dateFilter = (elements.filtroDataSelect ? elements.filtroDataSelect.value.trim() : '');
  const schoolFilter = (elements.filtroEscolaSelect ? elements.filtroEscolaSelect.value.trim().toUpperCase() : '');
  const textFilter = (elements.filtroHistorico ? elements.filtroHistorico.value.trim().toLowerCase() : '');

  let list = appState.history;
  if (dateFilter) {
    list = list.filter(item => extractDateFromTimestamp(item.timestamp, item.date) === dateFilter);
  }
  if (schoolFilter) {
    list = list.filter(item => (item.escola || '').trim().toUpperCase() === schoolFilter);
  }
  if (textFilter) {
    list = list.filter(item => {
      const matchName = item.professor && item.professor.toLowerCase().includes(textFilter);
      const matchEmail = item.email && item.email.toLowerCase().includes(textFilter);
      const matchSchool = item.escola && item.escola.toLowerCase().includes(textFilter);
      return matchName || matchEmail || matchSchool;
    });
  }

  if (list.length === 0) {
    showToast("Não há registros para exportar com os filtros selecionados.", "info");
    return;
  }

  let csv = "\uFEFFNº;Professor;Email;Escola;DataHoraCompleta;Origem\n";
  list.forEach((h, idx) => {
    csv += `"${idx + 1}";"${(h.professor || '').replace(/"/g, '""')}";"${(h.email || '').replace(/"/g, '""')}";"${(h.escola || '').replace(/"/g, '""')}";"${(h.timestamp || '').replace(/"/g, '""')}";"${h.isRemote ? 'Nuvem' : 'Local'}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateSuffix = dateFilter ? `_${dateFilter.replace(/[^a-zA-Z0-9]/g, '-')}` : '';
  a.download = `historico_presencas${dateSuffix}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (a.parentNode) document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
  showToast(`Histórico CSV exportado (${list.length} registros)!`, "success");
}

window.exportCSV = exportCSV;

// ==========================================================================
// Base Oficial de Professores (EDM Firestore) & Auditoria de Faltas
// ==========================================================================

function loadCachedCadastrados() {
  const cached = localStorage.getItem('presenca_cadastrados_cache');
  if (cached) {
    try {
      appState.cadastrados = JSON.parse(cached);
      updateTeacherDatalist();
      renderAuditoriaUI();
    } catch (e) {
      appState.cadastrados = [];
    }
  }
}

async function syncCadastradosEDM(showFeedback = false) {
  const firestoreUrl = appState.config.firestoreUrl || DEFAULT_CONFIG.firestoreUrl;
  if (!firestoreUrl) return;

  appState.isSyncingEDM = true;
  if (elements.edmStatusIcon) {
    elements.edmStatusIcon.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i>`;
  }
  if (elements.edmStatusTitle) {
    elements.edmStatusTitle.textContent = "Sincronizando Base EDM Firestore...";
  }

  try {
    const res = await fetch(firestoreUrl, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    
    const docs = data.documents || [];
    const cadastrados = docs.map(doc => {
      const f = doc.fields || {};
      const id = doc.name ? doc.name.split('/').pop() : '';
      return {
        id: id,
        nome: (f.nome?.stringValue || f.nome_processado?.stringValue || '').trim(),
        escola: (f.escola?.stringValue || '').trim(),
        disciplina: (f.disciplina?.stringValue || 'EDM').trim(),
        turma: (f.turma?.stringValue || '').trim(),
        ano: (f.ano?.stringValue || '').trim(),
        turno: (f.turno?.stringValue || '').trim(),
        telefone: (f.telefone?.stringValue || '').trim()
      };
    }).filter(c => c.nome.length > 0);

    appState.cadastrados = cadastrados;
    localStorage.setItem('presenca_cadastrados_cache', JSON.stringify(cadastrados));
    appState.lastSyncEDMTime = new Date();
    const timeStr = appState.lastSyncEDMTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (elements.edmStatusBar) {
      elements.edmStatusBar.className = "sync-status-bar firestore-status-bar synced";
    }
    if (elements.edmStatusIcon) {
      elements.edmStatusIcon.innerHTML = `<i class="fa-solid fa-database" style="color: #9333ea;"></i>`;
    }
    if (elements.edmStatusTitle) {
      elements.edmStatusTitle.textContent = `Base Oficial EDM: ${cadastrados.length} Professores Cadastrados`;
    }
    if (elements.edmStatusDesc) {
      elements.edmStatusDesc.textContent = `Sincronizado com o Firestore às ${timeStr}`;
    }

    updateTeacherDatalist();
    renderAuditoriaUI();

    if (showFeedback) {
      showToast(`Base EDM atualizada! ${cadastrados.length} docentes carregados.`, "success");
    }
  } catch (err) {
    console.warn("Erro ao buscar professores do Firestore:", err);
    if (elements.edmStatusIcon) {
      elements.edmStatusIcon.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-warning"></i>`;
    }
    if (elements.edmStatusTitle) {
      elements.edmStatusTitle.textContent = `Base EDM (Offline/Cache: ${appState.cadastrados.length} docentes)`;
    }
    if (elements.edmStatusDesc) {
      elements.edmStatusDesc.textContent = `Não foi possível atualizar em tempo real: ${err.message}`;
    }
    if (showFeedback) {
      showToast(`Falha na conexão com Firestore: ${err.message}`, "warning");
    }
  } finally {
    appState.isSyncingEDM = false;
  }
}

// Normaliza o nome da escola para comparação padronizada
function normalizeSchoolName(name) {
  if (!name) return '';
  const n = normalizeName(name);
  if (n.includes('ALZIRA')) return 'ALZIRA ACRA';
  if (n.includes('ANNA') || n.includes('BONAGURA')) return 'ANNA BONAGURA';
  if (n.includes('BRAGA') || n.includes('MORATO')) return 'BRAGA MORATO';
  if (n.includes('CAIC')) return 'CAIC';
  if (n.includes('CELIA') || n.includes('BUENO')) return 'CÉLIA BUENO';
  if (n.includes('ESTHER') || n.includes('VIANNA')) return 'ESTHER VIANNA';
  if (n.includes('PADRE') || n.includes('BENITO')) return 'PADRE BENITO';
  return name.trim().toUpperCase();
}

// Atualiza o <datalist> de auto-sugestão do formulário
function updateTeacherDatalist() {
  const datalist = elements.listaSugestoesProfessores;
  if (!datalist) return;

  const selectedSchool = elements.selectEscola ? elements.selectEscola.value : '';
  const normSelectedSchool = normalizeSchoolName(selectedSchool);

  let options = appState.cadastrados || [];
  if (normSelectedSchool) {
    options = options.filter(c => normalizeSchoolName(c.escola) === normSelectedSchool);
  }

  options.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

  datalist.innerHTML = options.map(c => {
    const meta = [c.ano, c.turma, c.turno ? `(${c.turno})` : ''].filter(Boolean).join(' ');
    return `<option value="${escapeHtml(c.nome)}">${meta ? escapeHtml(meta) : ''}</option>`;
  }).join('');
}

// Executa o cruzamento completo dos dados (Presentes vs Faltantes vs Extras)
function computeAuditoriaData(dateFilter = '') {
  const cadastrados = appState.cadastrados || [];
  let presencas = appState.history || [];
  if (dateFilter) {
    presencas = presencas.filter(item => extractDateFromTimestamp(item.timestamp, item.date) === dateFilter);
  }

  const presencasMap = new Map();
  const presencasByEmail = new Map();

  presencas.forEach(p => {
    const n = normalizeName(p.professor);
    const email = (p.email || '').trim().toLowerCase();
    if (n) {
      if (!presencasMap.has(n)) presencasMap.set(n, []);
      presencasMap.get(n).push(p);
    }
    if (email) {
      if (!presencasByEmail.has(email)) presencasByEmail.set(email, []);
      presencasByEmail.get(email).push(p);
    }
  });

  const matchedPresencasKeys = new Set();
  const matchedPresencasEmails = new Set();
  const presentes = [];
  const faltantes = [];

  cadastrados.forEach(cad => {
    const cadNorm = normalizeName(cad.nome);
    const cadSchool = normalizeSchoolName(cad.escola);

    let match = null;
    let matchKey = null;

    // 1. Match direto por nome normalizado
    if (presencasMap.has(cadNorm)) {
      match = presencasMap.get(cadNorm)[0];
      matchKey = cadNorm;
    }

    // 2. Match inteligente por primeiro e último nome ou inclusão
    if (!match) {
      for (const [presNorm, pList] of presencasMap.entries()) {
        const wordsCad = cadNorm.split(' ').filter(w => w.length > 1);
        const wordsPres = presNorm.split(' ').filter(w => w.length > 1);
        const pRecord = pList[0];
        const pSchool = normalizeSchoolName(pRecord.escola);

        const sameSchool = !cadSchool || !pSchool || cadSchool === pSchool;

        if (sameSchool) {
          if (cadNorm.includes(presNorm) || presNorm.includes(cadNorm)) {
            match = pRecord;
            matchKey = presNorm;
            break;
          }
          if (wordsCad.length >= 2 && wordsPres.length >= 2) {
            if (wordsCad[0] === wordsPres[0] && wordsCad[wordsCad.length - 1] === wordsPres[wordsPres.length - 1]) {
              match = pRecord;
              matchKey = presNorm;
              break;
            }
          }
        }
      }
    }

    // 3. Match de apelidos conhecidos ou e-mails específicos
    if (!match) {
      if (cadNorm.includes('SAQUETO') && presencasMap.has(normalizeName('LUCIA SAQUETO'))) {
        match = presencasMap.get(normalizeName('LUCIA SAQUETO'))[0];
        matchKey = normalizeName('LUCIA SAQUETO');
      } else if (cadNorm.includes('VERENA') && presencasByEmail.has('verenamichel.19@gmail.com')) {
        match = presencasByEmail.get('verenamichel.19@gmail.com')[0];
        matchKey = normalizeName(match.professor);
      }
    }

    if (match) {
      matchedPresencasKeys.add(matchKey || normalizeName(match.professor));
      if (match.email) matchedPresencasEmails.add(match.email.toLowerCase());
      presentes.push({
        tipo: 'presente',
        cadastrado: cad,
        presenca: match,
        nome: cad.nome,
        escola: normalizeSchoolName(cad.escola),
        ano: cad.ano || '-',
        turma: cad.turma || '-',
        turno: cad.turno || '-',
        disciplina: cad.disciplina || 'EDM',
        email: match.email || '-',
        timestamp: match.timestamp || '-'
      });
    } else {
      faltantes.push({
        tipo: 'falta',
        cadastrado: cad,
        presenca: null,
        nome: cad.nome,
        escola: normalizeSchoolName(cad.escola),
        ano: cad.ano || '-',
        turma: cad.turma || '-',
        turno: cad.turno || '-',
        disciplina: cad.disciplina || 'EDM',
        email: '-',
        timestamp: '-'
      });
    }
  });

  // Presenças extras (não encontradas no cadastro inicial)
  const extras = [];
  presencas.forEach(p => {
    const pNorm = normalizeName(p.professor);
    const pEmail = (p.email || '').trim().toLowerCase();
    if (!matchedPresencasKeys.has(pNorm) && (!pEmail || !matchedPresencasEmails.has(pEmail))) {
      extras.push({
        tipo: 'extra',
        cadastrado: null,
        presenca: p,
        nome: p.professor,
        escola: normalizeSchoolName(p.escola),
        ano: '-',
        turma: '-',
        turno: '-',
        disciplina: 'EDM',
        email: p.email || '-',
        timestamp: p.timestamp || '-'
      });
    }
  });

  const ALL_SCHOOLS = ["ALZIRA ACRA", "ANNA BONAGURA", "BRAGA MORATO", "CAIC", "CÉLIA BUENO", "ESTHER VIANNA", "PADRE BENITO"];
  const schoolStats = {};
  ALL_SCHOOLS.forEach(s => {
    schoolStats[s] = { totalCad: 0, presentes: 0, faltas: 0, extras: 0, taxa: 0 };
  });

  cadastrados.forEach(c => {
    const s = normalizeSchoolName(c.escola);
    if (schoolStats[s]) schoolStats[s].totalCad++;
  });

  presentes.forEach(p => {
    const s = normalizeSchoolName(p.escola);
    if (schoolStats[s]) schoolStats[s].presentes++;
  });

  faltantes.forEach(f => {
    const s = normalizeSchoolName(f.escola);
    if (schoolStats[s]) schoolStats[s].faltas++;
  });

  extras.forEach(e => {
    const s = normalizeSchoolName(e.escola);
    if (schoolStats[s]) schoolStats[s].extras++;
  });

  ALL_SCHOOLS.forEach(s => {
    const st = schoolStats[s];
    st.taxa = st.totalCad > 0 ? Math.round((st.presentes / st.totalCad) * 100) : (st.presentes > 0 ? 100 : 0);
  });

  const totalCadastrados = cadastrados.length;
  const totalPresentes = presentes.length;
  const totalFaltas = faltantes.length;
  const taxaGeral = totalCadastrados > 0 ? Math.round((totalPresentes / totalCadastrados) * 100) : 0;

  return {
    cadastrados,
    presencas,
    presentes,
    faltantes,
    extras,
    totalCadastrados,
    totalPresentes,
    totalFaltas,
    taxaGeral,
    schoolStats,
    ALL_SCHOOLS
  };
}

// Renderiza a interface da aba Cruzamento & Auditoria de Faltas
function renderAuditoriaUI() {
  const selectedDate = elements.auditoriaFiltroDataSelect ? elements.auditoriaFiltroDataSelect.value : '';
  const data = computeAuditoriaData(selectedDate);
  const { totalCadastrados, totalPresentes, totalFaltas, taxaGeral, schoolStats, ALL_SCHOOLS, presentes, faltantes, extras } = data;

  if (elements.repFaltasEncontroData) {
    if (selectedDate) {
      elements.repFaltasEncontroData.textContent = formatDateDisplayPT(selectedDate);
    } else {
      const dates = getUniqueMeetingDates();
      elements.repFaltasEncontroData.textContent = dates.length > 0 ? `Todos os Encontros (${dates.length} dias)` : '07 de outubro de 2026';
    }
  }

  // Atualiza KPIs
  if (elements.kpiAuditoriaCadastrados) elements.kpiAuditoriaCadastrados.textContent = totalCadastrados;
  if (elements.kpiAuditoriaPresentes) elements.kpiAuditoriaPresentes.textContent = totalPresentes;
  if (elements.kpiAuditoriaPresentesSub) elements.kpiAuditoriaPresentesSub.textContent = `${taxaGeral}% de presença`;
  if (elements.kpiAuditoriaFaltas) elements.kpiAuditoriaFaltas.textContent = totalFaltas;
  if (elements.kpiAuditoriaFaltasSub) elements.kpiAuditoriaFaltasSub.textContent = `${totalFaltas} docente${totalFaltas !== 1 ? 's' : ''} ausente${totalFaltas !== 1 ? 's' : ''}`;
  if (elements.kpiAuditoriaTaxa) elements.kpiAuditoriaTaxa.textContent = `${taxaGeral}%`;
  if (elements.kpiAuditoriaExtrasSub) elements.kpiAuditoriaExtrasSub.textContent = `+${extras.length} extra${extras.length !== 1 ? 's' : ''} participante${extras.length !== 1 ? 's' : ''}`;

  if (elements.badgeFaltasDestaque) {
    elements.badgeFaltasDestaque.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${totalFaltas} Falta${totalFaltas !== 1 ? 's' : ''}`;
  }

  // Renderiza Grid de Escolas com Taxa e Progresso
  if (elements.auditoriaSchoolsContainer) {
    const selectedSchool = elements.auditoriaFiltroEscolaSelect ? elements.auditoriaFiltroEscolaSelect.value : '';
    let cardsHtml = '';

    ALL_SCHOOLS.forEach(school => {
      const st = schoolStats[school] || { totalCad: 0, presentes: 0, faltas: 0, extras: 0, taxa: 0 };
      const isActive = selectedSchool === school;
      
      let rateClass = 'rate-100';
      if (st.taxa < 80) rateClass = 'rate-alert';
      else if (st.taxa < 90) rateClass = 'rate-warn';
      else if (st.taxa < 100) rateClass = 'rate-good';

      let barColor = 'var(--success)';
      if (st.taxa < 80) barColor = 'var(--danger)';
      else if (st.taxa < 90) barColor = '#f59e0b';
      else if (st.taxa < 100) barColor = 'var(--primary)';

      cardsHtml += `
        <div class="auditoria-school-card ${isActive ? 'active' : ''}" data-school="${escapeHtml(school)}">
          <div class="auditoria-school-header">
            <span class="auditoria-school-name" title="${escapeHtml(school)}">${escapeHtml(school)}</span>
            <span class="auditoria-school-rate ${rateClass}">${st.taxa}%</span>
          </div>
          <div class="auditoria-school-bar-wrap">
            <div class="auditoria-school-bar-fill" style="width: ${st.taxa}%; background: ${barColor};"></div>
          </div>
          <div class="auditoria-school-counts">
            <span>✅ ${st.presentes}/${st.totalCad}</span>
            <span class="${st.faltas > 0 ? 'text-danger font-bold' : ''}">❌ ${st.faltas} falta${st.faltas !== 1 ? 's' : ''}</span>
          </div>
        </div>
      `;
    });

    elements.auditoriaSchoolsContainer.innerHTML = cardsHtml;

    elements.auditoriaSchoolsContainer.querySelectorAll('.auditoria-school-card').forEach(card => {
      card.addEventListener('click', () => {
        const sch = card.getAttribute('data-school');
        if (elements.auditoriaFiltroEscolaSelect) {
          elements.auditoriaFiltroEscolaSelect.value = (elements.auditoriaFiltroEscolaSelect.value === sch) ? '' : sch;
        }
        renderAuditoriaUI();
      });
    });
  }

  // Filtragem da Lista de Auditoria
  const filterSchool = elements.auditoriaFiltroEscolaSelect ? elements.auditoriaFiltroEscolaSelect.value : '';
  const filterStatus = elements.auditoriaFiltroStatusSelect ? elements.auditoriaFiltroStatusSelect.value : 'faltas';
  const filterSearch = (elements.auditoriaFiltroBusca ? elements.auditoriaFiltroBusca.value : '').toLowerCase().trim();

  let combinedList = [];
  if (filterStatus === 'all') {
    combinedList = [...faltantes, ...presentes, ...extras];
  } else if (filterStatus === 'faltas') {
    combinedList = [...faltantes];
  } else if (filterStatus === 'presentes') {
    combinedList = [...presentes];
  } else if (filterStatus === 'extras') {
    combinedList = [...extras];
  }

  if (filterSchool) {
    combinedList = combinedList.filter(item => item.escola === filterSchool);
  }

  if (filterSearch) {
    combinedList = combinedList.filter(item => {
      const matchNome = (item.nome || '').toLowerCase().includes(filterSearch);
      const matchEscola = (item.escola || '').toLowerCase().includes(filterSearch);
      const matchEmail = (item.email || '').toLowerCase().includes(filterSearch);
      const matchTurma = (item.turma || '').toLowerCase().includes(filterSearch);
      const matchAno = (item.ano || '').toLowerCase().includes(filterSearch);
      return matchNome || matchEscola || matchEmail || matchTurma || matchAno;
    });
  }

  // Ordenação: Faltas primeiro -> Escola ASC -> Nome ASC
  combinedList.sort((a, b) => {
    if (a.tipo === 'falta' && b.tipo !== 'falta') return -1;
    if (b.tipo === 'falta' && a.tipo !== 'falta') return 1;
    return (a.escola || '').localeCompare(b.escola || '') || (a.nome || '').localeCompare(b.nome || '');
  });

  if (elements.totalAuditoriaBadge) {
    elements.totalAuditoriaBadge.textContent = `${combinedList.length} registro${combinedList.length !== 1 ? 's' : ''} exibido${combinedList.length !== 1 ? 's' : ''}`;
  }

  // Renderiza Tabela
  if (elements.auditoriaTabelaContainer) {
    if (combinedList.length === 0) {
      elements.auditoriaTabelaContainer.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-circle-check text-success" style="font-size: 2.5rem; margin-bottom: 0.75rem;"></i>
          <p><strong>Nenhum registro encontrado para estes filtros.</strong></p>
          <span style="font-size: 0.85rem; color: var(--text-muted);">Altere a escola ou selecione outro status de exibição.</span>
        </div>
      `;
      return;
    }

    let tableHtml = `
      <table class="history-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Professor(a)</th>
            <th>Unidade Escolar</th>
            <th>Turma / Turno</th>
            <th>Confirmação / E-mail</th>
            <th style="text-align: center; width: 60px;">Atestado</th>
          </tr>
        </thead>
        <tbody>
    `;

    combinedList.forEach(item => {
      let statusBadge = '';
      let rowClass = '';

      if (item.tipo === 'falta') {
        statusBadge = `<span class="badge-status-falta"><i class="fa-solid fa-user-xmark"></i> Falta</span>`;
        rowClass = 'table-row-falta';
      } else if (item.tipo === 'presente') {
        statusBadge = `<span class="badge-status-presente"><i class="fa-solid fa-user-check"></i> Presente</span>`;
        rowClass = 'table-row-presente';
      } else {
        statusBadge = `<span class="badge-status-extra"><i class="fa-solid fa-user-plus"></i> Extra</span>`;
        rowClass = 'table-row-extra';
      }

      const metaTurma = (item.ano !== '-' || item.turma !== '-') ? `${item.ano} ${item.turma} • ${item.turno}` : '-';

      tableHtml += `
        <tr class="${rowClass}">
          <td>${statusBadge}</td>
          <td>
            <strong>${escapeHtml(item.nome)}</strong>
            ${item.tipo === 'falta' ? `<div class="docente-meta-pill"><i class="fa-solid fa-clock-rotate-left"></i> Não assinou a lista</div>` : ''}
          </td>
          <td><span class="badge badge-outline">${escapeHtml(item.escola)}</span></td>
          <td><span style="font-size: 0.85rem;">${escapeHtml(metaTurma)}</span></td>
          <td>
            ${item.timestamp !== '-' ? `<div><i class="fa-regular fa-clock text-muted"></i> <strong>${escapeHtml(item.timestamp)}</strong></div>` : '<span class="text-muted">--:--</span>'}
            ${item.email !== '-' ? `<div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(item.email)}</div>` : ''}
          </td>
          <td style="text-align: center;">
            <button type="button" class="btn-table-action" onclick="abrirAtestadoDocenteAdmin('${escapeHtml((item.email && item.email !== '-') ? item.email : item.nome)}')" title="Ver Histórico & Atestado deste Docente">
              <i class="fa-solid fa-graduation-cap text-primary"></i>
            </button>
          </td>
        </tr>
      `;
    });

    tableHtml += `</tbody></table>`;
    elements.auditoriaTabelaContainer.innerHTML = tableHtml;
  }
}

// Exporta o Relatório Oficial de Faltas em PDF
function exportarRelatorioFaltasPDF() {
  const selectedDate = elements.auditoriaFiltroDataSelect ? elements.auditoriaFiltroDataSelect.value : '';
  const data = computeAuditoriaData(selectedDate);
  const { faltantes, totalCadastrados, totalPresentes, totalFaltas, taxaGeral, ALL_SCHOOLS, schoolStats } = data;

  if (faltantes.length === 0) {
    showToast("Parabéns! Não há nenhuma falta registrada.", "success");
    return;
  }

  const docEl = document.getElementById('relatorioFaltasDocumento');
  if (!docEl) return;

  const now = new Date();
  const emissaoStr = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const filterSchool = elements.auditoriaFiltroEscolaSelect ? elements.auditoriaFiltroEscolaSelect.value : '';
  const listFaltas = filterSchool ? faltantes.filter(f => f.escola === filterSchool) : faltantes;

  document.getElementById('repFaltasDataEmissao').textContent = emissaoStr;
  document.getElementById('repFaltasEscopo').textContent = filterSchool || 'Todas as 7 Escolas';
  document.getElementById('repFaltasTotalBadge').textContent = `${listFaltas.length} Faltantes`;
  document.getElementById('repFaltasTotalCad').textContent = filterSchool ? (schoolStats[filterSchool]?.totalCad || 0) : totalCadastrados;
  document.getElementById('repFaltasTotalPres').textContent = filterSchool ? (schoolStats[filterSchool]?.presentes || 0) : totalPresentes;
  document.getElementById('repFaltasTotalFaltas').textContent = listFaltas.length;
  document.getElementById('repFaltasTaxa').textContent = `${filterSchool ? (schoolStats[filterSchool]?.taxa || 0) : taxaGeral}%`;

  const repFaltasEncontroEl = document.getElementById('repFaltasEncontroData');
  if (repFaltasEncontroEl) {
    if (selectedDate) {
      repFaltasEncontroEl.textContent = formatDateDisplayPT(selectedDate);
    } else {
      const dates = getUniqueMeetingDates();
      repFaltasEncontroEl.textContent = dates.length > 0 ? `Todos os Encontros (${dates.length} dias)` : '07 de outubro de 2026';
    }
  }

  let tableHtml = `
    <table class="report-formal-table">
      <thead>
        <tr>
          <th style="width: 40px;">Nº</th>
          <th>Escola</th>
          <th>Professor(a) Ausente</th>
          <th>Ano / Turma / Turno</th>
          <th>Situação</th>
          <th>Justificativa / Motivo</th>
        </tr>
      </thead>
      <tbody>
  `;

  listFaltas.forEach((f, idx) => {
    tableHtml += `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td><strong>${escapeHtml(f.escola)}</strong></td>
        <td>${escapeHtml(f.nome)}</td>
        <td>${escapeHtml(f.ano)} ${escapeHtml(f.turma)} (${escapeHtml(f.turno)})</td>
        <td style="color: #b91c1c; font-weight: bold;">AUSENTE</td>
        <td style="border-bottom: 1px dashed #cbd5e1; min-width: 140px;"></td>
      </tr>
    `;
  });

  tableHtml += `</tbody></table>`;
  document.getElementById('repFaltasTabelaContainer').innerHTML = tableHtml;

  docEl.style.display = 'block';

  showToast("Gerando Relatório Oficial de Faltas em PDF...", "info");

  const dateSuffix = selectedDate ? selectedDate.replace(/[^a-zA-Z0-9]/g, '_') : 'todos_encontros';
  const opt = {
    margin: [10, 10, 10, 10],
    filename: `Relatorio_Faltas_Docentes_EDM_${dateSuffix}_${new Date().toISOString().slice(0, 10)}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  if (window.html2pdf) {
    window.html2pdf().set(opt).from(docEl).save().then(() => {
      docEl.style.display = 'none';
      showToast("Relatório de Faltas baixado com sucesso!", "success");
    }).catch(err => {
      console.error(err);
      docEl.style.display = 'none';
      window.print();
    });
  } else {
    window.print();
    docEl.style.display = 'none';
  }
}

// Copia o resumo formatado de faltas para o WhatsApp da Gestão
function copiarFaltasWhatsApp() {
  const selectedDate = elements.auditoriaFiltroDataSelect ? elements.auditoriaFiltroDataSelect.value : '';
  const data = computeAuditoriaData(selectedDate);
  const { faltantes, totalCadastrados, totalPresentes, totalFaltas, taxaGeral, schoolStats, ALL_SCHOOLS } = data;

  const now = new Date();
  const emissaoStr = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const filterSchool = elements.auditoriaFiltroEscolaSelect ? elements.auditoriaFiltroEscolaSelect.value : '';
  const listFaltas = filterSchool ? faltantes.filter(f => f.escola === filterSchool) : faltantes;

  let text = `🚨 *RELATÓRIO DE AUSÊNCIAS E FALTAS DOCENTES*\n`;
  text += `💻 *Formação:* EDM — Educação Digital e Midiática\n`;
  text += `📅 *Encontro Formativo:* ${selectedDate ? formatDateDisplayPT(selectedDate) : 'Todos os Encontros Formativos'}\n`;
  text += `🏢 *Escopo:* ${filterSchool || "Consolidado Geral (Todas as 7 Escolas)"}\n`;
  text += `📊 *Frequência Geral:* ${taxaGeral}% de presença (${totalPresentes} presentes de ${totalCadastrados} cadastrados)\n`;
  text += `❌ *Total de Faltas:* ${listFaltas.length} docentes ausentes\n`;
  text += `⏱️ *Emissão:* ${emissaoStr}\n\n`;

  if (!filterSchool) {
    text += `🏫 *PANORAMA DE AUSÊNCIAS POR ESCOLA:*\n`;
    ALL_SCHOOLS.forEach(s => {
      const st = schoolStats[s];
      if (st.faltas > 0) {
        text += `• *${s}:* ${st.faltas} falta${st.faltas > 1 ? 's' : ''} (${st.presentes}/${st.totalCad} presentes - ${st.taxa}%)\n`;
      } else {
        text += `• *${s}:* 100% Presença (0 faltas) ✅\n`;
      }
    });
    text += `\n`;
  }

  text += `📝 *RELAÇÃO NOMINAL DOS FALTANTES:*\n`;
  if (listFaltas.length === 0) {
    text += `Nenhuma falta registrada nesta escola. 100% presente! 🎉\n`;
  } else {
    const porEscola = {};
    listFaltas.forEach(f => {
      if (!porEscola[f.escola]) porEscola[f.escola] = [];
      porEscola[f.escola].push(f);
    });

    for (const esc in porEscola) {
      text += `\n🏫 *${esc}:*\n`;
      porEscola[esc].forEach((f, i) => {
        text += `   ${i + 1}. *${f.nome}* — ${f.ano} ${f.turma} (${f.turno})\n`;
      });
    }
  }

  text += `\n_Auditoria realizada pelo cruzamento entre o Cadastro Oficial EDM e a Lista de Presença Digital._`;

  copyTextToClipboard(text).then(() => {
    showToast("Resumo de Faltas copiado para o WhatsApp!", "success");
  }).catch(() => {
    showToast("Não foi possível copiar automaticamente.", "error");
  });
}

// Exporta Tabela Completa de Auditoria em CSV
function exportarAuditoriaCSV() {
  const selectedDate = elements.auditoriaFiltroDataSelect ? elements.auditoriaFiltroDataSelect.value : '';
  const data = computeAuditoriaData(selectedDate);
  const { presentes, faltantes, extras } = data;

  const allItems = [...faltantes, ...presentes, ...extras];
  allItems.sort((a, b) => (a.escola || '').localeCompare(b.escola || '') || (a.nome || '').localeCompare(b.nome || ''));

  let csv = "\uFEFFNº;Status;Escola;Professor;Ano;Turma;Turno;Disciplina;Email;CarimboPresenca\n";
  allItems.forEach((item, idx) => {
    let stText = item.tipo === 'falta' ? 'FALTA' : (item.tipo === 'presente' ? 'PRESENTE' : 'EXTRA');
    csv += `"${idx + 1}";"${stText}";"${(item.escola || '').replace(/"/g, '""')}";"${(item.nome || '').replace(/"/g, '""')}";"${(item.ano || '').replace(/"/g, '""')}";"${(item.turma || '').replace(/"/g, '""')}";"${(item.turno || '').replace(/"/g, '""')}";"${(item.disciplina || '').replace(/"/g, '""')}";"${(item.email || '').replace(/"/g, '""')}";"${(item.timestamp || '').replace(/"/g, '""')}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateSuffix = selectedDate ? selectedDate.replace(/[^a-zA-Z0-9]/g, '_') : 'todos_encontros';
  a.download = `auditoria_faltas_presenca_edm_${dateSuffix}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (a.parentNode) document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
  showToast("Planilha CSV de Auditoria baixada com sucesso!", "success");
}

// Expõe globalmente
window.exportarRelatorioFaltasPDF = exportarRelatorioFaltasPDF;
window.copiarFaltasWhatsApp = copiarFaltasWhatsApp;
window.exportarAuditoriaCSV = exportarAuditoriaCSV;

function clearHistory() {
  if (confirm("Tem certeza que deseja apagar os registros locais deste dispositivo? Essa ação não afeta a planilha do Google Forms.")) {
    appState.history = appState.history.filter(h => h.isRemote);
    localStorage.removeItem('presenca_history_records');
    renderHistoryTable();
    updateRelatorioDateSelect();
    updateAuditoriaDateSelect();
    renderAuditoriaUI();
    const activeTab = document.querySelector('.admin-tab-btn.active')?.getAttribute('data-tab');
    if (activeTab === 'tabRelatorios') {
      const selectedSchool = elements.relatorioEscolaSelect ? elements.relatorioEscolaSelect.value : '';
      const selectedDate = elements.relatorioDataSelect ? elements.relatorioDataSelect.value : '';
      renderManagementReport(selectedSchool, selectedDate);
    }
    showToast("Histórico local limpo.", "info");
  }
}

// ==========================================================================
// Event Listeners
// ==========================================================================
function setupEventListeners() {
  // Atualiza datalist de auto-sugestão de professores quando muda a escola
  if (elements.selectEscola) {
    elements.selectEscola.addEventListener('change', updateTeacherDatalist);
  }

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

  // Conversão automática para minúsculas ao digitar o e-mail
  if (elements.inputEmail) {
    elements.inputEmail.addEventListener('input', (e) => {
      e.target.value = e.target.value.toLowerCase().trim();
    });
  }

  // Desconectar / Trocar conta Google
  if (elements.btnGoogleDisconnect) {
    elements.btnGoogleDisconnect.addEventListener('click', disconnectGoogleUser);
  }

  // Envio do formulário principal
  elements.form.addEventListener('submit', handleSubmit);
  elements.btnNovoRegistro.addEventListener('click', resetForNewEntry);

  // Ações de Consulta e Atestado no Painel Admin
  if (elements.portalEmailInput) {
    elements.portalEmailInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        executarBuscaPortalDocente();
      }
    });
  }
  if (elements.btnBuscarPresencasDocente) {
    elements.btnBuscarPresencasDocente.addEventListener('click', () => executarBuscaPortalDocente());
  }
  if (elements.btnEmitirAtestadoDocente) {
    elements.btnEmitirAtestadoDocente.addEventListener('click', emitirAtestadoDocente);
  }
  if (elements.btnImprimirAtestadoDocente) {
    elements.btnImprimirAtestadoDocente.addEventListener('click', imprimirAtestadoDocente);
  }

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

  // Botão Testar Conexão com Firestore EDM
  if (elements.btnTestarEDM) {
    elements.btnTestarEDM.addEventListener('click', () => {
      const testUrl = elements.cfgFirestoreUrl ? elements.cfgFirestoreUrl.value.trim() : '';
      if (testUrl) {
        appState.config.firestoreUrl = testUrl;
      }
      syncCadastradosEDM(true);
    });
  }

  // Sincronizar Base EDM na aba de Auditoria
  if (elements.btnSyncEDMNow) {
    elements.btnSyncEDMNow.addEventListener('click', () => {
      syncCadastradosEDM(true);
    });
  }

  // Filtros da Aba Cruzamento & Auditoria de Faltas
  if (elements.auditoriaFiltroEscolaSelect) {
    elements.auditoriaFiltroEscolaSelect.addEventListener('change', renderAuditoriaUI);
  }
  if (elements.auditoriaFiltroDataSelect) {
    elements.auditoriaFiltroDataSelect.addEventListener('change', renderAuditoriaUI);
  }
  if (elements.auditoriaFiltroStatusSelect) {
    elements.auditoriaFiltroStatusSelect.addEventListener('change', renderAuditoriaUI);
  }
  if (elements.auditoriaFiltroBusca) {
    elements.auditoriaFiltroBusca.addEventListener('input', renderAuditoriaUI);
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
  if (elements.filtroDataSelect) {
    elements.filtroDataSelect.addEventListener('change', renderHistoryTable);
  }
  if (elements.filtroEscolaSelect) {
    elements.filtroEscolaSelect.addEventListener('change', renderHistoryTable);
  }
  if (elements.ordemHistoricoSelect) {
    elements.ordemHistoricoSelect.addEventListener('change', renderHistoryTable);
  }
  if (elements.btnExportarCSV) {
    elements.btnExportarCSV.addEventListener('click', exportCSV);
  }
  if (elements.btnLimparHistorico) {
    elements.btnLimparHistorico.addEventListener('click', clearHistory);
  }

  if (elements.btnNovaPresencaAdmin) {
    elements.btnNovaPresencaAdmin.addEventListener('click', () => abrirModalEdicaoRegistro(null));
  }
  if (elements.formEditarRegistro) {
    elements.formEditarRegistro.addEventListener('submit', salvarEdicaoRegistro);
  }
  if (elements.btnExcluirDentroDoModal) {
    elements.btnExcluirDentroDoModal.addEventListener('click', () => {
      const id = elements.editRecordId ? elements.editRecordId.value : '';
      if (id) excluirRegistroAdmin(id);
    });
  }

  // Ações da Aba Relatórios para Gestão
  if (elements.relatorioEscolaSelect) {
    elements.relatorioEscolaSelect.addEventListener('change', () => {
      const selectedSchool = elements.relatorioEscolaSelect.value;
      const selectedDate = elements.relatorioDataSelect ? elements.relatorioDataSelect.value : '';
      renderManagementReport(selectedSchool, selectedDate);
    });
  }
  if (elements.relatorioDataSelect) {
    elements.relatorioDataSelect.addEventListener('change', () => {
      const selectedSchool = elements.relatorioEscolaSelect ? elements.relatorioEscolaSelect.value : '';
      const selectedDate = elements.relatorioDataSelect.value;
      renderManagementReport(selectedSchool, selectedDate);
    });
  }
  if (elements.btnGerarPDF) {
    elements.btnGerarPDF.addEventListener('click', exportReportPDF);
  }
  if (elements.btnImprimirRelatorio) {
    elements.btnImprimirRelatorio.addEventListener('click', printManagementReport);
  }
  if (elements.btnCopiarWhatsApp) {
    elements.btnCopiarWhatsApp.addEventListener('click', copyWhatsAppSummary);
  }
  if (elements.btnExportarRelatorioCSV) {
    elements.btnExportarRelatorioCSV.addEventListener('click', exportReportCSV);
  }

  // Ações da Aba Configurações
  if (elements.btnSalvarConfig) {
    elements.btnSalvarConfig.addEventListener('click', saveConfig);
  }
  if (elements.btnRestaurarPadrao) {
    elements.btnRestaurarPadrao.addEventListener('click', restoreDefaultConfig);
  }

  // Ações da Identificação Google & Rápida
  if (elements.btnGoogleSignInAction) {
    elements.btnGoogleSignInAction.addEventListener('click', handleGoogleSignInClick);
  }
  if (elements.formGoogleQuickAuth) {
    elements.formGoogleQuickAuth.addEventListener('submit', handleQuickAuthSubmit);
  }
  if (elements.btnCloseGoogleQuickAuth) {
    elements.btnCloseGoogleQuickAuth.addEventListener('click', () => closeModal(elements.modalGoogleQuickAuth));
  }
  if (elements.btnCancelarQuickAuth) {
    elements.btnCancelarQuickAuth.addEventListener('click', () => closeModal(elements.modalGoogleQuickAuth));
  }

  // Fechar modais ao clicar no backdrop
  [elements.modalAdminAuth, elements.modalAdminPanel, elements.modalDuplicado, elements.modalGoogleQuickAuth].forEach(modal => {
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
      closeModal(elements.modalGoogleQuickAuth);
    }
  });
}

function openModal(modal) {
  if (typeof modal === 'string') modal = document.getElementById(modal);
  if (modal) {
    modal.classList.add('active');
    modal.style.display = 'flex';
    modal.style.opacity = '1';
    modal.style.pointerEvents = 'auto';
    modal.style.visibility = 'visible';
    modal.removeAttribute('hidden');

    const dialog = modal.querySelector('.modal-dialog');
    if (dialog) {
      dialog.style.transform = 'translateY(0) scale(1)';
      dialog.style.opacity = '1';
    }
  } else {
    console.warn("openModal: elemento modal não encontrado:", modal);
  }
}

function closeModal(modal) {
  if (typeof modal === 'string') modal = document.getElementById(modal);
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
    modal.style.opacity = '0';
    modal.style.pointerEvents = 'none';
    modal.style.visibility = 'hidden';
  }
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMessage');
  if (toastMsg) toastMsg.textContent = message;
  if (toast) {
    toast.className = `toast show ${type}`;
    if (window._toastTimeout) clearTimeout(window._toastTimeout);
    window._toastTimeout = setTimeout(() => toast.classList.remove('show'), 3500);
  } else {
    alert(message);
  }
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

// ==========================================================================
// Gestão de Tema (Claro / Escuro)
// ==========================================================================
function initTheme() {
  try {
    const savedTheme = localStorage.getItem('presenca_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      applyTheme('dark');
    } else {
      applyTheme('light');
    }
  } catch (e) {
    applyTheme('light');
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
  try {
    localStorage.setItem('presenca_theme', newTheme);
  } catch (e) {
    console.warn("Storage tema:", e);
  }
  showToast(newTheme === 'dark' ? "Modo Escuro ativado" : "Modo Claro ativado", "info");
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const themeIcon = document.getElementById('themeIcon');
  const btnToggle = document.getElementById('btnThemeToggle');
  
  if (theme === 'dark') {
    if (themeIcon) {
      themeIcon.className = 'fa-solid fa-sun';
    }
    if (btnToggle) {
      btnToggle.title = 'Alternar para Modo Claro';
      btnToggle.setAttribute('aria-label', 'Alternar para Modo Claro');
    }
  } else {
    if (themeIcon) {
      themeIcon.className = 'fa-solid fa-moon';
    }
    if (btnToggle) {
      btnToggle.title = 'Alternar para Modo Escuro';
      btnToggle.setAttribute('aria-label', 'Alternar para Modo Escuro');
    }
  }
}

// Funções globais expostas no window
window.initTheme = initTheme;
window.toggleTheme = toggleTheme;
window.applyTheme = applyTheme;
window.handleGoogleSignInClick = handleGoogleSignInClick;
window.openGoogleQuickAuthModal = openGoogleQuickAuthModal;
window.handleQuickAuthSubmit = handleQuickAuthSubmit;
window.selectQuickProfile = selectQuickProfile;
window.disconnectGoogleUser = disconnectGoogleUser;
window.openModal = openModal;
window.closeModal = closeModal;
window.showToast = showToast;



