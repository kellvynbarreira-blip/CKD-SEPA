const DEFAULT_CONFIG = window.CKD_CONFIG;
let config = loadConfig();
let previewConfig = null;

const userPanel = document.getElementById("userPanel");
const adminPanel = document.getElementById("adminPanel");
const referenceSelect = document.getElementById("referenceSelect");
const customRefBox = document.getElementById("customRefBox");
const customRef = document.getElementById("customRef");
const finalReference = document.getElementById("finalReference");
const qrCanvas = document.getElementById("qrCanvas");
const previewCanvas = document.getElementById("previewCanvas");
const statusEl = document.getElementById("status");
const loginModal = document.getElementById("loginModal");
const passwordInput = document.getElementById("passwordInput");
const loginError = document.getElementById("loginError");

let logoClicks = 0;
let logoClickTimer = null;

function cloneConfig(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function loadConfig() {
  const saved = localStorage.getItem("ckdConfig");
  if (!saved) return cloneConfig(DEFAULT_CONFIG);
  try {
    return { ...cloneConfig(DEFAULT_CONFIG), ...JSON.parse(saved) };
  } catch {
    return cloneConfig(DEFAULT_CONFIG);
  }
}

function saveConfig() {
  localStorage.setItem("ckdConfig", JSON.stringify(config));
}

function resetConfig() {
  localStorage.removeItem("ckdConfig");
  config = cloneConfig(DEFAULT_CONFIG);
  previewConfig = cloneConfig(config);
  init();
  showUser();
  setStatus("Configurações restauradas.");
}

function setStatus(message) {
  statusEl.textContent = message;
  setTimeout(() => {
    if (statusEl.textContent === message) statusEl.textContent = "";
  }, 2500);
}

function openLogin() {
  loginModal.classList.remove("hidden");
  passwordInput.value = "";
  loginError.classList.add("hidden");
  setTimeout(() => passwordInput.focus(), 50);
}

function closeLogin() {
  loginModal.classList.add("hidden");
}

function tryLogin() {
  if (passwordInput.value === config.adminPassword) {
    closeLogin();
    showAdmin();
  } else {
    loginError.classList.remove("hidden");
  }
}

function showAdmin() {
  userPanel.classList.add("hidden");
  adminPanel.classList.remove("hidden");
  previewConfig = cloneConfig(config);
  fillAdminForm();
  renderPreview();
  setStatus("ADM aberto.");
}

function showUser() {
  adminPanel.classList.add("hidden");
  userPanel.classList.remove("hidden");
  generateQR();
}

function buildReference() {
  let value = referenceSelect.value === "__custom__" ? customRef.value : referenceSelect.value;
  value = (value || "Backnang").trim();
  value = value.replace(/^CKD[-\s]*/i, "");
  return config.referencePrefix + value;
}

function makePayload(refOverride, cfg = config) {
  const ref = refOverride || buildReference();
  if (!refOverride) finalReference.textContent = ref;

  return [
    "BCD",
    "002",
    "1",
    "SCT",
    cfg.bic.replace(/\s+/g, ""),
    cfg.beneficiaryName,
    cfg.iban.replace(/\s+/g, ""),
    "",
    "",
    "",
    ref,
    ""
  ].join("\n");
}

function drawQR(canvas, cfg, refOverride) {
  const payload = makePayload(refOverride, cfg);

  new QRious({
    element: canvas,
    value: payload,
    size: canvas.width,
    level: "H",
    background: "white",
    foreground: "black"
  });

  const ctx = canvas.getContext("2d");
  const logo = new Image();
  logo.onload = () => {
    const qrW = canvas.width;
    const logoW = qrW * (Number(cfg.logoPercent || 20) / 100);
    const ratio = logoW / logo.width;
    const logoH = logo.height * ratio;

    const circleD = Math.max(logoW, logoH) * (Number(cfg.circleMarginPercent || 160) / 100);
    const cx = qrW / 2;
    const cy = qrW / 2;
    const radius = circleD / 2;

    const shadowOpacity = Number(cfg.shadowOpacity || 0) / 100;
    const shadowBlur = Number(cfg.shadowBlur || 0);
    const shadowOffset = Number(cfg.shadowOffset || 0);
    const borderWidth = Number(cfg.borderWidth || 0);
    const borderOpacity = Number(cfg.borderOpacity || 0) / 100;

    ctx.save();
    if (shadowOpacity > 0 && shadowBlur > 0) {
      ctx.shadowColor = `rgba(0,0,0,${shadowOpacity})`;
      ctx.shadowBlur = shadowBlur;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = shadowOffset;
    }
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.restore();

    if (borderWidth > 0 && borderOpacity > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius - borderWidth / 2, 0, Math.PI * 2);
      ctx.lineWidth = borderWidth;
      ctx.strokeStyle = `rgba(80,80,80,${borderOpacity})`;
      ctx.stroke();
      ctx.restore();
    }

    ctx.drawImage(logo, cx - logoW / 2, cy - logoH / 2, logoW, logoH);
  };
  logo.src = "logo.png";
}

function generateQR() {
  drawQR(qrCanvas, config);
}

function renderPreview() {
  if (!previewConfig) previewConfig = cloneConfig(config);
  const previewRef = previewConfig.referencePrefix + "Backnang";
  drawQR(previewCanvas, previewConfig, previewRef);
}

function downloadQR() {
  generateQR();
  setTimeout(() => {
    const ref = buildReference().replace(/[^A-Za-z0-9_-]/g, "_");
    const a = document.createElement("a");
    a.download = `CKD_SEPA_GiroCode_${ref}.png`;
    a.href = qrCanvas.toDataURL("image/png");
    a.click();
  }, 300);
}

function populateReferences() {
  referenceSelect.innerHTML = "";
  config.congregations.forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    referenceSelect.appendChild(option);
  });

  const custom = document.createElement("option");
  custom.value = "__custom__";
  custom.textContent = "Outra...";
  referenceSelect.appendChild(custom);
}

function updateBankData() {
  document.getElementById("displayName").textContent = config.beneficiaryName;
  document.getElementById("displayIban").textContent = formatIban(config.iban);
  document.getElementById("displayBic").textContent = config.bic;
}

function formatIban(iban) {
  return iban.replace(/\s+/g, "").replace(/(.{4})/g, "$1 ").trim();
}

function setPair(id, value) {
  document.getElementById(id).value = value;
  document.getElementById(id + "Range").value = value;
}

function bindPair(id, key, min, max) {
  const number = document.getElementById(id);
  const range = document.getElementById(id + "Range");

  function update(value) {
    value = Number(value);
    if (!Number.isFinite(value)) return;
    value = Math.max(min, Math.min(max, value));
    number.value = value;
    range.value = value;
    previewConfig[key] = value;
    renderPreview();
  }

  number.addEventListener("input", () => update(number.value));
  range.addEventListener("input", () => update(range.value));
}

function fillAdminForm() {
  document.getElementById("adminPassword").value = config.adminPassword;
  document.getElementById("adminPrefix").value = config.referencePrefix;
  document.getElementById("adminName").value = config.beneficiaryName;
  document.getElementById("adminIban").value = config.iban;
  document.getElementById("adminBic").value = config.bic;
  document.getElementById("adminCongregations").value = config.congregations.join("\n");

  setPair("previewLogoPercent", previewConfig.logoPercent);
  setPair("previewCircleMarginPercent", previewConfig.circleMarginPercent);
  setPair("previewBorderWidth", previewConfig.borderWidth);
  setPair("previewBorderOpacity", previewConfig.borderOpacity);
  setPair("previewShadowOpacity", previewConfig.shadowOpacity);
  setPair("previewShadowBlur", previewConfig.shadowBlur);
  setPair("previewShadowOffset", previewConfig.shadowOffset);
}

function readAdminTextFields(target) {
  target.adminPassword = document.getElementById("adminPassword").value.trim() || "CKD2025";
  target.referencePrefix = document.getElementById("adminPrefix").value.trim() || "CKD-";
  target.beneficiaryName = document.getElementById("adminName").value.trim();
  target.iban = document.getElementById("adminIban").value.replace(/\s+/g, "").trim();
  target.bic = document.getElementById("adminBic").value.replace(/\s+/g, "").trim();
  target.congregations = document.getElementById("adminCongregations").value
    .split("\n")
    .map(x => x.trim())
    .filter(Boolean);
}

function applyPreview() {
  readAdminTextFields(previewConfig);
  config = cloneConfig(previewConfig);
  init();
  setStatus("Pré-visualização aplicada nesta sessão.");
}

function cancelPreview() {
  previewConfig = cloneConfig(config);
  fillAdminForm();
  renderPreview();
  setStatus("Alterações da prévia canceladas.");
}

function saveAdminForm() {
  readAdminTextFields(previewConfig);
  config = cloneConfig(previewConfig);
  saveConfig();
  init();
  showAdmin();
  setStatus("Configurações salvas neste navegador.");
}

function exportConfig() {
  const js = "window.CKD_CONFIG = " + JSON.stringify(config, null, 2) + ";\n";
  const blob = new Blob([js], { type: "text/javascript" });
  const a = document.createElement("a");
  a.download = "config.js";
  a.href = URL.createObjectURL(blob);
  a.click();
  URL.revokeObjectURL(a.href);
}

function importConfigFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const text = String(reader.result);
      const match = text.match(/window\\.CKD_CONFIG\\s*=\\s*(\\{[\\s\\S]*\\})\\s*;?/);
      if (!match) throw new Error("Formato inválido");
      const imported = Function("return " + match[1])();
      config = { ...cloneConfig(DEFAULT_CONFIG), ...imported };
      previewConfig = cloneConfig(config);
      saveConfig();
      init();
      fillAdminForm();
      renderPreview();
      setStatus("Configuração importada.");
    } catch (e) {
      setStatus("Não foi possível importar o config.js.");
    }
  };
  reader.readAsText(file);
}

function init() {
  populateReferences();
  updateBankData();
  customRefBox.classList.add("hidden");
  generateQR();
}

document.getElementById("ckdLogo").addEventListener("click", () => {
  logoClicks += 1;
  clearTimeout(logoClickTimer);
  logoClickTimer = setTimeout(() => logoClicks = 0, 1400);
  if (logoClicks >= 5) {
    logoClicks = 0;
    openLogin();
  }
});

document.getElementById("loginBtn").addEventListener("click", tryLogin);
document.getElementById("cancelLoginBtn").addEventListener("click", closeLogin);
passwordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") tryLogin();
  if (e.key === "Escape") closeLogin();
});

document.getElementById("exitAdminBtn").addEventListener("click", showUser);

document.querySelectorAll(".adminTab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".adminTab").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tabPanel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
    if (btn.dataset.tab === "qrTab") renderPreview();
  });
});

referenceSelect.addEventListener("change", () => {
  customRefBox.classList.toggle("hidden", referenceSelect.value !== "__custom__");
  generateQR();
});
customRef.addEventListener("input", generateQR);
document.getElementById("generateBtn").addEventListener("click", generateQR);
document.getElementById("downloadBtn").addEventListener("click", downloadQR);

document.getElementById("cancelPreviewBtn").addEventListener("click", cancelPreview);
document.getElementById("applyPreviewBtn").addEventListener("click", applyPreview);
document.getElementById("saveFromPreviewBtn").addEventListener("click", saveAdminForm);
document.getElementById("saveAdminBtn").addEventListener("click", saveAdminForm);
document.getElementById("resetAdminBtn").addEventListener("click", resetConfig);
document.getElementById("exportConfigBtn").addEventListener("click", exportConfig);
document.getElementById("importConfigFile").addEventListener("change", (e) => importConfigFile(e.target.files[0]));

bindPair("previewLogoPercent", "logoPercent", 5, 25);
bindPair("previewCircleMarginPercent", "circleMarginPercent", 120, 220);
bindPair("previewBorderWidth", "borderWidth", 0, 18);
bindPair("previewBorderOpacity", "borderOpacity", 0, 100);
bindPair("previewShadowOpacity", "shadowOpacity", 0, 100);
bindPair("previewShadowBlur", "shadowBlur", 0, 40);
bindPair("previewShadowOffset", "shadowOffset", 0, 20);

document.querySelectorAll(".copy").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const value = btn.dataset.copy === "iban" ? config.iban : config.bic;
    await navigator.clipboard.writeText(value);
    setStatus("Copiado.");
  });
});

init();
