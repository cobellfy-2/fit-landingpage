/**
 * @jest-environment jsdom
 */

/* ==============================================================================
 * TEST SUITE: Core Logic & UI Integration (script.js)
 * ==============================================================================
 * Beinhaltet Unit-Tests für reine Datenverarbeitungsfunktionen (Pure Functions) 
 * sowie Integrationstests für das Projektformular und Modal-Interaktionen im DOM.
 */

const { normalize, cleanDisplayName, categoryFor } = require('../www/assets/js/script');

describe('Unit Tests: Core Business Logik', () => {

    describe('Funktion: normalize()', () => {
        test('entfernt normale Leerzeichen am Anfang und Ende', () => {
            // Assert: Trim-Funktionalität prüfen
            expect(normalize('  Testwort  ')).toBe('Testwort');
        });

        test('entfernt unsichtbare BOM Zeichen', () => {
            // Assert: Byte Order Mark (BOM) Bereinigung
            expect(normalize('\uFEFFHalloWelt')).toBe('HalloWelt');
        });

        test('wandelt null und undefined sicher in leere Strings um', () => {
            // Assert: Type Coercion und Null-Safety
            expect(normalize(null)).toBe('');
            expect(normalize(undefined)).toBe('');
        });
    });

    describe('Funktion: cleanDisplayName()', () => {
        test('entfernt die ID vom Anfang des Namens', () => {
            // Assert: Extraktion des reinen Display-Namens bei Standardformatierung
            expect(cleanDisplayName('123', '123 - Chirurgie')).toBe('Chirurgie');
        });

        test('funktioniert auch ohne Bindestrich', () => {
            // Assert: Toleranz bei fehlenden Trennzeichen
            expect(cleanDisplayName('9FL', '9FL Lehrstuhl Test')).toBe('Lehrstuhl Test');
        });

        test('lässt Namen in Ruhe, wenn die ID nicht am Anfang steht', () => {
            // Assert: String bleibt unverändert bei abweichendem Pattern
            expect(cleanDisplayName('99', 'Chirurgie 99')).toBe('Chirurgie 99');
        });
    });

    describe('Funktion: categoryFor()', () => {
        test('erkennt Lehrstühle an der Kennung 9FL', () => {
            // Assert: Alphanumerisches Präfix-Mapping (Case-Insensitive)
            expect(categoryFor('9FL001')).toBe('Lehrstühle');
            expect(categoryFor('9flabc')).toBe('Lehrstühle'); 
        });

        test('ordnet Zahlenbereich 80-99 dem MIT zu', () => {
            // Assert: Boundary Testing (Grenzwerte) für den MIT-Bereich
            expect(categoryFor('85')).toBe('MIT');
            expect(categoryFor('99')).toBe('MIT');
        });

        test('ordnet Zahlenbereich 700-799 der Kinderklinik zu', () => {
            // Assert: Boundary Testing für den Kinderklinik-Bereich
            expect(categoryFor('700')).toBe('Kinderklinik');
            expect(categoryFor('750')).toBe('Kinderklinik');
            expect(categoryFor('799')).toBe('Kinderklinik');
        });

        test('ordnet Einzel-IDs korrekt zu (z.B. ZNA = 630, 631)', () => {
            // Assert: Spezifisches ID-Mapping
            expect(categoryFor('630')).toBe('Zentrale Notaufnahme');
            expect(categoryFor('631')).toBe('Zentrale Notaufnahme');
        });

        test('fällt auf "Weitere" zurück, wenn der Code nicht zugeordnet werden kann', () => {
            // Assert: Fallback-Logik (Default-Case) für ungemappte oder fehlerhafte Werte
            expect(categoryFor('10')).toBe('Weitere'); // Wert unterhalb gemappter Range
            expect(categoryFor('900')).toBe('Weitere'); // Wert oberhalb gemappter Range
            expect(categoryFor('ABC')).toBe('Weitere'); // Invalid Type (Nicht-numerisch)
        });
    });

});

/* ========================================================================== */

describe('Integration Tests: Formularauswertung und Modal UI', () => {
    
    beforeEach(() => {
      // Reset des Modul-Caches zur Vermeidung von Seiteneffekten zwischen Tests
      jest.resetModules();

      // Setup: Injektion der initialen DOM-Fixture
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

      // Dynamischer Import des Target-Skripts zur Initialisierung der Event-Listener
      require('../www/assets/js/script');
    });

    test('Formular-Submit wertet Daten aus und öffnet das Modal', () => {
      // Arrange: DOM-Referenzen cachen
      const form = document.querySelector('form[name="projekt"]');
      const modal = document.getElementById('confirmModal');
      const modalText = document.getElementById('modalText');

      // Act: Submit-Event programmatisch auslösen
      const submitEvent = new window.Event('submit', { cancelable: true });
      form.dispatchEvent(submitEvent);

      // Assert: Verifikation der UI-Zustandsänderungen (Modal-Sichtbarkeit und Body-Lock)
      expect(modal.hasAttribute('hidden')).toBe(false);
      expect(document.body.style.overflow).toBe('hidden');

      // Assert: Verifikation der korrekten Datenextraktion (Checkbox und Input Node-Values)
      expect(modalText.textContent).toContain('Vorname: Max Mustermann');
      expect(modalText.textContent).toContain('Datenschutz akzeptiert: Ja');
    });

    test('Klick auf den Schließen-Button blendet das Modal wieder aus', () => {
      // Arrange: DOM-Referenzen cachen und initialen "Geöffnet"-Zustand herstellen
      const form = document.querySelector('form[name="projekt"]');
      const modal = document.getElementById('confirmModal');
      const closeBtn = document.getElementById('closeBtn');

      form.dispatchEvent(new window.Event('submit', { cancelable: true }));
      expect(modal.hasAttribute('hidden')).toBe(false); // Sanity Check

      // Act: Click-Event auf Schließen-Element simulieren
      closeBtn.dispatchEvent(new window.Event('click'));

      // Assert: Verifikation des UI-Resets (Modal wieder versteckt, Body-Scroll freigegeben)
      expect(modal.hasAttribute('hidden')).toBe(true);
      expect(document.body.style.overflow).toBe('');
    });
});