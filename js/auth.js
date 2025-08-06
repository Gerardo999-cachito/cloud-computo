const SUPABASE_URL = "https://vtjqtpoaclxuyljzvmny.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0anF0cG9hY2x4dXlsanp2bW55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDQyNzUsImV4cCI6MjA3MDA4MDI3NX0.Ro2ed6bwMGML65AraIHZRsGURW5psGdW_KSCiRFXHsk";

const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function register() {
  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password").value;

  if (!email || !password) {
    alert("Por favor completa todos los campos.");
    return;
  }

  const { error } = await client.auth.signUp({ email, password });

  if (error) {
    alert("Error: " + error.message);
  } else {
    alert("Registro exitoso. Revisa tu correo.");
    toggleForms();
  }
}

async function login() {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  if (!email || !password) {
    alert("Por favor completa todos los campos.");
    return;
  }

  const { data, error } = await client.auth.signInWithPassword({ email, password });

  if (error) {
    alert("Error: " + error.message);
  } else {
    alert("Sesión iniciada.");
    localStorage.setItem("token", data.session.access_token);
    window.location.href = "dashboard.html"; // redirige al dashboard
  }
}

function toggleForms(event) {
  if (event) event.preventDefault();
  document.getElementById('login-form-card').classList.toggle('hidden');
  document.getElementById('register-form-card').classList.toggle('hidden');
}
