// ============================================================
//  SUPABASE BAĞLANTI BİLGİLERİ
// ============================================================
const SUPABASE_URL = "https://crotxfqveixgqajjuarv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyb3R4ZnF2ZWl4Z3Fhamp1YXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MDQ1NzIsImV4cCI6MjA5NjA4MDU3Mn0.MCK8QWabiWRTRyPfj7hqGzLzX9HCJQ0NOTaq9Ecdig8";

// ============================================================
//  HTML ELEMANLARI
// ============================================================
const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const countEl = document.getElementById("count");
const clearBtn = document.getElementById("clear-completed");
const filterBtns = document.querySelectorAll(".filter-btn");

let todos = [];
let filter = "all";

// ============================================================
//  EKRANDA HATA/DURUM GÖSTERME (dev-tools açmana gerek kalmasın)
// ============================================================
function showStatus(message, isError) {
  let bar = document.getElementById("status-bar");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "status-bar";
    document.querySelector(".container").prepend(bar);
  }
  bar.textContent = message;
  bar.style.display = message ? "block" : "none";
  bar.style.background = isError ? "#fdecea" : "#eafaf1";
  bar.style.color = isError ? "#c0392b" : "#1e8449";
  bar.style.padding = message ? "10px 12px" : "0";
  bar.style.borderRadius = "8px";
  bar.style.marginBottom = message ? "16px" : "0";
  bar.style.fontSize = "13px";
}

// ============================================================
//  SUPABASE İSTEMCİSİNİ GÜVENLİ ŞEKİLDE OLUŞTUR
// ============================================================
// NOT: Değişken adını "db" yaptık. Kütüphane "supabase" adını kendisi
// kullandığı için "supabase" desek isim çakışır ve script çöker.
let db = null;

// Form gönderimini HER ZAMAN engelle: kütüphane yüklenmese bile
// sayfanın yenilenip "hiçbir şey olmuyor" gibi görünmesini önler.
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!db) {
    showStatus("Supabase bağlantısı kurulamadı. İnternet/CDN engeli olabilir.", true);
    return;
  }
  const text = input.value.trim();
  if (!text) return;
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

// Kütüphane gerçekten yüklendi mi?
if (!window.supabase || typeof window.supabase.createClient !== "function") {
  showStatus(
    "Supabase kütüphanesi yüklenemedi. İnternet bağlantını veya reklam engelleyiciyi kontrol et.",
    true
  );
} else {
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  loadTodos();
}

// ============================================================
//  VERİTABANI İŞLEMLERİ
// ============================================================
async function loadTodos() {
  const { data, error } = await db
    .from("todos")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    showStatus("Görevler yüklenemedi: " + error.message, true);
    return;
  }
  showStatus("", false);
  todos = data;
  render();
}

async function addTodo(text) {
  const { error } = await db
    .from("todos")
    .insert({ text: text, completed: false });

  if (error) {
    showStatus("Eklenemedi: " + error.message, true);
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
    showStatus("Güncellenemedi: " + error.message, true);
    return;
  }
  loadTodos();
}

async function remove(id) {
  const { error } = await db.from("todos").delete().eq("id", id);

  if (error) {
    showStatus("Silinemedi: " + error.message, true);
    return;
  }
  loadTodos();
}

async function clearCompleted() {
  const { error } = await db
    .from("todos")
    .delete()
    .eq("completed", true);

  if (error) {
    showStatus("Silinemedi: " + error.message, true);
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
