import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://vtjqtpoaclxuyljzvmny.supabase.co",
  "TU_CLAVE_PUBLICA_AQUI" // Reemplaza con tu clave pública de Supabase
);

let uploadTask = null; // referencia para cancelar subida (si decides usarla después)

document.getElementById("formulario").addEventListener("submit", async function (e) {
  e.preventDefault();

  const archivoInput = document.getElementById("archivo");
  const archivo = archivoInput?.files[0];
  const clase = document.getElementById("clase").value;
  const user = supabase.auth.user();

  if (!archivo || !clase || !user) {
    alert("Faltan datos para subir el archivo.");
    return;
  }

  // Sanear el nombre del archivo
  const nombreSeguro = archivo.name.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // elimina acentos
    .replace(/[^\w.\-]+/g, "_");     // reemplaza caracteres especiales por "_"

  const nombreRuta = `${user.id}/${nombreSeguro}`;

  // Subir a Supabase Storage
  const { data, error } = await supabase.storage
    .from("archivos")
    .upload(nombreRuta, archivo, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    alert("Error al subir: " + error.message);
    return;
  }

  // Guardar metadata en tabla "estudiantes"
  const { error: insertError } = await supabase.from("estudiantes").insert([
    {
      user_id: user.id,
      clase: clase,
      archivo_url: nombreRuta,
    },
  ]);

  if (insertError) {
    alert("Error al agregar: " + insertError.message);
    return;
  }

  mostrarArchivos();
});

async function mostrarArchivos() {
  const lista = document.getElementById("lista-archivos");
  lista.innerHTML = "";

  const user = supabase.auth.user();
  const { data, error } = await supabase
    .from("estudiantes")
    .select("*")
    .eq("user_id", user.id);

  if (error) {
    lista.innerHTML = "Error al cargar archivos.";
    return;
  }

  for (const archivo of data) {
    const { data: urlData } = supabase.storage
      .from("archivos")
      .getPublicUrl(archivo.archivo_url);

    const publicUrl = urlData.publicUrl;
    const fileName = archivo.archivo_url.split("/").pop();
    const esImagen = /\.(jpg|jpeg|png|gif)$/i.test(fileName);
    const esPDF = /\.pdf$/i.test(fileName);
    const esDOCX = /\.docx$/i.test(fileName);

    const item = document.createElement("div");
    item.style.marginBottom = "10px";

    if (esImagen) {
      item.innerHTML = `
        <strong>${fileName}</strong><br>
        <a href="${publicUrl}" target="_blank">
          <img src="${publicUrl}" width="150" style="border:1px solid #ccc; margin:5px;" />
        </a>`;
    } else if (esPDF) {
      item.innerHTML = `
        <strong>${fileName}</strong><br>
        <a href="${publicUrl}" target="_blank">📄 Ver PDF</a>`;
    } else if (esDOCX) {
      item.innerHTML = `
        <strong>${fileName}</strong><br>
        <a href="${publicUrl}" target="_blank">📄 Ver documento Word</a>`;
    } else {
      item.innerHTML = `
        <strong>${fileName}</strong><br>
        <a href="${publicUrl}" target="_blank">${fileName}</a>`;
    }

    lista.appendChild(item);
  }
}

mostrarArchivos();
