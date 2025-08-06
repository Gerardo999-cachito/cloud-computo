const SUPABASE_URL = "https://vtjqtpoaclxuyljzvmny.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."; // recorta aquí si compartes en público

const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Agrega un nuevo estudiante
async function agregarEstudiante() {
  const nombreInput = document.getElementById("nombre");
  const correoInput = document.getElementById("correo");
  const claseInput = document.getElementById("clase");

  if (!nombreInput || !correoInput || !claseInput) {
    alert("Campos no encontrados en el DOM.");
    return;
  }

  const nombre = nombreInput.value;
  const correo = correoInput.value;
  const clase = claseInput.value;

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

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
    alert("Estudiante agregado");
    cargarEstudiantes();
  }
}

// Cargar lista de estudiantes
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

// Subir archivo al bucket
async function subirArchivo() {
  const archivoInput = document.getElementById("archivo");
  if (!archivoInput || !archivoInput.files.length) {
    alert("Selecciona un archivo primero.");
    return;
  }

  const archivo = archivoInput.files[0];

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError || !user) {
    alert("Sesión no válida.");
    return;
  }

  const nombreRuta = `${user.id}/${archivo.name}`;
  const { error } = await client.storage
    .from("tareas")
    .upload(nombreRuta, archivo, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    alert("Error al subir: " + error.message);
  } else {
    alert("Archivo subido correctamente.");
    listarArchivos();
  }
}

// Listar archivos del usuario autenticado
async function listarArchivos() {
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

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

    if (signedUrlError) {
      console.error("Error al generar URL firmada:", signedUrlError.message);
      continue;
    }

    const publicUrl = signedUrlData.signedUrl;
    const item = document.createElement("li");

    const esImagen = /\.(jpg|jpeg|png|gif)$/i.test(archivo.name);
    const esPDF = /\.pdf$/i.test(archivo.name);

    if (esImagen) {
      item.innerHTML = `
        <strong>${archivo.name}</strong><br>
        <a href="${publicUrl}" target="_blank">
          <img src="${publicUrl}" width="150" style="border:1px solid #ccc; margin:5px;" />
        </a>
      `;
    } else if (esPDF) {
      item.innerHTML = `
        <strong>${archivo.name}</strong><br>
        <a href="${publicUrl}" target="_blank">Ver PDF</a>
      `;
    } else {
      item.innerHTML = `<a href="${publicUrl}" target="_blank">${archivo.name}</a>`;
    }

    lista.appendChild(item);
  }
}

// Cerrar sesión
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

// Llamadas iniciales
document.addEventListener("DOMContentLoaded", () => {
  cargarEstudiantes();
  listarArchivos();
});
