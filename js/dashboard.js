const SUPABASE_URL = "https://vtjqtpoaclxuyljzvmny.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0anF0cG9hY2x4dXlsanp2bW55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDQyNzUsImV4cCI6MjA3MDA4MDI3NX0.Ro2ed6bwMGML65AraIHZRsGURW5psGdW_KSCiRFXHsk";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function agregarEstudiante() {
  const nombre = document.getElementById("nombre").value;
  const correo = document.getElementById("correo").value;
  const clase = document.getElementById("clase").value;

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
    alert("Estudiante agregado");
    cargarEstudiantes();
    limpiarFormulario();
  }
}

function limpiarFormulario() {
  document.getElementById("nombre").value = "";
  document.getElementById("correo").value = "";
  document.getElementById("clase").value = "";
  // Limpiar input archivo si quieres:
  const archivoInput = document.getElementById("archivo");
  if(archivoInput) archivoInput.value = "";
}

async function cargarEstudiantes() {
  const { data: { user }, error: userError } = await client.auth.getUser();

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
    item.textContent = `${est.nombre} (${est.clase}) - ${est.correo} `;

    const btnEditar = document.createElement("button");
    btnEditar.textContent = "Editar";
    btnEditar.onclick = () => mostrarEditar(est.id, est.nombre, est.correo, est.clase);

    const btnEliminar = document.createElement("button");
    btnEliminar.textContent = "Eliminar";
    btnEliminar.onclick = () => eliminarEstudiante(est.id);

    item.appendChild(btnEditar);
    item.appendChild(document.createTextNode(" "));
    item.appendChild(btnEliminar);

    lista.appendChild(item);
  });
}

function mostrarEditar(id, nombre, correo, clase) {
  document.getElementById("nombre").value = nombre;
  document.getElementById("correo").value = correo;
  document.getElementById("clase").value = clase;

  document.getElementById("btnAgregar").style.display = "none";

  const btnEditar = document.getElementById("btnEditar");
  btnEditar.style.display = "inline";
  btnEditar.setAttribute("data-id", id);

  document.getElementById("btnCancelarEdicion").style.display = "inline";

  document.getElementById("form-title").textContent = "Editar estudiante";
}

async function editarEstudiante() {
  const btnEditar = document.getElementById("btnEditar");
  const id = btnEditar.getAttribute("data-id");

  if (!id) {
    alert("No hay estudiante seleccionado para editar.");
    return;
  }

  const nuevoNombre = document.getElementById("nombre").value;
  const nuevoCorreo = document.getElementById("correo").value;
  const nuevaClase = document.getElementById("clase").value;

  const { data: { user }, error: userError } = await client.auth.getUser();

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

    btnEditar.style.display = "none";
    document.getElementById("btnAgregar").style.display = "inline";
    document.getElementById("btnCancelarEdicion").style.display = "none";
    document.getElementById("form-title").textContent = "Registrar estudiante";
    btnEditar.removeAttribute("data-id");
  }
}

async function eliminarEstudiante(id) {
  if (!confirm("¿Seguro que quieres eliminar este estudiante?")) return;

  const { data: { user }, error: userError } = await client.auth.getUser();

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

  const { data: { user }, error: userError } = await client.auth.getUser();

  if (userError || !user) {
    alert("Sesión no válida.");
    return;
  }

  const nombreRuta = `${user.id}/${Date.now()}_${archivo.name}`;

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
    archivoInput.value = ""; // limpiar input
  }
}

async function listarArchivos() {
  const { data: { user }, error: userError } = await client.auth.getUser();

  if (userError || !user) {
    alert("Sesión no válida.");
    return;
  }

  const { data, error } = await client.storage
    .from("tareas")
    .list(user.id, { limit: 100, offset: 0 });

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
    alert("Sesión cerrada.");
    window.location.href = "index.html";
  }
}

// Eventos
document.getElementById("btnEditar").addEventListener("click", editarEstudiante);
document.getElementById("btnCancelarEdicion").addEventListener("click", () => {
  limpiarFormulario();
  document.getElementById("form-title").textContent = "Registrar estudiante";
  document.getElementById("btnAgregar").style.display = "inline";
  document.getElementById("btnEditar").style.display = "none";
  document.getElementById("btnCancelarEdicion").style.display = "none";
  document.getElementById("btnEditar").removeAttribute("data-id");
});

// Carga inicial
cargarEstudiantes();
listarArchivos();
