//skripte Main-Page

// Button scrollt zu Services
(function () {
  const btn = document.getElementById('scroll-to-services');
  const target = document.getElementById('services');
  if (btn && target) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
})();


// Erzeugt / aktualisiert eine div.connector, die von der Unterseite des Buttons
// zur Oberseite des Bildes verbindet. Läuft bei Laden, Scroll und Resize.
(function () {
  function ensureConnector() {
    let c = document.querySelector('.connector');
    if (!c) {
      c = document.createElement('div');
      c.className = 'connector';
      document.body.appendChild(c);
    }
    return c;
  }

  function updateConnector() {
    const btn = document.querySelector('.hero .button');
    const img = document.querySelector('.image-section img');
    if (!btn || !img) return;

    const rectBtn = btn.getBoundingClientRect();
    const rectImg = img.getBoundingClientRect();

    // Start an der Unterkante des Buttons (mittig)
    const startX = rectBtn.left + rectBtn.width / 2 + window.scrollX;
    const startY = rectBtn.bottom + window.scrollY;
    // Ende an der Oberkante des Bildes (mittig)
    const endX = rectImg.left + rectImg.width / 2 + window.scrollX;
    const endY = rectImg.top + window.scrollY;

    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    const conn = ensureConnector();
    conn.style.width = length + 'px';
    conn.style.left = startX + 'px';
    // damit die Linie genau an startY zentriert ist, höhe halb abziehen
    const connHeight = parseFloat(getComputedStyle(conn).height) || 2;
    conn.style.top = (startY - connHeight / 2) + 'px';
    conn.style.transform = 'rotate(' + angle + 'deg)';
  }

  // initial + bei Resize/Scroll (debounced kurz)
  let timeout;
  function scheduleUpdate() {
    clearTimeout(timeout);
    timeout = setTimeout(updateConnector, 50);
  }

  window.addEventListener('load', updateConnector);
  window.addEventListener('resize', scheduleUpdate);
  window.addEventListener('scroll', scheduleUpdate);
  document.querySelectorAll('.image-section img').forEach(img => {
    if (!img.complete) img.addEventListener('load', scheduleUpdate);
  });
})();


  // Anfrage-Formular logique
  (function () {
    const anfragetypSel = document.getElementById("anfragetyp");

    function setupAbteilungenTwoStep() {
      const groupSel = document.getElementById("abteilungGroup");
      const deptSel = document.getElementById("abteilungSelect");
      if (!groupSel || !deptSel) return;

      const abteilungenUrl = new URL(
        "../data/abteilungen.json",
        (document.currentScript && document.currentScript.src) || location.href,
      ).href;
      fetch(abteilungenUrl, { cache: "no-store" })
        .then((res) => {
          if (!res.ok)
            throw new Error(
              "Konnte abteilungen.json nicht laden: " + res.status,
            );
          return res.json();
        })
        .then((json) => {
          const rows = Array.isArray(json?.data) ? json.data : [];
          const groups = new Map();

          rows.forEach((row) => {
            if (!Array.isArray(row) || row.length < 2) return;
            const id = normalize(row[0]);
            const rawName = normalize(row[1]);
            if (!id || !rawName) return;
            const displayName = cleanDisplayName(id, rawName);
            const groupLabel = categoryFor(id, displayName);
            if (!groups.has(groupLabel)) groups.set(groupLabel, []);
            groups.get(groupLabel).push({ id, name: displayName });
          });

          const groupLabels = Array.from(groups.keys()).sort((a, b) =>
            a.localeCompare(b, "de"),
          );
          groupSel
            .querySelectorAll("option:not([disabled])")
            .forEach((o) => o.remove());
          groupLabels.forEach((label) => {
            const opt = document.createElement("option");
            opt.value = label;
            opt.textContent = label;
            groupSel.appendChild(opt);
          });

          deptSel.disabled = true;

          groupSel.addEventListener("change", () => {
            const label = groupSel.value;
            deptSel.innerHTML =
              '<option value="" disabled selected>Bitte wählen</option>';
            deptSel.disabled = false;

            const items = (groups.get(label) ?? [])
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name, "de"));
            items.forEach((item) => {
              const opt = document.createElement("option");
              opt.value = item.id;
              opt.textContent = item.name;
              deptSel.appendChild(opt);
            });
          });
        })
        .catch(console.warn);
    }

    function normalize(s) {
      return String(s ?? "")
        .replace(/\uFEFF/g, "")
        .replace(/\x00/g, "")
        .trim();
    }

    function cleanDisplayName(id, name) {
      let n = normalize(name);
      const i = normalize(id);
      if (n.startsWith(i)) n = n.slice(i.length).trim();
      return n.replace(/^\s*-\s*/, "").trim();
    }

    function categoryFor(id) {
      const cu = String(id).toUpperCase();
      if (cu.startsWith("9FL")) return "Lehrstühle";

      const m = cu.match(/^(\d+)/);
      if (!m) return "Weitere";
      const n = parseInt(m[1], 10);

      if (n >= 80 && n < 100) return "MIT";
      if (n >= 801 && n < 806) return "MIT";
      if (n >= 200 && n < 300) return "Pflege";
      if (n >= 300 && n < 304) return "Anästhesiologie";
      if (n === 601) return "Anästhesiologie";
      if (n >= 304 && n < 310) return "Palliativmedizin";
      if (n === 320) return "Institut f. Laboratoriumsmed./Mikrob./Umwelth.";
      if (n === 330) return "Institut für Digitale Medizin (IDM)";
      if (n === 375) return "Institut für Humangenetik";
      if (n === 310) return "MVZ Nuklearmed. und Strahlenklinik";
      if (n === 690) return "Physiotherapie und Ergotherapie";
      if (n === 340) return "Klinik f. Diagnostische Radiologie u. Neurorad.";
      if (n === 350) return "Klinik für Strahlentherapie";
      if (n === 360) return "Klinik für Nuklearmedizin";
      if (n === 390) return "Institut für Pathologie und molekulare Diagnostik";
      if (n >= 400 && n < 500) return "Chirurgisches Zentrum";
      if (n === 550) return "Neurologie";
      if (n >= 500 && n < 550) return "Allgemeinmedizinische Akutpraxis (AMAP)";
      if (n >= 630 && n < 632) return "Zentrale Notaufnahme";
      if (n >= 700 && n < 800) return "Kinderklinik";
      if (n >= 800 && n < 900) return "MedizinCampus Süd";
      return "Weitere";
    }

    if (anfragetypSel) {
      const dyn = document.getElementById("dynamisch");
      anfragetypSel.addEventListener("change", function () {
        if (!dyn) return;
        const typ = this.value;
        dyn.innerHTML = "";

        const templates = {
          "Zugang ins Forschungsnetz": `
          <div class="row">
            <div class="col-6 col-12-xsmall">
              <label>Bereich</label>
              <select id="abteilungGroup" required>
                <option value="" disabled selected>Bitte wählen</option>
              </select>
              
              <label style="margin-top: 1.5rem;">Abteilung</label>
              <select id="abteilungSelect" name="abteilung" required disabled>
                <option value="" disabled selected>Bitte zuerst Bereich wählen</option>
              </select>
            </div>
            
            <div class="col-6 col-12-xsmall">
              <label>Berechtigung auf einen Fileshare</label>
              <input type="text" name="berechtigung" placeholder="Fileshare (optional)">
            </div>
            
            <div class="col-12" style="margin-top: 1.5rem;">
              <label>PKZ (optional)</label>
              <input type="text" name="pkz" placeholder="PKZ">
            </div>
          </div>`
        };

        if (templates[typ]) dyn.innerHTML = templates[typ];

        if (typ === "Zugang ins Forschungsnetz") {
          setupAbteilungenTwoStep();
        }

        if (typ === "zertifikat") {
          const details = document.getElementById("zert-details");
          const zertArt = document.getElementById("zert-art");
          if (zertArt) {
            zertArt.addEventListener("change", () => {
              if (!details) return;
              if (zertArt.value === "neu") {
                details.innerHTML = `<div class="row"><div class="col-6 col-12-xsmall"><label>Hostname</label><input type="text" name="hostname" required></div><div class="col-6 col-12-xsmall"><label>Zertifikatstyp</label><select name="cert_typ" required><option disabled selected>Bitte wählen</option><option value="intern">Intern</option><option value="extern">Extern</option></select></div></div>`;
              } else if (zertArt.value === "verlaengerung") {
                details.innerHTML = `<div class="row"><div class="col-12"><label>Hostname</label><input type="text" name="hostname" required></div></div>`;
              } else {
                details.innerHTML = "";
              }
            });
          }
        }
      });
    }

    const projektForm = document.querySelector('form[name="projekt"]');
    const modal = document.getElementById("confirmModal");
    const modalText = document.getElementById("modalText");
    const downloadBtn = document.getElementById("downloadBtn");
    const closeBtn = document.getElementById("closeBtn");
    const closeX = document.querySelector(".modal-close");

    function gatherFormData(f) {
      const lines = [];
      const elements = Array.from(f.elements).filter(
        (el) => el.name && !el.disabled,
      );
      elements.forEach((el) => {
        let value = "";
        if (el.type === "checkbox") value = el.checked ? "Ja" : "Nein";
        else if (el.type === "radio") {
          if (el.checked) value = el.value;
          else return;
        } else value = el.value || "";

        let label = el.getAttribute("name") || "";
        const lab = f.querySelector('label[for="' + el.id + '"]');
        if (lab) label = lab.textContent.trim();
        else if (el.parentElement) {
          const p = el.parentElement.querySelector("label");
          if (p) label = p.textContent.trim();
        }

        lines.push(label + ": " + value);
      });
      return lines.join("\n");
    }

    function showModal(text) {
      if (!modal || !modalText) return;
      modalText.textContent = text;
      modal.removeAttribute("hidden");
      document.body.style.overflow = "hidden";
      modalText.focus();
    }

    function hideModal() {
      if (!modal) return;
      modal.setAttribute("hidden", "");
      document.body.style.overflow = "";
    }

    if (projektForm && modal && modalText) {
      projektForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const txt = gatherFormData(projektForm);
        showModal(txt);
      });

      if (closeBtn) closeBtn.addEventListener("click", hideModal);
      if (closeX) closeX.addEventListener("click", hideModal);

      modal.addEventListener("click", function (e) {
        if (e.target === modal) hideModal();
      });

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && !modal.hasAttribute("hidden")) hideModal();
      });

      if (downloadBtn) {
        downloadBtn.addEventListener("click", function () {
          const content = modalText.textContent || "";
          const blob = new Blob([content], {
            type: "text/plain;charset=utf-8",
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          const now = new Date();
          const stamp = now.toISOString().slice(0, 19).replace(/[:T]/g, "-");
          a.href = url;
          a.download = "anfrage-" + stamp + ".txt";
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          hideModal();
        });
      }
    }
  })();
// Skript Datenhaltung & Infrastruktur

// FAQ Boxen öffnen und schließen
const questions = document.querySelectorAll(".faq-question");

questions.forEach(q => {
  q.addEventListener("click", () => {
    const parent = q.parentElement;
    const answer = parent.querySelector(".faq-answer");
    const icon = q.querySelector(".faq-icon");

    // Prüfen, ob die Box bereits offen ist
    const isOpen = answer.classList.contains("open");

    // Alle anderen Boxen schließen (Optional, für Ordnung)
    // document.querySelectorAll('.faq-answer').forEach(el => {
    //    el.style.maxHeight = null;
    //    el.classList.remove('open');
    // });

    if (!isOpen) {
      answer.classList.add("open");
      // Setzt die exakte Höhe des Inhalts in Pixeln
      answer.style.maxHeight = answer.scrollHeight + "px";
      icon.textContent = "-";
    } else {
      answer.classList.remove("open");
      // Setzt die Höhe zurück auf 0 für ein flüssiges Zuziehen
      answer.style.maxHeight = null;
      icon.textContent = "+";
    }
  });
});


//Skript About-Us Seite

// Logik für das Scrollen mit den Pfeilen
const carousel = document.getElementById('carousel');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

const scrollAmount = 245;

nextBtn.addEventListener('click', () => {
  carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
});

prevBtn.addEventListener('click', () => {
  carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
});