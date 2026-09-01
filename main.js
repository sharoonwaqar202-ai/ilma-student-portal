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
function showLoginPage() {
  document.querySelector("#app").innerHTML = `
    <div class="login-page">
      <div class="login-card">
        <img src="/ilma-logo.png" alt="ILMA University Logo" class="logo">
        <h1>ILMA Student Portal</h1>
        <p>Login to access your student record</p>

        <form id="loginForm">
          <input
            id="loginEmail"
            type="email"
            placeholder="Email Address"
            required
          />

          <input
            id="loginPassword"
            type="password"
            placeholder="Password"
            required
          />

          <button type="submit">Login</button>
        </form>

        <div id="loginMessage" class="message"></div>
      </div>
    </div>
  `;

  document.querySelector("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.querySelector("#loginEmail").value.trim();
    const password = document.querySelector("#loginPassword").value;
    const loginMessage = document.querySelector("#loginMessage");

    loginMessage.textContent = "Logging in…";

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      loginMessage.textContent = error.message;
      loginMessage.className = "message error";
      return;
    }

    location.reload();
  });
}

document.querySelector("#app").innerHTML = `
  <div class="page">
    <header class="hero">
      <div class="brand">
<img src="/ilma-logo.png" alt="ILMA University Logo" class="logo">
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
          <input id="studentId" autocomplete="off" placeholder="" required />
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
  const degreePath = "https://mesdnfikjzxuhiuuagvz.supabase.co/storage/v1/object/sign/documents/Muhammad_Zunair_Degree_Clear.pdf?token=eyJraWQiOiI4OTQ0ZGJmOC1lZTFjLTQ4MWUtYTE0Ni1lOWEzMmNmYWVkM2QiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJkb2N1bWVudHMvTXVoYW1tYWRfWnVuYWlyX0RlZ3JlZV9DbGVhci5wZGYiLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg3OTk1NjQ0LCJleHAiOjE4MTk1MzE2NDR9.2WGfgbE1zhtPbXNnj_3G_2IvKiVW5wlKoB_9uD9kdyA";

const transcriptPath = "https://mesdnfikjzxuhiuuagvz.supabase.co/storage/v1/object/sign/documents/transcript%20(2).pdf?token=eyJraWQiOiI4OTQ0ZGJmOC1lZTFjLTQ4MWUtYTE0Ni1lOWEzMmNmYWVkM2QiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJkb2N1bWVudHMvdHJhbnNjcmlwdCAoMikucGRmIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4ODI2NzUzMCwiZXhwIjoxODE5ODAzNTMwfQ.wZU75KbyhurJlyvu9dlg2bz9dguFs3i0WLGeAb8mdtc";
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
      <div class="avatar">
  <img
    src="https://mesdnfikjzxuhiuuagvz.supabase.co/storage/v1/object/sign/documents/Muhammad_Zunair_Profile.jpeg?token=eyJraWQiOiI4OTQ0ZGJmOC1lZTFjLTQ4MWUtYTE0Ni1lOWEzMmNmYWVkM2QiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJkb2N1bWVudHMvTXVoYW1tYWRfWnVuYWlyX1Byb2ZpbGUuanBlZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODc5MjkyNTYsImV4cCI6MTgxOTQ2NTI1Nn0.yFcslvsQ_dJ-j2JDS-36_p1fcKf3a5uNPeo2vPpa8LM"
    alt="Muhammad Zunair"
  />
</div>
      <div class="profile-main">
        <span class="eyebrow">Student Profile</span>
        <h2>${escapeHtml(student.full_name?.trim() || "Muhammad Zunair")}</h2>
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
    </div> <div class="card section">
  <div class="section-title">
    <h3>Degree Certificate</h3>
    <span>Official Document</span>
  </div>

  <div class="degree-box">
    <p>Muhammad Zunair — Bachelor of Arts</p>
    <a href="${degreePath}" target="_blank" download>
      View / Download Degree
    </a>
  </div>
</div>

<div class="card section">
  <div class="section-title">
    <h3>Transcript</h3>
    <span>Official Document</span>
  </div>

  <div class="degree-box">
    <p>Academic Transcript</p>
    <a href="${transcriptPath}" target="_blank" download>
      View / Download Transcript
    </a>
  </div>
</div>
    <div class="card section">
      <div class="section-title"><h3>Marksheet</h3><span>${marks.length} subjects</span></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Attended</th><th>Percentage</th></tr></thead>
          <tbody>${markRows || `<tr><td colspan="4">No marks available.</td></tr>`}</tbody>
        </table>
      </div>
    </div>

    <div class="card section">
      <div class="section-title"><h3>Attendance</h3><span>Class record</span></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Attended</th><th>Percentage</th></tr></thead>
          <tbody>${attendanceRows || `<tr><td colspan="2">No attendance available.</td></tr>`}</tbody>
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
  const user = await checkLogin();

  if (!user) {
    setMessage("Please login first.", "error");
    return;
  }

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

checkLogin().then(user => {
  if (!user) {
    showLoginPage();
  }
});
