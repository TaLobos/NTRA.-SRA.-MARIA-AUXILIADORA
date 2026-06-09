const config = window.APP_CONFIG || {};
const API = config.apiBaseUrl || "http://localhost:8080";

const state = {
  products: [],
  backendAvailable: false,
  cart: new Map(),
  orders: [],
  users: [],
  profile: loadProfile(),
  adminAuth: "",
  adminSession: null,
  supabaseClient: null,
  detailProductId: null,
  detailImageIndex: 0,
  editingProductId: null,
  notifications: loadNotifications(),
  auditLogs: loadAuditLogs(),
  orderStatusPoller: null,
  dashboardMonth: currentMonthKey(),
  expandedOrderId: null,
  expandedUserId: null,
  userHistoryPage: new Map(),
};

const ADMIN_EMAIL = "tomas.alberto.lobos123@gmail.com";

const demoImages = [
  "https://images.unsplash.com/photo-1578301978018-3005759f48f7?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1542361345-89e58247f2d5?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1602524206684-1886f0379f7d?auto=format&fit=crop&w=900&q=80",
];

const fallbackProducts = [
  { id: 1, nombre: "María Auxiliadora (Tamaño: 40 CM)", descripcion: "Imagen religiosa para devoción particular o comunidad.", precio: 36400, stockQuantity: 8, fotos: [demoImages[0], demoImages[0]], caracteristicas: ["Categoría: Imágenes", "Tamaño: 40 CM"] },
  { id: 2, nombre: "Cristo Crucificado (Tamaño: 120CM)", descripcion: "Crucifijo de pared en madera.", precio: 402500, stockQuantity: 5, fotos: [demoImages[1], demoImages[1]], caracteristicas: ["Categoría: Crucifijos", "Tamaño: 120 CM"] },
  { id: 3, nombre: "Rosario de Plata", descripcion: "Rosario devocional con terminación metálica.", precio: 120000, stockQuantity: 12, fotos: [demoImages[2], demoImages[2]], caracteristicas: ["Categoría: Rosarios", "Material: Plata"] },
  { id: 4, nombre: "Lámpara Votiva para Santuario", descripcion: "Lámpara para uso litúrgico o santuario.", precio: 60000, stockQuantity: 0, fotos: [demoImages[3], demoImages[3]], caracteristicas: ["Categoría: Santuario", "Uso: Interior"] },
];

const pageBibleQuotes = [
  '"Que el Dios de la esperanza los llene de alegría y paz." Romanos 15:13',
  '"El Señor es mi luz y mi salvación." Salmo 27:1',
  '"Vengan a mí todos los que están cansados, y yo los aliviaré." Mateo 11:28',
  '"La paz les dejo, mi paz les doy." Juan 14:27',
  '"El amor es paciente, el amor es servicial." 1 Corintios 13:4',
  '"El Señor te bendiga y te proteja." Números 6:24',
  '"Todo lo puedo en Cristo que me fortalece." Filipenses 4:13',
  '"Dichosos los que trabajan por la paz." Mateo 5:9',
  '"Permanezcan en mi amor." Juan 15:9',
  '"El Señor está cerca de los que tienen el corazón quebrantado." Salmo 34:18',
];

const GEOREF_API = "https://apis.datos.gob.ar/georef/api";
const geoCache = {
  provinces: null,
  citiesByProvince: new Map(),
};
const supportedCountries = ["Argentina", "Bolivia", "Brasil", "Chile", "Paraguay", "Uruguay"];
const fallbackArgentinaLocations = {
  "Buenos Aires": ["La Plata", "Mar del Plata", "Bahia Blanca", "Tandil", "Lujan"],
  "Catamarca": ["San Fernando del Valle de Catamarca"],
  "Chaco": ["Resistencia", "Presidencia Roque Saenz Pena"],
  "Chubut": ["Rawson", "Trelew", "Puerto Madryn", "Comodoro Rivadavia"],
  "Ciudad Autonoma de Buenos Aires": ["CABA"],
  "Cordoba": ["Cordoba", "San Francisco", "Alta Gracia", "Villa Maria", "Rio Cuarto"],
  "Corrientes": ["Corrientes", "Goya"],
  "Entre Rios": ["Parana", "Concordia", "Gualeguaychu"],
  "Formosa": ["Formosa"],
  "Jujuy": ["San Salvador de Jujuy"],
  "La Pampa": ["Santa Rosa", "General Pico"],
  "La Rioja": ["La Rioja"],
  "Mendoza": ["Mendoza", "San Rafael", "Godoy Cruz"],
  "Misiones": ["Posadas", "Obera", "Puerto Iguazu"],
  "Neuquen": ["Neuquen", "San Martin de los Andes"],
  "Rio Negro": ["Viedma", "Bariloche", "General Roca"],
  "Salta": ["Salta", "Tartagal"],
  "San Juan": ["San Juan"],
  "San Luis": ["San Luis", "Villa Mercedes"],
  "Santa Cruz": ["Rio Gallegos", "Caleta Olivia"],
  "Santa Fe": ["Santa Fe", "Rosario", "Rafaela"],
  "Santiago del Estero": ["Santiago del Estero", "La Banda"],
  "Tierra del Fuego": ["Ushuaia", "Rio Grande"],
  "Tucuman": ["San Miguel de Tucuman", "Yerba Buena"],
};

const money = (value) => new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
}).format(Number(value || 0));

function currentMonthKey(date = new Date()) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return currentMonthKey(new Date());
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key) {
  const [year, month] = String(key || currentMonthKey()).split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));
}

function orderDate(order) {
  const date = new Date(order?.fecha || order?.createdAt || order?.created_at || Date.now());
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function orderTotal(order) {
  return Number(order?.total || 0);
}

function orderCustomer(order) {
  const user = order?.usuario || order?.user || {};
  const fullName = `${user.nombre || ""} ${user.apellido || ""}`.trim();
  return user.organizacion || fullName || user.email || "Cliente";
}

function orderLocation(order) {
  const user = order?.usuario || order?.user || {};
  const parts = [user.ciudad, user.provincia].filter(Boolean);
  return parts.join(", ") || user.pais || "Sin ubicacion";
}

function normalizeText(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function canonicalLocation(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalCountry(value = "") {
  const text = normalizeText(value);
  const found = supportedCountries.find((country) => normalizeText(country) === text);
  if (text === "brasil" || text === "brazil") return "Brasil";
  return found || canonicalLocation(value);
}

function isArgentinaCountry(value = "") {
  const text = normalizeText(value);
  return text === "argentina" || text === "ar" || text === "republica argentina";
}

async function fetchArgentinaProvinces() {
  if (geoCache.provinces) return geoCache.provinces;
  try {
    const response = await fetch(`${GEOREF_API}/provincias?campos=nombre&max=24`);
    if (!response.ok) throw new Error("georef unavailable");
    const data = await response.json();
    geoCache.provinces = (data.provincias || []).map((item) => canonicalLocation(item.nombre)).sort((a, b) => a.localeCompare(b, "es"));
  } catch {
    geoCache.provinces = Object.keys(fallbackArgentinaLocations).sort((a, b) => a.localeCompare(b, "es"));
  }
  return geoCache.provinces;
}

async function fetchArgentinaCities(province) {
  const key = String(province || "").trim();
  if (!key) return [];
  if (geoCache.citiesByProvince.has(key)) return geoCache.citiesByProvince.get(key);
  try {
    const params = new URLSearchParams({ provincia: key, campos: "nombre", max: "5000" });
    const response = await fetch(`${GEOREF_API}/localidades?${params.toString()}`);
    if (!response.ok) throw new Error("georef unavailable");
    const data = await response.json();
    const cities = Array.from(new Set((data.localidades || []).map((item) => canonicalLocation(item.nombre)).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b, "es"));
    geoCache.citiesByProvince.set(key, cities.length ? cities : (fallbackArgentinaLocations[key] || []));
  } catch {
    geoCache.citiesByProvince.set(key, fallbackArgentinaLocations[key] || []);
  }
  return geoCache.citiesByProvince.get(key);
}

function setFieldAsInput(form, name, value = "") {
  const current = form.elements[name];
  if (!current || current.tagName === "INPUT") return;
  const input = document.createElement("input");
  input.name = name;
  input.required = current.required;
  input.value = canonicalLocation(value || current.value || "");
  if (name === "pais") input.autocomplete = "country-name";
  current.replaceWith(input);
}

function setFieldAsSelect(form, name, options, value = "", placeholder = "Seleccionar") {
  const current = form.elements[name];
  if (!current) return null;
  const select = document.createElement("select");
  select.name = name;
  select.required = current.required;
  select.autocomplete = current.autocomplete || "";
  select.innerHTML = `<option value="">${placeholder}</option>` + options.map((option) => (
    `<option value="${escapeHtml(canonicalLocation(option))}" ${normalizeText(option) === normalizeText(value || current.value) ? "selected" : ""}>${escapeHtml(canonicalLocation(option))}</option>`
  )).join("");
  current.replaceWith(select);
  return select;
}

async function bindLocationSelectors(form, profile = {}) {
  if (!form?.elements?.pais || !form.elements.provincia || !form.elements.ciudad) return;
  setFieldAsSelect(form, "pais", supportedCountries, profile.pais || form.elements.pais.value || "Argentina", "Seleccionar pais");
  const initialProvince = profile.provincia || form.elements.provincia.value;
  const initialCity = profile.ciudad || form.elements.ciudad.value;

  async function refreshLocationControls() {
    const country = form.elements.pais?.value || "";
    if (!isArgentinaCountry(country)) {
      setFieldAsInput(form, "provincia", form.elements.provincia?.value || "");
      setFieldAsInput(form, "ciudad", form.elements.ciudad?.value || "");
      return;
    }
    const provinces = await fetchArgentinaProvinces();
    const provinceSelect = setFieldAsSelect(form, "provincia", provinces, form.elements.provincia?.value || initialProvince, "Seleccionar provincia");
    const selectedProvince = provinceSelect?.value || "";
    const cities = selectedProvince ? await fetchArgentinaCities(selectedProvince) : [];
    setFieldAsSelect(form, "ciudad", cities, form.elements.ciudad?.value || initialCity, selectedProvince ? "Seleccionar ciudad" : "Primero seleccione provincia");
    if (form.elements.provincia) form.elements.provincia.onchange = async () => {
      const nextCities = await fetchArgentinaCities(form.elements.provincia.value);
      setFieldAsSelect(form, "ciudad", nextCities, "", "Seleccionar ciudad");
    };
  }

  form.elements.pais.onchange = refreshLocationControls;
  await refreshLocationControls();
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function installRandomBibleQuote() {
  const quote = document.querySelector(".bible-quote");
  if (!quote) return;
  quote.textContent = pageBibleQuotes[Math.floor(Math.random() * pageBibleQuotes.length)];
}

function installRosaryScrollMotion() {
  const beads = Array.from(document.querySelectorAll(".rosary-beads circle"));
  if (!beads.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let ticking = false;
  const update = () => {
    const progress = window.scrollY * 0.035;
    beads.forEach((bead, index) => {
      const phase = progress + index * 0.72;
      const depth = Math.cos(phase);
      const lateral = Math.sin(phase) * 3.8;
      const scale = 0.88 + ((depth + 1) * 0.09);
      bead.style.transform = `translateX(${lateral.toFixed(2)}px) scale(${scale.toFixed(3)})`;
      bead.style.opacity = String(0.62 + ((depth + 1) * 0.16));
    });
    ticking = false;
  };
  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  };
  update();
  window.addEventListener("scroll", requestUpdate, { passive: true });
}

function productDisplayName(product) {
  const category = categoryOf(product);
  return String(product?.nombre || "")
    .replace(/\s*\((Categoria|Categoría):[^)]*\)/gi, "")
    .replace(/\s*\((Tamano|Tamaño):[^)]*\)/gi, "")
    .replace(new RegExp(`\\s*\\(${category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)\\s*$`, "i"), "")
    .trim();
}

function categoryFromText(value = "") {
  const text = String(value || "");
  const match = text.match(/(?:Categoria|Categoría):\s*([^)]+)/i);
  return match ? match[1].trim() : "";
}

function categoryOf(product) {
  const fromExplicit = product.categoria || product.category;
  const fromFeatures = (product.caracteristicas || []).map(categoryFromText).find(Boolean);
  const fromDescription = categoryFromText(product.descripcion);
  const fromName = categoryFromText(product.nombre);
  const raw = fromExplicit || fromFeatures || fromDescription || fromName || "";
  const measure = productMeasure(product);
  const invalidCategory = ["General", "Imagenes religiosas", "MULA", "CILLA", "PONCHO", "BUSTO", "PIE", "MEXICO", "SANTA FE", "GENERALA", "AUREOLA", "D", "DELGADA", "T", "V.R.CH", "V.R.G", "DORADA", "90 CM", "RAYOS"];
  if (measure && (!raw || invalidCategory.includes(raw))) return `TAMANO: ${measure}`;
  if (raw && raw !== "General") return raw;
  if (measure) return `TAMANO: ${measure}`;
  const freeFeature = (product.caracteristicas || []).find((item) => !/^\s*(Categoria|Categoría|Medida|Tamano|Tamaño)\s*:/i.test(item));
  if (freeFeature) return freeFeature.trim();
  return "General";
}

function productMeasure(product) {
  const source = [product.nombre, product.descripcion, ...(product.caracteristicas || [])].join(" ");
  const explicit = source.match(/(?:Tamano|Tamaño|Medida):\s*([0-9]+\s*CM|IMAGENES\s*15\s*CM)/i)?.[1];
  if (explicit) return explicit.replace(/\s+/g, " ").trim().toUpperCase();
  const inName = source.match(/\b([0-9]{2,3})\s*CM\b/i)?.[1];
  return inName ? `${inName} CM` : "";
}

function productFeatures(product) {
  const raw = product.caracteristicas || [];
  const features = raw.filter((item) => !/^\s*(Categoria|Categoría)\s*:/i.test(item));
  const name = String(product.nombre || "");
  const size = name.match(/\((Tamano|Tamaño):\s*([^)]+)\)/i)?.[2] || String(product.descripcion || "").match(/(Tamano|Tamaño):\s*([^)]+)/i)?.[2];
  if (size && !features.some((item) => /tamano|tamaño/i.test(item))) {
    features.unshift(`Medida: ${size.trim()}`);
  }
  if (!features.length) features.push("Pieza de arte sacro para devoción y oración.");
  return features;
}

function bibleQuoteFor(product) {
  const name = productDisplayName(product).toLowerCase();
  if (name.includes("espiritu")) return '"El Espíritu viene en ayuda de nuestra debilidad." Romanos 8:26';
  if (name.includes("rosa") || name.includes("maria") || name.includes("virgen")) return '"Hagan todo lo que el les diga." Juan 2:5';
  if (name.includes("familia")) return '"Yo y mi casa serviremos al Señor." Josué 24:15';
  if (name.includes("corazon")) return '"Aprendan de mí, que soy manso y humilde de corazón." Mateo 11:29';
  if (name.includes("benito")) return '"El Señor te guardará de todo mal." Salmo 121:7';
  if (name.includes("cruz") || name.includes("cristo")) return '"Por sus heridas fuimos sanados." Isaías 53:5';
  return '"Que el Dios de la esperanza los llene de alegría y paz." Romanos 15:13';
}

function productDescription(product) {
  const current = String(product.descripcion || "").trim();
  if (current && /(Romanos|Juan|Josue|Isa[ií]as|Mateo|Salmo|Lucas|Proverbios|Corintios)/i.test(current)) return current;
  return `${productDisplayName(product)} es una pieza de arte sacro pensada para acompañar la oración, el hogar o la comunidad. ${bibleQuoteFor(product)}`;
}

function normalizeProduct(product) {
  const category = categoryOf(product);
  const features = productFeatures({ ...product, caracteristicas: product.caracteristicas || [`Categoría: ${category}`] });
  return {
    ...product,
    nombre: productDisplayName(product),
    descripcion: productDescription(product),
    caracteristicas: [`Categoría: ${category}`, ...features.filter((item) => !/^\s*(Categoria|Categoría)\s*:/i.test(item))],
  };
}

function normalizeProducts(products) {
  return products.map(normalizeProduct);
}

function loadProfile() {
  try {
    return JSON.parse(localStorage.getItem("customerProfile") || "null");
  } catch {
    return null;
  }
}

function saveProfile(profile) {
  state.profile = {
    ...state.profile,
    ...profile,
    role: profile.role || profile.rol || state.profile?.role || "CLIENTE",
  };
  localStorage.setItem("customerProfile", JSON.stringify(state.profile));
  saveKnownProfile(state.profile);
  updateAccountButton();
  startOrderStatusPolling();
}

function loadKnownProfiles() {
  try {
    return JSON.parse(localStorage.getItem("knownProfiles") || "{}");
  } catch {
    return {};
  }
}

function saveKnownProfile(profile) {
  const email = String(profile?.email || "").toLowerCase();
  if (!email) return;
  const profiles = loadKnownProfiles();
  profiles[email] = { ...(profiles[email] || {}), ...profile, email };
  localStorage.setItem("knownProfiles", JSON.stringify(profiles));
  const deletedUsers = JSON.parse(localStorage.getItem("localDeletedUsers") || "[]")
    .filter((item) => String(item || "").toLowerCase() !== email);
  localStorage.setItem("localDeletedUsers", JSON.stringify(deletedUsers));
}

function knownProfileFor(email) {
  return loadKnownProfiles()[String(email || "").toLowerCase()] || null;
}

function localRoleForEmail(email) {
  const normalizedEmail = String(email || "").toLowerCase();
  if (!normalizedEmail) return "";
  try {
    const roles = JSON.parse(localStorage.getItem("localUserRoles") || "{}");
    return roles[normalizedEmail] || knownProfileFor(normalizedEmail)?.role || knownProfileFor(normalizedEmail)?.rol || "";
  } catch {
    return knownProfileFor(normalizedEmail)?.role || knownProfileFor(normalizedEmail)?.rol || "";
  }
}

function loadNotifications() {
  try {
    return JSON.parse(localStorage.getItem("appNotifications") || "[]");
  } catch {
    return [];
  }
}

function loadAuditLogs() {
  try {
    return JSON.parse(localStorage.getItem("adminAuditLogs") || "[]");
  } catch {
    return [];
  }
}

function saveAuditLogs() {
  localStorage.setItem("adminAuditLogs", JSON.stringify(state.auditLogs));
}

function currentActor() {
  const profile = state.profile || {};
  return {
    nombre: `${profile.nombre || ""} ${profile.apellido || ""}`.trim() || profile.email || "Administrador",
    email: String(profile.email || "").toLowerCase() || "sin-mail",
    rol: profile.role || profile.rol || "ADMIN",
  };
}

function addAuditLog(action, detail = "", target = "") {
  const actor = currentActor();
  state.auditLogs = [
    {
      id: Date.now(),
      fecha: new Date().toISOString(),
      actorNombre: actor.nombre,
      actorEmail: actor.email,
      actorRol: actor.rol,
      accion: action,
      detalle: detail,
      objetivo: target,
    },
    ...state.auditLogs,
  ].slice(0, 300);
  saveAuditLogs();
  if (!document.getElementById("adminAudit")?.classList.contains("hidden")) renderAdminAudit();
}

function saveNotifications() {
  localStorage.setItem("appNotifications", JSON.stringify(state.notifications));
  renderNotifications();
}

function addNotification(message, type = "info") {
  state.notifications = [
    { id: Date.now(), message, type, read: false, createdAt: new Date().toISOString() },
    ...state.notifications,
  ].slice(0, 20);
  saveNotifications();
}

function renderNotifications() {
  const count = document.getElementById("notificationCount");
  const list = document.getElementById("notificationList");
  if (count) count.textContent = state.notifications.filter((item) => !item.read).length;
  if (!list) return;
  list.innerHTML = state.notifications.length
    ? state.notifications.map((item) => `
      <article class="notification-item ${item.type}">
        <p>${escapeHtml(item.message)}</p>
        <small>${new Date(item.createdAt).toLocaleString("es-AR")}</small>
      </article>
    `).join("")
    : "<p>No hay avisos.</p>";
}

function toggleNotifications() {
  const panel = document.getElementById("notificationPanel");
  if (!panel) return;
  panel.classList.toggle("hidden");
  state.notifications = state.notifications.map((item) => ({ ...item, read: true }));
  saveNotifications();
}

function loadTrackedOrderStatuses() {
  try {
    return JSON.parse(localStorage.getItem("trackedOrderStatuses") || "{}");
  } catch {
    return {};
  }
}

function saveTrackedOrderStatuses(statuses) {
  localStorage.setItem("trackedOrderStatuses", JSON.stringify(statuses));
}

function trackOrderStatus(order) {
  if (!order?.id || !order?.estado) return;
  const statuses = loadTrackedOrderStatuses();
  statuses[order.id] = order.estado;
  saveTrackedOrderStatuses(statuses);
}

function orderStatusMessage(order, estado, automatic = false) {
  const id = order?.id || "";
  if (estado === "ACEPTADO") return `Tu pedido #${id} fue aceptado. El stock ya quedo reservado.`;
  if (automatic) return `Tu pedido #${id} fue rechazado porque el stock ya no alcanza por el momento.`;
  return `Tu pedido #${id} fue rechazado. Podes consultar al santuario o revisar el catalogo.`;
}

function notifyOrderStatus(order, estado, automatic = false) {
  if (estado !== "ACEPTADO" && estado !== "RECHAZADO") return;
  addNotification(orderStatusMessage(order, estado, automatic), estado === "RECHAZADO" ? "warning" : "info");
}

async function pollOrderStatuses() {
  if (!state.backendAvailable || !state.profile?.id || isAdminProfile()) return;
  try {
    const orders = await api(`/api/pedidos/usuario/${state.profile.id}`, { headers: await authHeader() });
    const statuses = loadTrackedOrderStatuses();
    let changed = false;
    orders.forEach((order) => {
      const previous = statuses[order.id];
      if (!previous) {
        statuses[order.id] = order.estado;
        changed = true;
        return;
      }
      if (previous !== order.estado) {
        statuses[order.id] = order.estado;
        changed = true;
        notifyOrderStatus(order, order.estado, order.estado === "RECHAZADO");
      }
    });
    if (changed) saveTrackedOrderStatuses(statuses);
  } catch {
    // El polling no debe interrumpir el uso normal de la app.
  }
}

function startOrderStatusPolling() {
  if (state.orderStatusPoller || !state.profile?.id || isAdminProfile()) return;
  state.orderStatusPoller = window.setInterval(pollOrderStatuses, 15000);
  pollOrderStatuses();
}

function isAdminProfile() {
  return ["ADMIN", "SUPER_ADMIN", "SUPER ADMIN"].includes(state.profile?.role);
}

function isSuperAdminProfile() {
  return String(state.profile?.email || "").toLowerCase() === ADMIN_EMAIL;
}

function hasShippingInfo(profile = state.profile) {
  return Boolean(profile?.nombre && profile?.email && profile?.provincia && profile?.ciudad && profile?.direccion && profile?.codigoPostal);
}

function nextLocalOrderId() {
  const next = Number(localStorage.getItem("nextLocalOrderId") || "1000") + 1;
  localStorage.setItem("nextLocalOrderId", String(next));
  return next;
}

function normalizeLocalOrders() {
  const orders = JSON.parse(localStorage.getItem("localOrders") || "[]");
  let changed = false;
  let next = 1001;
  const normalized = orders.map((order) => {
    const id = Number(order.id);
    if (!Number.isFinite(id) || id > 999999) {
      changed = true;
      return { ...order, id: next++ };
    }
    next = Math.max(next, id + 1);
    return order;
  });
  if (changed) {
    localStorage.setItem("localOrders", JSON.stringify(normalized));
    localStorage.setItem("nextLocalOrderId", String(next - 1));
  }
  return normalized;
}

async function ensureSupabaseClient() {
  if (state.supabaseClient || !config.supabaseUrl || !config.supabaseAnonKey) return state.supabaseClient;
  if (!window.supabase) {
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  state.supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  return state.supabaseClient;
}

async function currentSupabaseSession() {
  const client = await ensureSupabaseClient().catch(() => null);
  if (!client) return null;
  const { data } = await client.auth.getSession();
  state.adminSession = data.session || null;
  return state.adminSession;
}

async function requireSupabaseAdminSession() {
  const client = await ensureSupabaseClient().catch(() => null);
  if (!client) {
    alert("No está configurada la conexión con Supabase Auth.");
    return null;
  }

  let session = await currentSupabaseSession();
  const sessionEmail = String(session?.user?.email || "").toLowerCase();
  if (session && isAdminProfile() && sessionEmail === String(state.profile?.email || "").toLowerCase()) return session;
  if (session && !isAdminProfile()) {
    await client.auth.signOut();
    session = null;
  }

  alert("Volvé a iniciar sesión como administrador para realizar esta acción.");
  return null;
}

async function authHeader() {
  const session = await currentSupabaseSession();
  if (session?.access_token) return { Authorization: `Bearer ${session.access_token}` };
  return state.adminAuth ? { Authorization: `Basic ${state.adminAuth}` } : {};
}

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

function firstImage(product) {
  return product.fotos && product.fotos.length ? product.fotos[0] : "";
}

async function loadProducts() {
  const status = document.getElementById("statusLine");
  try {
    const products = await api("/api/productos");
    state.products = normalizeProducts(products);
    state.backendAvailable = true;
    status.textContent = "";
  } catch {
    state.backendAvailable = false;
    state.products = normalizeProducts(await loadLocalProducts());
    saveLocalProducts();
    status.textContent = "";
  }
  syncCartWithProducts();
  hydrateCategories();
  renderProducts();
  renderCart();
  renderAdminProducts();
  if (state.detailProductId) renderProductDetail();
}

function syncCartWithProducts() {
  for (const [id, item] of state.cart.entries()) {
    const product = state.products.find((candidate) => Number(candidate.id) === Number(id));
    if (!product || Number(product.stockQuantity || 0) <= 0) {
      state.cart.delete(id);
      if (product) addNotification(`No hay mas stock de ${productDisplayName(product)} por el momento.`, "warning");
      continue;
    }
    item.product = product;
    if (item.cantidad > product.stockQuantity) {
      item.cantidad = product.stockQuantity;
      addNotification(`Se ajusto la cantidad de ${productDisplayName(product)} al stock disponible.`, "warning");
    }
    state.cart.set(id, item);
  }
}

async function loadLocalProducts() {
  const saved = localStorage.getItem("localProducts");
  if (saved) {
    try {
      return normalizeProducts(JSON.parse(saved));
    } catch {
      localStorage.removeItem("localProducts");
    }
  }
  try {
    const response = await fetch("./products.seed.json");
    if (!response.ok) throw new Error("seed unavailable");
    return normalizeProducts(await response.json());
  } catch {
    return fallbackProducts;
  }
}

function saveLocalProducts(products = state.products) {
  localStorage.setItem("localProducts", JSON.stringify(products));
}

function allCategories() {
  const saved = JSON.parse(localStorage.getItem("localCategories") || "[]");
  const fromProducts = state.products.map(categoryOf);
  return Array.from(new Set([...saved, ...fromProducts].filter(Boolean))).sort();
}

function saveCategories(categories) {
  localStorage.setItem("localCategories", JSON.stringify(Array.from(new Set(categories.filter(Boolean))).sort()));
}

function hydrateCategories() {
  const select = document.getElementById("categoryFilter");
  const categories = allCategories();
  select.innerHTML = `<option value="">Todas</option>` + categories.map((c) => `<option>${escapeHtml(c)}</option>`).join("");
  renderAdminCategories();
}

function renderProducts() {
  const grid = document.getElementById("productGrid");
  const search = document.getElementById("searchInput").value.trim().toLowerCase();
  const category = document.getElementById("categoryFilter").value;
  const onlyStock = document.getElementById("onlyStock").checked;
  const products = state.products.filter((product) => {
    const matchesSearch = productDisplayName(product).toLowerCase().includes(search);
    const matchesCategory = !category || categoryOf(product) === category;
    const matchesStock = !onlyStock || product.stockQuantity > 0;
    return matchesSearch && matchesCategory && matchesStock;
  });
  grid.innerHTML = products.map(productCard).join("") || `<p>No hay productos para esos filtros.</p>`;
}

function productCard(product) {
  const stock = Number(product.stockQuantity || 0);
  const image = firstImage(product);
  return `
    <article class="product-card">
      <button class="product-open" type="button" onclick="openProductDetail(${product.id})" aria-label="Ver ${escapeHtml(productDisplayName(product))}">
        <div class="product-image">${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(productDisplayName(product))}">` : "✝"}</div>
      </button>
      <div class="product-body">
        <button class="product-title-button" type="button" onclick="openProductDetail(${product.id})">${escapeHtml(productDisplayName(product))}</button>
        <div class="price">${money(product.precio)}</div>
        <div class="stock ${stock === 0 ? "zero" : ""}">Stock disponible: <strong>${stock} unidades</strong></div>
        <button class="primary-button" type="button" ${stock === 0 ? "disabled" : ""} onclick="openQuantityPicker(${product.id})">
          ${stock === 0 ? "Sin stock" : "Añadir al pedido"}
        </button>
      </div>
    </article>
  `;
}

function ensureDynamicSections() {
  if (!document.getElementById("detailView")) {
    document.querySelector(".trust-band").insertAdjacentHTML("beforebegin", `
      <section class="detail-view hidden" id="detailView"></section>
    `);
  }
  if (!document.getElementById("accountModal")) {
    document.body.insertAdjacentHTML("beforeend", `
      <section class="modal hidden" id="accountModal" role="dialog" aria-modal="true"></section>
    `);
  }
  if (!document.getElementById("quantityModal")) {
    document.body.insertAdjacentHTML("beforeend", `
      <section class="modal hidden" id="quantityModal" role="dialog" aria-modal="true"></section>
    `);
  }
}

function switchView(view) {
  ensureDynamicSections();
  document.getElementById("catalogView").classList.toggle("hidden", view !== "catalog");
  document.getElementById("aboutView").classList.toggle("hidden", view !== "about");
  document.getElementById("contactView").classList.toggle("hidden", view !== "contact");
  document.getElementById("detailView").classList.toggle("hidden", view !== "detail");
  document.querySelectorAll(".nav-link").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
}

function openProductDetail(id) {
  state.detailProductId = id;
  state.detailImageIndex = 0;
  renderProductDetail();
  switchView("detail");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderProductDetail() {
  ensureDynamicSections();
  const product = state.products.find((item) => item.id === state.detailProductId);
  const view = document.getElementById("detailView");
  if (!product) {
    view.innerHTML = `<button class="secondary-button" onclick="switchView('catalog')">Volver</button>`;
    return;
  }
  const photos = product.fotos?.length ? product.fotos : [];
  const activePhoto = photos[state.detailImageIndex] || "";
  const stock = Number(product.stockQuantity || 0);
  view.innerHTML = `
    <button class="back-link" type="button" onclick="switchView('catalog')">Volver al catalogo</button>
    <div class="detail-layout">
      <section class="gallery">
        <div class="gallery-main">${activePhoto ? `<img src="${escapeHtml(activePhoto)}" alt="${escapeHtml(productDisplayName(product))}">` : "✝"}</div>
        <div class="gallery-controls">
          <button type="button" onclick="moveGallery(-1)" ${photos.length <= 1 ? "disabled" : ""}>Anterior</button>
          <span>${photos.length ? state.detailImageIndex + 1 : 0} / ${photos.length}</span>
          <button type="button" onclick="moveGallery(1)" ${photos.length <= 1 ? "disabled" : ""}>Siguiente</button>
        </div>
        <div class="gallery-thumbs">
          ${photos.map((photo, index) => `
            <button class="${index === state.detailImageIndex ? "active" : ""}" type="button" onclick="setGalleryImage(${index})">
              <img src="${escapeHtml(photo)}" alt="">
            </button>
          `).join("")}
        </div>
      </section>
      <section class="detail-info">
        <p class="detail-category">${escapeHtml(categoryOf(product))}</p>
        <h1>${escapeHtml(productDisplayName(product))}</h1>
        <div class="price detail-price">${money(product.precio)}</div>
        <p>${escapeHtml(productDescription(product))}</p>
        <div class="stock ${stock === 0 ? "zero" : ""}">Stock disponible: <strong>${stock} unidades</strong></div>
        <div class="detail-actions">
          <button class="primary-button" type="button" ${stock === 0 ? "disabled" : ""} onclick="openQuantityPicker(${product.id})">
            ${stock === 0 ? "Sin stock" : "Añadir al pedido"}
          </button>
        </div>
        <h2>Caracteristicas</h2>
        <ul class="feature-list">
          ${productFeatures(product).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </section>
    </div>
  `;
}

function moveGallery(delta) {
  const product = state.products.find((item) => item.id === state.detailProductId);
  const count = product?.fotos?.length || 0;
  if (count <= 1) return;
  state.detailImageIndex = (state.detailImageIndex + delta + count) % count;
  renderProductDetail();
}

function setGalleryImage(index) {
  state.detailImageIndex = index;
  renderProductDetail();
}

function openQuantityPicker(id) {
  ensureDynamicSections();
  const product = state.products.find((item) => item.id === id);
  const stock = Number(product?.stockQuantity || 0);
  if (!product || stock <= 0) return;
  const currentQty = state.cart.get(id)?.cantidad || 0;
  const available = Math.max(0, stock - currentQty);
  if (available <= 0) {
    addNotification(`Ya agregaste todo el stock disponible de ${productDisplayName(product)}.`, "warning");
    openCart();
    return;
  }
  const modal = document.getElementById("quantityModal");
  modal.innerHTML = `
    <form class="modal-card compact quantity-card" id="quantityForm">
      <button class="ghost-button modal-close" type="button" onclick="closeModal('quantityModal')">x</button>
      <h2>${escapeHtml(productDisplayName(product))}</h2>
      <p class="modal-note">Stock disponible para agregar: ${available} unidades</p>
      <div class="quantity-stepper">
        <button type="button" onclick="stepQuantity(-1)">-</button>
        <input id="quantityInput" name="cantidad" type="number" min="1" max="${available}" value="1" inputmode="numeric">
        <button type="button" onclick="stepQuantity(1)">+</button>
      </div>
      <button class="primary-button" type="submit">Agregar al pedido</button>
    </form>
  `;
  modal.classList.remove("hidden");
  document.getElementById("quantityForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const qty = Number(document.getElementById("quantityInput").value || 1);
    addToCart(id, qty);
    closeModal("quantityModal");
    openCart();
  });
}

function stepQuantity(delta) {
  const input = document.getElementById("quantityInput");
  if (!input) return;
  const min = Number(input.min || 1);
  const max = Number(input.max || 1);
  const next = Math.min(max, Math.max(min, Number(input.value || min) + delta));
  input.value = String(next);
}

function addToCart(id, cantidad = 1) {
  const product = state.products.find((item) => item.id === id);
  if (!product || product.stockQuantity <= 0) return;
  const requested = Math.max(1, Math.floor(Number(cantidad || 1)));
  const current = state.cart.get(id) || { product, cantidad: 0 };
  const next = current.cantidad + requested;
  if (next > product.stockQuantity) {
    addNotification(`No se puede agregar mas de ${product.stockQuantity} unidades de ${productDisplayName(product)}.`, "warning");
    return;
  }
  current.cantidad = next;
  state.cart.set(id, current);
  renderCart();
}

function renderCart() {
  const items = Array.from(state.cart.values());
  document.getElementById("cartCount").textContent = items.reduce((sum, item) => sum + item.cantidad, 0);
  document.getElementById("cartTotal").textContent = money(items.reduce((sum, item) => sum + item.cantidad * item.product.precio, 0));
  document.getElementById("cartItems").innerHTML = items.length ? items.map(cartItem).join("") : "<p>No hay productos en el pedido.</p>";
  document.getElementById("sendOrderButton").disabled = items.length === 0;
}

function cartItem(item) {
  const image = firstImage(item.product);
  return `
    <article class="cart-item">
      <div class="cart-thumb">${image ? `<img src="${escapeHtml(image)}" alt="">` : "✝"}</div>
      <div>
        <h3>${escapeHtml(productDisplayName(item.product))}</h3>
        <div class="price">${money(item.product.precio)}</div>
        <div class="cart-controls">
          <button type="button" onclick="changeQty(${item.product.id}, -1)">-</button>
          <span>${item.cantidad}</span>
          <button type="button" onclick="changeQty(${item.product.id}, 1)">+</button>
        </div>
      </div>
      <button class="remove-item" type="button" onclick="removeFromCart(${item.product.id})">Quitar</button>
    </article>
  `;
}

function changeQty(id, delta) {
  const item = state.cart.get(id);
  if (!item) return;
  const next = item.cantidad + delta;
  if (next <= 0) return removeFromCart(id);
  if (next > item.product.stockQuantity) {
    addNotification(`No hay mas stock disponible de ${productDisplayName(item.product)} por el momento.`, "warning");
    return;
  }
  item.cantidad = next;
  state.cart.set(id, item);
  renderCart();
}

function removeFromCart(id) {
  state.cart.delete(id);
  renderCart();
}

function openCart() {
  document.getElementById("cartDrawer").classList.add("open");
  document.getElementById("cartDrawer").setAttribute("aria-hidden", "false");
}

function closeCart() {
  document.getElementById("cartDrawer").classList.remove("open");
  document.getElementById("cartDrawer").setAttribute("aria-hidden", "true");
}

function openCheckout() {
  if (!state.profile) {
    openAccountModal("register", true);
    return;
  }
  if (!hasShippingInfo()) {
    openProfileModal(true);
    return;
  }
  fillCheckoutForm(state.profile);
  bindLocationSelectors(document.getElementById("checkoutForm"), state.profile);
  document.getElementById("checkoutModal").classList.remove("hidden");
}

function fillCheckoutForm(profile) {
  const form = document.getElementById("checkoutForm");
  Object.entries(profile || {}).forEach(([key, value]) => {
    if (form.elements[key]) form.elements[key].value = value || "";
  });
}

function cartStockProblem() {
  return Array.from(state.cart.values()).find((item) => {
    const product = state.products.find((candidate) => Number(candidate.id) === Number(item.product.id)) || item.product;
    return Number(item.cantidad || 0) > Number(product.stockQuantity || 0);
  });
}

async function submitOrder(event) {
  event.preventDefault();
  const data = buildUsuarioPayload(Object.fromEntries(new FormData(event.currentTarget)));
  try {
    const stockProblem = cartStockProblem();
    if (stockProblem) {
      addNotification(`No hay stock suficiente de ${productDisplayName(stockProblem.product)} por el momento.`, "warning");
      renderCart();
      return;
    }
    if (!state.backendAvailable) {
      saveProfile({ ...data });
      const localOrders = JSON.parse(localStorage.getItem("localOrders") || "[]");
      const localOrder = {
        id: nextLocalOrderId(),
        usuario: data,
        fecha: new Date().toISOString(),
        estado: "PENDIENTE",
        total: Array.from(state.cart.values()).reduce((sum, item) => sum + item.cantidad * item.product.precio, 0),
        detalles: Array.from(state.cart.values()),
      };
      localOrders.push(localOrder);
      localStorage.setItem("localOrders", JSON.stringify(localOrders));
      trackOrderStatus(localOrder);
      state.cart.clear();
      renderCart();
      closeModal("checkoutModal");
      closeCart();
      document.getElementById("successModal").classList.remove("hidden");
      return;
    }
    const user = await api("/api/usuarios", { method: "POST", body: JSON.stringify(data) });
    saveProfile({ ...data, id: user.id });
    const detalles = Array.from(state.cart.values()).map((item) => ({
      productoId: item.product.id,
      cantidad: item.cantidad,
    }));
    const order = await api("/api/pedidos", { method: "POST", body: JSON.stringify({ usuarioId: user.id, detalles }) });
    trackOrderStatus(order);
    startOrderStatusPolling();
    state.cart.clear();
    renderCart();
    closeModal("checkoutModal");
    closeCart();
    document.getElementById("successModal").classList.remove("hidden");
    await loadProducts();
  } catch (error) {
    if (String(error.message || "").toLowerCase().includes("stock")) {
      addNotification("No hay stock suficiente para completar el pedido por el momento.", "warning");
      await loadProducts();
      return;
    }
    alert("No se pudo enviar el pedido. Verifique los datos o intente mas tarde.");
  }
}

function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
}

function authErrorMessage(message = "", mode = "login") {
  const text = String(message || "").toLowerCase();
  if (mode === "update") {
    return "No se pudo actualizar la cuenta. Volvé a iniciar sesión y probá de nuevo.";
  }
  if (text.includes("already") || text.includes("registered") || text.includes("exists")) {
    return "Ese email ya está inscripto en el Libro. Inicia sesión o usa otro correo.";
  }
  if (text.includes("email") && text.includes("invalid")) {
    return "Ese correo no parece válido. Revísalo antes de continuar.";
  }
  if (text.includes("password")) {
    return mode === "register"
      ? "La contraseña debe tener al menos 6 caracteres."
      : "Aun no es tu momento de entrar. Credenciales incorrectas.";
  }
  return mode === "register"
    ? "No se pudo inscribir tu nombre. Revisa los datos e intenta nuevamente."
    : "Aun no es tu momento de entrar. Credenciales incorrectas.";
}

function showAuthMessage(message, type = "error") {
  const box = document.getElementById("authMessage");
  if (!box) return;
  box.className = `auth-message ${type}`;
  box.textContent = message;
  box.classList.remove("hidden");
}

function buildUsuarioPayload(data) {
  return {
    nombre: String(data.nombre || "").trim(),
    apellido: String(data.apellido || "").trim(),
    email: String(data.email || "").trim().toLowerCase(),
    pais: canonicalCountry(data.pais),
    provincia: canonicalLocation(data.provincia),
    ciudad: canonicalLocation(data.ciudad),
    direccion: String(data.direccion || "").trim(),
    codigoPostal: String(data.codigoPostal || "").trim(),
    organizacion: String(data.organizacion || "").trim(),
    telefono: String(data.telefono || "").trim(),
    rol: data.rol || data.role || "CLIENTE",
  };
}

function validateUsuarioPayload(payload) {
  const required = ["nombre", "apellido", "email", "pais", "provincia", "ciudad", "direccion", "codigoPostal"];
  const missing = required.filter((field) => !payload[field]);
  if (missing.length) {
    throw new Error("Completa todos los campos obligatorios para registrarte.");
  }
}

async function persistRegisteredUser(payload) {
  const response = await fetch(`${API}/api/usuarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const text = await response.text();
    if (response.status === 409 || text.toLowerCase().includes("email")) {
      throw new Error("Ese email ya esta registrado como cliente.");
    }
    throw new Error("No se pudo guardar el cliente en el backend.");
  }
  return response.json();
}

async function resolveBackendRole(email) {
  try {
    const users = await api("/api/usuarios", { headers: await authHeader() });
    const user = users.find((item) => String(item.email || "").toLowerCase() === String(email || "").toLowerCase());
    return user?.rol || "";
  } catch {
    return "";
  }
}

function registerFields(profile = {}) {
  return `
    <label>Nombre<input name="nombre" required value="${escapeHtml(profile.nombre || "")}" autocomplete="given-name" /></label>
    <label>Apellido<input name="apellido" required value="${escapeHtml(profile.apellido || "")}" autocomplete="family-name" /></label>
    <label>Email<input name="email" type="email" required value="${escapeHtml(profile.email || "")}" autocomplete="email" /></label>
    <label>Contraseña<input name="password" type="password" minlength="6" required autocomplete="new-password" /></label>
    <label>País<input name="pais" required value="${escapeHtml(profile.pais || "Argentina")}" autocomplete="country-name" /></label>
    <label>Provincia<input name="provincia" required value="${escapeHtml(profile.provincia || "")}" /></label>
    <label>Ciudad<input name="ciudad" required value="${escapeHtml(profile.ciudad || "")}" /></label>
    <label>Código postal<input name="codigoPostal" required value="${escapeHtml(profile.codigoPostal || "")}" autocomplete="postal-code" /></label>
    <label class="full">Dirección<input name="direccion" required value="${escapeHtml(profile.direccion || "")}" autocomplete="street-address" /></label>
    <label>Organizacion<input name="organizacion" value="${escapeHtml(profile.organizacion || "")}" placeholder="Parroquia, santuario o particular" /></label>
    <label>Teléfono<input name="telefono" value="${escapeHtml(profile.telefono || "")}" autocomplete="tel" /></label>
  `;
}

function registerView(profile = {}, mustComplete = false) {
  return `
    <section class="register-view">
      <div class="cloud cloud-left"></div>
      <div class="cloud cloud-right"></div>
      <div class="divine-light"></div>
      <form class="register-glass-card" id="accountForm" novalidate>
        ${mustComplete ? "" : `<button class="ghost-button modal-close" type="button" onclick="closeModal('accountModal')">x</button>`}
        <p class="auth-kicker">Una luz al cielo</p>
        <h2>Hágase la Luz</h2>
        <p class="modal-note auth-copy">Únete a nuestra comunidad y permite que la devoción ilumine tu hogar.</p>
        <div class="auth-message hidden" id="authMessage"></div>
        <div class="form-grid register-grid">
          ${registerFields(profile)}
        </div>
        <div class="modal-actions register-actions">
          <button class="secondary-button auth-switch" type="button" onclick="openAccountModal('login')">Ya tengo cuenta</button>
          <button class="primary-button auth-submit" type="submit">Ascender y Registrarme</button>
        </div>
      </form>
    </section>
  `;
}

function showEmailConfirmationView(email) {
  document.getElementById("accountModal").innerHTML = `
    <div class="modal-card compact email-confirm-card">
      <button class="ghost-button modal-close" type="button" onclick="closeModal('accountModal')">x</button>
      <div class="success-icon">✓</div>
      <h2>Revisá tu correo</h2>
      <p>Te enviamos un mail de confirmación a <strong>${escapeHtml(email)}</strong>.</p>
      <p>Entrá a tu Gmail, abrí el mensaje y confirmá tu cuenta para poder iniciar sesión.</p>
      <button class="primary-button" type="button" onclick="openAccountModal('login')">Ya confirmé, iniciar sesión</button>
    </div>
  `;
}

function openAccountModal(mode = "login", mustComplete = false) {
  ensureDynamicSections();
  const profile = state.profile || {};
  const isLogin = mode === "login";
  const isLogged = Boolean(state.profile);
  if (!isLogin && !isLogged) {
    document.getElementById("accountModal").innerHTML = registerView(profile, mustComplete);
  } else {
  const cardClass = isLogin || isLogged ? "sanctuary-auth-card" : "heaven-register-card";
  const fullName = `${profile.nombre || ""} ${profile.apellido || ""}`.trim();
  document.getElementById("accountModal").innerHTML = `
    <form class="modal-card ${cardClass}" id="accountForm" novalidate>
      ${mustComplete ? "" : `<button class="ghost-button modal-close" type="button" onclick="closeModal('accountModal')">x</button>`}
      <h2>${isLogged ? "Mi cuenta" : isLogin ? "Las Puertas del Santuario" : "Hágase la Luz"}</h2>
      ${isLogged ? `<p class="account-welcome">Bienvenido, ${escapeHtml(fullName || profile.email || "usuario")}</p>` : `<p class="auth-kicker">${isLogin ? "Las Puertas de San Pedro" : "Una luz al cielo"}</p>`}
      <p class="modal-note auth-copy">
        ${isLogged
          ? "Gestioná tu acceso y los datos necesarios para realizar pedidos."
          : isLogin
            ? "¿Está tu nombre inscrito en el Libro? Ingresa tus credenciales para acceder."
            : "Únete a nuestra comunidad y permite que la devoción ilumine tu hogar."}
      </p>
      <div class="auth-message hidden" id="authMessage"></div>
      <div class="form-grid auth-grid ${!isLogin && !isLogged ? "register-grid" : ""}">
        ${!isLogin && !isLogged
          ? registerFields(profile)
          : `
            <label class="full">Email<input name="email" type="email" required value="${escapeHtml(profile.email || "")}" autocomplete="email" /></label>
            <label class="full">Contraseña<input name="password" type="password" minlength="6" ${isLogged ? "" : "required"} autocomplete="${isLogin ? "current-password" : "new-password"}" /></label>
          `}
      </div>
      <div class="modal-actions">
        ${!isLogged ? `<button class="secondary-button auth-switch" type="button" onclick="openAccountModal('${isLogin ? "register" : "login"}')">${isLogin ? "Crear cuenta" : "Ya tengo cuenta"}</button>` : ""}
        ${state.profile ? `<button class="secondary-button" type="button" onclick="openProfileModal(false)">Datos para pedidos</button>` : ""}
        ${isAdminProfile() ? `<button class="secondary-button" type="button" onclick="closeModal('accountModal'); openAdmin()">Panel admin</button>` : ""}
        ${state.profile ? `<button class="secondary-button" type="button" onclick="logoutProfile()">Cerrar sesión</button>` : ""}
        <button class="primary-button auth-submit" type="submit">${state.profile ? "Actualizar" : isLogin ? "Llamar a la Puerta" : "Ascender y Registrarme"}</button>
      </div>
    </form>
  `;
  }
  document.getElementById("accountModal").classList.remove("hidden");
  bindLocationSelectors(document.getElementById("accountForm"), profile);
  document.getElementById("accountForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const submit = event.currentTarget.querySelector("button[type='submit']");
    submit.disabled = true;
    try {
      const result = await authenticateAccount(data, mode);
      if (result?.emailConfirmation) {
        showEmailConfirmationView(result.email);
        return;
      }
      closeModal("accountModal");
      if (mustComplete) openProfileModal(true);
    } catch (error) {
      showAuthMessage(error.message || authErrorMessage("", mode));
    } finally {
      submit.disabled = false;
    }
  });
}

async function authenticateAccount(data, mode) {
  const email = String(data.email || "").toLowerCase();
  const password = data.password;
  const usuarioPayload = buildUsuarioPayload({ ...data, email });
  if (!email || !email.includes("@")) {
    throw new Error("Ese correo no parece válido. Revísalo antes de continuar.");
  }
  if (!state.profile && (!password || password.length < 6)) {
    throw new Error("La contraseña debe tener al menos 6 caracteres.");
  }
  if (mode === "register" && !state.profile) {
    validateUsuarioPayload(usuarioPayload);
  }

  const baseProfile = {
    ...usuarioPayload,
    nombre: usuarioPayload.nombre || state.profile?.nombre || "",
    email,
    role: "CLIENTE",
  };

  const client = await ensureSupabaseClient().catch(() => null);
  if (!client) {
    throw new Error("No está configurada la autenticación de Supabase.");
  }

  if (state.profile) {
    const currentEmail = String(state.profile.email || "").toLowerCase();
    const authUpdates = {};
    if (email && email !== currentEmail) authUpdates.email = email;
    if (password) authUpdates.password = password;
    if (Object.keys(authUpdates).length) {
      const { error } = await client.auth.updateUser(authUpdates);
      if (error) throw new Error(authErrorMessage(error.message, "update"));
    }
    saveProfile({ ...state.profile, email });
    return;
  }

  let authResult;
  if (mode === "register") {
    saveKnownProfile(baseProfile);
    authResult = await client.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre: usuarioPayload.nombre,
          apellido: usuarioPayload.apellido,
        },
      },
    });
    if (authResult.error) {
      throw new Error(authErrorMessage(authResult.error.message, mode));
    }
    const identities = authResult.data?.user?.identities || [];
    if (authResult.data?.user && identities.length === 0) {
      throw new Error("Ese email ya está inscripto en el Libro. Inicia sesión o usa otro correo.");
    }
    try {
      const backendUser = await persistRegisteredUser(usuarioPayload);
      baseProfile.id = backendUser.id;
      saveKnownProfile(baseProfile);
    } catch {
      // Si el backend local no está disponible, no bloqueamos el alta de Supabase ni perdemos los datos.
    }
    return { emailConfirmation: true, email };
  } else {
    authResult = await client.auth.signInWithPassword({ email, password });
    if (authResult.error) {
      throw new Error(authErrorMessage(authResult.error.message, mode));
    }
  }

  state.adminSession = authResult.data.session || null;
  const knownProfile = knownProfileFor(email) || {};
  Object.assign(baseProfile, knownProfile, { email, role: knownProfile.role || knownProfile.rol || baseProfile.role });
  baseProfile.nombre = baseProfile.nombre || authResult.data.user?.user_metadata?.nombre || email.split("@")[0];
  if (email === ADMIN_EMAIL) baseProfile.role = "ADMIN";
  const backendRole = mode === "login" ? await resolveBackendRole(email) : "";
  if (backendRole) baseProfile.role = backendRole;
  else {
    const localRole = localRoleForEmail(email);
    if (localRole) baseProfile.role = localRole;
  }
  saveProfile(baseProfile);
}

function openProfileModal(mustComplete = false) {
  ensureDynamicSections();
  const profile = state.profile || {};
  document.getElementById("accountModal").innerHTML = `
    <form class="modal-card" id="profileForm">
      ${mustComplete ? "" : `<button class="ghost-button modal-close" type="button" onclick="closeModal('accountModal')">x</button>`}
      <h2>Datos para pedidos</h2>
      <p class="modal-note">Estos datos se usan para que el santuario pueda confirmar entrega y contacto.</p>
      <div class="form-grid">
        <label>Nombre<input name="nombre" required value="${escapeHtml(profile.nombre || "")}" /></label>
        <label>Apellido<input name="apellido" required value="${escapeHtml(profile.apellido || "")}" /></label>
        <label>Email<input name="email" type="email" required value="${escapeHtml(profile.email || "")}" /></label>
        <label>Teléfono<input name="telefono" value="${escapeHtml(profile.telefono || "")}" /></label>
        <label>País<input name="pais" required value="${escapeHtml(profile.pais || "Argentina")}" /></label>
        <label>Provincia<input name="provincia" required value="${escapeHtml(profile.provincia || "")}" /></label>
        <label>Ciudad<input name="ciudad" required value="${escapeHtml(profile.ciudad || "")}" /></label>
        <label>Código postal<input name="codigoPostal" required value="${escapeHtml(profile.codigoPostal || "")}" /></label>
        <label class="full">Dirección<input name="direccion" required value="${escapeHtml(profile.direccion || "")}" /></label>
        <label class="full">Organizacion<input name="organizacion" value="${escapeHtml(profile.organizacion || "")}" placeholder="Parroquia, santuario o particular" /></label>
      </div>
      <div class="modal-actions">
        <button class="primary-button" type="submit">Guardar datos</button>
      </div>
    </form>
  `;
  document.getElementById("accountModal").classList.remove("hidden");
  bindLocationSelectors(document.getElementById("profileForm"), profile);
  document.getElementById("profileForm").addEventListener("submit", (event) => {
    event.preventDefault();
    saveProfile(buildUsuarioPayload(Object.fromEntries(new FormData(event.currentTarget))));
    closeModal("accountModal");
    if (mustComplete) openCheckout();
  });
}

function logoutProfile() {
  state.profile = null;
  if (state.orderStatusPoller) {
    window.clearInterval(state.orderStatusPoller);
    state.orderStatusPoller = null;
  }
  localStorage.removeItem("customerProfile");
  updateAccountButton();
  closeModal("accountModal");
}

function updateAccountButton() {
  const button = document.getElementById("accountButton");
  if (!button) return;
  button.querySelector("span:last-child").textContent = state.profile ? "Mi perfil" : "Ingresar";
}

function lineChartPath(points, width = 520, height = 210, padding = 26) {
  const max = Math.max(...points.map((item) => item.pedidos), 1);
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;
  const coords = points.map((item, index) => {
    const x = padding + (usableWidth / Math.max(points.length - 1, 1)) * index;
    const y = height - padding - (item.pedidos / max) * usableHeight;
    return [x, y];
  });
  const path = coords.map(([x, y], index) => {
    if (index === 0) return `M ${x} ${y}`;
    const [prevX, prevY] = coords[index - 1];
    const midX = (prevX + x) / 2;
    return `C ${midX} ${prevY}, ${midX} ${y}, ${x} ${y}`;
  }).join(" ");
  const area = `${path} L ${coords[coords.length - 1][0]} ${height - padding} L ${coords[0][0]} ${height - padding} Z`;
  return { path, area, coords, max };
}

function dashboardMonthOptions() {
  const keys = new Set([currentMonthKey()]);
  state.orders.forEach((order) => keys.add(currentMonthKey(orderDate(order))));
  return Array.from(keys).sort().reverse();
}

function dashboardForMonth(monthKey = state.dashboardMonth) {
  const selectedOrders = state.orders.filter((order) => currentMonthKey(orderDate(order)) === monthKey);
  const previousDate = new Date(Number(monthKey.slice(0, 4)), Number(monthKey.slice(5, 7)) - 2, 1);
  const previousKey = currentMonthKey(previousDate);
  const previousOrders = state.orders.filter((order) => currentMonthKey(orderDate(order)) === previousKey);
  const accepted = selectedOrders.filter((order) => order.estado === "ACEPTADO");
  const previousAccepted = previousOrders.filter((order) => order.estado === "ACEPTADO");
  const sales = accepted.reduce((sum, order) => sum + orderTotal(order), 0);
  const previousSales = previousAccepted.reduce((sum, order) => sum + orderTotal(order), 0);
  const growth = previousSales > 0 ? Math.round(((sales - previousSales) / previousSales) * 100) : (sales > 0 ? 100 : 0);
  const [year, month] = monthKey.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const pedidosPorDia = Array.from({ length: daysInMonth }, (_, index) => ({ dia: String(index + 1), pedidos: 0 }));
  selectedOrders.forEach((order) => {
    const day = orderDate(order).getDate();
    pedidosPorDia[day - 1].pedidos += 1;
  });
  const compactLine = pedidosPorDia.filter((item, index) => item.pedidos > 0 || index === 0 || index === pedidosPorDia.length - 1 || (index + 1) % 4 === 0);
  const zoneCounts = selectedOrders.reduce((acc, order) => {
    const location = orderLocation(order);
    acc[location] = (acc[location] || 0) + 1;
    return acc;
  }, {});
  const zonasEnvio = Object.entries(zoneCounts)
    .map(([zona, pedidos]) => ({ zona, pedidos }))
    .sort((a, b) => b.pedidos - a.pedidos)
    .slice(0, 5);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  return {
    kpis: {
      pendientes: selectedOrders.filter((order) => order.estado === "PENDIENTE").length,
      ventasMes: sales,
      crecimientoVentas: growth,
      stockCritico: state.products.filter((product) => Number(product.stockQuantity || 0) < 5).length,
      enviosTransito: state.orders.filter((order) => order.estado === "ACEPTADO" && orderDate(order) >= weekStart).length,
    },
    pedidosPorDia: compactLine.length ? compactLine : [{ dia: "1", pedidos: 0 }],
    zonasEnvio,
    actividad: selectedOrders
      .slice()
      .sort((a, b) => orderDate(b) - orderDate(a))
      .slice(0, 5),
  };
}

function renderAdminDashboard() {
  const target = document.getElementById("adminDashboard");
  if (!target) return;
  const options = dashboardMonthOptions();
  if (!options.includes(state.dashboardMonth)) state.dashboardMonth = options[0] || currentMonthKey();
  const data = dashboardForMonth(state.dashboardMonth);
  const chart = lineChartPath(data.pedidosPorDia);
  const maxZone = Math.max(...data.zonasEnvio.map((item) => item.pedidos), 1);
  target.innerHTML = `
    <div class="dashboard-header">
      <div>
        <h1>Dashboard General</h1>
        <p>Resumen operativo basado en los pedidos reales cargados en el sistema.</p>
      </div>
      <label class="dashboard-period">
        <span>Mes</span>
        <select id="dashboardMonthSelect" onchange="changeDashboardMonth(this.value)">
          ${options.map((option) => `<option value="${option}" ${option === state.dashboardMonth ? "selected" : ""}>${monthLabel(option)}</option>`).join("")}
        </select>
      </label>
    </div>

    <section class="kpi-grid">
      <article class="kpi-card">
        <span>Pedidos Pendientes</span>
        <strong>${data.kpis.pendientes}</strong>
        <small>Esperando revisión</small>
      </article>
      <article class="kpi-card">
        <span>Ventas del Mes</span>
        <strong>${money(data.kpis.ventasMes)}</strong>
        <small class="${data.kpis.crecimientoVentas >= 0 ? "positive" : "negative"}">${data.kpis.crecimientoVentas >= 0 ? "+" : ""}${data.kpis.crecimientoVentas}% vs mes anterior</small>
      </article>
      <article class="kpi-card warning">
        <span>Stock Critico</span>
        <strong>${data.kpis.stockCritico}</strong>
        <small>Artículos con stock menor a 5</small>
      </article>
      <article class="kpi-card">
        <span>Reservas de Stock</span>
        <strong>${data.kpis.enviosTransito}</strong>
        <small>Pedidos aceptados esta semana</small>
      </article>
    </section>

    <section class="dashboard-main-grid">
      <article class="dashboard-card dashboard-line-card">
        <header>
          <h2>Evolución de Pedidos</h2>
          <small>Cantidad por dia del mes</small>
        </header>
        <svg class="line-chart" viewBox="0 0 520 210" role="img" aria-label="Evolución de pedidos">
          <defs>
            <linearGradient id="ordersFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#b17a14" stop-opacity=".22" />
              <stop offset="100%" stop-color="#b17a14" stop-opacity="0" />
            </linearGradient>
          </defs>
          <path class="chart-area" d="${chart.area}"></path>
          <path class="chart-line" d="${chart.path}"></path>
          ${chart.coords.map(([x, y], index) => {
            const point = data.pedidosPorDia[index];
            return `
              <g class="chart-point" tabindex="0">
                <title>Dia ${escapeHtml(point.dia)}: ${point.pedidos} pedidos</title>
                <circle cx="${x}" cy="${y}" r="5"></circle>
                <text x="${x}" y="${Math.max(14, y - 12)}">${point.pedidos}</text>
              </g>
            `;
          }).join("")}
        </svg>
        <div class="chart-axis">
          ${data.pedidosPorDia.map((item) => `<span>${item.dia}</span>`).join("")}
        </div>
      </article>

      <article class="dashboard-card">
        <header>
          <h2>Distribución Logística</h2>
          <small>Top zonas de envio</small>
        </header>
        <div class="bar-chart ${data.zonasEnvio.length ? "" : "empty-chart"}">
          ${data.zonasEnvio.length ? data.zonasEnvio.map((item) => `
            <div class="bar-row">
              <div class="bar-label"><strong>${escapeHtml(item.zona)}</strong><span>${item.pedidos} pedidos</span></div>
              <div class="bar-track"><span style="width:${Math.round((item.pedidos / maxZone) * 100)}%"></span></div>
            </div>
          `).join("") : "<p>No hay pedidos para este mes.</p>"}
        </div>
      </article>
    </section>

    <section class="dashboard-card activity-card">
      <header>
        <h2>Actividad Reciente</h2>
        <small>Ultimos 5 pedidos</small>
      </header>
      <div class="table-wrap dashboard-table">
        <table>
          <thead><tr><th>ID Pedido</th><th>Parroquia/Cliente</th><th>Ubicación</th><th>Fecha</th><th>Monto Total</th><th>Estado</th></tr></thead>
          <tbody>
            ${data.actividad.length ? data.actividad.map((order) => `
              <tr>
                <td>#${order.id}</td>
                <td>${escapeHtml(orderCustomer(order))}</td>
                <td>${escapeHtml(orderLocation(order))}</td>
                <td>${orderDate(order).toLocaleDateString("es-AR")}</td>
                <td>${money(orderTotal(order))}</td>
                <td><span class="badge ${order.estado}">${order.estado}</span></td>
              </tr>
            `).join("") : `<tr><td colspan="6">No hay pedidos para este mes.</td></tr>`}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function changeDashboardMonth(monthKey) {
  state.dashboardMonth = monthKey || currentMonthKey();
  renderAdminDashboard();
}

function activateAdminTab(tabName) {
  document.querySelectorAll(".admin-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.adminTab === tabName);
  });
  document.getElementById("adminDashboard")?.classList.toggle("hidden", tabName !== "dashboard");
  document.getElementById("adminOrders")?.classList.toggle("hidden", tabName !== "orders");
  document.getElementById("adminProducts")?.classList.toggle("hidden", tabName !== "products");
  document.getElementById("adminCategories")?.classList.toggle("hidden", tabName !== "categories");
  document.getElementById("adminUsers")?.classList.toggle("hidden", tabName !== "users");
  document.getElementById("adminAudit")?.classList.toggle("hidden", tabName !== "audit");
}

async function openAdmin() {
  if (!isAdminProfile()) {
    alert("Tu usuario no tiene permisos de administrador.");
    return;
  }
  const supabaseAdminSession = await requireSupabaseAdminSession();
  if (!supabaseAdminSession) return;
  if (!state.backendAvailable) {
    document.getElementById("adminView").classList.remove("hidden");
    activateAdminTab("dashboard");
    await loadOrders();
    renderAdminDashboard();
    renderAdminProducts();
    await loadUsers();
    return;
  }
  document.getElementById("adminView").classList.remove("hidden");
  activateAdminTab("dashboard");
  await loadOrders();
  renderAdminDashboard();
  renderAdminProducts();
  await loadUsers();
}

async function loadOrders() {
  if (!state.backendAvailable) {
    state.orders = normalizeLocalOrders();
    renderOrders();
    return;
  }
  try {
    state.orders = await api("/api/pedidos", { headers: await authHeader() });
  } catch {
    state.orders = [];
  }
  renderOrders();
  if (!document.getElementById("adminDashboard")?.classList.contains("hidden")) renderAdminDashboard();
}

function renderOrders() {
  const body = document.getElementById("ordersTable");
  hydrateOrderFilters();
  const orders = filteredOrders();
  body.innerHTML = orders.length ? orders.map((order) => `
    <tr>
      <td>${order.id}</td>
      <td>${buyerCell(order.usuario || {})}</td>
      <td>${order.fecha ? new Date(order.fecha).toLocaleString("es-AR") : ""}</td>
      <td><span class="badge ${order.estado}">${order.estado}</span></td>
      <td>${money(order.total)}</td>
      <td>
        <div class="row-actions">
          <button class="secondary-button" type="button" onclick="toggleOrderDetail(${order.id})">${Number(state.expandedOrderId) === Number(order.id) ? "Ocultar detalle" : "Ver detalle"}</button>
        ${order.estado === "PENDIENTE" ? `
          <button class="primary-button" type="button" onclick="changeOrderStatus(${order.id}, 'ACEPTADO')">Aceptar</button>
          <button class="danger-button" type="button" onclick="changeOrderStatus(${order.id}, 'RECHAZADO')">Rechazar</button>
        ` : ""}
        </div>
      </td>
    </tr>
    ${Number(state.expandedOrderId) === Number(order.id) ? orderDetailRow(order) : ""}
  `).join("") : `<tr><td colspan="6">No hay pedidos para esos filtros.</td></tr>`;
}

function orderSearchText(order) {
  const user = order.usuario || {};
  return [
    order.id,
    user.nombre,
    user.apellido,
    user.email,
    user.organizacion,
    user.telefono,
    orderLocation(order),
    order.estado,
  ].filter(Boolean).join(" ").toLowerCase();
}

function filteredOrders() {
  const search = (document.getElementById("orderSearch")?.value || "").trim().toLowerCase();
  const status = document.getElementById("orderStatusFilter")?.value || "";
  const month = document.getElementById("orderMonthFilter")?.value || "";
  const location = document.getElementById("orderLocationFilter")?.value || "";
  return state.orders
    .filter((order) => !search || orderSearchText(order).includes(search))
    .filter((order) => !status || order.estado === status)
    .filter((order) => !month || currentMonthKey(orderDate(order)) === month)
    .filter((order) => !location || orderLocation(order) === location)
    .slice()
    .sort((a, b) => orderDate(b) - orderDate(a) || Number(b.id || 0) - Number(a.id || 0));
}

function hydrateOrderFilters() {
  const monthSelect = document.getElementById("orderMonthFilter");
  const locationSelect = document.getElementById("orderLocationFilter");
  if (!monthSelect || !locationSelect) return;
  const selectedMonth = monthSelect.value;
  const selectedLocation = locationSelect.value;
  const months = Array.from(new Set(state.orders.map((order) => currentMonthKey(orderDate(order))))).sort().reverse();
  const locations = Array.from(new Set(state.orders.map(orderLocation).filter(Boolean))).sort((a, b) => a.localeCompare(b, "es"));
  monthSelect.innerHTML = `<option value="">Todos los meses</option>` + months.map((month) => (
    `<option value="${month}" ${month === selectedMonth ? "selected" : ""}>${monthLabel(month)}</option>`
  )).join("");
  locationSelect.innerHTML = `<option value="">Todas</option>` + locations.map((location) => (
    `<option value="${escapeHtml(location)}" ${location === selectedLocation ? "selected" : ""}>${escapeHtml(location)}</option>`
  )).join("");
}

function buyerCell(user = {}) {
  const name = `${user.nombre || ""} ${user.apellido || ""}`.trim() || "Sin nombre";
  return `
    <div class="buyer-cell">
      <strong>${escapeHtml(name)}</strong>
      <span><b>Mail:</b> ${escapeHtml(user.email || "Sin mail")}</span>
      <span><b>Lugar:</b> ${escapeHtml(user.organizacion || "Particular")}</span>
    </div>
  `;
}

function toggleOrderDetail(id) {
  state.expandedOrderId = Number(state.expandedOrderId) === Number(id) ? null : id;
  renderOrders();
}

function orderDetailRow(order) {
  const user = order.usuario || {};
  const details = order.detalles || order.detallesPedido || [];
  return `
    <tr class="order-detail-row">
      <td colspan="6">
        <div class="order-detail-card">
      <button class="ghost-button modal-close" type="button" onclick="closeOrderDetail()">x</button>
      <h2>Pedido #${escapeHtml(order.id)}</h2>
      <div class="order-detail-grid">
        <section>
          <h3>Comprador</h3>
          <p><strong>${escapeHtml(user.nombre || "")} ${escapeHtml(user.apellido || "")}</strong></p>
          <p><b>Mail:</b> ${escapeHtml(user.email || "Sin mail")}</p>
          <p><b>Teléfono:</b> ${escapeHtml(user.telefono || "Sin teléfono")}</p>
          <p><b>Lugar:</b> ${escapeHtml(user.organizacion || "Particular")}</p>
        </section>
        <section>
          <h3>Dirección</h3>
          <p>${escapeHtml(user.direccion || "Sin direccion")}</p>
          <p>${escapeHtml(user.ciudad || "")}, ${escapeHtml(user.provincia || "")}</p>
          <p>${escapeHtml(user.pais || "")} - CP ${escapeHtml(user.codigoPostal || user.codigo_postal || "")}</p>
        </section>
      </div>
      <h3>Productos</h3>
      <div class="order-lines">
        ${details.map((detail) => {
          const product = detail.product || detail.producto || detail.productoResponse || detail.productoResumen || detail.producto || detail.product;
          const localProduct = detail.product?.nombre ? detail.product : null;
          const name = productDisplayName(product || localProduct || { nombre: detail.nombre || "Producto" });
          const qty = detail.cantidad || detail.cantidadSolicitada || 1;
          const unit = detail.precioUnitario || product?.precio || localProduct?.precio || 0;
          return `<div><span>${escapeHtml(name)} x ${qty}</span><strong>${money(Number(unit) * Number(qty))}</strong></div>`;
        }).join("") || "<p>Sin detalle de productos.</p>"}
      </div>
      <div class="total-row"><span>Total</span><strong>${money(order.total)}</strong></div>
        </div>
      </td>
    </tr>
  `;
}

function closeOrderDetail() {
  state.expandedOrderId = null;
  renderOrders();
}

function resolveOrderDetails(order) {
  return order.detalles || order.detallesPedido || [];
}

function applyLocalOrderDecision(order, estado) {
  if (estado === "RECHAZADO") {
    notifyOrderStatus(order, "RECHAZADO", false);
    trackOrderStatus({ ...order, estado: "RECHAZADO" });
    return { estado };
  }
  if (estado !== "ACEPTADO") return { estado };
  const details = resolveOrderDetails(order);
  const missing = details.find((detail) => {
    const productId = Number(detail.productoId || detail.product?.id || detail.producto?.id);
    const qty = Number(detail.cantidad || detail.cantidadSolicitada || 1);
    const product = state.products.find((item) => Number(item.id) === productId);
    return !product || Number(product.stockQuantity || 0) < qty;
  });
  if (missing) {
    const product = missing.product || missing.producto || {};
    const name = productDisplayName(product.nombre ? product : { nombre: missing.nombre || "un producto" });
    addNotification(`Tu pedido #${order.id} fue rechazado porque no hay mas stock de ${name} por el momento.`, "warning");
    trackOrderStatus({ ...order, estado: "RECHAZADO" });
    return { estado: "RECHAZADO" };
  }
  state.products = state.products.map((product) => {
    const detail = details.find((item) => Number(item.productoId || item.product?.id || item.producto?.id) === Number(product.id));
    if (!detail) return product;
    return { ...product, stockQuantity: Math.max(0, Number(product.stockQuantity || 0) - Number(detail.cantidad || detail.cantidadSolicitada || 1)) };
  });
  saveLocalProducts();
  notifyOrderStatus(order, "ACEPTADO", false);
  trackOrderStatus({ ...order, estado: "ACEPTADO" });
  return { estado: "ACEPTADO" };
}

async function changeOrderStatus(id, estado) {
  if (!state.backendAvailable) {
    const localOrders = JSON.parse(localStorage.getItem("localOrders") || "[]").map((order) => {
      if (Number(order.id) !== Number(id)) return order;
      return { ...order, ...applyLocalOrderDecision(order, estado) };
    });
    localStorage.setItem("localOrders", JSON.stringify(localOrders));
    addAuditLog(estado === "ACEPTADO" ? "Aceptó pedido" : "Rechazó pedido", `Pedido #${id}`, `pedido:${id}`);
    await loadOrders();
    renderProducts();
    renderAdminDashboard();
    return;
  }
  try {
    const updatedOrder = await api(`/api/pedidos/${id}/estado`, {
      method: "PATCH",
      headers: await authHeader(),
      body: JSON.stringify({ estado }),
    });
    if (updatedOrder?.estado === "RECHAZADO" || updatedOrder?.estado === "ACEPTADO") {
      const automatic = estado === "ACEPTADO" && updatedOrder.estado === "RECHAZADO";
      notifyOrderStatus(updatedOrder, updatedOrder.estado, automatic);
      trackOrderStatus(updatedOrder);
      addAuditLog(updatedOrder.estado === "ACEPTADO" ? "Aceptó pedido" : "Rechazó pedido", `Pedido #${id}${automatic ? " por falta de stock" : ""}`, `pedido:${id}`);
    }
    await loadOrders();
    await loadProducts();
    renderAdminDashboard();
  } catch {
    alert("No se pudo actualizar el pedido.");
  }
}

function renderAdminProducts() {
  const list = document.getElementById("adminProductList");
  if (!list) return;
  const search = (document.getElementById("adminProductSearch")?.value || "").toLowerCase();
  const products = state.products.filter((product) => productDisplayName(product).toLowerCase().includes(search)).slice(0, 120);
  list.innerHTML = `
    <article class="admin-product admin-product-new">
      <div>
        <h3>Nuevo producto</h3>
        <small>Carga nombre, precio, stock, fotos y caracteristicas.</small>
      </div>
      <button class="primary-button" type="button" onclick="openProductEditor()">Agregar producto</button>
    </article>
    ${products.map((product) => `
      <article class="admin-product">
        <div><h3>${escapeHtml(productDisplayName(product))}</h3><small>${money(product.precio)} - Stock ${product.stockQuantity || 0}</small></div>
        <div class="admin-product-preview">${firstImage(product) ? `<img src="${escapeHtml(firstImage(product))}" alt="">` : "✝"}</div>
        <button class="secondary-button" type="button" onclick="openProductEditor(${product.id})">Editar</button>
        <button class="danger-button" type="button" onclick="deleteProduct(${product.id})">Borrar</button>
      </article>
    `).join("")}
  `;
}

function renderAdminCategories() {
  const list = document.getElementById("adminCategoryList");
  if (!list) return;
  const categories = allCategories();
  list.innerHTML = categories.map((category) => `
    <article class="admin-category-row">
      <input value="${escapeHtml(category)}" data-original="${escapeHtml(category)}" aria-label="Categoría">
      <span>${state.products.filter((product) => categoryOf(product) === category).length} productos</span>
      <button class="secondary-button" type="button" onclick="renameCategory(this)">Guardar</button>
      <button class="danger-button" type="button" onclick='deleteCategory(${JSON.stringify(category)})'>Borrar</button>
    </article>
  `).join("") || `<p>No hay categorias cargadas.</p>`;
}

function addCategory() {
  const input = document.getElementById("newCategoryName");
  const name = input.value.trim();
  if (!name) return;
  saveCategories([...allCategories(), name]);
  addAuditLog("Creó categoría", `Agregó categoría ${name}`, name);
  input.value = "";
  hydrateCategories();
}

function renameCategory(button) {
  const input = button.closest(".admin-category-row").querySelector("input");
  const original = input.dataset.original;
  const next = input.value.trim();
  if (!next || original === next) return;
  state.products = state.products.map((product) => {
    const features = product.caracteristicas || [];
    if (categoryOf(product) !== original) return product;
    return {
      ...product,
      caracteristicas: [`Categoría: ${next}`, ...features.filter((item) => !/^\s*(Categoria|Categoría)\s*:/i.test(item))],
    };
  });
  saveLocalProducts();
  saveCategories(allCategories().map((category) => category === original ? next : category));
  addAuditLog("Renombró categoría", `${original} -> ${next}`, next);
  hydrateCategories();
  renderProducts();
  renderAdminProducts();
}

function deleteCategory(category) {
  if (state.products.some((product) => categoryOf(product) === category)) {
    alert("No se puede borrar una categoria con productos asignados.");
    return;
  }
  saveCategories(allCategories().filter((item) => item !== category));
  addAuditLog("Borró categoría", `Eliminó categoría ${category}`, category);
  hydrateCategories();
}

function localUsersFromOrders() {
  const roles = JSON.parse(localStorage.getItem("localUserRoles") || "{}");
  const deletedUsers = JSON.parse(localStorage.getItem("localDeletedUsers") || "[]");
  const deletedSet = new Set(deletedUsers.map((email) => String(email || "").toLowerCase()));
  const map = new Map();
  Object.values(loadKnownProfiles()).forEach((profile) => {
    const email = String(profile.email || "").toLowerCase();
    if (!email || deletedSet.has(email)) return;
    map.set(email, {
      ...profile,
      id: profile.id || email,
      email,
      rol: roles[email] || profile.role || profile.rol || (email === ADMIN_EMAIL ? "ADMIN" : "CLIENTE"),
    });
  });
  state.orders.forEach((order) => {
    const user = order.usuario || {};
    const email = String(user.email || "").toLowerCase();
    if (!email || deletedSet.has(email)) return;
    if (!map.has(email)) {
      map.set(email, {
        ...user,
        id: user.id || email,
        email,
        rol: roles[email] || (email === ADMIN_EMAIL ? "ADMIN" : "CLIENTE"),
      });
    }
  });
  if (state.profile?.email) {
    const email = String(state.profile.email).toLowerCase();
    if (deletedSet.has(email)) return Array.from(map.values());
    map.set(email, {
      ...state.profile,
      id: state.profile.id || email,
      email,
      rol: roles[email] || state.profile.role || state.profile.rol || (email === ADMIN_EMAIL ? "ADMIN" : "CLIENTE"),
    });
  }
  return Array.from(map.values());
}

async function loadUsers() {
  if (!state.backendAvailable) {
    state.users = localUsersFromOrders();
    renderAdminUsers();
    return;
  }
  try {
    state.users = await api("/api/usuarios", { headers: await authHeader() });
  } catch {
    state.users = localUsersFromOrders();
  }
  renderAdminUsers();
}

function userOrders(user) {
  const email = String(user.email || "").toLowerCase();
  return state.orders
    .filter((order) => String(order.usuario?.email || "").toLowerCase() === email || Number(order.usuario?.id) === Number(user.id))
    .sort((a, b) => orderDate(b) - orderDate(a));
}

function renderAdminUsers() {
  const list = document.getElementById("adminUserList");
  if (!list) return;
  const search = (document.getElementById("adminUserSearch")?.value || "").toLowerCase();
  const users = state.users.filter((user) => [
    user.nombre,
    user.apellido,
    user.email,
    user.organizacion,
    user.ciudad,
    user.provincia,
    user.rol,
  ].filter(Boolean).join(" ").toLowerCase().includes(search));
  list.innerHTML = `
    <div class="table-wrap">
      <table class="users-table">
        <thead>
          <tr><th>ID</th><th>Nombre</th><th>Email</th><th>Lugar</th><th>Ubicación</th><th>Pedidos</th><th>Rol</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          ${users.map((user) => userRow(user)).join("") || `<tr><td colspan="8">No hay usuarios para mostrar.</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
}

function userRow(user) {
    const orders = userOrders(user);
    const accepted = orders.filter((order) => order.estado === "ACEPTADO").length;
    const rejected = orders.filter((order) => order.estado === "RECHAZADO").length;
    const pending = orders.filter((order) => order.estado === "PENDIENTE").length;
    const userId = String(user.id);
    const isExpanded = String(state.expandedUserId) === userId;
    const isSuperAdminUser = String(user.email || "").toLowerCase() === ADMIN_EMAIL;
    const canEditRole = isSuperAdminProfile() && !isSuperAdminUser;
    const canDeleteUser = !isSuperAdminUser && (isSuperAdminProfile() || ((user.rol || user.role) !== "ADMIN"));
    const name = `${user.nombre || ""} ${user.apellido || ""}`.trim() || "Sin nombre";
    const place = user.organizacion || "Particular";
    const location = [user.ciudad, user.provincia, user.pais].filter(Boolean).join(", ") || "Sin ubicacion";
    return `
      <tr class="user-row ${isExpanded ? "active" : ""}" onclick='toggleUserHistory(${JSON.stringify(userId)})'>
        <td>${escapeHtml(user.id || "-")}</td>
        <td><strong>${escapeHtml(name)}</strong></td>
        <td>${escapeHtml(user.email || "Sin mail")}</td>
        <td>${escapeHtml(place)}</td>
        <td>${escapeHtml(location)}</td>
        <td>
          <span>${orders.length} total</span><br>
          <small>${accepted} aceptados / ${rejected} rechazados / ${pending} pendientes</small>
        </td>
        <td onclick="event.stopPropagation()">
          ${isSuperAdminUser ? `
            <span class="role-lock">SUPER ADMIN</span>
          ` : `
            <select class="role-select" onchange='changeUserRole(${JSON.stringify(userId)}, this.value)' ${canEditRole ? "" : "disabled"}>
              <option value="CLIENTE" ${(user.rol || user.role) !== "ADMIN" ? "selected" : ""}>CLIENTE</option>
              <option value="ADMIN" ${(user.rol || user.role) === "ADMIN" ? "selected" : ""}>ADMIN</option>
            </select>
          `}
        </td>
        <td onclick="event.stopPropagation()">
          <button class="danger-button small-button" type="button" onclick='deleteUser(${JSON.stringify(userId)})' ${canDeleteUser ? "" : "disabled"}>Borrar</button>
        </td>
      </tr>
      ${isExpanded ? userHistoryRow(user, orders) : ""}
    `;
}

function userHistoryRow(user, orders) {
  const userId = String(user.id);
  const page = state.userHistoryPage.get(userId) || 0;
  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  if (safePage !== page) state.userHistoryPage.set(userId, safePage);
  const pageOrders = orders.slice(safePage * pageSize, safePage * pageSize + pageSize);
  return `
    <tr class="user-history-row">
      <td colspan="8">
        <div class="user-history-panel">
          <div class="user-history-title">
            <strong>Historial de pedidos</strong>
            <small>${orders.length} pedidos registrados</small>
          </div>
          ${pageOrders.length ? pageOrders.map((order) => `
            <div class="user-history-line">
              <span>#${escapeHtml(order.id)} - ${orderDate(order).toLocaleString("es-AR")}</span>
              <span class="badge ${order.estado}">${order.estado}</span>
              <strong>${money(orderTotal(order))}</strong>
            </div>
          `).join("") : "<p>No tiene pedidos registrados.</p>"}
          ${orders.length > pageSize ? `
            <div class="user-history-pagination">
              <button class="secondary-button" type="button" onclick='event.stopPropagation(); changeUserHistoryPage(${JSON.stringify(userId)}, -1)' ${safePage === 0 ? "disabled" : ""}>Anterior</button>
              <span>Página ${safePage + 1} de ${totalPages}</span>
              <button class="secondary-button" type="button" onclick='event.stopPropagation(); changeUserHistoryPage(${JSON.stringify(userId)}, 1)' ${safePage >= totalPages - 1 ? "disabled" : ""}>Siguiente</button>
            </div>
          ` : ""}
        </div>
      </td>
    </tr>
  `;
}

function toggleUserHistory(userId) {
  state.expandedUserId = String(state.expandedUserId) === String(userId) ? null : userId;
  if (state.expandedUserId && !state.userHistoryPage.has(String(userId))) state.userHistoryPage.set(String(userId), 0);
  renderAdminUsers();
}

function changeUserHistoryPage(userId, delta) {
  const current = state.userHistoryPage.get(String(userId)) || 0;
  state.userHistoryPage.set(String(userId), Math.max(0, current + delta));
  renderAdminUsers();
}

function renderAdminAudit() {
  const body = document.getElementById("auditTable");
  if (!body) return;
  body.innerHTML = state.auditLogs.length ? state.auditLogs.map((log) => `
    <tr>
      <td>${new Date(log.fecha).toLocaleString("es-AR")}</td>
      <td>
        <strong>${escapeHtml(log.actorNombre || "Administrador")}</strong><br>
        <small>${escapeHtml(log.actorEmail || "sin-mail")}</small>
      </td>
      <td><span class="audit-action">${escapeHtml(log.accion || "-")}</span></td>
      <td>${escapeHtml(log.detalle || "-")}</td>
      <td>${escapeHtml(log.objetivo || "-")}</td>
    </tr>
  `).join("") : `<tr><td colspan="5">Todavía no hay movimientos registrados.</td></tr>`;
}

async function deleteUser(userId) {
  const user = state.users.find((item) => String(item.id) === String(userId));
  if (!user) return;
  const userRole = user.rol || user.role || "CLIENTE";
  const email = String(user.email || "").toLowerCase();
  if (email === ADMIN_EMAIL) {
    alert("La cuenta super admin no se puede borrar.");
    return;
  }
  if (!isSuperAdminProfile() && userRole === "ADMIN") {
    alert("Los administradores solo pueden borrar clientes.");
    return;
  }
  const name = `${user.nombre || ""} ${user.apellido || ""}`.trim() || email || "usuario";
  if (!confirm(`¿Seguro que querés borrar a ${name}?`)) return;

  if (state.backendAvailable && !String(user.id).includes("@")) {
    try {
      await api(`/api/usuarios/${user.id}`, { method: "DELETE", headers: await authHeader() });
    } catch {
      alert("No se pudo borrar el usuario en el backend.");
      return;
    }
  }

  const profiles = loadKnownProfiles();
  delete profiles[email];
  localStorage.setItem("knownProfiles", JSON.stringify(profiles));
  const roles = JSON.parse(localStorage.getItem("localUserRoles") || "{}");
  delete roles[email];
  localStorage.setItem("localUserRoles", JSON.stringify(roles));
  const deletedUsers = JSON.parse(localStorage.getItem("localDeletedUsers") || "[]");
  if (email && !deletedUsers.includes(email)) {
    deletedUsers.push(email);
    localStorage.setItem("localDeletedUsers", JSON.stringify(deletedUsers));
  }
  state.users = state.users.filter((item) => String(item.id) !== String(userId));
  addAuditLog("Borró usuario", `Eliminó ${userRole.toLowerCase()} ${name}`, email);
  renderAdminUsers();
}

async function changeUserRole(userId, rol) {
  const user = state.users.find((item) => String(item.id) === String(userId));
  if (!user) return;
  if (!isSuperAdminProfile()) {
    alert("Solo el super admin puede cambiar roles.");
    renderAdminUsers();
    return;
  }
  if (String(user.email || "").toLowerCase() === ADMIN_EMAIL) {
    alert("La cuenta super admin no puede cambiarse desde el panel.");
    renderAdminUsers();
    return;
  }
  const nextUser = { ...user, rol };
  if (!state.backendAvailable || String(user.id).includes("@")) {
    const roles = JSON.parse(localStorage.getItem("localUserRoles") || "{}");
    roles[String(user.email || "").toLowerCase()] = rol;
    localStorage.setItem("localUserRoles", JSON.stringify(roles));
    state.users = state.users.map((item) => String(item.id) === String(userId) ? nextUser : item);
    addAuditLog("Cambió rol", `Asignó rol ${rol}`, String(user.email || "").toLowerCase());
    renderAdminUsers();
    return;
  }
  try {
    await api(`/api/usuarios/${user.id}`, {
      method: "PUT",
      headers: await authHeader(),
      body: JSON.stringify(buildUsuarioPayload(nextUser)),
    });
    const roles = JSON.parse(localStorage.getItem("localUserRoles") || "{}");
    roles[String(user.email || "").toLowerCase()] = rol;
    localStorage.setItem("localUserRoles", JSON.stringify(roles));
    addAuditLog("Cambió rol", `Asignó rol ${rol}`, String(user.email || "").toLowerCase());
    await loadUsers();
  } catch {
    alert("No se pudo cambiar el rol del usuario.");
    renderAdminUsers();
  }
}

function openProductEditor(id = null) {
  state.editingProductId = id;
  const product = id ? state.products.find((item) => item.id === id) : {
    nombre: "",
    descripcion: "",
    precio: 0,
    stockQuantity: 0,
    fotos: [],
    caracteristicas: [],
  };
  const categories = allCategories();
  const category = categoryOf(product);
  const editor = document.getElementById("adminProductEditor");
  editor.innerHTML = `
    <form class="product-editor" id="productEditorForm">
      <button class="ghost-button modal-close" type="button" onclick="closeProductEditor()">x</button>
      <h2>${id ? "Editar producto" : "Agregar producto"}</h2>
      <div class="form-grid">
        <label class="full">Nombre<input name="nombre" required value="${escapeHtml(product.nombre || "")}" /></label>
        <label>Precio<input name="precio" type="number" min="0" step="0.01" required value="${product.precio || 0}" /></label>
        <label>Stock<input name="stockQuantity" type="number" min="0" required value="${product.stockQuantity || 0}" /></label>
        <label class="full">Categoría
          <select name="categoria" required>
            ${categories.map((item) => `<option value="${escapeHtml(item)}" ${item === category ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}
          </select>
        </label>
        <label class="full">Descripcion breve y cita<textarea name="descripcion" rows="3" placeholder="Descripcion corta del producto y cita relacionada">${escapeHtml(product.descripcion || "")}</textarea></label>
        <label class="full">Caracteristicas / especificaciones, una por linea<textarea name="caracteristicas" rows="5" required>${escapeHtml(productFeatures(product).join("\n"))}</textarea></label>
      </div>
      <section class="photo-uploader">
        <div>
          <h3>Fotos del producto</h3>
          <p>Subi una imagen desde tu dispositivo. Se guarda en Supabase Storage y queda asociada al producto.</p>
        </div>
        <input id="editorFile" type="file" accept="image/*">
        <textarea class="hidden" name="fotos" id="editorFotos">${escapeHtml((product.fotos || []).join("\n"))}</textarea>
        <div class="photo-actions">
          <button class="secondary-button" type="button" onclick="uploadEditorImage()">Subir foto</button>
        </div>
        <div class="editor-photo-list" id="editorPhotoList"></div>
      </section>
      <div class="modal-actions">
        <button class="primary-button" type="submit">Guardar producto</button>
      </div>
    </form>
  `;
  editor.classList.remove("hidden");
  document.getElementById("productEditorForm").addEventListener("submit", saveProductFromEditor);
  renderEditorPhotos();
  editor.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeProductEditor() {
  const editor = document.getElementById("adminProductEditor");
  if (!editor) return;
  editor.classList.add("hidden");
  editor.innerHTML = "";
  state.editingProductId = null;
}

function lines(value) {
  return String(value || "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

function renderEditorPhotos() {
  const list = document.getElementById("editorPhotoList");
  const textarea = document.getElementById("editorFotos");
  if (!list || !textarea) return;
  const photos = lines(textarea.value);
  list.innerHTML = photos.length ? photos.map((url, index) => `
    <article class="editor-photo">
      <img src="${escapeHtml(url)}" alt="Foto ${index + 1}">
      <button class="danger-button" type="button" onclick="removeEditorPhoto(${index})">Quitar</button>
    </article>
  `).join("") : `<p>No hay fotos cargadas todavía.</p>`;
}

function removeEditorPhoto(index) {
  const textarea = document.getElementById("editorFotos");
  const photos = lines(textarea.value).filter((_, itemIndex) => itemIndex !== index);
  textarea.value = photos.join("\n");
  renderEditorPhotos();
}

async function optimizeImageFile(file, maxSize = 1400, quality = 0.82) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const mimeType = "image/webp";
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, mimeType, quality));
  if (!blob) return file;

  const originalName = file.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${originalName}.webp`, { type: mimeType });
}

async function saveProductFromEditor(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  const payload = {
    nombre: productDisplayName({ nombre: data.nombre }),
    descripcion: data.descripcion || "",
    precio: Number(data.precio || 0),
    stockQuantity: Number(data.stockQuantity || 0),
    fotos: lines(data.fotos),
    caracteristicas: [`Categoría: ${data.categoria}`, ...lines(data.caracteristicas)],
  };
  payload.descripcion = productDescription(payload);
  if (!payload.fotos.length) payload.fotos = ["https://placehold.co/900x700/f1e5d1/9a650c?text=Arte+Sacro"];
  if (!payload.caracteristicas.length) payload.caracteristicas = [`Categoría: ${data.categoria || "General"}`];

  try {
    const id = state.editingProductId;
    if (!state.backendAvailable) {
      if (id) {
        state.products = state.products.map((product) => (
          Number(product.id) === Number(id) ? { ...product, ...payload, id } : product
        ));
        addAuditLog("Editó producto", `Actualizó ${payload.nombre}`, `producto:${id}`);
      } else {
        const newId = Date.now();
        state.products = [{ ...payload, id: newId }, ...state.products];
        addAuditLog("Creó producto", `Agregó ${payload.nombre}`, `producto:${newId}`);
      }
      saveLocalProducts();
      closeProductEditor();
      hydrateCategories();
      renderProducts();
      renderAdminProducts();
      return;
    }
    await api(id ? `/api/productos/${id}` : "/api/productos", {
      method: id ? "PUT" : "POST",
      headers: await authHeader(),
      body: JSON.stringify(payload),
    });
    addAuditLog(id ? "Editó producto" : "Creó producto", `${id ? "Actualizó" : "Agregó"} ${payload.nombre}`, id ? `producto:${id}` : payload.nombre);
    closeProductEditor();
    await loadProducts();
  } catch {
    alert("No se pudo guardar el producto.");
  }
}

async function deleteProduct(id) {
  if (!confirm("Seguro que queres borrar este producto?")) return;
  const product = state.products.find((item) => Number(item.id) === Number(id));
  if (!state.backendAvailable) {
    state.products = state.products.filter((product) => Number(product.id) !== Number(id));
    saveLocalProducts();
    hydrateCategories();
    renderProducts();
    renderAdminProducts();
    addAuditLog("Borró producto", `Eliminó ${productDisplayName(product || { nombre: id })}`, `producto:${id}`);
    return;
  }
  try {
    await api(`/api/productos/${id}`, { method: "DELETE", headers: await authHeader() });
    addAuditLog("Borró producto", `Eliminó ${productDisplayName(product || { nombre: id })}`, `producto:${id}`);
    await loadProducts();
  } catch {
    alert("No se pudo borrar. Puede tener pedidos asociados.");
  }
}

async function uploadEditorImage() {
  const button = document.querySelector(".photo-actions button");
  const session = await requireSupabaseAdminSession();
  if (!session) {
    return;
  }
  const client = state.supabaseClient;
  const file = document.getElementById("editorFile")?.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    alert("Seleccioná un archivo de imagen.");
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    alert("La imagen no puede superar 5 MB.");
    return;
  }
  if (button) {
    button.disabled = true;
    button.textContent = "Optimizando...";
  }
  const optimizedFile = await optimizeImageFile(file);
  const safeName = optimizedFile.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
  const productId = state.editingProductId || "nuevo";
  const path = `products/${productId}-${Date.now()}-${safeName}`;
  if (button) button.textContent = "Subiendo...";
  const { error } = await client.storage.from(config.storageBucket || "product-images").upload(path, optimizedFile, {
    cacheControl: "3600",
    contentType: optimizedFile.type,
  });
  if (button) {
    button.disabled = false;
    button.textContent = "Subir foto";
  }
  if (error) {
    alert("No se pudo subir la imagen.");
    return;
  }
  const { data } = client.storage.from(config.storageBucket || "product-images").getPublicUrl(path);
  const textarea = document.getElementById("editorFotos");
  textarea.value = `${textarea.value.trim()}\n${data.publicUrl}`.trim();
  document.getElementById("editorFile").value = "";
  renderEditorPhotos();
}

function installAccountButton() {
  if (document.getElementById("accountButton")) return;
  document.querySelector(".top-actions").insertAdjacentHTML("beforeend", `
    <button class="icon-button" id="accountButton" type="button">
      <span aria-hidden="true">👤</span>
      <span>${state.profile ? "Mi perfil" : "Crear cuenta"}</span>
    </button>
  `);
}

function bindEvents() {
  document.getElementById("searchInput").addEventListener("input", renderProducts);
  document.getElementById("categoryFilter").addEventListener("change", renderProducts);
  document.getElementById("onlyStock").addEventListener("change", renderProducts);
  document.getElementById("cartButton").addEventListener("click", openCart);
  document.getElementById("notificationButton")?.addEventListener("click", toggleNotifications);
  document.getElementById("closeCart").addEventListener("click", closeCart);
  document.getElementById("sendOrderButton").addEventListener("click", openCheckout);
  document.getElementById("checkoutForm").addEventListener("submit", submitOrder);
  document.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", () => closeModal("checkoutModal")));
  document.querySelector("[data-close-success]").addEventListener("click", () => closeModal("successModal"));
  document.querySelectorAll(".nav-link").forEach((button) => button.addEventListener("click", () => switchView(button.dataset.view)));
  document.getElementById("accountButton")?.addEventListener("click", () => openAccountModal("login"));
  document.getElementById("adminButton")?.addEventListener("click", openAdmin);
  document.querySelectorAll(".admin-tab").forEach((button) => button.addEventListener("click", async () => {
    if (button.dataset.adminTab === "catalog") {
      document.getElementById("adminView").classList.add("hidden");
      return;
    }
    activateAdminTab(button.dataset.adminTab);
    if (button.dataset.adminTab === "dashboard") {
      await loadOrders();
      renderAdminDashboard();
    }
    if (button.dataset.adminTab === "orders") await loadOrders();
    if (button.dataset.adminTab === "products") renderAdminProducts();
    if (button.dataset.adminTab === "categories") renderAdminCategories();
    if (button.dataset.adminTab === "users") await loadUsers();
    if (button.dataset.adminTab === "audit") renderAdminAudit();
  }));
  document.getElementById("adminProductSearch").addEventListener("input", renderAdminProducts);
  document.getElementById("reloadProducts").addEventListener("click", loadProducts);
  document.getElementById("addCategoryButton").addEventListener("click", addCategory);
  document.getElementById("adminUserSearch")?.addEventListener("input", renderAdminUsers);
  document.getElementById("reloadUsers")?.addEventListener("click", loadUsers);
  ["orderSearch", "orderStatusFilter", "orderMonthFilter", "orderLocationFilter"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", () => {
      state.expandedOrderId = null;
      renderOrders();
    });
    document.getElementById(id)?.addEventListener("change", () => {
      state.expandedOrderId = null;
      renderOrders();
    });
  });
  document.getElementById("clearOrderFilters")?.addEventListener("click", () => {
    ["orderSearch", "orderStatusFilter", "orderMonthFilter", "orderLocationFilter"].forEach((id) => {
      const field = document.getElementById(id);
      if (field) field.value = "";
    });
    state.expandedOrderId = null;
    renderOrders();
  });
}

window.addToCart = addToCart;
window.openQuantityPicker = openQuantityPicker;
window.stepQuantity = stepQuantity;
window.changeQty = changeQty;
window.removeFromCart = removeFromCart;
window.changeOrderStatus = changeOrderStatus;
window.openProductDetail = openProductDetail;
window.switchView = switchView;
window.moveGallery = moveGallery;
window.setGalleryImage = setGalleryImage;
window.openAccountModal = openAccountModal;
window.openProfileModal = openProfileModal;
window.logoutProfile = logoutProfile;
window.toggleOrderDetail = toggleOrderDetail;
window.closeOrderDetail = closeOrderDetail;
window.openProductEditor = openProductEditor;
window.closeProductEditor = closeProductEditor;
window.deleteProduct = deleteProduct;
window.uploadEditorImage = uploadEditorImage;
window.removeEditorPhoto = removeEditorPhoto;
window.addCategory = addCategory;
window.renameCategory = renameCategory;
window.deleteCategory = deleteCategory;
window.changeDashboardMonth = changeDashboardMonth;
window.changeUserRole = changeUserRole;
window.deleteUser = deleteUser;
window.renderAdminAudit = renderAdminAudit;
window.toggleUserHistory = toggleUserHistory;
window.changeUserHistoryPage = changeUserHistoryPage;

ensureDynamicSections();
installAccountButton();
installRandomBibleQuote();
installRosaryScrollMotion();
bindEvents();
updateAccountButton();
loadProducts();
renderCart();
renderNotifications();
