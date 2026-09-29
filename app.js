/*
  วาง URL ของ Google Apps Script Web App ที่ลงท้ายด้วย /exec ตรงนี้
  ตัวอย่าง: https://script.google.com/macros/s/XXXXXXXXXXXX/exec
*/
const API_URL = "https://script.google.com/macros/s/AKfycbwlTi1T1dzh-F_Vd2XbaHDo1-kZPqvo2rHWxig79d2h67FLhZ_SvWdsno1Pz-Ya6-oq/exec";

const form = document.getElementById("rsvpForm");
const submitBtn = document.getElementById("submitBtn");
const formStatus = document.getElementById("formStatus");
const guestCountGroup = document.getElementById("guestCountGroup");
const guestCountInput = document.getElementById("guestCount");
const scrollTopBtn = document.getElementById("scrollTopBtn");
const successModal = document.getElementById("successModal");
const closeModalBtn = document.getElementById("closeModalBtn");

function getSelected(name) {
  return form.querySelector(`input[name="${name}"]:checked`)?.value || "";
}

function setError(field, message = "") {
  const target = document.querySelector(`[data-error-for="${field}"]`);
  if (target) target.textContent = message;
}

function clearErrors() {
  document.querySelectorAll(".field-error").forEach((el) => (el.textContent = ""));
  formStatus.textContent = "";
  formStatus.className = "form-status";
}

function updateGuestCountVisibility() {
  const attendance = getSelected("attendance");
  const isNotAttending = attendance === "ไม่สะดวก";

  guestCountGroup.classList.toggle("is-hidden", isNotAttending);
  guestCountInput.required = !isNotAttending;

  if (isNotAttending) {
    guestCountInput.value = "0";
    setError("guestCount", "");
  } else if (!guestCountInput.value || Number(guestCountInput.value) < 1) {
    guestCountInput.value = "";
  }
}

function validateForm() {
  clearErrors();

  const name = document.getElementById("guestName").value.trim();
  const side = getSelected("side");
  const attendance = getSelected("attendance");
  const guests = Number(guestCountInput.value);

  let valid = true;

  if (name.length < 2) {
    setError("guestName", "กรุณากรอกชื่อของท่าน");
    valid = false;
  }

  if (!side) {
    setError("side", "กรุณาเลือกฝ่ายเจ้าสาวหรือฝ่ายเจ้าบ่าว");
    valid = false;
  }

  if (!attendance) {
    setError("attendance", "กรุณาเลือกว่าสะดวกมาร่วมงานหรือไม่");
    valid = false;
  }

  if (attendance === "สะดวก" && (!Number.isInteger(guests) || guests < 1 || guests > 20)) {
    setError("guestCount", "กรุณากรอกจำนวนตั้งแต่ 1–20 คน");
    valid = false;
  }

  return valid;
}

function createSubmissionId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `rsvp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.classList.toggle("is-loading", isLoading);
}

function openSuccessModal() {
  successModal.hidden = false;
  document.body.style.overflow = "hidden";
  closeModalBtn.focus();
}

function closeSuccessModal() {
  successModal.hidden = true;
  document.body.style.overflow = "";
}

async function submitRSVP(event) {
  event.preventDefault();

  if (!validateForm()) {
    const firstError = document.querySelector(".field-error:not(:empty)");
    firstError?.closest(".field-group")?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  if (!API_URL || API_URL.includes("PASTE_YOUR")) {
    formStatus.textContent = "ยังไม่ได้ตั้งค่า API URL ในไฟล์ app.js";
    formStatus.className = "form-status error";
    return;
  }

  const attendance = getSelected("attendance");
  const payload = {
    submissionId: createSubmissionId(),
    name: document.getElementById("guestName").value.trim(),
    side: getSelected("side"),
    attendance,
    guests: attendance === "ไม่สะดวก" ? 0 : Number(guestCountInput.value),
    website: document.getElementById("website").value.trim()
  };

  setLoading(true);
  clearErrors();

  try {
    /*
      Apps Script Web App ไม่ส่ง CORS header กลับมาสำหรับ static site ทั่วไป
      จึงใช้ no-cors + text/plain เพื่อให้ GitHub Pages / Netlify POST ได้โดยไม่ preflight
    */
    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      cache: "no-store",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });

    form.reset();
    updateGuestCountVisibility();
    openSuccessModal();
  } catch (error) {
    console.error(error);
    formStatus.textContent = "ส่งข้อมูลไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง";
    formStatus.className = "form-status error";
  } finally {
    setLoading(false);
  }
}

function createFloatingHearts() {
  const holder = document.getElementById("floatingHearts");
  if (!holder || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const count = window.innerWidth < 520 ? 8 : 12;
  for (let i = 0; i < count; i += 1) {
    const heart = document.createElement("span");
    heart.className = "float-heart";
    heart.textContent = Math.random() > 0.5 ? "♡" : "♥";
    heart.style.left = `${Math.random() * 100}%`;
    heart.style.animationDuration = `${14 + Math.random() * 12}s`;
    heart.style.animationDelay = `${-Math.random() * 18}s`;
    heart.style.setProperty("--drift", `${-40 + Math.random() * 80}px`);
    heart.style.fontSize = `${12 + Math.random() * 11}px`;
    holder.appendChild(heart);
  }
}

form.addEventListener("submit", submitRSVP);
form.querySelectorAll('input[name="attendance"]').forEach((input) => {
  input.addEventListener("change", updateGuestCountVisibility);
});

scrollTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
window.addEventListener("scroll", () => {
  scrollTopBtn.classList.toggle("show", window.scrollY > 500);
}, { passive: true });

closeModalBtn.addEventListener("click", closeSuccessModal);
successModal.addEventListener("click", (event) => {
  if (event.target.matches("[data-close-modal]")) closeSuccessModal();
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !successModal.hidden) closeSuccessModal();
});

updateGuestCountVisibility();
createFloatingHearts();
