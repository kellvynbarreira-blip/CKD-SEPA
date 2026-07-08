const DEFAULT_CONFIG = window.CKD_CONFIG;
let config = loadConfig();

const userPanel = document.getElementById("userPanel");
const adminPanel = document.getElementById("adminPanel");
const referenceSelect = document.getElementById("referenceSelect");
const customRefBox = document.getElementById("customRefBox");
const customRef = document.getElementById("customRef");
const finalReference = document.getElementById("finalReference");
const qrCanvas = document.getElementById("qrCanvas");
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
  fillAdminForm();
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

function makePayload() {
  const ref = buildReference();
  finalReference.textContent = ref;

  return [
    "BCD",
    "002",
    "1",
    "SCT",
    config.bic.replace(/\s+/g, ""),
    config.beneficiaryName,
    config.iban.replace(/\s+/g, ""),
    "",
    "",
    "",
    ref,
    ""
  ].join("\n");
}

function generateQR() {
  const payload = makePayload();

  new QRious({
    element: qrCanvas,
    value: payload,
    size: 1400,
    level: "H",
    background: "white",
    foreground: "black"
  });

  const ctx = qrCanvas.getContext("2d");
  const logo = new Image();
  logo.onload = () => {
    const qrW = qrCanvas.width;
    const logoW = qrW * (Number(config.logoPercent || 20) / 100);
    const ratio = logoW / logo.width;
    const logoH = logo.height * ratio;

    const circleD = Math.max(logoW, logoH) * 1.30;
    const cx = qrW / 2;
    const cy = qrW / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, circleD / 2, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.restore();

    ctx.drawImage(logo, cx - logoW / 2, cy - logoH / 2, logoW, logoH);
  };
  logo.src = "logo.png";
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

function fillAdminForm() {
  document.getElementById("adminPassword").value = config.adminPassword;
  document.getElementById("adminPrefix").value = config.referencePrefix;
  document.getElementById("adminName").value = config.beneficiaryName;
  document.getElementById("adminIban").value = config.iban;
  document.getElementById("adminBic").value = config.bic;
  document.getElementById("adminLogoPercent").value = config.logoPercent;
  document.getElementById("adminCongregations").value = config.congregations.join("\n");
}

function saveAdminForm() {
  config.adminPassword = document.getElementById("adminPassword").value.trim() || "CKD2025";
  config.referencePrefix = document.getElementById("adminPrefix").value.trim() || "CKD-";
  config.beneficiaryName = document.getElementById("adminName").value.trim();
  config.iban = document.getElementById("adminIban").value.replace(/\s+/g, "").trim();
  config.bic = document.getElementById("adminBic").value.replace(/\s+/g, "").trim();
  config.logoPercent = Math.max(5, Math.min(25, Number(document.getElementById("adminLogoPercent").value || 20)));
  config.congregations = document.getElementById("adminCongregations").value
    .split("\n")
    .map(x => x.trim())
    .filter(Boolean);

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
referenceSelect.addEventListener("change", () => {
  customRefBox.classList.toggle("hidden", referenceSelect.value !== "__custom__");
  generateQR();
});
customRef.addEventListener("input", generateQR);
document.getElementById("generateBtn").addEventListener("click", generateQR);
document.getElementById("downloadBtn").addEventListener("click", downloadQR);
document.getElementById("saveAdminBtn").addEventListener("click", saveAdminForm);
document.getElementById("resetAdminBtn").addEventListener("click", resetConfig);
document.getElementById("exportConfigBtn").addEventListener("click", exportConfig);

document.querySelectorAll(".copy").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const value = btn.dataset.copy === "iban" ? config.iban : config.bic;
    await navigator.clipboard.writeText(value);
    setStatus("Copiado.");
  });
});

init();
