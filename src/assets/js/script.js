(function () {
  // smooth scroll from hero button to services
  const scrollBtn = document.getElementById("scroll-to-services");
  const scrollTarget = document.getElementById("services");
  if (scrollBtn && scrollTarget) {
    scrollBtn.addEventListener("click", function (e) {
      e.preventDefault();
      scrollTarget.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  // connector line between hero button and image
  (function () {
    function ensureConnector() {
      let c = document.querySelector(".connector");
      if (!c) {
        c = document.createElement("div");
        c.className = "connector";
        document.body.appendChild(c);
      }
      return c;
    }

    function updateConnector() {
      const btn = document.querySelector(".hero .button");
      const img = document.querySelector(".image-section img");
      if (!btn || !img) return;

      const rectBtn = btn.getBoundingClientRect();
      const rectImg = img.getBoundingClientRect();
      const startX = rectBtn.left + rectBtn.width / 2 + window.scrollX;
      const startY = rectBtn.bottom + window.scrollY;
      const endX = rectImg.left + rectImg.width / 2 + window.scrollX;
      const endY = rectImg.top + window.scrollY;

      const dx = endX - startX;
      const dy = endY - startY;
      const length = Math.hypot(dx, dy);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      const conn = ensureConnector();
      conn.style.width = length + "px";
      conn.style.left = startX + "px";
      const connHeight = parseFloat(getComputedStyle(conn).height) || 2;
      conn.style.top = startY - connHeight / 2 + "px";
      conn.style.transform = "rotate(" + angle + "deg)";
    }

    let timeout;
    function scheduleUpdate() {
      clearTimeout(timeout);
      timeout = setTimeout(updateConnector, 50);
    }

    window.addEventListener("load", updateConnector);
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate);
    document.querySelectorAll(".image-section img").forEach((img) => {
      if (!img.complete) img.addEventListener("load", scheduleUpdate);
    });
  })();

  // FAQ Accordion
  (function () {
    const questions = document.querySelectorAll(".faq-question");
    if (!questions.length) return;

    questions.forEach((q) => {
      q.addEventListener("click", () => {
        const parent = q.parentElement;
        const answer = parent?.querySelector(".faq-answer");
        const icon = q.querySelector(".faq-icon");
        if (!answer || !icon) return;

        answer.classList.toggle("open");
        icon.textContent = answer.classList.contains("open") ? "" : "+";
      });
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
          "fit-ad": `<div class="row"><div class="col-6 col-12-xsmall"><label>Bereich</label><select id="abteilungGroup" required><option value="" disabled selected>Bitte wählen</option></select><label>Abteilung</label><select id="abteilungSelect" name="abteilung" required disabled><option value="" disabled selected>Bitte zuerst Bereich wählen</option></select></div><div class="col-6 col-12-xsmall"><label>Berechtigung auf einen Fileshare</label><input name="berechtigung"><option value="" disabled selected>Fileshare(optional)</option></input></div><div class="col-12"><label>PKZ (optional)</label><input type="text" name="pkz" placeholder="PKZ"></div></div>`,
          zertifikat: `<div class="row"><div class="col-12"><label>Art der Ausstellung</label><select id="zert-art" name="zert_art" required><option disabled selected>Bitte wählen</option><option value="neu">Neu</option><option value="verlaengerung">Verlängerung</option></select></div><div id="zert-details" class="col-12"></div><div class="col-12" style="color:#666;font-size:0.9em;">Hinweis: Private Schlüssel werden von uns generiert. Fremdschlüssel werden nicht akzeptiert.</div></div>`,
          sonstiges: `<div class="row"><div class="col-12"><label>Beschreibung</label><textarea name="kommentar" required placeholder="Ihr Anliegen"></textarea></div></div>`,
        };

        if (templates[typ]) dyn.innerHTML = templates[typ];

        if (typ === "fit-ad") {
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
})();
