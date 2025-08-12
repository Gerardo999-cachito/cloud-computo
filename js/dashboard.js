const SUPABASE_URL = "https://vtjqtpoaclxuyljzvmny.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0anF0cG9hY2x4dXlsanp2bW55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDQyNzUsImV4cCI6MjA3MDA4MDI3NX0.Ro2ed6bwMGML65AraIHZRsGURW5psGdW_KSCiRFXHsk";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function agregarEstudiante() {
  const nombre = document.getElementById("nombre").value;
  const correo = document.getElementById("correo").value;
  const clase = document.getElementById("clase").value;

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
    limpiarFormulario();
  }
}

function limpiarFormulario() {
  document.getElementById("nombre").value = "";
  document.getElementById("correo").value = "";
  document.getElementById("clase").value = "";
}

async function cargarEstudiantes() {
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError || !user) {
    alert("No estás autenticado.");
    return;
  }

  const { data, error } = await client
    .from("estudiantes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    alert("Error al cargar estudiantes: " + error.message);
    return;
  }

  const lista = document.getElementById("lista-estudiantes");
  lista.innerHTML = "";

  data.forEach((est) => {
    const item = document.createElement("li");
    item.innerHTML = `
      ${est.nombre} (${est.clase}) - ${est.correo} 
      <button onclick="mostrarEditar(${est.id}, '${escape(est.nombre)}', '${escape(est.correo)}', '${escape(est.clase)}')">Editar</button> 
      <button onclick="eliminarEstudiante(${est.id})">Eliminar</button>
    `;
    lista.appendChild(item);
  });
}

function mostrarEditar(id, nombre, correo, clase) {
  nombre = unescape(nombre);
  correo = unescape(correo);
  clase = unescape(clase);

  document.getElementById("nombre").value = nombre;
  document.getElementById("correo").value = correo;
  document.getElementById("clase").value = clase;

  // Cambiar botón agregar por editar
  const btnAgregar = document.getElementById("btnAgregar");
  btnAgregar.style.display = "none";

  const btnEditar = document.getElementById("btnEditar");
  btnEditar.style.display = "inline";
  btnEditar.dataset.id = id; // guardamos id para editar
}

async function editarEstudiante() {
  const id = this.dataset.id;
  const nuevoNombre = document.getElementById("nombre").value;
  const nuevoCorreo = document.getElementById("correo").value;
  const nuevaClase = document.getElementById("clase").value;

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError || !user) {
    alert("No estás autenticado.");
    return;
  }

  const { error } = await client
    .from("estudiantes")
    .update({
      nombre: nuevoNombre,
      correo: nuevoCorreo,
      clase: nuevaClase,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    alert("Error al editar: " + error.message);
  } else {
    alert("Estudiante editado correctamente");
    cargarEstudiantes();
    limpiarFormulario();
    // Restaurar botones
    document.getElementById("btnEditar").style.display = "none";
    document.getElementById("btnAgregar").style.display = "inline";
  }
}

async function eliminarEstudiante(id) {
  if (!confirm("¿Seguro que quieres eliminar este estudiante?")) return;

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError || !user) {
    alert("No estás autenticado.");
    return;
  }

  const { error } = await client
    .from("estudiantes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    alert("Error al eliminar: " + error.message);
  } else {
    alert("Estudiante eliminado");
    cargarEstudiantes();
  }
}

async function subirArchivo() {
  const archivoInput = document.getElementById("archivo");
  const archivo = archivoInput.files[0];

  if (!archivo) {
    alert("Selecciona un archivo primero.");
    return;
  }

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError || !user) {
    alert("Sesión no válida.");
    return;
  }

  const nombreRuta = `${user.id}/${archivo.name}`;
  const { data, error } = await client.storage
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

async function listarArchivos() {
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError || !user) {
    alert("Sesión no válida.");
    return;
  }

  const { data, error } = await client.storage
    .from("tareas")
    .list(`${user.id}`, { limit: 20 });

  const lista = document.getElementById("lista-archivos");
  lista.innerHTML = "";

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

    const esImagen = archivo.name.match(/\.(jpg|jpeg|png|gif)$/i);
    const esPDF = archivo.name.match(/\.pdf$/i);

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

// Asignar evento para editar (se llama desde el botón "Editar" creado dinámicamente)
document.getElementById("btnEditar").addEventListener("click", editarEstudiante);

// Carga inicial
cargarEstudiantes();
listarArchivos();
