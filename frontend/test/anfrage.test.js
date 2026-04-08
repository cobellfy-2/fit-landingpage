/**
 * @jest-environment jsdom
 */

/* ==============================================================================
 * TEST SUITE: Formularvalidierung Serviceanfrage (anfrage.html)
 * ==============================================================================
 * Prüft statische HTML5-Validierungen, dynamisches DOM-Rendering sowie 
 * grundlegende Sicherheitsmechanismen (XSS- und Overflow-Protection).
 */

describe('Integration Tests: Formularvalidierung der Serviceanfrage', () => {
    let form, vorname, nachname, email, anfragetyp;

    /**
     * Hilfsfunktion: Triggert programmatisch das Change-Event, 
     * um dynamisch abhängige DOM-Knoten zu generieren.
     */
    function aktiviereNetzZugang() {
        anfragetyp.value = "Zugang ins Forschungsnetz";
        anfragetyp.dispatchEvent(new window.Event('change'));
    }

    beforeEach(() => {
        // Reset des Modul-Caches zur Vermeidung von Seiteneffekten zwischen Tests
        jest.resetModules();

        // Setup: Mocking der fetch-API zur Isolation von Netzwerkaufrufen im JSDOM
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ data: [] }),
            })
        );

        // Setup: Injektion der initialen DOM-Fixture
        document.body.innerHTML = `
      <form name="projekt" method="POST">
        <input type="text" name="vorname" required>
        <input type="text" name="nachname" required>
        <input type="text" name="titel">
        <input type="email" name="email" required>
        
        <select id="anfragetyp" name="anfragetyp" required>
          <option value="" disabled selected>--select--</option>
          <option value="Zugang ins Forschungsnetz">Zugang ins Forschungsnetz</option>
        </select>
        
        <div id="dynamisch"></div>
        <button type="submit">Download</button>
      </form>

      <div id="confirmModal" hidden>
        <pre id="modalText"></pre>
      </div>
    `;
        
        // Import der Business-Logik zur Initialisierung der Event-Listener
        require('../www/assets/js/script');

        // Setup: Caching der DOM-Knoten-Referenzen
        form = document.querySelector('form[name="projekt"]');
        vorname = document.querySelector('input[name="vorname"]');
        nachname = document.querySelector('input[name="nachname"]');
        email = document.querySelector('input[name="email"]');
        anfragetyp = document.querySelector('#anfragetyp');
    });

    /* ========================================================================== */

    describe('Basis-Felder (Statische HTML-Validierung)', () => {
        test('Sollte das Formular als ungültig markieren, wenn Pflichtfelder leer sind', () => {
            // Assert: HTML5 'required' Constraint-Validierung
            expect(form.checkValidity()).toBe(false);
            expect(vorname.validity.valueMissing).toBe(true);
            expect(nachname.validity.valueMissing).toBe(true);
        });

        test('Sollte ungültige E-Mail-Formate ablehnen', () => {
            // Arrange
            email.value = "max.mustermann.ohne.at";
            
            // Assert: HTML5 'type' Constraint-Validierung
            expect(email.validity.typeMismatch).toBe(true);
            expect(form.checkValidity()).toBe(false);
        });

        test('Sollte korrekte E-Mail-Formate akzeptieren', () => {
            // Arrange
            email.value = "max.mustermann@uk-augsburg.de";
            
            // Assert
            expect(email.validity.typeMismatch).toBe(false);
        });
    });

    /* ========================================================================== */

    describe('Dynamische Formularfelder (PKZ-Logik)', () => {
        test('Sollte das PKZ-Feld ins DOM rendern', () => {
            // Act
            aktiviereNetzZugang();
            
            // Assert
            expect(document.querySelector('input[name="pkz"]')).not.toBeNull();
        });

        test('Sollte PKZ-Eingaben unter 5 Ziffern ablehnen', () => {
            // Arrange
            aktiviereNetzZugang();
            const pkz = document.querySelector('input[name="pkz"]');

            // Act
            pkz.value = "1234";
            
            // Assert: Überprüfung der Regex-Pattern-Vorgaben
            expect(pkz.validity.patternMismatch).toBe(true);
        });

        test('Sollte alphabetische Eingaben im PKZ-Feld ablehnen', () => {
            // Arrange
            aktiviereNetzZugang();
            const pkz = document.querySelector('input[name="pkz"]');

            // Act
            pkz.value = "ABCDE";
            
            // Assert: Überprüfung der Typ-Sicherheit (nur numerisch)
            expect(pkz.validity.patternMismatch).toBe(true);
        });

        test('Sollte eine exakt 5-stellige numerische PKZ akzeptieren', () => {
            // Arrange
            aktiviereNetzZugang();
            const pkz = document.querySelector('input[name="pkz"]');

            // Act
            pkz.value = "12345";
            
            // Assert
            expect(pkz.validity.patternMismatch).toBe(false);
            expect(pkz.validity.valid).toBe(true);
        });
    });

    /* ========================================================================== */

    describe('Sicherheits-Tests (Security & Resilience)', () => {
        test('Verhindert HTML/JS-Injection (Cross-Site Scripting) in Eingabefeldern', () => {
            // Arrange: Setup einer XSS-Payload
            const maliciousPayload = "<script>alert('Dein System wurde gehackt!');</script>";

            vorname.value = maliciousPayload;
            nachname.value = "Hacker";
            email.value = "hacker@uk-augsburg.de";

            // Act: Submit-Event triggern
            form.dispatchEvent(new window.Event('submit', { cancelable: true }));

            // Assert: Auswertung der DOM-Ausgabe
            const modalText = document.getElementById('modalText');

            // 1. Verifikation der reinen Textausgabe (ohne Ausführung)
            expect(modalText.textContent).toContain(maliciousPayload);

            // 2. Verifikation des HTML-Escapings (Umwandlung in HTML-Entitäten)
            expect(modalText.innerHTML).toContain("&lt;script&gt;alert('Dein System wurde gehackt!');&lt;/script&gt;");
        });

        test('Verkraftet extrem lange Eingaben ohne abzustürzen (Boundary / Overflow-Testing)', () => {
            // Arrange: Generierung eines Boundary-Test-Strings
            const massiveString = "A".repeat(10000);

            vorname.value = massiveString;
            nachname.value = "Test";
            email.value = "test@uk-augsburg.de";

            // Act & Assert: Evaluierung der Laufzeitstabilität unter extremer Last
            expect(() => {
                form.dispatchEvent(new window.Event('submit', { cancelable: true }));
            }).not.toThrow();

            // Assert: Verifikation der erfolgreichen Datenverarbeitung
            const modalText = document.getElementById('modalText');
            expect(modalText.textContent).toContain('Test');
        });
    });

    /* ========================================================================== */

    describe('End-to-End Formular Status', () => {
        test('Sollte form.checkValidity() als TRUE evaluieren, wenn alle Bedingungen erfüllt sind', () => {
            // Arrange: Validen Datensatz aufbauen
            vorname.value = "Max";
            nachname.value = "Mustermann";
            email.value = "max.mustermann@uk-augsburg.de";

            aktiviereNetzZugang();

            const abteilungGroup = document.querySelector('#abteilungGroup');
            const abteilungSelect = document.querySelector('#abteilungSelect');
            const pkz = document.querySelector('input[name="pkz"]');

            // Setup: Abhängige Dropdowns mit gültigen Fixture-Werten versehen
            abteilungGroup.innerHTML = '<option value="MIT">MIT</option>';
            abteilungGroup.value = "MIT";

            abteilungSelect.disabled = false;
            abteilungSelect.innerHTML = '<option value="85">IT-Abteilung</option>';
            abteilungSelect.value = "85";

            pkz.value = "98765";

            // Assert: Finale Constraint-Evaluierung
            expect(form.checkValidity()).toBe(true);
        });
    });
});