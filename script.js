// ============================================================
//  SUPABASE BAĞLANTI BİLGİLERİ
// ============================================================
const SUPABASE_URL = "https://crotxfqveixgqajjuarv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyb3R4ZnF2ZWl4Z3Fhamp1YXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MDQ1NzIsImV4cCI6MjA5NjA4MDU3Mn0.MCK8QWabiWRTRyPfj7hqGzLzX9HCJQ0NOTaq9Ecdig8";

// NOT: Kendi değişkenimize "db" diyoruz; "supabase" adı kütüphaneye ait.
let db = null;

// ============================================================
//  HTML ELEMANLARI
// ============================================================
// Giriş / kayıt
const authView = document.getElementById("auth-view");
const authForm = document.getElementById("auth-form");
const authEmail = document.getElementById("auth-email");
const authPassword = document.getElementById("auth-password");
const signupBtn = document.getElementById("signup-btn");
const authMessage = document.getElementById("auth-message");

// Uygulama
const appView = document.getElementById("app-view");
const userEmail = document.getElementById("user-email");
const logoutBtn = document.getElementById("logout-btn");
const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const countEl = document.getElementById("count");
const clearBtn = document.getElementById("clear-completed");
const filterBtns = document.querySelectorAll(".filter-btn");

let todos = [];
let filter = "all";

// Onay mailindeki bağlantının geri döneceği adres (bu sayfanın kendisi)
const REDIRECT_URL = window.location.origin + window.location.pathname;

// ============================================================
//  GİRİŞ/KAYIT EKRANINDA MESAJ GÖSTERME
// ============================================================
function showAuthMessage(text, type) {
  authMessage.textContent = text;
  authMessage.className = "auth-message" + (text ? " show " + type : "");
}

// Türkçeleştirilmiş bazı yaygın hata mesajları
function translateError(message) {
  if (!message) return "Bir hata oluştu.";
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "E-posta veya şifre hatalı.";
  if (m.includes("email not confirmed"))
    return "E-postanı henüz onaylamamışsın. Gelen kutundaki onay bağlantısına tıkla.";
  if (m.includes("user already registered"))
    return "Bu e-posta zaten kayıtlı. Giriş yapmayı dene.";
  if (m.includes("password should be at least"))
    return "Şifre en az 6 karakter olmalı.";
  return message;
}

// ============================================================
//  GÖRÜNÜMÜ AYARLA (giriş yapılmışsa uygulama, değilse giriş ekranı)
// ============================================================
function updateView(session) {
  if (session && session.user) {
    authView.classList.add("hidden");
    appView.classList.remove("hidden");
    userEmail.textContent = session.user.email;
    loadTodos();
  } else {
    appView.classList.add("hidden");
    authView.classList.remove("hidden");
    todos = [];
  }
}

// ============================================================
//  GİRİŞ / KAYIT / ÇIKIŞ
// ============================================================

// Giriş yap (form gönderimi)
authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!db) return;
  showAuthMessage("Giriş yapılıyor...", "success");

  const { error } = await db.auth.signInWithPassword({
    email: authEmail.value.trim(),
    password: authPassword.value,
  });

  if (error) {
    showAuthMessage(translateError(error.message), "error");
  } else {
    showAuthMessage("", "");
  }
  // Başarılıysa onAuthStateChange görünümü otomatik değiştirir.
});

// Kaydol
signupBtn.addEventListener("click", async () => {
  if (!db) return;
  const email = authEmail.value.trim();
  const password = authPassword.value;

  if (!email || password.length < 6) {
    showAuthMessage("Geçerli bir e-posta ve en az 6 karakterli şifre gir.", "error");
    return;
  }

  showAuthMessage("Kayıt oluşturuluyor...", "success");

  const { data, error } = await db.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: REDIRECT_URL },
  });

  if (error) {
    showAuthMessage(translateError(error.message), "error");
    return;
  }

  // Onay maili gönderildi; kullanıcı linke tıklayana kadar oturum açılmaz.
  showAuthMessage(
    "✅ Kayıt alındı! " + email + " adresine bir onay maili gönderdik. " +
      "Maildeki bağlantıya tıkladıktan sonra giriş yapabilirsin.",
    "success"
  );
});

// Çıkış
logoutBtn.addEventListener("click", async () => {
  if (db) await db.auth.signOut();
});

// ============================================================
//  SUPABASE İSTEMCİSİNİ OLUŞTUR VE OTURUMU İZLE
// ============================================================
if (!window.supabase || typeof window.supabase.createClient !== "function") {
  showAuthMessage(
    "Supabase kütüphanesi yüklenemedi. İnternet bağlantını veya reklam engelleyiciyi kontrol et.",
    "error"
  );
} else {
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Açılışta mevcut oturumu kontrol et
  db.auth.getSession().then(({ data }) => updateView(data.session));

  // Giriş/çıkış/onay sonrası görünümü otomatik güncelle
  db.auth.onAuthStateChange((_event, session) => updateView(session));
}

// ============================================================
//  TODO OLAY DİNLEYİCİLERİ
// ============================================================
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text || !db) return;
  addTodo(text);
  input.value = "";
  input.focus();
});

clearBtn.addEventListener("click", () => {
  if (db) clearCompleted();
});

filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    filter = btn.dataset.filter;
    render();
  });
});

// ============================================================
//  VERİTABANI İŞLEMLERİ (RLS sayesinde sadece kendi görevleri)
// ============================================================
async function loadTodos() {
  const { data, error } = await db
    .from("todos")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("Görevler yüklenemedi:", error.message);
    return;
  }
  todos = data;
  render();
}

async function addTodo(text) {
  const { error } = await db
    .from("todos")
    .insert({ text: text, completed: false });

  if (error) {
    console.error("Eklenemedi:", error.message);
    return;
  }
  loadTodos();
}

async function toggle(id, currentValue) {
  const { error } = await db
    .from("todos")
    .update({ completed: !currentValue })
    .eq("id", id);

  if (error) {
    console.error("Güncellenemedi:", error.message);
    return;
  }
  loadTodos();
}

async function remove(id) {
  const { error } = await db.from("todos").delete().eq("id", id);

  if (error) {
    console.error("Silinemedi:", error.message);
    return;
  }
  loadTodos();
}

async function clearCompleted() {
  const { error } = await db.from("todos").delete().eq("completed", true);

  if (error) {
    console.error("Silinemedi:", error.message);
    return;
  }
  loadTodos();
}

// ============================================================
//  EKRANA ÇİZME
// ============================================================
function render() {
  list.innerHTML = "";

  const visible = todos.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  if (visible.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "Görev yok 🎉";
    list.appendChild(li);
  }

  visible.forEach((todo) => {
    const li = document.createElement("li");
    li.className = "todo-item" + (todo.completed ? " completed" : "");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.completed;
    checkbox.addEventListener("change", () => toggle(todo.id, todo.completed));

    const span = document.createElement("span");
    span.className = "text";
    span.textContent = todo.text;

    const del = document.createElement("button");
    del.className = "delete";
    del.innerHTML = "&times;";
    del.title = "Sil";
    del.addEventListener("click", () => remove(todo.id));

    li.append(checkbox, span, del);
    list.appendChild(li);
  });

  const remaining = todos.filter((t) => !t.completed).length;
  countEl.textContent = `${remaining} görev kaldı`;
}
