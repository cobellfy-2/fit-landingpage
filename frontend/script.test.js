/**
 * @jest-environment jsdom
 */
// Importiert die Funktionen aus deiner script.js
// Test Funktion abfrage Abteilungen und Berreiche
const { normalize, cleanDisplayName, categoryFor } = require('./www/assets/js/script');

describe('Frontend Skript Logik Tests', () => {

    describe('Funktion: normalize()', () => {
        test('entfernt normale Leerzeichen am Anfang und Ende', () => {
            expect(normalize('  Testwort  ')).toBe('Testwort');
        });

        test('entfernt unsichtbare BOM Zeichen', () => {
            expect(normalize('\uFEFFHalloWelt')).toBe('HalloWelt');
        });

        test('wandelt null und undefined sicher in leere Strings um', () => {
            expect(normalize(null)).toBe('');
            expect(normalize(undefined)).toBe('');
        });
    });

    describe('Funktion: cleanDisplayName()', () => {
        test('entfernt die ID vom Anfang des Namens', () => {
            expect(cleanDisplayName('123', '123 - Chirurgie')).toBe('Chirurgie');
        });

        test('funktioniert auch ohne Bindestrich', () => {
            expect(cleanDisplayName('9FL', '9FL Lehrstuhl Test')).toBe('Lehrstuhl Test');
        });

        test('lässt Namen in Ruhe, wenn die ID nicht am Anfang steht', () => {
            expect(cleanDisplayName('99', 'Chirurgie 99')).toBe('Chirurgie 99');
        });
    });

    describe('Funktion: categoryFor()', () => {
        test('erkennt Lehrstühle an der Kennung 9FL', () => {
            expect(categoryFor('9FL001')).toBe('Lehrstühle');
            expect(categoryFor('9flabc')).toBe('Lehrstühle'); // Checkt Groß/Kleinschreibung
        });

        test('ordnet Zahlenbereich 80-99 dem MIT zu', () => {
            expect(categoryFor('85')).toBe('MIT');
            expect(categoryFor('99')).toBe('MIT');
        });

        test('ordnet Zahlenbereich 700-799 der Kinderklinik zu', () => {
            expect(categoryFor('700')).toBe('Kinderklinik');
            expect(categoryFor('750')).toBe('Kinderklinik');
            expect(categoryFor('799')).toBe('Kinderklinik');
        });

        test('ordnet Einzel-IDs korrekt zu (z.B. ZNA = 630, 631)', () => {
            expect(categoryFor('630')).toBe('Zentrale Notaufnahme');
            expect(categoryFor('631')).toBe('Zentrale Notaufnahme');
        });

        test('fällt auf "Weitere" zurück, wenn der Code nicht zugeordnet werden kann', () => {
            expect(categoryFor('10')).toBe('Weitere'); // Zu niedrig
            expect(categoryFor('900')).toBe('Weitere'); // Zu hoch
            expect(categoryFor('ABC')).toBe('Weitere'); // Keine Zahlen
        });
    });

});

// Test Download und Pop-Up

describe('UI Tests: Formular und Modal', () => {
    
    // beforeEach wird VOR jedem einzelnen Test ausgeführt
    beforeEach(() => {
      // WICHTIG: Setzt den Zwischenspeicher zurück, damit deine script.js 
      // bei jedem Test frisch geladen wird und die Events neu bindet.
      jest.resetModules();

      // 1. Wir bauen ein künstliches "Mini-HTML", das exakt deine IDs und Namen nutzt
      document.body.innerHTML = `
        <form name="projekt">
          <div>
            <label for="vorname">Vorname</label>
            <input type="text" id="vorname" name="Vorname" value="Max Mustermann">
          </div>
          <div>
            <label for="datenschutz">Datenschutz akzeptiert</label>
            <input type="checkbox" id="datenschutz" name="Datenschutz" checked>
          </div>
          <button type="submit">Senden</button>
        </form>

        <div id="confirmModal" hidden>
          <div id="modalText"></div>
          <button id="closeBtn">Schließen</button>
          <button id="downloadBtn">Download</button>
          <button class="modal-close">X</button>
        </div>
      `;

      // 2. Jetzt laden wir dein Skript, damit es die <form> und das Modal findet!
      require('./www/assets/js/script');
    });

    test('Formular-Submit wertet Daten aus und öffnet das Modal', () => {
      const form = document.querySelector('form[name="projekt"]');
      const modal = document.getElementById('confirmModal');
      const modalText = document.getElementById('modalText');

      // 3. Wir simulieren das Absenden des Formulars
      const submitEvent = new window.Event('submit', { cancelable: true });
      form.dispatchEvent(submitEvent);

      // 4. Prüfen: Wurde das "hidden" Attribut vom Modal entfernt?
      expect(modal.hasAttribute('hidden')).toBe(false);

      // 5. Prüfen: Wurde der Hintergrund gegen Scrollen gesperrt?
      expect(document.body.style.overflow).toBe('hidden');

      // 6. Prüfen: Hat die gatherFormData Funktion die Werte richtig ausgelesen?
      // "Vorname: Max Mustermann" und "Datenschutz akzeptiert: Ja" (weil checked)
      expect(modalText.textContent).toContain('Vorname: Max Mustermann');
      expect(modalText.textContent).toContain('Datenschutz akzeptiert: Ja');
    });

    test('Klick auf den Schließen-Button blendet das Modal wieder aus', () => {
      const form = document.querySelector('form[name="projekt"]');
      const modal = document.getElementById('confirmModal');
      const closeBtn = document.getElementById('closeBtn');

      // Modal erst öffnen
      form.dispatchEvent(new window.Event('submit', { cancelable: true }));
      expect(modal.hasAttribute('hidden')).toBe(false);

      // Dann auf "Schließen" klicken
      closeBtn.dispatchEvent(new window.Event('click'));

      // Prüfen: Ist das "hidden" Attribut wieder da und kann man wieder scrollen?
      expect(modal.hasAttribute('hidden')).toBe(true);
      expect(document.body.style.overflow).toBe('');
    });
  });