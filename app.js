import { BASE_URL } from "./api.js";

/**
 * Catálogo de tratamientos por kinesiólogo
 * (puedes editar nombres, duración y precios)
 */
const KINE_TREATMENTS = {
  "Dr. Francisca torres": [
    {
      name: "1 sesión de kinesiología de piso pélvico",
      duration: "45 minutos",
      price: "$25.000",
    },
    {
      name: "Plan 4 sesiones postparto",
      duration: "4 sesiones • 1 mes",
      price: "$90.000",
    },
    {
      name: "Evaluación inicial suelo pélvico",
      duration: "60 minutos",
      price: "$35.000",
    },
  ],
  "Dr. Ignacio Valdés": [
    {
      name: "Kinesiología neurológica adulto",
      duration: "45 minutos",
      price: "$25.000",
    },
    {
      name: "Rehabilitación post-ACV",
      duration: "55 minutos",
      price: "$35.000",
    },
    {
      name: "Evaluación neurológica",
      duration: "60 minutos",
      price: "$40.000",
    },
  ],
  "Dr. Matias Olivares": [
    {
      name: "Rehabilitación respiratoria adultos",
      duration: "45 minutos",
      price: "$25.000",
    },
    {
      name: "Rehabilitación respiratoria pediátrica",
      duration: "45 minutos",
      price: "$25.000",
    },
    {
      name: "Evaluación respiratoria",
      duration: "60 minutos",
      price: "$35.000",
    },
  ],
};

const DEFAULT_TREATMENTS = [
  {
    name: "1 sesión de kinesiología",
    duration: "45 minutos",
    price: "$25.000",
  },
  {
    name: "Plan 3 sesiones",
    duration: "3 sesiones • 1 semana",
    price: "$70.000",
  },
  {
    name: "Evaluación kinesiológica",
    duration: "60 minutos",
    price: "$35.000",
  },
];



/**
 * Inicializa el Directorio de Kinesiólogos
 */
async function initKineDirectory() {
  const directoryRoot = document.querySelector("[data-kine-directory]");
  if (!directoryRoot) return;

  // Elementos del DOM
  const listEl = directoryRoot.querySelector("[data-kine-list]");
  const placeholder = directoryRoot.querySelector(".kine-directory__placeholder");
  const detailEmpty = directoryRoot.querySelector("[data-kine-empty]");
  const detailProfile = directoryRoot.querySelector("[data-kine-profile]");

  const avatarEl = directoryRoot.querySelector("[data-kine-avatar]");
  const nameEl = directoryRoot.querySelector("[data-kine-name]");
  const specialtyEl = directoryRoot.querySelector("[data-kine-specialty]");
  const boxEl = directoryRoot.querySelector("[data-kine-box]");
  const rutEl = directoryRoot.querySelector("[data-kine-rut]");
  const descEl = directoryRoot.querySelector("[data-kine-description]");
  const phoneEl = directoryRoot.querySelector("[data-kine-phone]");
  const phoneLinkEl = directoryRoot.querySelector("[data-kine-phone-link]");
  const emailEl = directoryRoot.querySelector("[data-kine-email]");
  const emailLinkEl = directoryRoot.querySelector("[data-kine-email-link]");



  const servicesContainer = directoryRoot.querySelector("[data-kine-services]");
  const slotsContainer = directoryRoot.querySelector("[data-kine-slots]");



  // Mostrar loader
  if (placeholder) placeholder.style.display = "flex";

  /***********************************************************
   * 1) LLAMADA REAL AL BACKEND
   ***********************************************************/
  let professionals = [];
  try {
    const res = await fetch(BASE_URL + "api/kinesiologists", {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });

    if (!res.ok) throw new Error("Error HTTP " + res.status);

    professionals = await res.json();
    console.log("Kinesiólogos cargados:", professionals);
  } catch (err) {
    console.error("Error cargando kinesiologos:", err);
    if (placeholder)
      placeholder.innerHTML = "<p>Error al cargar los profesionales.</p>";
    return;
  }

  // Ocultar loader
  if (placeholder) placeholder.style.display = "none";
  if (listEl) listEl.innerHTML = "";

  /***********************************************************
   * 2) Pintar LISTA LATERAL con los nombres reales
   ***********************************************************/
  professionals.forEach((kine) => {
    const item = document.createElement("button");
    item.className = "kine-directory__item";
    item.textContent = kine.name;
    item.dataset.id = kine.id;

    item.addEventListener("click", () => showKineDetail(kine));
    listEl.appendChild(item);
  });

  /***********************************************************
   * 3) Cargar HORARIOS de una semana (cuando ya se eligió servicio)
   ***********************************************************/
/********************** AUTENTICACIÓN UI **************************/

function isUserLoggedIn() {
  const token = localStorage.getItem("authToken");
  if (!token) return false;

  try {
    const rawUser = localStorage.getItem("user");
    if (!rawUser) return false;
    const user = JSON.parse(rawUser);
    return !!user;
  } catch (e) {
    console.warn("No se pudo parsear user:", e);
    return false;
  }
}

function updateAuthUI() {
  // Elementos del header
  const loginLink = document.querySelector("[data-auth-link]");
  const labelSpan = document.querySelector("[data-auth-label]");
  const userSpan  = document.querySelector("[data-auth-user]");

  if (!loginLink || !labelSpan || !userSpan) {
    // No estás en una página con este header, no hacemos nada
    return;
  }

  const token   = localStorage.getItem("authToken");
  const rawUser = localStorage.getItem("user");

  if (token && rawUser) {
    // === Usuario logeado ===
    let name = "Paciente";
    try {
      const user = JSON.parse(rawUser);
      name = user.name || user.full_name || user.email || name;
    } catch (e) {
      console.warn("No se pudo parsear user desde localStorage:", e);
    }

    labelSpan.textContent = "Cerrar sesión";
    userSpan.textContent  = `Hola, ${name}`;

    // Al hacer click: cerrar sesión
    loginLink.href = "#";
    loginLink.onclick = (ev) => {
      ev.preventDefault();
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      window.location.href = "ingreseAqui.html";
    };
  } else {
    // === Invitado / no logeado ===
    labelSpan.textContent = "Ingresar";
    userSpan.textContent  = "Invitado";

    loginLink.href = "ingreseAqui.html";
    loginLink.onclick = null;
  }
}



  async function loadSlotsForKine(kineId) {
  if (!slotsContainer) return;

  // Texto mientras carga
  slotsContainer.innerHTML = "<p>Cargando horarios…</p>";

  // Array con los próximos 7 días (hoy + 6)
  const today = new Date();
  const WEEK_DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);

    const iso = d.toISOString().slice(0, 10); // YYYY-MM-DD
    const label = `${WEEK_DAYS[d.getDay()]} ${d.getDate()}`;

    days.push({ iso, label });
  }

  try {
    const results = await Promise.all(
      days.map((info) =>
        fetch(
          `${BASE_URL}api/kinesiologists/${kineId}/slots/?date=${info.iso}`,
          {
            headers: { "ngrok-skip-browser-warning": "true" },
          }
        ).then((res) => (res.ok ? res.json() : []))
      )
    );

    const weekSlots = days.map((info, idx) => ({
      ...info,
      slots: results[idx],
    }));

    const wrapper = document.createElement("div");
    wrapper.className = "week-slots";

    weekSlots.forEach((day) => {
      const col = document.createElement("div");
      col.className = "week-day";

      const header = document.createElement("div");
      header.className = "week-day__header";
      header.textContent = day.label;
      col.appendChild(header);

      if (!day.slots.length) {
        const empty = document.createElement("p");
        empty.className = "week-day__empty";
        empty.textContent = "Sin horarios";
        col.appendChild(empty);
      } else {
        const list = document.createElement("div");
        list.className = "week-day__slots";

        day.slots.forEach((slot) => {
  const btn = document.createElement("button");
  btn.className = "slot-pill";

  const hora = slot.start_time.slice(0, 5);
  btn.textContent = hora;

  btn.addEventListener("click", () => {
    // 1) Visual: marcar seleccionado
    list
      .querySelectorAll(".slot-pill")
      .forEach((b) => b.classList.remove("slot-pill--selected"));
    btn.classList.add("slot-pill--selected");

    // 2) Construir info de la hora seleccionada
    const selection = {
      kinesiologistId: kineId,
      date: slot.date,            // viene del backend
      startTime: slot.start_time, // "10:45:00"
      endTime: slot.end_time,     // si tu modelo lo tiene
    };

    // 3) Guardar selección para usarla en datos.html
    localStorage.setItem("pendingBooking", JSON.stringify(selection));
    console.log("pendingBooking guardado:", selection); // 👈 DEBUG

    // 4) Ver si el usuario está logueado
    const token = localStorage.getItem("authToken");

    if (!token) {
      // NO logueado → ir a datos.html
      window.location.href = "datos.html";
    } else {
      // YA logueado → podrías ir directo al historial
      window.location.href = "historial.html";
    }
  });

  list.appendChild(btn);
});

        col.appendChild(list);
      }

      wrapper.appendChild(col);
    });

    slotsContainer.innerHTML = "";
    slotsContainer.appendChild(wrapper);
  } catch (err) {
    console.error("Error cargando horarios:", err);
    slotsContainer.innerHTML =
      "<p>Error al cargar los horarios. Intenta nuevamente.</p>";
  }
}

  /***********************************************************
   * 4) Pintar tratamientos para el kine seleccionado
   ***********************************************************/
  function renderServices(kine) {
    if (!servicesContainer) return;

    const treatments = KINE_TREATMENTS[kine.name] || DEFAULT_TREATMENTS;

    servicesContainer.innerHTML = `
      <h3 class="kine-services__title">Selecciona un servicio</h3>
      <div class="kine-services__grid"></div>
    `;

    const grid = servicesContainer.querySelector(".kine-services__grid");

    treatments.forEach((t) => {
      const card = document.createElement("article");
      card.className = "service-card";

      card.innerHTML = `
        <div class="service-card__info">
          <h4>${t.name}</h4>
          <span>${t.duration}</span>
        </div>
        <strong class="service-card__price">${t.price}</strong>
      `;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "service-card__action";
      btn.textContent = "Ver horarios";

      btn.addEventListener("click", () => {
        // Reset selección visual de otras cards
        grid
          .querySelectorAll(".service-card")
          .forEach((c) => c.classList.remove("service-card--selected"));
        card.classList.add("service-card--selected");

        loadSlotsForKine(kine.id);
      });

      card.appendChild(btn);
      grid.appendChild(card);
    });

    if (slotsContainer) {
      slotsContainer.innerHTML = `
        <p class="kine-directory__slots-empty">
          Selecciona “Ver horarios” en un servicio.
        </p>
      `;
    }
  }

  /***********************************************************
   * 5) Mostrar perfil en el panel derecho
   ***********************************************************/
  function showKineDetail(k) {
    console.log("Mostrando kine:", k);

    if (detailEmpty) detailEmpty.hidden = true;
    if (detailProfile) detailProfile.hidden = false;

    if (nameEl) nameEl.textContent = k.name;
    if (specialtyEl) specialtyEl.textContent = k.specialty;
    if (boxEl) boxEl.textContent = k.box;
    if (rutEl) rutEl.textContent = k.rut;
    if (descEl) descEl.textContent = k.description;

    if (phoneEl) phoneEl.textContent = k.phone_number;
    if (phoneLinkEl) phoneLinkEl.href = `https://wa.me/56${k.phone_number}`;

    if (emailEl) emailEl.textContent = k.email;
    if (emailLinkEl) emailLinkEl.href = `mailto:${k.email}`;

    if (avatarEl) {
      avatarEl.style.backgroundImage = `url('./img/default-kine.jpg')`;
    }

    renderServices(k);
  }
}




// Ejecutar directorio al cargar
initKineDirectory();

/****************************************************
 *  LOGIN REAL — Conexión correcta al backend Django
 ****************************************************/
function initLoginSystem() {
  const loginForm = document.querySelector("#loginForm");
  if (!loginForm) return;

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.querySelector("#email").value.trim();
    const password = document.querySelector("#password").value.trim();

    try {
      const response = await fetch(`${BASE_URL}api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ email, password }),
      });

    
      if (!response.ok) {
        console.error("Login HTTP error:", response.status);
        alert("Credenciales incorrectas.");
        return;
      }

      const data = await response.json(); // aquí ya es seguro

      console.log("Usuario logeado, podrías ir al siguiente paso", data);

      // Guardar sesión
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirigir al perfil / historial
      window.location.href = "historial.html";
    } catch (err) {
      console.error("Error al iniciar sesión:", err);
      alert("Ocurrió un error al iniciar sesión. Intenta de nuevo.");
    }
  });
}




initLoginSystem();


/***********************************************************
 * DATOS DEL PACIENTE (datos.html) — Mostrar hora elegida
 ***********************************************************/


/***********************************************************
 * DATOS DEL PACIENTE (datos.html)
 ***********************************************************/
function initPatientDataPage() {
  const page = document.body.dataset.page;
  if (page !== "datos") return;

  console.log("Init página DATOS (registro de paciente)");

  // Elementos del formulario
  const rutInput = document.querySelector("[data-patient-rut]");
  const nameInput = document.querySelector("[data-patient-fullname]");
  const emailInput = document.querySelector("[data-patient-email]");
  const phoneInput = document.querySelector("[data-patient-phone]");
  const passwordInput = document.querySelector("[data-patient-password]");
  const passwordConfirmInput = document.querySelector("[data-patient-password-confirm]");
  const submitBtn = document.querySelector("[data-patient-submit]");

  // Spans de error
  const rutError = document.querySelector("[data-rut-error]");
  const nameError = document.querySelector("[data-name-error]");
  const emailError = document.querySelector("[data-email-error]");
  const phoneError = document.querySelector("[data-phone-error]");
  const passwordError = document.querySelector("[data-password-error]");
  const passwordConfirmError = document.querySelector("[data-password-confirm-error]");

  // Elementos del resumen (tarjeta derecha)
  const kineNameEl = document.querySelector("[data-patient-name]");
  const kineRoleEl = document.querySelector("[data-patient-role]");
  const serviceTitleEl = document.querySelector("[data-patient-service]");
  const modalityEl = document.querySelector("[data-patient-modality]");
  const durationEl = document.querySelector("[data-patient-duration]");
  const priceEl = document.querySelector("[data-patient-price]");
  const selectionEl = document.querySelector("[data-patient-selection]");

  /***********************************************************
   * 1) Cargar info de la hora guardada en localStorage
   ***********************************************************/
  try {
    const pendingStr = localStorage.getItem("pendingBooking");
    console.log("pendingBooking en datos.html:", pendingStr);
    if (pendingStr) {
      const pending = JSON.parse(pendingStr);
      console.log("pendingBooking parseado:", pending);

      if (kineNameEl && pending.kinesiologistName) {
        kineNameEl.textContent = pending.kinesiologistName;
      }
      if (kineRoleEl && pending.specialty) {
        kineRoleEl.textContent = pending.specialty;
      }
      if (serviceTitleEl && pending.serviceName) {
        serviceTitleEl.textContent = pending.serviceName;
      }
      if (durationEl && pending.duration) {
        durationEl.textContent = pending.duration;
      }
      if (priceEl && pending.price) {
        priceEl.textContent = pending.price;
      }

      // 👈 AQUÍ ESTABA EL BUG: startTime vs start_time
      const start = pending.startTime || pending.start_time;
      if (selectionEl && pending.date && start) {
        const hora = start.slice(0, 5);
        selectionEl.textContent = `${pending.date} a las ${hora} hrs`;
      }
    }
  } catch (e) {
    console.warn("No se pudo leer pendingBooking:", e);
  }

  /***********************************************************
   * Helper para limpiar errores
   ***********************************************************/
  function clearErrors() {
    [rutError, nameError, emailError, phoneError, passwordError, passwordConfirmError]
      .forEach((el) => {
        if (el) el.textContent = "";
      });
  }

  /***********************************************************
   * 2) Click en "CONFIRMAR HORARIO" (crear cuenta + confirmar)
   ***********************************************************/
  if (submitBtn) {
    submitBtn.addEventListener("click", async () => {
      console.log("CLICK en CONFIRMAR HORARIO");
      clearErrors();

      // a) Validar horario seleccionado
      const rawSelection = localStorage.getItem("pendingBooking");
      if (!rawSelection) {
        alert("Primero selecciona un horario en la pantalla anterior.");
        return;
      }

      let selection;
      try {
        selection = JSON.parse(rawSelection);
      } catch (e) {
        console.error("Error parseando pendingBooking:", e);
        alert("Ocurrió un problema con la hora seleccionada. Vuelve a escogerla.");
        return;
      }

      // b) Validar formulario
      const rut = rutInput?.value.trim() || "";
      const name = nameInput?.value.trim() || "";
      const email = emailInput?.value.trim() || "";
      const phone = phoneInput?.value.trim() || "";
      const password = passwordInput?.value.trim() || "";
      const confirm = passwordConfirmInput?.value.trim() || "";

      let hasError = false;

      if (!rut) {
        hasError = true;
        if (rutError) rutError.textContent = "Ingresa el RUT del paciente.";
      }
      if (!name) {
        hasError = true;
        if (nameError) nameError.textContent = "Ingresa el nombre completo.";
      }
      if (!email) {
        hasError = true;
        if (emailError) emailError.textContent = "Ingresa un correo electrónico.";
      }
      if (!phone) {
        hasError = true;
        if (phoneError) phoneError.textContent = "Ingresa un número de celular.";
      }
      if (!password) {
        hasError = true;
        if (passwordError) passwordError.textContent = "Ingresa una contraseña.";
      }
      if (!confirm) {
        hasError = true;
        if (passwordConfirmError)
          passwordConfirmError.textContent = "Repite la contraseña.";
      }
      if (password && confirm && password !== confirm) {
        hasError = true;
        if (passwordConfirmError)
          passwordConfirmError.textContent = "Las contraseñas no coinciden.";
      }

      if (hasError) return;

      // c) Registrar paciente en el backend
      let response;
      try {
        response = await fetch(BASE_URL + "api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({
            rut,
            name,
            email,
            phone_number: phone,
            password,
          }),
        });
      } catch (err) {
        console.error("Error de red:", err);
        alert("No se pudo contactar con el servidor. Intenta nuevamente.");
        return;
      }

      const raw = await response.clone().text();
      console.log("REGISTER RAW RESPONSE:", raw);

      if (!response.ok) {
        let msg = "Error al crear la cuenta.";
        try {
          const data = JSON.parse(raw);
          if (data.detail) msg = data.detail;
        } catch (e) {}
        alert(msg);
        return;
      }

      let data = {};
      try {
        data = JSON.parse(raw);
      } catch (e) {}

      if (data.token) {
        localStorage.setItem("authToken", data.token);
      }
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      // d) Mensaje de confirmación de reserva 🎉
      const horaBonita =
        (selection.startTime || selection.start_time || "").slice(0, 5);

      alert(
        `¡Reserva creada con éxito!\n\n` +
        `Paciente: ${name}\n` +
        `Fecha: ${selection.date}\n` +
        `Hora: ${horaBonita} hrs`
      );

      // e) Redirigir donde quieras
      window.location.href = "historial.html";
    });
  }
}

/****************************************************
 *  REGISTRO + CONFIRMACIÓN DE HORARIO (datos.html)
 ****************************************************/
async function initRegisterSystem() {
  const registerBtn = document.querySelector("[data-patient-submit]");
  if (!registerBtn) {
    // No estamos en datos.html, salir sin error
    return;
  }

  console.log("initRegisterSystem listo en datos.html ✅");

  registerBtn.addEventListener("click", async () => {
    console.log("CLICK en CONFIRMAR HORARIO");

    // 1) Verificamos que haya un horario pendiente
    const rawSelection = localStorage.getItem("pendingBooking");
    if (!rawSelection) {
      alert("Primero selecciona un horario en la pantalla anterior.");
      return;
    }

    let selection;
    try {
      selection = JSON.parse(rawSelection);
    } catch (e) {
      console.error("Error parseando pendingBooking:", e);
      alert("Ocurrió un problema con la hora seleccionada. Vuelve a escogerla.");
      return;
    }

    // 2) Datos del formulario
    const rut = document.querySelector("[data-patient-rut]").value.trim();
    const name = document.querySelector("[data-patient-fullname]").value.trim();
    const email = document.querySelector("[data-patient-email]").value.trim();
    const phone = document.querySelector("[data-patient-phone]").value.trim();
    const password = document
      .querySelector("[data-patient-password]")
      .value.trim();
    const confirm = document
      .querySelector("[data-patient-password-confirm]")
      .value.trim();

    if (!rut || !name || !email || !phone || !password || !confirm) {
      alert("Por favor completa todos los campos.");
      return;
    }

    if (password !== confirm) {
      alert("Las contraseñas no coinciden.");
      return;
    }

    // 3) Llamada al backend para crear el paciente
    // 🔁 Ajusta la URL si tu endpoint cambió (aquí uso /api/register)
    let response;
    try {
      response = await fetch(BASE_URL + "api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          rut,
          name,
          email,
          phone_number: phone,
          password,
        }),
      });
    } catch (err) {
      console.error("Error de red:", err);
      alert("No se pudo contactar con el servidor. Intenta nuevamente.");
      return;
    }

    if (!response.ok) {
      const txt = await response.text();
      console.error("Error backend registro:", response.status, txt);
      alert("Error al crear la cuenta. Revisa la consola para más detalles.");
      return;
    }

    // 4) Si llegó hasta aquí, mostramos el MENSAJE DE CONFIRMACIÓN 🎉
    const horaBonita = (selection.startTime || selection.start_time || "")
      .slice(0, 5);
    alert(
      `¡Reserva creada con éxito!\n\n` +
        `Paciente: ${name}\n` +
        `Fecha: ${selection.date}\n` +
        `Hora: ${horaBonita} hrs`
    );

    // Opcional: puedes redirigir al historial o al login
    window.location.href = "historial.html";
  });
}


/***********************************************************
 * HISTORIAL (historial.html)
 ***********************************************************/
function initPatientHistoryPage() {
  const page = document.body.dataset.page;
  if (page !== "historial") return;

  const rawUser = localStorage.getItem("user");
  const token = localStorage.getItem("authToken");

 
  if (!rawUser || !token) {
    if (!window.location.href.includes("ingreseAqui.html")) {
      window.location.href = "ingreseAqui.html";
    }
    return;
  }

  const user = JSON.parse(rawUser);

  const nameEl = document.querySelector("[data-profile-name]");
  const subtitleEl = document.querySelector("[data-profile-subtitle]");
  const rutEl = document.querySelector("[data-profile-rut]");
  const emailEl = document.querySelector("[data-profile-email]");
  const phoneEl = document.querySelector("[data-profile-phone]");

  if (nameEl) {
    nameEl.textContent =
      user.name ||
      user.full_name ||
      user.username ||
      user.email ||
      "Paciente";
  }

  if (subtitleEl) {
    subtitleEl.textContent = "Paciente registrado";
  }

  if (rutEl && user.rut) {
    rutEl.textContent = user.rut;
  }
  if (emailEl && user.email) {
    emailEl.textContent = user.email;
  }
  if (phoneEl && user.phone_number) {
    phoneEl.textContent = user.phone_number;
  }

  const navUserEl = document.querySelector("[data-nav-username]");
  if (navUserEl) {
    const firstName =
      (user.name || user.full_name || "").split(" ")[0] || user.email;
    navUserEl.textContent = `Hola, ${firstName}`;
  }
}




function getCurrentUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}



window.updateAuthUI = function () {
  const loginLink = document.querySelector("[data-auth-link]");
  const labelSpan = document.querySelector("[data-auth-label]");
  const userSpan  = document.querySelector("[data-auth-user]");

  // Si esta página no tiene header con estos elementos, salimos.
  if (!loginLink || !labelSpan || !userSpan) {
    return;
  }

  const token   = localStorage.getItem("authToken");
  const rawUser = localStorage.getItem("user");

  if (token && rawUser) {
    // === Usuario logeado ===
    let name = "Paciente";
    try {
      const user = JSON.parse(rawUser);
      // Ajusta las propiedades según tu backend
      name = user.name || user.full_name || user.email || name;
    } catch (e) {
      console.warn("No se pudo parsear user desde localStorage:", e);
    }

    labelSpan.textContent = "Cerrar sesión";
    userSpan.textContent  = `Hola, ${name}`;

    loginLink.href = "#";
    loginLink.onclick = (ev) => {
      ev.preventDefault();
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      // Después de cerrar sesión volvemos al login
      window.location.href = "ingreseAqui.html";
    };
  } else {
    // === Invitado / no logeado ===
    labelSpan.textContent = "Ingresar";
    userSpan.textContent  = "Invitado";

    loginLink.href = "ingreseAqui.html";
    loginLink.onclick = null;
  }
};


// DOM 
document.addEventListener("DOMContentLoaded", () => {
  if (typeof updateAuthUI === "function") updateAuthUI();
  if (typeof initLoginSystem === "function") initLoginSystem();
  if (typeof initKineDirectory === "function") initKineDirectory();
  if (typeof initPatientDataPage === "function") initPatientDataPage();
  if (typeof initPatientHistoryPage === "function") initPatientHistoryPage();
});



