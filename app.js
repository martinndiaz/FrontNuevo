/***********************************************************
 *  KINE DIRECTORY — Conexión real al backend Django
 ***********************************************************/

import { BASE_URL } from "./api.js";

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

  // NUEVO: contenedor para los horarios (si existe)
  const slotsContainer = directoryRoot.querySelector("[data-kine-slots]");

  // Mostrar loader
  placeholder.style.display = "flex";

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
    placeholder.innerHTML = "<p>Error al cargar los profesionales.</p>";
    return;
  }

  // Ocultar loader
  placeholder.style.display = "none";
  listEl.innerHTML = ""; // limpiar

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
   * Función para cargar HORARIOS del kinesiólogo
   * (usa endpoint: GET /api/kinesiologists/<id>/slots/?date=YYYY-MM-DD)
   ***********************************************************/
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

    // YYYY-MM-DD para el endpoint
    const iso = d.toISOString().slice(0, 10);

    // Etiqueta tipo "Lun 15"
    const label = `${WEEK_DAYS[d.getDay()]} ${d.getDate()}`;

    days.push({ iso, label });
  }

  try {
    // Pido los slots de TODOS esos días en paralelo
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

    // Uno fechas + slots
    const weekSlots = days.map((info, idx) => ({
      ...info,
      slots: results[idx],
    }));

    // Dibujo la grilla semanal
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

          // slot.start_time viene tipo "09:00:00" → me quedo con "09:00"
          const hora = slot.start_time.slice(0, 5);

          btn.textContent = hora;

          // Marcar seleccionado
          btn.addEventListener("click", () => {
            list
              .querySelectorAll(".slot-pill")
              .forEach((b) => b.classList.remove("slot-pill--selected"));
            btn.classList.add("slot-pill--selected");
            // Aquí después vas a disparar el POST para crear la cita 😉
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
   * 3) Mostrar perfil en el panel derecho
   ***********************************************************/
  function showKineDetail(k) {
  console.log("Mostrando kine:", k);

  if (detailEmpty) {
    detailEmpty.hidden = true;
  }
  if (detailProfile) {
    detailProfile.hidden = false;
  }

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

  if (slotsContainer) {
    loadSlotsForKine(k.id);
  }
}
}

// Ejecutar directorio al cargar
initKineDirectory();

/****************************************************
 *  LOGIN REAL — Conexión correcta al backend Django
 ****************************************************/
async function initLoginSystem() {
  const loginForm = document.querySelector("#loginForm");
  if (!loginForm) return;

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.querySelector("#email").value.trim();
    const password = document.querySelector("#password").value.trim();

    const response = await fetch(BASE_URL + "api/auth/login/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      alert("Credenciales incorrectas");
      return;
    }

    const data = await response.json();

    // Guardar sesión
    localStorage.setItem("authToken", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    // Redirigir
    window.location.href = "agendar.html";
  });
}

initLoginSystem();

/****************************************************
 *  REGISTRO REAL — Crear cuenta en Django
 ****************************************************/
async function initRegisterSystem() {
  const registerBtn = document.querySelector("[data-patient-submit]");
  if (!registerBtn) {
    console.warn("Botón de registro no encontrado todavía");
    return;
  }

  registerBtn.addEventListener("click", async () => {
    console.log("CLICK DETECTADO"); // <<< prueba

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

    if (password !== confirm) {
      alert("Las contraseñas no coinciden.");
      return;
    }

    const response = await fetch(BASE_URL + "api/patient/auth/register/", {
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

    console.log("RESPONSE STATUS:", response.status);
    console.log("RAW RESP:", await response.clone().text());

    if (!response.ok) {
      alert("Error al crear la cuenta.");
      return;
    }

    alert("Cuenta creada correctamente. Puedes iniciar sesión.");
    window.location.href = "ingreseAqui.html";
  });
}

// 🚀 INICIALIZAR SOLO CUANDO EL DOM ESTÉ LISTO
document.addEventListener("DOMContentLoaded", initRegisterSystem);
