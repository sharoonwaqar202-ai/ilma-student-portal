import { createClient } from "@supabase/supabase-js";
import "./style.css";
let currentUser = null;

async function checkLogin() {
  const { data: { session } } = await supabase.auth.getSession();
  currentUser = session?.user ?? null;
  return currentUser;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

document.querySelector("#app").innerHTML = `
  <div class="page">
    <header class="hero">
      <div class="brand">
        <div class="logo">IL</div>
        <div>
          <h1>ILMA</h1>
          <p>Student Portal</p>
        </div>
      </div>
      <span class="badge">Student Services</span>
    </header>

    <main>
      <section class="search-card">
        <div>
          <h2>Find Student Record</h2>
          <p>Enter an authorized Student ID to view the student's portal record.</p>
        </div>
        <form id="searchForm">
          <input id="studentId" autocomplete="off" placeholder="e.g. ILMA-1001" required />
          <button type="submit">Search</button>
        </form>
        <div id="message" class="message"></div>
      </section>

      <section id="dashboard" class="hidden"></section>
    </main>

    <footer>ILMA Student Portal • Secure academic record access</footer>
  </div>
`;

const message = document.querySelector("#message");
const dashboard = document.querySelector("#dashboard");

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

function setMessage(text, type="") {
  message.textContent = text;
  message.className = `message ${type}`;
}

function percent(attended, held) {
  if (!held) return 0;
  return Math.round((attended / held) * 100);
}

function renderDashboard(student, marks, attendance, fees) {
  const grouped = new Map();
  marks.forEach(m => {
    grouped.set(m.subject_id, {
      subject: m.subjects?.subject_name ?? "Subject",
      code: m.subjects?.subject_code ?? "—",
      marks: m.marks_obtained ?? "—",
      total: m.total_marks ?? 100,
      grade: m.grade ?? "—"
    });
  });

  const fee = fees[0];
  const attendanceRows = attendance.map(a => `
    <tr>
      <td>${escapeHtml(a.subjects?.subject_name ?? "Subject")}</td>
      <td>${a.classes_attended ?? 0} / ${a.classes_held ?? 0}</td>
      <td>${percent(a.classes_attended, a.classes_held)}%</td>
    </tr>
  `).join("");

  const markRows = [...grouped.values()].map(m => `
    <tr>
      <td>${escapeHtml(m.code)}</td>
      <td>${escapeHtml(m.subject)}</td>
      <td>${escapeHtml(m.marks)} / ${escapeHtml(m.total)}</td>
      <td><strong>${escapeHtml(m.grade)}</strong></td>
    </tr>
  `).join("");

  dashboard.classList.remove("hidden");
  dashboard.innerHTML = `
    <div class="profile card">
      <div class="avatar">${escapeHtml(student.full_name?.charAt(0) ?? "S")}</div>
      <div class="profile-main">
        <span class="eyebrow">Student Profile</span>
        <h2>${escapeHtml(student.full_name)}</h2>
        <p>${escapeHtml(student.program ?? "—")} • ${escapeHtml(student.semester ?? "—")}</p>
      </div>
      <div class="student-id">
        <small>Student ID</small>
        <strong>${escapeHtml(student.student_id)}</strong>
      </div>
    </div>

    <div class="info-grid">
      <div class="card info"><span>Father Name</span><strong>${escapeHtml(student.father_name ?? "—")}</strong></div>
      <div class="card info"><span>Phone</span><strong>${escapeHtml(student.phone ?? "—")}</strong></div>
      <div class="card info"><span>Email</span><strong>${escapeHtml(student.email ?? "—")}</strong></div>
      <div class="card info"><span>Fee Status</span><strong class="${fee?.status?.toLowerCase()==="paid" ? "paid":"pending"}">${escapeHtml(fee?.status ?? "—")}</strong></div>
    </div>

    <div class="card section">
      <div class="section-title"><h3>Marksheet</h3><span>${marks.length} subjects</span></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Code</th><th>Subject</th><th>Marks</th><th>Grade</th></tr></thead>
          <tbody>${markRows || `<tr><td colspan="4">No marks available.</td></tr>`}</tbody>
        </table>
      </div>
    </div>

    <div class="card section">
      <div class="section-title"><h3>Attendance</h3><span>Class record</span></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Subject</th><th>Attended</th><th>Percentage</th></tr></thead>
          <tbody>${attendanceRows || `<tr><td colspan="3">No attendance available.</td></tr>`}</tbody>
        </table>
      </div>
    </div>

    <div class="card section">
      <div class="section-title"><h3>Fee Information</h3></div>
      <div class="fee-box">
        <div><span>Amount</span><strong>${fee ? Number(fee.amount).toLocaleString() : "—"}</strong></div>
        <div><span>Status</span><strong>${escapeHtml(fee?.status ?? "—")}</strong></div>
        <div><span>Due Date</span><strong>${escapeHtml(fee?.due_date ?? "—")}</strong></div>
      </div>
    </div>
  `;
}

async function searchStudent(studentId) {
  if (!supabase) {
    setMessage("Supabase is not configured yet. Add the Vercel environment variables first.", "error");
    return;
  }

  setMessage("Searching…");
  dashboard.classList.add("hidden");

  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("*")
    .eq("student_id", studentId.trim())
    .maybeSingle();

  if (studentError) {
    setMessage(studentError.message, "error");
    return;
  }

  if (!student) {
    setMessage("No student record found.", "error");
    return;
  }

  const [marksRes, attendanceRes, feesRes] = await Promise.all([
    supabase.from("marks")
      .select("*, subjects(subject_code, subject_name)")
      .eq("student_id", student.id),
    supabase.from("attendance")
      .select("*, subjects(subject_code, subject_name)")
      .eq("student_id", student.id),
    supabase.from("fees")
      .select("*")
      .eq("student_id", student.id)
      .order("created_at", { ascending: false })
      .limit(1)
  ]);

  if (marksRes.error || attendanceRes.error || feesRes.error) {
    setMessage(
      marksRes.error?.message || attendanceRes.error?.message || feesRes.error?.message,
      "error"
    );
    return;
  }

  setMessage("Record found.", "success");
  renderDashboard(student, marksRes.data || [], attendanceRes.data || [], feesRes.data || []);
}

document.querySelector("#searchForm").addEventListener("submit", e => {
  e.preventDefault();
  searchStudent(document.querySelector("#studentId").value);
});
