const SUPABASE_URL = "https://vtjqtpoaclxuyljzvmny.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0anF0cG9hY2x4dXlsanp2bW55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDQyNzUsImV4cCI6MjA3MDA4MDI3NX0.Ro2ed6bwMGML65AraIHZRsGURW5psGdW_KSCiRFXHsk";
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let controladorCarga = null;

async function agregarEstudiante() {
  const nombre = document.getElementById("nombre")?.value;
  const correo = document.getElementById("correo")?.value;
  const clase = document.getElementById("clase")?.value;

  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) {
    alert("No estás autenticado.");
    return;
  }

  const { error } = await client.from("estudiantes").insert({
    nombre,
    correo,
    clase,
    user_id: user.id,
  });

  if (error) {
    alert("Error al agregar: " + error.message);
  } else {
    alert("Estudiante agregado correctamente.");
    cargarEstudiantes();
  }
}

async function cargarEstudiantes() {
  const { data, error } = await client
    .from("estudiantes")
    .select("*")
    .order("created_at", { ascending: false });

  const lista = document.getElementById("lista-estudiantes");
  if (!lista) return;

  lista.innerHTML = "";

  if (error) {
    alert("Error al cargar estudiantes: " + error.message);
    return;
  }

  data.forEach((est) => {
    const item = document.createElement("li");
    item.textContent = `${est.nombre} (${est.clase})`;
    lista.appendChild(item);
  });
}

function mostrarBotonCancelar() {
  const archivoInput = document.getElementById("archivo");
  const cancelarBtn = document.getElementById("cancelarBtn");

  if (archivoInput.files.length > 0) {
    cancelarBtn.style.display = "inline-block";
  } else {
    cancelarBtn.style.display = "none";
  }
}

async function subirArchivo() {
  const archivoInput = document.getElementById("archivo");
  const archivo = archivoInput?.files[0];
  const cancelarBtn = document.getElementById("cancelarBtn");

  if (!archivo) {
    alert("Selecciona un archivo.");
    return;
  }

  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) {
    alert("Sesión no válida.");
    return;
  }

  cancelarBtn.style.display = "inline-block";
  controladorCarga = new AbortController();
  const signal = controladorCarga.signal;

  const nombreRuta = `${user.id}/${archivo.name}`;

  try {
    const { error } = await client.storage
      .from("tareas") // Asegúrate de que este bucket existe en Supabase
      .upload(nombreRuta, archivo, {
        cacheControl: "3600",
        upsert: false,
        signal: signal
      });

    if (error) {
      if (error.name === "AbortError") {
        alert("Carga cancelada.");
      } else {
        alert("Error al subir: " + error.message);
      }
    } else {
      alert("Archivo subido correctamente.");
      listarArchivos();
    }
  } catch (e) {
    if (e.name === "AbortError") {
      alert("Carga cancelada por el usuario.");
    } else {
      alert("Error inesperado.");
      console.error(e);
    }
  } finally {
    cancelarBtn.style.display = "none";
    archivoInput.value = ""; // Limpiar input
    controladorCarga = null;
  }
}

function cancelarCarga() {
  if (controladorCarga) {
    controladorCarga.abort();
  }

  const archivoInput = document.getElementById("archivo");
  archivoInput.value = ""; // Elimina archivo seleccionado
  document.getElementById("cancelarBtn").style.display = "none";
}

async function listarArchivos() {
  const { data: { user }, error: userError } = await client.auth.getUser();
  const lista = document.getElementById("lista-archivos");
  if (!lista) return;

  lista.innerHTML = "";

  if (userError || !user) {
    lista.innerHTML = "<li>Sesión no válida.</li>";
    return;
  }

  const { data, error } = await client.storage
    .from("tareas")
    .list(`${user.id}`, { limit: 20 });

  if (error) {
    lista.innerHTML = "<li>Error al listar archivos</li>";
    return;
  }

  for (const archivo of data) {
    const { data: signedUrlData, error: signedUrlError } = await client.storage
      .from("tareas")
      .createSignedUrl(`${user.id}/${archivo.name}`, 60);

    if (signedUrlError) continue;

    const publicUrl = signedUrlData.signedUrl;
    const item = document.createElement("li");

    const esImagen = /\.(jpg|jpeg|png|gif)$/i.test(archivo.name);
    const esPDF = /\.pdf$/i.test(archivo.name);

    if (esImagen) {
      item.innerHTML = `
        <strong>${archivo.name}</strong><br>
        <a href="${publicUrl}" target="_blank">
          <img src="${publicUrl}" width="150" style="border:1px solid #ccc; margin:5px;" />
        </a>`;
    } else if (esPDF) {
      item.innerHTML = `
        <strong>${archivo.name}</strong><br>
        <a href="${publicUrl}" target="_blank">Ver PDF</a>`;
    } else {
      item.innerHTML = `<a href="${publicUrl}" target="_blank">${archivo.name}</a>`;
    }

    lista.appendChild(item);
  }
}

async function cerrarSesion() {
  const { error } = await client.auth.signOut();
  if (error) {
    alert("Error al cerrar sesión: " + error.message);
  } else {
    localStorage.removeItem("token");
    alert("Sesión cerrada.");
    window.location.href = "index.html";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  cargarEstudiantes();
  listarArchivos();
});
