/**
 * @jest-environment jsdom
 */

describe('Integration Tests: Formularvalidierung der Serviceanfrage', () => {
    let form, vorname, nachname, email, anfragetyp;

    function aktiviereNetzZugang() {
        anfragetyp.value = "Zugang ins Forschungsnetz";
        anfragetyp.dispatchEvent(new window.Event('change'));
    }

    beforeEach(() => {
        jest.resetModules();

        // fetch mocken, da JSDOM keine echten Netzwerkanfragen macht
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ data: [] }),
            })
        );

        // Minimal nötige HTML-Struktur aufbauen
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
        require('./www/assets/js/script');

        // DOM-Elemente referenzieren
        form = document.querySelector('form[name="projekt"]');
        vorname = document.querySelector('input[name="vorname"]');
        nachname = document.querySelector('input[name="nachname"]');
        email = document.querySelector('input[name="email"]');
        anfragetyp = document.querySelector('#anfragetyp');
    });

    describe('Basis-Felder (Statische HTML-Validierung)', () => {
        test('Sollte das Formular als ungültig markieren, wenn Pflichtfelder leer sind', () => {
            expect(form.checkValidity()).toBe(false);
            expect(vorname.validity.valueMissing).toBe(true);
            expect(nachname.validity.valueMissing).toBe(true);
        });

        test('Sollte ungültige E-Mail-Formate ablehnen', () => {
            email.value = "max.mustermann.ohne.at";
            expect(email.validity.typeMismatch).toBe(true);
            expect(form.checkValidity()).toBe(false);
        });

        test('Sollte korrekte E-Mail-Formate akzeptieren', () => {
            email.value = "max.mustermann@uk-augsburg.de";
            expect(email.validity.typeMismatch).toBe(false);
        });
    });

    describe('Dynamische Formularfelder (PKZ-Logik)', () => {

        test('Sollte das PKZ-Feld ins DOM rendern', () => {
            aktiviereNetzZugang();
            expect(document.querySelector('input[name="pkz"]')).not.toBeNull();
        });

        test('Sollte PKZ-Eingaben unter 5 Ziffern ablehnen', () => {
            aktiviereNetzZugang();
            const pkz = document.querySelector('input[name="pkz"]');

            pkz.value = "1234";
            expect(pkz.validity.patternMismatch).toBe(true);
        });

        test('Sollte alphabetische Eingaben im PKZ-Feld ablehnen', () => {
            aktiviereNetzZugang();
            const pkz = document.querySelector('input[name="pkz"]');

            pkz.value = "ABCDE";
            expect(pkz.validity.patternMismatch).toBe(true);
        });

        test('Sollte eine exakt 5-stellige numerische PKZ akzeptieren', () => {
            aktiviereNetzZugang();
            const pkz = document.querySelector('input[name="pkz"]');

            pkz.value = "12345";
            expect(pkz.validity.patternMismatch).toBe(false);
            expect(pkz.validity.valid).toBe(true);
        });

        describe('Sicherheits-Tests (Security & XSS)', () => {
            test('Verhindert HTML/JS-Injection (Cross-Site Scripting) in Eingabefeldern', () => {
                // Arrange: Ein Angreifer versucht, ausführbaren Code als Vornamen einzugeben
                const maliciousPayload = "<script>alert('Dein System wurde gehackt!');</script>";

                vorname.value = maliciousPayload;
                nachname.value = "Hacker";
                email.value = "hacker@uk-augsburg.de";

                // Act: Formular absenden
                form.dispatchEvent(new window.Event('submit', { cancelable: true }));

                // Assert: Modal auslesen
                const modalText = document.getElementById('modalText');

                // 1. Wir prüfen, ob der Text exakt als Text ausgegeben wird
                expect(modalText.textContent).toContain(maliciousPayload);

                // 2. DER WICHTIGSTE TEST: Wir prüfen das echte HTML des Modals!
                // Wenn das System sicher ist, muss der Browser die Klammern in "&lt;" (less than) 
                // und "&gt;" (greater than) umgewandelt haben. 
                // Wäre das System unsicher, stünde hier ein echtes <script>-Tag.
                expect(modalText.innerHTML).toContain("&lt;script&gt;alert('Dein System wurde gehackt!');&lt;/script&gt;");
            });
        });

        test('Verkraftet extrem lange Eingaben ohne abzustürzen (Overflow-Schutz)', () => {
            // Arrange: Wir generieren einen String mit 10.000 "A"s
            const massiveString = "A".repeat(10000);

            vorname.value = massiveString;
            nachname.value = "Test";
            email.value = "test@uk-augsburg.de";

            // Act: Wir triggern die Auswertung deines Skripts
            // Wir packen es in einen try-catch/expect Block. 
            // Wenn das Skript wegen der Datenmenge abstürzt, schlägt der Test fehl.
            expect(() => {
                form.dispatchEvent(new window.Event('submit', { cancelable: true }));
            }).not.toThrow();

            // Assert: Das Modal sollte sich trotzdem fehlerfrei geöffnet haben
            const modalText = document.getElementById('modalText');
            expect(modalText.textContent).toContain('Test');
        });
    });

    describe('End-to-End Formular Status', () => {
        test('Sollte form.checkValidity() als TRUE evaluieren, wenn alle Bedingungen erfüllt sind', () => {
            vorname.value = "Max";
            nachname.value = "Mustermann";
            email.value = "max.mustermann@uk-augsburg.de";

            aktiviereNetzZugang();

            const abteilungGroup = document.querySelector('#abteilungGroup');
            const abteilungSelect = document.querySelector('#abteilungSelect');
            const pkz = document.querySelector('input[name="pkz"]');

            // Dropdowns simulieren
            abteilungGroup.innerHTML = '<option value="MIT">MIT</option>';
            abteilungGroup.value = "MIT";

            abteilungSelect.disabled = false;
            abteilungSelect.innerHTML = '<option value="85">IT-Abteilung</option>';
            abteilungSelect.value = "85";

            pkz.value = "98765";

            expect(form.checkValidity()).toBe(true);
        });
    });
});