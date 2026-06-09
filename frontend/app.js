const config = window.APP_CONFIG || {};
const API = config.apiBaseUrl || "http://localhost:8080";

const state = {
  products: [],
  backendAvailable: false,
  cart: new Map(),
  orders: [],
  profile: loadProfile(),
  adminAuth: "",
  adminSession: null,
  supabaseClient: null,
  detailProductId: null,
  detailImageIndex: 0,
  editingProductId: null,
};

const ADMIN_EMAIL = "tomas.alberto.lobos123@gmail.com";

const demoImages = [
  "https://images.unsplash.com/photo-1578301978018-3005759f48f7?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1542361345-89e58247f2d5?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1602524206684-1886f0379f7d?auto=format&fit=crop&w=900&q=80",
];

const fallbackProducts = [
  { id: 1, nombre: "Maria Auxiliadora (Tamano: 40 CM)", descripcion: "Imagen religiosa para devocion particular o comunidad.", precio: 36400, stockQuantity: 8, fotos: [demoImages[0], demoImages[0]], caracteristicas: ["Categoria: Imagenes", "Tamano: 40 CM"] },
  { id: 2, nombre: "Cristo Crucificado (Tamano: 120CM)", descripcion: "Crucifijo de pared en madera.", precio: 402500, stockQuantity: 5, fotos: [demoImages[1], demoImages[1]], caracteristicas: ["Categoria: Crucifijos", "Tamano: 120 CM"] },
  { id: 3, nombre: "Rosario de Plata", descripcion: "Rosario devocional con terminacion metalica.", precio: 120000, stockQuantity: 12, fotos: [demoImages[2], demoImages[2]], caracteristicas: ["Categoria: Rosarios", "Material: Plata"] },
  { id: 4, nombre: "Lampara Votiva para Santuario", descripcion: "Lampara para uso liturgico o santuario.", precio: 60000, stockQuantity: 0, fotos: [demoImages[3], demoImages[3]], caracteristicas: ["Categoria: Santuario", "Uso: Interior"] },
];

const money = (value) => new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
}).format(Number(value || 0));

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
    role: profile.role || state.profile?.role || (String(profile.email || "").toLowerCase() === ADMIN_EMAIL ? "ADMIN" : "CLIENTE"),
  };
  localStorage.setItem("customerProfile", JSON.stringify(state.profile));
  updateAccountButton();
}

function isAdminProfile() {
  return state.profile?.role === "ADMIN" || String(state.profile?.email || "").toLowerCase() === ADMIN_EMAIL;
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

function categoryOf(product) {
  const source = product.caracteristicas?.find((item) => item.toLowerCase().includes("categoria")) || product.caracteristicas?.[0] || "General";
  return source.replace(/^categoria:\s*/i, "") || "General";
}

async function loadProducts() {
  const status = document.getElementById("statusLine");
  try {
    const products = await api("/api/productos");
    state.products = products;
    state.backendAvailable = true;
    status.textContent = "";
  } catch {
    state.backendAvailable = false;
    state.products = await loadLocalProducts();
    status.textContent = "";
  }
  hydrateCategories();
  renderProducts();
  renderAdminProducts();
  if (state.detailProductId) renderProductDetail();
}

async function loadLocalProducts() {
  const saved = localStorage.getItem("localProducts");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      localStorage.removeItem("localProducts");
    }
  }
  try {
    const response = await fetch("./products.seed.json");
    if (!response.ok) throw new Error("seed unavailable");
    return response.json();
  } catch {
    return fallbackProducts;
  }
}

function saveLocalProducts(products = state.products) {
  localStorage.setItem("localProducts", JSON.stringify(products));
}

function hydrateCategories() {
  const select = document.getElementById("categoryFilter");
  const categories = Array.from(new Set(state.products.map(categoryOf))).sort();
  select.innerHTML = `<option value="">Todas</option>` + categories.map((c) => `<option>${escapeHtml(c)}</option>`).join("");
}

function renderProducts() {
  const grid = document.getElementById("productGrid");
  const search = document.getElementById("searchInput").value.trim().toLowerCase();
  const category = document.getElementById("categoryFilter").value;
  const onlyStock = document.getElementById("onlyStock").checked;
  const products = state.products.filter((product) => {
    const matchesSearch = product.nombre.toLowerCase().includes(search);
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
      <button class="product-open" type="button" onclick="openProductDetail(${product.id})" aria-label="Ver ${escapeHtml(product.nombre)}">
        <div class="product-image">${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(product.nombre)}">` : "✝"}</div>
      </button>
      <div class="product-body">
        <button class="product-title-button" type="button" onclick="openProductDetail(${product.id})">${escapeHtml(product.nombre)}</button>
        <div class="price">${money(product.precio)}</div>
        <div class="stock ${stock === 0 ? "zero" : ""}">Stock disponible: <strong>${stock} unidades</strong></div>
        <button class="primary-button" type="button" ${stock === 0 ? "disabled" : ""} onclick="addToCart(${product.id})">
          ${stock === 0 ? "Sin stock" : "Anadir al pedido"}
        </button>
      </div>
    </article>
  `;
}

function ensureDynamicSections() {
  if (!document.getElementById("detailView")) {
    document.querySelector("main").insertAdjacentHTML("beforeend", `
      <section class="detail-view hidden" id="detailView"></section>
    `);
  }
  if (!document.getElementById("accountModal")) {
    document.body.insertAdjacentHTML("beforeend", `
      <section class="modal hidden" id="accountModal" role="dialog" aria-modal="true"></section>
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
        <div class="gallery-main">${activePhoto ? `<img src="${escapeHtml(activePhoto)}" alt="${escapeHtml(product.nombre)}">` : "✝"}</div>
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
        <h1>${escapeHtml(product.nombre)}</h1>
        <div class="price detail-price">${money(product.precio)}</div>
        <p>${escapeHtml(product.descripcion || "Producto disponible para venta al publico. Consulte entrega y condiciones con el santuario.")}</p>
        <div class="stock ${stock === 0 ? "zero" : ""}">Stock disponible: <strong>${stock} unidades</strong></div>
        <div class="detail-actions">
          <button class="primary-button" type="button" ${stock === 0 ? "disabled" : ""} onclick="addToCart(${product.id})">
            ${stock === 0 ? "Sin stock" : "Anadir al pedido"}
          </button>
        </div>
        <h2>Caracteristicas</h2>
        <ul class="feature-list">
          ${(product.caracteristicas || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("") || "<li>Sin caracteristicas cargadas.</li>"}
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

function addToCart(id) {
  const product = state.products.find((item) => item.id === id);
  if (!product || product.stockQuantity <= 0) return;
  const current = state.cart.get(id) || { product, cantidad: 0 };
  if (current.cantidad >= product.stockQuantity) return;
  current.cantidad += 1;
  state.cart.set(id, current);
  renderCart();
  openCart();
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
        <h3>${escapeHtml(item.product.nombre)}</h3>
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
  if (next > item.product.stockQuantity) return;
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
  document.getElementById("checkoutModal").classList.remove("hidden");
}

function fillCheckoutForm(profile) {
  const form = document.getElementById("checkoutForm");
  Object.entries(profile || {}).forEach(([key, value]) => {
    if (form.elements[key]) form.elements[key].value = value || "";
  });
}

async function submitOrder(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  try {
    if (!state.backendAvailable) {
      saveProfile({ ...data });
      const localOrders = JSON.parse(localStorage.getItem("localOrders") || "[]");
      localOrders.push({
        id: nextLocalOrderId(),
        usuario: data,
        fecha: new Date().toISOString(),
        estado: "PENDIENTE",
        total: Array.from(state.cart.values()).reduce((sum, item) => sum + item.cantidad * item.product.precio, 0),
        detalles: Array.from(state.cart.values()),
      });
      localStorage.setItem("localOrders", JSON.stringify(localOrders));
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
    await api("/api/pedidos", { method: "POST", body: JSON.stringify({ usuarioId: user.id, detalles }) });
    state.cart.clear();
    renderCart();
    closeModal("checkoutModal");
    closeCart();
    document.getElementById("successModal").classList.remove("hidden");
    await loadProducts();
  } catch {
    alert("No se pudo enviar el pedido. Verifique los datos o intente mas tarde.");
  }
}

function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
}

function openAccountModal(mode = "login", mustComplete = false) {
  ensureDynamicSections();
  const profile = state.profile || {};
  document.getElementById("accountModal").innerHTML = `
    <form class="modal-card" id="accountForm">
      ${mustComplete ? "" : `<button class="ghost-button modal-close" type="button" onclick="closeModal('accountModal')">x</button>`}
      <h2>${state.profile ? "Mi cuenta" : mode === "login" ? "Iniciar sesion" : "Crear cuenta"}</h2>
      <p class="modal-note">Usa nombre, email y contrasenia. Despues completas direccion solo cuando hagas un pedido.</p>
      <div class="form-grid">
        <label>Nombre<input name="nombre" required value="${escapeHtml(profile.nombre || "")}" /></label>
        <label>Email<input name="email" type="email" required value="${escapeHtml(profile.email || "")}" /></label>
        <label class="full">Contrasenia<input name="password" type="password" minlength="6" ${state.profile ? "" : "required"} /></label>
      </div>
      <div class="modal-actions">
        ${!state.profile ? `<button class="secondary-button" type="button" onclick="openAccountModal('${mode === "login" ? "register" : "login"}')">${mode === "login" ? "Crear cuenta" : "Ya tengo cuenta"}</button>` : ""}
        ${state.profile ? `<button class="secondary-button" type="button" onclick="openProfileModal(false)">Datos para pedidos</button>` : ""}
        ${isAdminProfile() ? `<button class="secondary-button" type="button" onclick="closeModal('accountModal'); openAdmin()">Panel admin</button>` : ""}
        ${state.profile ? `<button class="secondary-button" type="button" onclick="logoutProfile()">Cerrar sesion</button>` : ""}
        <button class="primary-button" type="submit">${state.profile ? "Actualizar" : "Entrar"}</button>
      </div>
    </form>
  `;
  document.getElementById("accountModal").classList.remove("hidden");
  document.getElementById("accountForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    await authenticateAccount(data, mode);
    closeModal("accountModal");
    if (mustComplete) openProfileModal(true);
  });
}

async function authenticateAccount(data, mode) {
  const email = String(data.email || "").toLowerCase();
  const baseProfile = {
    nombre: data.nombre,
    email,
    role: email === ADMIN_EMAIL ? "ADMIN" : "CLIENTE",
  };

  const client = await ensureSupabaseClient().catch(() => null);
  if (client && data.password) {
    const authResult = mode === "register"
      ? await client.auth.signUp({ email, password: data.password, options: { data: { nombre: data.nombre } } })
      : await client.auth.signInWithPassword({ email, password: data.password });
    if (authResult.error) {
      alert("Supabase no valido esos datos. Se guardara sesion local para seguir probando.");
    } else {
      state.adminSession = authResult.data.session || null;
    }
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
        <label>Telefono<input name="telefono" value="${escapeHtml(profile.telefono || "")}" /></label>
        <label>Pais<input name="pais" required value="${escapeHtml(profile.pais || "Argentina")}" /></label>
        <label>Provincia<input name="provincia" required value="${escapeHtml(profile.provincia || "")}" /></label>
        <label>Ciudad<input name="ciudad" required value="${escapeHtml(profile.ciudad || "")}" /></label>
        <label>Codigo postal<input name="codigoPostal" required value="${escapeHtml(profile.codigoPostal || "")}" /></label>
        <label class="full">Direccion<input name="direccion" required value="${escapeHtml(profile.direccion || "")}" /></label>
        <label class="full">Organizacion<input name="organizacion" value="${escapeHtml(profile.organizacion || "")}" placeholder="Parroquia, santuario o particular" /></label>
      </div>
      <div class="modal-actions">
        <button class="primary-button" type="submit">Guardar datos</button>
      </div>
    </form>
  `;
  document.getElementById("accountModal").classList.remove("hidden");
  document.getElementById("profileForm").addEventListener("submit", (event) => {
    event.preventDefault();
    saveProfile(Object.fromEntries(new FormData(event.currentTarget)));
    closeModal("accountModal");
    if (mustComplete) openCheckout();
  });
}

function logoutProfile() {
  state.profile = null;
  localStorage.removeItem("customerProfile");
  updateAccountButton();
  closeModal("accountModal");
}

function updateAccountButton() {
  const button = document.getElementById("accountButton");
  if (!button) return;
  button.querySelector("span:last-child").textContent = state.profile ? "Mi perfil" : "Crear cuenta";
}

async function openAdmin() {
  if (!isAdminProfile()) {
    alert("Tu usuario no tiene permisos de administrador.");
    return;
  }
  if (!state.backendAvailable) {
    document.getElementById("adminView").classList.remove("hidden");
    await loadOrders();
    renderAdminProducts();
    return;
  }
  const session = await currentSupabaseSession();
  if (!session && !state.adminAuth && config.supabaseAnonKey) {
    const email = prompt("Email admin", "tomas.alberto.lobos123@gmail.com");
    const password = prompt("Contrasenia admin", "");
    if (!email || !password) return;
    const client = await ensureSupabaseClient().catch(() => null);
    const { error } = client ? await client.auth.signInWithPassword({ email, password }) : { error: true };
    if (error) alert("No se pudo iniciar sesion con Supabase Auth. Se usara acceso local si esta disponible.");
  }
  const nextSession = await currentSupabaseSession();
  if (!nextSession && !state.adminAuth) {
    const email = prompt("Email admin", "tomas.alberto.lobos123@gmail.com");
    const password = prompt("Contrasenia admin", "");
    if (!email || !password) return;
    state.adminAuth = btoa(`${email}:${password}`);
  }
  document.getElementById("adminView").classList.remove("hidden");
  await loadOrders();
  renderAdminProducts();
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
}

function renderOrders() {
  const body = document.getElementById("ordersTable");
  body.innerHTML = state.orders.length ? state.orders.map((order) => `
    <tr>
      <td>${order.id}</td>
      <td>${escapeHtml(order.usuario?.nombre || "")} ${escapeHtml(order.usuario?.apellido || "")}<br><small>${escapeHtml(order.usuario?.email || "")}</small></td>
      <td>${order.fecha ? new Date(order.fecha).toLocaleString("es-AR") : ""}</td>
      <td><span class="badge ${order.estado}">${order.estado}</span></td>
      <td>${money(order.total)}</td>
      <td class="row-actions">
        <button class="secondary-button" type="button" onclick="openOrderDetail(${order.id})">Ver detalle</button>
        ${order.estado === "PENDIENTE" ? `
          <button class="primary-button" type="button" onclick="changeOrderStatus(${order.id}, 'ACEPTADO')">Aceptar</button>
          <button class="danger-button" type="button" onclick="changeOrderStatus(${order.id}, 'RECHAZADO')">Rechazar</button>
        ` : "-"}
      </td>
    </tr>
  `).join("") : `<tr><td colspan="6">No hay pedidos.</td></tr>`;
}

function openOrderDetail(id) {
  const order = state.orders.find((item) => Number(item.id) === Number(id));
  if (!order) return;
  const user = order.usuario || {};
  const details = order.detalles || order.detallesPedido || [];
  const detail = document.getElementById("adminOrderDetail");
  detail.innerHTML = `
    <div class="order-detail-card">
      <button class="ghost-button modal-close" type="button" onclick="closeOrderDetail()">x</button>
      <h2>Pedido #${escapeHtml(order.id)}</h2>
      <div class="order-detail-grid">
        <section>
          <h3>Comprador</h3>
          <p><strong>${escapeHtml(user.nombre || "")} ${escapeHtml(user.apellido || "")}</strong></p>
          <p>${escapeHtml(user.email || "")}</p>
          <p>${escapeHtml(user.telefono || "Sin telefono")}</p>
          <p>${escapeHtml(user.organizacion || "Particular")}</p>
        </section>
        <section>
          <h3>Direccion</h3>
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
          const name = product?.nombre || localProduct?.nombre || detail.nombre || "Producto";
          const qty = detail.cantidad || detail.cantidadSolicitada || 1;
          const unit = detail.precioUnitario || product?.precio || localProduct?.precio || 0;
          return `<div><span>${escapeHtml(name)} x ${qty}</span><strong>${money(Number(unit) * Number(qty))}</strong></div>`;
        }).join("") || "<p>Sin detalle de productos.</p>"}
      </div>
      <div class="total-row"><span>Total</span><strong>${money(order.total)}</strong></div>
    </div>
  `;
  detail.classList.remove("hidden");
  detail.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeOrderDetail() {
  const detail = document.getElementById("adminOrderDetail");
  if (!detail) return;
  detail.classList.add("hidden");
  detail.innerHTML = "";
}

async function changeOrderStatus(id, estado) {
  if (!state.backendAvailable) {
    const localOrders = JSON.parse(localStorage.getItem("localOrders") || "[]").map((order) => (
      Number(order.id) === Number(id) ? { ...order, estado } : order
    ));
    localStorage.setItem("localOrders", JSON.stringify(localOrders));
    await loadOrders();
    return;
  }
  try {
    await api(`/api/pedidos/${id}/estado`, {
      method: "PATCH",
      headers: await authHeader(),
      body: JSON.stringify({ estado }),
    });
    await loadOrders();
    await loadProducts();
  } catch {
    alert("No se pudo actualizar el pedido.");
  }
}

function renderAdminProducts() {
  const list = document.getElementById("adminProductList");
  if (!list) return;
  const search = (document.getElementById("adminProductSearch")?.value || "").toLowerCase();
  const products = state.products.filter((product) => product.nombre.toLowerCase().includes(search)).slice(0, 120);
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
        <div><h3>${escapeHtml(product.nombre)}</h3><small>${money(product.precio)} - Stock ${product.stockQuantity || 0}</small></div>
        <div class="admin-product-preview">${firstImage(product) ? `<img src="${escapeHtml(firstImage(product))}" alt="">` : "✝"}</div>
        <button class="secondary-button" type="button" onclick="openProductEditor(${product.id})">Editar</button>
        <button class="danger-button" type="button" onclick="deleteProduct(${product.id})">Borrar</button>
      </article>
    `).join("")}
  `;
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
  const editor = document.getElementById("adminProductEditor");
  editor.innerHTML = `
    <form class="product-editor" id="productEditorForm">
      <button class="ghost-button modal-close" type="button" onclick="closeProductEditor()">x</button>
      <h2>${id ? "Editar producto" : "Agregar producto"}</h2>
      <div class="form-grid">
        <label class="full">Nombre<input name="nombre" required value="${escapeHtml(product.nombre || "")}" /></label>
        <label>Precio<input name="precio" type="number" min="0" step="0.01" required value="${product.precio || 0}" /></label>
        <label>Stock<input name="stockQuantity" type="number" min="0" required value="${product.stockQuantity || 0}" /></label>
        <label class="full">Descripcion<textarea name="descripcion" rows="3">${escapeHtml(product.descripcion || "")}</textarea></label>
        <label class="full">Fotos, una URL por linea<textarea name="fotos" id="editorFotos" rows="4" required>${escapeHtml((product.fotos || []).join("\n"))}</textarea></label>
        <label class="full">Caracteristicas, una por linea<textarea name="caracteristicas" rows="5" required>${escapeHtml((product.caracteristicas || []).join("\n"))}</textarea></label>
        <label class="full">Subir foto a Supabase Storage<input id="editorFile" type="file" accept="image/*"></label>
      </div>
      <div class="modal-actions">
        <button class="secondary-button" type="button" onclick="uploadEditorImage()">Subir foto</button>
        <button class="primary-button" type="submit">Guardar producto</button>
      </div>
    </form>
  `;
  editor.classList.remove("hidden");
  document.getElementById("productEditorForm").addEventListener("submit", saveProductFromEditor);
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

async function saveProductFromEditor(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  const payload = {
    nombre: data.nombre,
    descripcion: data.descripcion || "",
    precio: Number(data.precio || 0),
    stockQuantity: Number(data.stockQuantity || 0),
    fotos: lines(data.fotos),
    caracteristicas: lines(data.caracteristicas),
  };
  if (!payload.fotos.length) payload.fotos = ["https://placehold.co/900x700/f1e5d1/9a650c?text=Arte+Sacro"];
  if (!payload.caracteristicas.length) payload.caracteristicas = ["Categoria: General"];

  try {
    const id = state.editingProductId;
    if (!state.backendAvailable) {
      if (id) {
        state.products = state.products.map((product) => (
          Number(product.id) === Number(id) ? { ...product, ...payload, id } : product
        ));
      } else {
        state.products = [{ ...payload, id: Date.now() }, ...state.products];
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
    closeProductEditor();
    await loadProducts();
  } catch {
    alert("No se pudo guardar el producto.");
  }
}

async function deleteProduct(id) {
  if (!confirm("Seguro que queres borrar este producto?")) return;
  if (!state.backendAvailable) {
    state.products = state.products.filter((product) => Number(product.id) !== Number(id));
    saveLocalProducts();
    hydrateCategories();
    renderProducts();
    renderAdminProducts();
    return;
  }
  try {
    await api(`/api/productos/${id}`, { method: "DELETE", headers: await authHeader() });
    await loadProducts();
  } catch {
    alert("No se pudo borrar. Puede tener pedidos asociados.");
  }
}

async function uploadEditorImage() {
  const client = await ensureSupabaseClient().catch(() => null);
  if (!client) {
    alert("Configure supabaseAnonKey en frontend/config.js para subir imagenes.");
    return;
  }
  const session = await currentSupabaseSession();
  if (!session) {
    alert("Inicie sesion como admin antes de subir imagenes.");
    return;
  }
  const file = document.getElementById("editorFile")?.files?.[0];
  if (!file) return;
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
  const path = `products/${Date.now()}-${safeName}`;
  const { error } = await client.storage.from(config.storageBucket || "product-images").upload(path, file, { cacheControl: "3600" });
  if (error) {
    alert("No se pudo subir la imagen.");
    return;
  }
  const { data } = client.storage.from(config.storageBucket || "product-images").getPublicUrl(path);
  const textarea = document.getElementById("editorFotos");
  textarea.value = `${textarea.value.trim()}\n${data.publicUrl}`.trim();
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
  document.getElementById("closeCart").addEventListener("click", closeCart);
  document.getElementById("sendOrderButton").addEventListener("click", openCheckout);
  document.getElementById("checkoutForm").addEventListener("submit", submitOrder);
  document.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", () => closeModal("checkoutModal")));
  document.querySelector("[data-close-success]").addEventListener("click", () => closeModal("successModal"));
  document.querySelectorAll(".nav-link").forEach((button) => button.addEventListener("click", () => switchView(button.dataset.view)));
  document.getElementById("accountButton")?.addEventListener("click", () => openAccountModal(state.profile ? "login" : "register"));
  document.getElementById("adminButton")?.addEventListener("click", openAdmin);
  document.querySelectorAll(".admin-tab").forEach((button) => button.addEventListener("click", async () => {
    if (button.dataset.adminTab === "catalog") {
      document.getElementById("adminView").classList.add("hidden");
      return;
    }
    document.querySelectorAll(".admin-tab").forEach((tab) => tab.classList.toggle("active", tab === button));
    document.getElementById("adminOrders").classList.toggle("hidden", button.dataset.adminTab !== "orders");
    document.getElementById("adminProducts").classList.toggle("hidden", button.dataset.adminTab !== "products");
    if (button.dataset.adminTab === "orders") await loadOrders();
    if (button.dataset.adminTab === "products") renderAdminProducts();
  }));
  document.getElementById("adminProductSearch").addEventListener("input", renderAdminProducts);
  document.getElementById("reloadProducts").addEventListener("click", loadProducts);
}

window.addToCart = addToCart;
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
window.openOrderDetail = openOrderDetail;
window.closeOrderDetail = closeOrderDetail;
window.openProductEditor = openProductEditor;
window.closeProductEditor = closeProductEditor;
window.deleteProduct = deleteProduct;
window.uploadEditorImage = uploadEditorImage;

ensureDynamicSections();
installAccountButton();
bindEvents();
updateAccountButton();
loadProducts();
renderCart();
