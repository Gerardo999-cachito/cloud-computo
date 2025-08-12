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
  btnEditar.setAttribute("data-id", id);  // <-- importante usar setAttribute

  document.getElementById("btnCancelarEdicion").style.display = "inline";

  document.getElementById("form-title").textContent = "Editar estudiante";
}

async function editarEstudiante() {
  const btnEditar = document.getElementById("btnEditar");
  const id = btnEditar.getAttribute("data-id");  // <-- obtiene id con getAttribute

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

async function cerrarSesion() {
  const { error } = await client.auth.signOut();

  if (error) {
    alert("Error al cerrar sesión: " + error.message);
  } else {
    alert("Sesión cerrada.");
    window.location.href = "index.html";
  }
}

// Event listeners
document.getElementById("btnEditar").addEventListener("click", editarEstudiante);
document.getElementById("btnCancelarEdicion").addEventListener("click", () => {
  limpiarFormulario();
  document.getElementById("form-title").textContent = "Registrar estudiante";
  document.getElementById("btnAgregar").style.display = "inline";
  document.getElementById("btnEditar").style.display = "none";
  document.getElementById("btnCancelarEdicion").style.display = "none";
  document.getElementById("btnEditar").removeAttribute("data-id");
});

// Inicializar lista de estudiantes
cargarEstudiantes();
