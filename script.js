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


//verschiedene Eingabemöglichkeiten je nach Typ der Anfrage
const anfrageTyp = document.getElementById("anfragetyp");
if (anfrageTyp) {
  anfrageTyp.addEventListener("change", function () {
    const dyn = document.getElementById("dynamisch");
    const typ = this.value;

    dyn.innerHTML = ""; // Reset

    /* ===================== FIT AD USERANLAGE ===================== */
    /* Berechtigung auf einen Fileshare BOX
    <div class="col-6 col-12-xsmall">
                    <label>Berechtigung auf einen Fileshare</label>
                    <select name="berechtigung" required>
                        <option value="" disabled selected>Fileshare(optional)</option>
                    </select>
                </div>*/
    if (typ === "Zugang ins Forschungsnetz") {
      dyn.innerHTML = `
            <div class="row">

                <div class="col-6 col-12-xsmall">
                    <label>Abteilung</label>
                    <select name="abteilung" required>
                        <option value="" disabled selected>Bitte wählen…</option>
                        <option value="2.Med">2.Med</option>
                        <option value="Biobank">Biobank</option>
                        <option value="CDS">CDS</option>
                        <option value="CDS-SAFICU">CDS-SAFICU</option>
                        <option value="IDM">IDM</option>
                        <option value="ILM-Mikrobiologie">ILM - Mikrobiologie</option>
                        <option value="INLET">INLET</option>
                        <option value="MeDiz">MeDiz</option>
                        <option value="Pathologie">Pathologie</option>
                        <option value="NUK">NUK</option>
                        <option value="Radiologie">Radiologie</option>
                        <option value="ALPS">ALPS</option>
                        <option value="MVB">MVB</option>
                        <option value="Anästhesie">Anästhesie</option>
                        <option value="Umweltmedizin">Umweltmedizin</option>
                    </select>
                </div>

                

                <div class="col-6 col-12-xsmall">
                    <label>PKZ (optional)</label>
                    <input type="text" name="pkz" placeholder="PKZ" maxlength="5" pattern="\\d{5}" inputmode="numeric" title="Die PKZ muss genau 5 Ziffern enthalten.">
                </div>
            </div>
        `;
    }
  });
}


//Modal erstellen
(function () {
  const form = document.querySelector('form[name="projekt"]');
  const modal = document.getElementById('confirmModal');
  const modalText = document.getElementById('modalText');
  const downloadBtn = document.getElementById('downloadBtn');
  const closeBtn = document.getElementById('closeBtn');
  const closeX = document.querySelector('.modal-close');

  if (!form || !modal) return;

  //Daten sammeln
  function gatherFormData(f) {
    const lines = [];
    const elements = Array.from(f.elements).filter(el => el.name && !el.disabled);

    elements.forEach(el => {
      let value = '';
      if (el.type === 'checkbox') value = el.checked ? 'Ja' : 'Nein';
      else if (el.type === 'radio') { if (el.checked) value = el.value; else return; }
      else value = el.value || '';

      // Friendly label: try to find a preceding label text
      let label = el.getAttribute('name');
      const lab = f.querySelector('label[for="' + el.id + '"]');
      if (lab) label = lab.textContent.trim();
      else if (el.parentElement) {
        const p = el.parentElement.querySelector('label');
        if (p) label = p.textContent.trim();
      }

      lines.push(label + ': ' + value);
    });

    return lines.join('\n');
  }

  //Modal anzeigen
  function showModal(text) {
    modalText.textContent = text;
    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    modalText.focus();
  }

  //Modal verstecken
  function hideModal() {
    modal.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const txt = gatherFormData(form);
    showModal(txt);
  });



  if (closeBtn) closeBtn.addEventListener('click', hideModal);
  if (closeX) closeX.addEventListener('click', hideModal);

  // Klick auf Overlay (außerhalb des Dialogs) soll Modal schließen
  modal.addEventListener('click', function (e) {
    if (e.target === modal) hideModal();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hasAttribute('hidden')) hideModal();
  });

  //Modal downloaden
  if (downloadBtn) downloadBtn.addEventListener('click', function () {
    const content = modalText.textContent || '';
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const now = new Date();
    const stamp = now.toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.href = url;
    a.download = 'anfrage-' + stamp + '.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    hideModal();
  });
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


// Exportiere die Funktion NUR, wenn Node.js/Jest läuft.
// Im normalen Browser wird dieser Block einfach ignoriert.
// jede öffentliche Funktion muss hier eingefügt werden um getestet zu werden
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {};
}