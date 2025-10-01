(function () {
  const A = document.createElement("link").relList;
  if (A && A.supports && A.supports("modulepreload")) return;
  for (const r of document.querySelectorAll('link[rel="modulepreload"]')) m(r);
  new MutationObserver((r) => {
    for (const i of r)
      if (i.type === "childList")
        for (const c of i.addedNodes)
          c.tagName === "LINK" && c.rel === "modulepreload" && m(c);
  }).observe(document, { childList: !0, subtree: !0 });
  function B(r) {
    const i = {};
    return (
      r.integrity && (i.integrity = r.integrity),
      r.referrerPolicy && (i.referrerPolicy = r.referrerPolicy),
      r.crossOrigin === "use-credentials"
        ? (i.credentials = "include")
        : r.crossOrigin === "anonymous"
          ? (i.credentials = "omit")
          : (i.credentials = "same-origin"),
      i
    );
  }
  function m(r) {
    if (r.ep) return;
    r.ep = !0;
    const i = B(r);
    fetch(r.href, i);
  }
})();
if (typeof document < "u") {
  let l = function (m, r = "warning", i = 4e3) {
    const c = document.getElementById("global-toast");
    if (c) {
      ((c.className = `toast align-items-center text-white bg-${r} border-0`),
        (document.getElementById("global-toast-body").textContent = m));
      const v = new bootstrap.Toast(c);
      (v.show(), i > 0 && setTimeout(() => v.hide(), i));
    }
  };
  class A {
    constructor() {
      ((this.activeModals = new Map()), (this.activeTimers = new Map()));
    }
    initialize(r) {
      const i = document.getElementById(r);
      if (!i) return (l(`Modal ${r} not found`, "danger"), null);
      try {
        const c = new bootstrap.Modal(i, { backdrop: "static", keyboard: !1 });
        return (
          this.activeModals.set(r, c),
          i.addEventListener("hidden.bs.modal", () => this.cleanup(r), {
            once: !0,
          }),
          c
        );
      } catch (c) {
        return (
          l(`Failed to initialize modal "${r}": ${c.message}`, "danger"),
          null
        );
      }
    }
    show(r, i = {}) {
      const c = this.activeModals.get(r) || this.initialize(r);
      c &&
        (i.countdown && this.setupCountdown(r, i.countdown),
        c.show(),
        (r === "validationModal" || r === "paymentModal") &&
          this.setupSpinnerTimeout(r));
    }
    hide(r) {
      const i = this.activeModals.get(r);
      i && i.hide();
    }
    setupCountdown(r, { duration: i, elementId: c, onComplete: v }) {
      const p = document.getElementById(c);
      if (!p) {
        l(`Countdown element "${c}" not found`, "danger");
        return;
      }
      let I = i;
      ((p.textContent = I), p.setAttribute("aria-live", "assertive"));
      const M = setInterval(() => {
        if (
          (I--,
          (p.textContent = I),
          I <= 0 && (this.cleanup(r), this.hide(r), typeof v == "function"))
        )
          try {
            v();
          } catch (w) {
            l(`Error in onComplete callback: ${w.message}`, "danger");
          }
      }, 1e3);
      this.activeTimers.set(r, M);
    }
    setupSpinnerTimeout(r, i = 15e3) {
      setTimeout(() => {
        const c = this.activeModals.get(r);
        c &&
          c._element.classList.contains("show") &&
          (l(
            "This is taking longer than expected. Please check your connection.",
            "danger",
          ),
          this.hide(r));
      }, i);
    }
    cleanup(r) {
      const i = this.activeTimers.get(r);
      i && (clearInterval(i), this.activeTimers.delete(r));
    }
  }
  const B = new A();
  document.addEventListener("DOMContentLoaded", () => {
    (typeof AOS < "u" && AOS.init({ duration: 800, once: !0 }),
      document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((e) => {
        new bootstrap.Tooltip(e);
      }));
    const m = document.getElementById("subscription-form"),
      r = document.getElementById("submit-btn"),
      i = r == null ? void 0 : r.querySelector(".btn-text"),
      c = r == null ? void 0 : r.querySelector(".spinner-border"),
      v = document.querySelector(".progress-bar"),
      p = document.getElementById("country-select"),
      I = document.getElementById("country"),
      M = document.getElementById("phone-prefix"),
      w = document.getElementById("phone"),
      K = document.getElementById("payment-type"),
      Y = document.getElementById("installment-options"),
      X = document.getElementById("installment-terms"),
      k = document.getElementById("branch"),
      C = document.getElementById("group"),
      H = document.getElementById("artist"),
      q = document.createElement("div");
    ((q.id = "form-debug-msg"),
      (q.style.color = "red"),
      (q.style.fontSize = "0.95em"),
      (q.style.marginTop = "0.5em"),
      r && r.parentNode.insertBefore(q, r.nextSibling));
    const j = [
        { name: "BigHit Music", groups: ["BTS", "TXT"] },
        { name: "PLEDIS Entertainment", groups: ["SEVENTEEN", "fromis_9"] },
        { name: "BELIFT LAB", groups: ["ENHYPEN", "ILLIT"] },
        { name: "KOZ Entertainment", groups: ["ZICO"] },
        { name: "ADOR", groups: ["NewJeans"] },
        { name: "HYBE Labels Japan", groups: ["&TEAM"] },
      ],
      W = {
        BTS: ["RM", "Jin", "SUGA", "j-hope", "Jimin", "V", "Jung Kook"],
        TXT: ["SOOBIN", "YEONJUN", "BEOMGYU", "TAEHYUN", "HUENINGKAI"],
        SEVENTEEN: [
          "S.COUPS",
          "JEONGHAN",
          "JOSHUA",
          "JUN",
          "HOSHI",
          "WONWOO",
          "WOOZI",
          "THE 8",
          "MINGYU",
          "DK",
          "SEUNGKWAN",
          "VERNON",
          "DINO",
        ],
        fromis_9: [
          "LEE SAEROM",
          "SONG HAYOUNG",
          "PARK JIWON",
          "ROH JISUN",
          "LEE SEOYEON",
          "LEE CHAEYOUNG",
          "LEE NAGYUNG",
          "BAEK JIHEON",
        ],
        ENHYPEN: [
          "JUNGWON",
          "HEESEUNG",
          "JAY",
          "JAKE",
          "SUNGHOON",
          "SUNOO",
          "NI-KI",
        ],
        ILLIT: ["YUNAH", "MINJU", "MOKA", "WONHEE", "IROHA"],
        ZICO: ["ZICO"],
        NewJeans: ["MINJI", "HANNI", "DANIELLE", "HAERIN", "HYEIN"],
        "&TEAM": [
          "K",
          "FUMA",
          "NICHOLAS",
          "EJ",
          "YUMA",
          "JO",
          "HARUA",
          "TAKI",
          "MAKI",
        ],
      },
      oe = {
        US: { flag: "🇺🇸", code: "+1", format: "(XXX) XXX-XXXX" },
        GB: { flag: "🇬🇧", code: "+44", format: "XXXX XXXXXX" },
        JP: { flag: "🇯🇵", code: "+81", format: "XX-XXXX-XXXX" },
        KR: { flag: "🇰🇷", code: "+82", format: "XX-XXXX-XXXX" },
        CN: { flag: "🇨🇳", code: "+86", format: "XXX XXXX XXXX" },
        FR: { flag: "🇫🇷", code: "+33", format: "X XX XX XX XX" },
        DE: { flag: "🇩🇪", code: "+49", format: "XXXX XXXXXXX" },
        IN: { flag: "🇮🇳", code: "+91", format: "XXXXX-XXXXX" },
        BR: { flag: "🇧🇷", code: "+55", format: "(XX) XXXXX-XXXX" },
        CA: { flag: "🇨🇦", code: "+1", format: "(XXX) XXX-XXXX" },
        NG: { flag: "🇳🇬", code: "+234", format: "XXX XXX XXXX" },
      },
      L = {
        "referral-code": {
          required: !0,
          message: "Referral code is required.",
        },
        "full-name": { required: !0, message: "Please enter your full name." },
        email: {
          required: !0,
          pattern: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
          message: "Please enter a valid email address.",
        },
        phone: {
          required: !0,
          pattern: /^\+?[\d\s\-()]{7,20}$/,
          message: "Please enter a valid phone number.",
        },
        "address-line1": {
          required: !0,
          message: "Street address is required.",
        },
        city: { required: !0, message: "City is required." },
        "postal-code": {
          required: !0,
          pattern: /^.{2,10}$/,
          message: "Postal code is required.",
        },
        "country-select": {
          required: !0,
          message: "Please select your country.",
        },
        dob: { required: !0, message: "Date of birth is required." },
        gender: { required: !0, message: "Please select your gender." },
        branch: { required: !0, message: "Please select a branch." },
        group: { required: !0, message: "Please select a group." },
        artist: { required: !0, message: "Please select an artist." },
        "payment-type": {
          required: !0,
          message: "Please select a payment type.",
        },
        "contact-method": {
          required: !0,
          message: "Please select a contact method.",
        },
        "subscription-agreement": {
          required: !0,
          message: "You must agree to complete your subscription.",
        },
        "installment-plan": {
          required: !1,
          message: "Please select an installment plan.",
        },
        "installment-terms": {
          required: !1,
          message: "You must agree to the installment terms.",
        },
      };
    function U(e, t = {}) {
      return fetch(e, t)
        .then((n) => {
          if (!n.ok) throw new Error(`Network error: ${n.status}`);
          return n;
        })
        .catch((n) => {
          throw (l(`Network error: ${n.message}`, "danger"), n);
        });
    }
    async function Z(e) {
      try {
        return (await e.clone().json()) || {};
      } catch {
        try {
          const t = await e.text();
          return t ? JSON.parse(t) : {};
        } catch {
          return {};
        }
      }
    }
    function _(e) {
      const t = document.createElement("div");
      return ((t.textContent = e), t.innerHTML);
    }
    function $(e, t) {
      let n = e.parentElement.querySelector(".invalid-feedback");
      (n ||
        ((n = document.createElement("div")),
        (n.className = "invalid-feedback"),
        e.parentElement.appendChild(n)),
        (n.textContent = t),
        e.classList.add("is-invalid"),
        e.setAttribute("aria-invalid", "true"));
    }
    function le(e) {
      const t = e.parentElement.querySelector(".invalid-feedback");
      (t && (t.textContent = ""),
        e.classList.remove("is-invalid"),
        e.setAttribute("aria-invalid", "false"));
    }
    function N(e) {
      const t = L[e.name || e.id];
      return t
        ? (t.required && !e.value) ||
          (t.pattern && e.value && !t.pattern.test(e.value))
          ? ($(e, t.message), !1)
          : (le(e), !0)
        : !0;
    }
    function O(e) {
      e &&
        (e.classList.remove("shake"),
        e.offsetWidth,
        e.classList.add("shake"),
        e.addEventListener("animationend", () => e.classList.remove("shake"), {
          once: !0,
        }));
    }
    function b() {
      const e = m.querySelectorAll("[required]");
      let t = 0;
      e.forEach((s) => {
        (s.value.trim() || (s.type === "radio" && s.checked)) && t++;
      });
      const n = (t / e.length) * 100;
      ((v.style.width = `${n}%`), v.setAttribute("aria-valuenow", n));
    }
    function ce(e = !1) {
      const t = m.querySelectorAll("[required]"),
        n = [];
      let s = !0;
      return (
        t.forEach((a) => {
          N(a) || ((s = !1), e && n.push(a.name || a.id));
        }),
        e ? n : s
      );
    }
    (j.forEach((e) => {
      const t = document.createElement("option");
      ((t.value = e.name), (t.textContent = e.name), k.appendChild(t));
    }),
      k.addEventListener("change", () => {
        ((C.innerHTML =
          '<option value="" disabled selected>Select a Group</option>'),
          (H.innerHTML =
            '<option value="" disabled selected>Select an Artist</option>'));
        const e = j.find((t) => t.name === k.value);
        (e &&
          e.groups.forEach((t) => {
            const n = document.createElement("option");
            ((n.value = t), (n.textContent = t), C.appendChild(n));
          }),
          b());
      }),
      C.addEventListener("change", () => {
        H.innerHTML =
          '<option value="" disabled selected>Select an Artist</option>';
        const e = C.value;
        (W[e] &&
          W[e].forEach((t) => {
            const n = document.createElement("option");
            ((n.value = t), (n.textContent = t), H.appendChild(n));
          }),
          b());
      }));
    async function de() {
      var t;
      p.innerHTML =
        '<option value="" disabled selected>Select Country</option>';
      let e = [];
      try {
        e = (
          await (
            await U("https://restcountries.com/v3.1/all?fields=name,cca2")
          ).json()
        ).map((s) => ({ code: s.cca2, name: s.name.common }));
      } catch {
        ((e = [
          { code: "US", name: "United States" },
          { code: "GB", name: "United Kingdom" },
          { code: "JP", name: "Japan" },
          { code: "KR", name: "South Korea" },
          { code: "CN", name: "China" },
          { code: "FR", name: "France" },
          { code: "DE", name: "Germany" },
          { code: "IN", name: "India" },
          { code: "BR", name: "Brazil" },
          { code: "CA", name: "Canada" },
          { code: "NG", name: "Nigeria" },
        ]),
          l("Could not load full country list. Using fallback.", "warning"));
      }
      (e.sort((n, s) => n.name.localeCompare(s.name)),
        e.forEach((n) => {
          const s = document.createElement("option");
          ((s.value = n.code), (s.textContent = n.name), p.appendChild(s));
        }));
      try {
        const a =
          (t = (await (await U("https://ipwho.is/")).json()).country_code) ==
          null
            ? void 0
            : t.toUpperCase();
        a && ((p.value = a), (I.value = a), z(a));
      } catch {
        l("Could not auto-detect country. Please select manually.", "warning");
      }
    }
    function z(e) {
      const t = oe[e] || { flag: "🌐", code: "" };
      ((M.textContent = `${t.flag} ${t.code}`),
        (w.value = ""),
        (w.oninput = () => {
          let n = w.value.replace(/\D/g, ""),
            s = n;
          (e === "US" || e === "CA"
            ? n.length > 3 && n.length <= 6
              ? (s = `(${n.slice(0, 3)}) ${n.slice(3)}`)
              : n.length > 6 &&
                (s = `(${n.slice(0, 3)}) ${n.slice(3, 6)}-${n.slice(6, 10)}`)
            : e === "GB"
              ? n.length > 4 && (s = `${n.slice(0, 4)} ${n.slice(4, 10)}`)
              : e === "NG" &&
                n.length > 3 &&
                (s = `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6, 10)}`),
            (w.value = s));
        }));
    }
    function ue(e) {
      const t = {
          US: {
            fields: [
              {
                id: "address-line1",
                label: "Street Address",
                placeholder: "123 Main St",
                required: !0,
              },
              {
                id: "address-line2",
                label: "Apt/Suite (optional)",
                placeholder: "Apt, suite, etc.",
                required: !1,
              },
              { id: "city", label: "City", placeholder: "City", required: !0 },
              {
                id: "state",
                label: "State",
                placeholder: "State",
                required: !0,
              },
              {
                id: "postal-code",
                label: "ZIP Code",
                placeholder: "12345",
                required: !0,
                pattern: /^\d{5}(-\d{4})?$/,
                error: "Invalid ZIP code",
              },
            ],
            order: [
              "address-line1",
              "address-line2",
              "city",
              "state",
              "postal-code",
            ],
          },
          JP: {
            fields: [
              {
                id: "postal-code",
                label: "Postal Code",
                placeholder: "100-0001",
                required: !0,
                pattern: /^\d{3}-\d{4}$/,
                error: "Invalid postal code",
              },
              {
                id: "address-line1",
                label: "Prefecture",
                placeholder: "Tokyo",
                required: !0,
              },
              {
                id: "address-line2",
                label: "City/Ward",
                placeholder: "Chiyoda-ku",
                required: !0,
              },
              {
                id: "city",
                label: "Town/Block",
                placeholder: "Kanda",
                required: !0,
              },
              {
                id: "state",
                label: "Building/Apartment (optional)",
                placeholder: "Building, room, etc.",
                required: !1,
              },
            ],
            order: [
              "postal-code",
              "address-line1",
              "address-line2",
              "city",
              "state",
            ],
          },
          default: {
            fields: [
              {
                id: "address-line1",
                label: "Address Line 1",
                placeholder: "Address Line 1",
                required: !0,
              },
              {
                id: "address-line2",
                label: "Address Line 2 (optional)",
                placeholder: "Address Line 2",
                required: !1,
              },
              {
                id: "city",
                label: "City/Town",
                placeholder: "City/Town",
                required: !0,
              },
              {
                id: "state",
                label: "State/Province/Region",
                placeholder: "State/Province/Region",
                required: !1,
              },
              {
                id: "postal-code",
                label: "Postal Code",
                placeholder: "Postal Code",
                required: !0,
                pattern: /^.{2,10}$/,
                error: "Invalid postal code",
              },
            ],
            order: [
              "address-line1",
              "address-line2",
              "city",
              "state",
              "postal-code",
            ],
          },
        },
        n = t[e] || t.default;
      (n.fields.forEach((a) => {
        const o = document.getElementById(a.id);
        if (o) {
          o.placeholder = a.placeholder;
          const u = o.previousElementSibling;
          (u && u.classList.contains("form-label") && (u.textContent = a.label),
            (o.required = a.required),
            (o.pattern = a.pattern ? a.pattern.source : ""),
            (L[a.id].pattern = a.pattern),
            (L[a.id].message = a.error || L[a.id].message),
            (o.parentElement.style.display = ""));
        }
      }),
        [
          "address-line1",
          "address-line2",
          "city",
          "state",
          "postal-code",
        ].forEach((a) => {
          if (!n.order.includes(a)) {
            const o = document.getElementById(a);
            o && (o.parentElement.style.display = "none");
          }
        }));
      const s = document.getElementById("address-fields");
      n.order.forEach((a) => {
        const o = document.getElementById(a);
        o && s && s.appendChild(o.parentElement);
      });
    }
    function Q() {
      (K.value === "Installment"
        ? (Y.classList.remove("d-none"),
          (document.getElementById("installment-plan").required = !0),
          X &&
            (X.closest(".form-check").classList.remove("d-none"),
            (X.required = !0),
            (L["installment-terms"].required = !0)))
        : (Y.classList.add("d-none"),
          (document.getElementById("installment-plan").required = !1),
          X &&
            (X.closest(".form-check").classList.add("d-none"),
            (X.checked = !1),
            (X.required = !1),
            (L["installment-terms"].required = !1))),
        b());
    }
    (K.addEventListener("change", Q),
      p.addEventListener("change", () => {
        ((I.value = p.value), z(p.value), ue(p.value), b());
      }),
      m.querySelectorAll("input, select, textarea").forEach((e) => {
        (e.addEventListener("input", () => {
          (N(e), b());
        }),
          e.addEventListener("blur", () => N(e)),
          e.addEventListener("invalid", () => O(e)));
      }),
      document
        .getElementById("digital-currency-home-btn")
        .addEventListener("click", () => {
          (B.hide("digitalCurrencySuccessModal"),
            B.show("loadingRedirectModal", {
              countdown: {
                duration: 5,
                elementId: "redirect-countdown",
                onComplete: () =>
                  (window.location.href = "https://hybecorp.com"),
              },
            }));
        }));
    function me() {
      const e = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      let t = "";
      for (let n = 0; n < 10; n++)
        t += e.charAt(Math.floor(Math.random() * e.length));
      return `HYB${t}`;
    }
    function fe(e) {
      const t = new FormData(e),
        n = me();
      ((document.getElementById("submission-id").value = n),
        t.set("submission-id", n));
      const s = new Date().toISOString();
      t.set("submission-timestamp", s);
      const a = document.querySelector('input[name="payment-method"]:checked');
      a && t.set("payment-method", a.value);
      const o = document.querySelector('input[name="contact-method"]:checked');
      return (
        o && t.set("contact-method", o.value),
        t.set("language", document.getElementById("language-switcher").value),
        t.set("country", document.getElementById("country-select").value),
        t.set("currency", document.getElementById("currency").value || "USD"),
        t.set("user-agent", navigator.userAgent),
        t.set("screen-resolution", `${screen.width}x${screen.height}`),
        t.set("referrer", document.referrer || "Direct"),
        { formData: t, uniqueID: n, submissionTime: s }
      );
    }
    m.addEventListener("submit", async (e) => {
      var t, n;
      if ((e.preventDefault(), !d.isVerified)) {
        (l(
          "Please verify your email address before submitting the form.",
          "warning",
        ),
          g.scrollIntoView({ behavior: "smooth", block: "center" }),
          setTimeout(() => {
            (g.focus(), O(g));
          }, 500));
        return;
      }
      if (!ce()) {
        (l("Please correct the highlighted errors and try again.", "danger"),
          m.querySelectorAll("[required]").forEach((s) => {
            N(s) || O(s);
          }));
        return;
      }
      ((r.disabled = !0),
        c.classList.remove("d-none"),
        (i.textContent = "Submitting..."),
        (t = document.querySelector('input[name="payment-method"]:checked')) ==
          null || t.value);
      try {
        const { formData: s } = fe(m),
          a = "https://formspree.io/f/mgvlpngb",
          o = await fetch(a, {
            method: "POST",
            body: s,
            headers: { Accept: "application/json" },
          });
        if (!o.ok) {
          const u = await o.json().catch(() => ({}));
          let f = "An error occurred. Please check the form and try again.",
            ie = !1;
          (u.errors && Array.isArray(u.errors)
            ? (u.errors.forEach((E) => {
                const ye = E.field || E.name,
                  G = m.querySelector(`[name="${ye}"]`);
                G && ($(G, E.message), O(G), (ie = !0));
              }),
              ie && u.errors.every((E) => E.field || E.name)
                ? (f = "Please correct the highlighted errors.")
                : u.errors.length > 0 &&
                  (f =
                    ((n = u.errors.find((E) => !E.field && !E.name)) == null
                      ? void 0
                      : n.message) || f))
            : o.status === 400
              ? (f =
                  "Invalid data sent to the server. Please refresh and try again.")
              : o.status >= 500 &&
                (f = "A server error occurred. Please try again later."),
            l(f, "danger"),
            (r.disabled = !1),
            c.classList.add("d-none"),
            (i.textContent = "Submit Subscription"));
          return;
        }
        (console.log("Form submitted to Formspree successfully!"),
          l("Form submitted successfully! Redirecting...", "success"),
          setTimeout(() => {
            window.location.href = "success.html";
          }, 1500));
      } catch (s) {
        (console.error("Submission Error:", s.message, s.stack),
          l(`Submission failed: ${s.message}. Please try again.`, "danger"),
          (r.disabled = !1),
          c.classList.add("d-none"),
          (i.textContent = "Submit Subscription"));
      }
    });
    async function pe() {
      try {
        const t = await (await U("https://ipwho.is/")).json();
        (t.city && (document.getElementById("city").value = t.city),
          t.region && (document.getElementById("state").value = t.region),
          t.postal && (document.getElementById("postal-code").value = t.postal),
          b());
      } catch {
        l("Could not auto-fill address.", "warning");
      }
    }
    (B.show("onboardingModal"), de(), pe(), Q(), b());
    let d = {
      isVerified: !1,
      currentEmail: "",
      verificationToken: "",
      otpSent: !1,
      resendTimer: 0,
    };
    const g = document.getElementById("email"),
      y = document.getElementById("verify-email-btn"),
      D = new bootstrap.Modal(
        document.getElementById("emailVerificationModal"),
        { backdrop: "static", keyboard: !1 },
      ),
      ee = document.getElementById("verification-email"),
      T = document.getElementById("send-otp-btn"),
      S = document.getElementById("verify-otp-btn"),
      F = document.getElementById("resend-otp-btn"),
      h = document.getElementById("otp-input"),
      te = document.getElementById("email-unverified"),
      ne = document.getElementById("email-verified-badge"),
      re = document.getElementById("submit-email-icon"),
      x = document.getElementById("submit-help-text");
    function J() {
      d.isVerified
        ? (te.classList.add("d-none"),
          ne.classList.remove("d-none"),
          (y.innerHTML =
            '<i class="bi bi-check-circle-fill text-success"></i> Verified'),
          y.classList.remove("btn-outline-primary"),
          y.classList.add("btn-outline-success"),
          (y.disabled = !0),
          (r.disabled = !1),
          (re.className = "bi bi-send me-2"),
          (r.querySelector(".btn-text").innerHTML =
            '<i class="bi bi-send me-2"></i>Submit Subscription'),
          (x.innerHTML =
            '<i class="bi bi-check-circle-fill text-success me-1"></i>Ready to submit your subscription'),
          (x.className = "text-success"),
          (document.getElementById("email-verified").value = "true"),
          (document.getElementById("verification-token").value =
            d.verificationToken))
        : (te.classList.remove("d-none"),
          ne.classList.add("d-none"),
          (y.innerHTML = '<i class="bi bi-envelope-check"></i> Verify'),
          y.classList.add("btn-outline-primary"),
          y.classList.remove("btn-outline-success"),
          (y.disabled = !1),
          (r.disabled = !0),
          (re.className = "bi bi-envelope-exclamation me-2"),
          (r.querySelector(".btn-text").innerHTML =
            '<i class="bi bi-envelope-exclamation me-2"></i>Verify Email to Continue'),
          (x.innerHTML =
            '<i class="bi bi-info-circle me-1"></i>Please verify your email address before submitting the form'),
          (x.className = "text-muted"),
          (document.getElementById("email-verified").value = "false"),
          (document.getElementById("verification-token").value = ""));
    }
    function ge() {
      g.value.trim() !== d.currentEmail &&
        d.isVerified &&
        ((d.isVerified = !1),
        (d.currentEmail = ""),
        (d.verificationToken = ""),
        J(),
        l("Email changed. Please verify your new email address.", "warning"));
    }
    (g.addEventListener("input", () => {
      (ge(), N(g), b());
    }),
      y.addEventListener("click", () => {
        const e = g.value.trim();
        if (!e || !N(g)) {
          (l("Please enter a valid email address first.", "warning"),
            g.focus());
          return;
        }
        ((ee.value = e), (d.currentEmail = e), P(1), D.show());
      }));
    function P(e) {
      (document
        .querySelectorAll(".verification-step")
        .forEach((t) => t.classList.add("d-none")),
        document
          .getElementById(`verification-step-${e}`)
          .classList.remove("d-none"),
        e === 2 &&
          ((document.getElementById("sent-to-email").textContent =
            d.currentEmail),
          h.focus()));
    }
    (T.addEventListener("click", async () => {
      const e = ee.value.trim();
      if (!e) return;
      const t = T.querySelector(".btn-text"),
        n = T.querySelector(".spinner-border");
      ((T.disabled = !0),
        n.classList.remove("d-none"),
        (t.textContent = "Sending..."));
      try {
        const s = await fetch("/send-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: e }),
          }),
          a = await Z(s);
        if (s.ok && a.success) {
          ((d.otpSent = !0),
            l("Verification code sent to your email!", "success"),
            P(2));
          const o = Number(a.expiresIn) || 300,
            u = Number(a.resendAfter) || 60;
          (he(o), se(u));
        } else if (s.status === 429) {
          const o = Number(s.headers.get("Retry-After")),
            u = Number(a.retryAfter) || (isNaN(o) ? 60 : o) * 1e3,
            f = Math.ceil(u / 1e3);
          (l(
            `Too many requests. Please wait ${f}s before retrying.`,
            "warning",
          ),
            P(2),
            se(f));
        } else throw new Error(a.error || "Failed to send verification code");
      } catch (s) {
        (console.error("OTP send error:", s), l(s.message, "danger"));
      } finally {
        ((T.disabled = !1),
          n.classList.add("d-none"),
          (t.textContent = "Send Verification Code"));
      }
    }),
      S.addEventListener("click", async () => {
        const e = d.currentEmail,
          t = h.value.trim();
        if (!t || t.length !== 6) {
          (l("Please enter a 6-digit verification code.", "warning"),
            h.focus());
          return;
        }
        const n = S.querySelector(".btn-text"),
          s = S.querySelector(".spinner-border");
        ((S.disabled = !0),
          s.classList.remove("d-none"),
          (n.textContent = "Verifying..."));
        try {
          const a = await fetch("/verify-otp", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: e, otp: t }),
            }),
            o = await Z(a);
          if (a.ok && o.success)
            ((d.isVerified = !0),
              (d.verificationToken = o.verificationToken),
              l("Email verified successfully!", "success"),
              P(3),
              J(),
              setTimeout(() => {
                D.hide();
              }, 2e3));
          else {
            let u = o.error || "Invalid verification code";
            if (
              (typeof o.remainingAttempts == "number" &&
                (u += ` (${o.remainingAttempts} attempts left)`),
              o.code === "OTP_EXPIRED")
            ) {
              const f = document.getElementById("otp-countdown");
              f &&
                ((f.textContent = "Expired"),
                (f.className = "fw-bold text-danger"));
            }
            ((o.code === "TOO_MANY_ATTEMPTS" || o.remainingAttempts === 0) &&
              (S.disabled = !0),
              l(u, "danger"),
              h.classList.add("is-invalid"),
              (document.getElementById("otp-error").textContent = u));
            return;
          }
        } catch (a) {
          (console.error("OTP verification error:", a),
            l(a.message, "danger"),
            h.classList.add("is-invalid"),
            (document.getElementById("otp-error").textContent = a.message));
        } finally {
          ((S.disabled = !1),
            s.classList.add("d-none"),
            (n.textContent = "Verify Code"));
        }
      }),
      F.addEventListener("click", () => {
        d.resendTimer > 0 ||
          ((h.value = ""), h.classList.remove("is-invalid"), T.click());
      }),
      h.addEventListener("input", (e) => {
        let t = e.target.value.replace(/\D/g, "");
        (t.length > 6 && (t = t.slice(0, 6)),
          (e.target.value = t),
          e.target.classList.remove("is-invalid"),
          (document.getElementById("otp-error").textContent = ""),
          t.length === 6 && setTimeout(() => S.click(), 500));
      }));
    let R;
    function he(e = 300) {
      let t = Number(e);
      (!Number.isFinite(t) || t <= 0) && (t = 300);
      const n = document.getElementById("otp-countdown");
      (clearInterval(R),
        (R = setInterval(() => {
          const s = Math.floor(t / 60),
            a = t % 60;
          ((n.textContent = `${s}:${a.toString().padStart(2, "0")}`),
            t <= 0 &&
              (clearInterval(R),
              (n.textContent = "Expired"),
              (n.className = "fw-bold text-danger"),
              l(
                "Verification code expired. Please request a new one.",
                "warning",
              )),
            t--);
        }, 1e3)));
    }
    let V;
    function se(e = 60) {
      d.resendTimer = Number(e) || 60;
      const t = document.getElementById("resend-countdown"),
        n = document.getElementById("resend-timer");
      ((F.disabled = !0),
        t.classList.remove("d-none"),
        clearInterval(V),
        (V = setInterval(() => {
          ((n.textContent = d.resendTimer),
            d.resendTimer--,
            d.resendTimer < 0 &&
              (clearInterval(V),
              (F.disabled = !1),
              t.classList.add("d-none"),
              (d.resendTimer = 0)));
        }, 1e3)));
    }
    const ae = document.getElementById("change-email-link");
    (ae &&
      ae.addEventListener("click", () => {
        (D.hide(),
          setTimeout(() => {
            (g.scrollIntoView({ behavior: "smooth", block: "center" }),
              g.focus());
          }, 300));
      }),
      h.addEventListener("paste", (e) => {
        e.preventDefault();
        const n = (
          (
            (e.clipboardData || window.clipboardData).getData("text") || ""
          ).match(/\d/g) || []
        )
          .join("")
          .slice(0, 6);
        n && ((h.value = n), h.dispatchEvent(new Event("input")));
      }),
      J(),
      window.location.hostname === "localhost" &&
        m.querySelectorAll("input, select, textarea").forEach((e) => {
          e.addEventListener("change", () => {
            console.log("[FORM AUDIT]", "Field changed", {
              id: _(e.id),
              value: _(e.value),
            });
          });
        }));
  });
}
