/**
 * @jest-environment jsdom
 * * TEST SUITE: UI Interaktionen (FAQ und Carousel)
 * ---------------------------------------------------------
 * Prüft die DOM-Manipulationen und Event-Listener der Benutzeroberfläche.
 */

describe('UI Interaktionen: FAQ und Carousel', () => {
  
  beforeEach(() => {
    // Zurücksetzen des Modul-Caches, um Seiteneffekte zwischen Tests zu vermeiden
    jest.resetModules();

    // Setup: Mocking der scrollBy-Methode, da JSDOM keine nativen Scroll-Funktionen implementiert.
    window.HTMLElement.prototype.scrollBy = jest.fn();

    // Setup: Mocking der scrollHeight-Eigenschaft zur Simulation berechneter Layout-Werte.
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { 
      configurable: true, 
      value: 100 
    });

    // Setup: DOM-Fixture initialisieren
    document.body.innerHTML = `
      <div class="faq-item">
        <button class="faq-question">
          Wie lautet die Frage? <span class="faq-icon">+</span>
        </button>
        <div class="faq-answer">Hier ist die Antwort!</div>
      </div>

      <div id="carousel"></div>
      <button id="prevBtn">Zurück</button>
      <button id="nextBtn">Weiter</button>
    `;

    // Target-Skript importieren, um Event-Listener an die DOM-Elemente zu binden
    require('./www/assets/js/script');
  });

  /* ========================================================================== */

  describe('FAQ Akkordeon', () => {
    test('Öffnet und schließt die Antwort beim Klicken und ändert das Icon', () => {
      const question = document.querySelector('.faq-question');
      const answer = document.querySelector('.faq-answer');
      const icon = document.querySelector('.faq-icon');

      // Assert (Initialzustand): Elemente sollten standardmäßig geschlossen sein
      expect(answer.classList.contains('open')).toBe(false);
      expect(icon.textContent).toBe('+');

      // Act: Klick-Event simulieren (Akkordeon öffnen)
      question.dispatchEvent(new window.Event('click'));
      
      // Assert: Überprüfung der Statusänderungen (CSS-Klasse, Höhe aus scrollHeight-Mock, Icon)
      expect(answer.classList.contains('open')).toBe(true);
      expect(answer.style.maxHeight).toBe('100px');
      expect(icon.textContent).toBe('-');

      // Act: Erneutes Klick-Event simulieren (Akkordeon schließen)
      question.dispatchEvent(new window.Event('click'));
      
      // Assert: Überprüfung der Wiederherstellung des Ursprungszustands
      expect(answer.classList.contains('open')).toBe(false);
      expect(answer.style.maxHeight).toBe('');
      expect(icon.textContent).toBe('+');
    });
  });

  /* ========================================================================== */

  describe('About Us Carousel', () => {
    test('Scrollt bei Klick auf "Weiter" um 245 Pixel nach rechts', () => {
      const nextBtn = document.getElementById('nextBtn');
      const carousel = document.getElementById('carousel');

      // Act: Klick-Event auf 'Weiter'-Button auslösen
      nextBtn.dispatchEvent(new window.Event('click'));

      // Assert: Verifizieren, ob die Mock-Funktion 'scrollBy' mit den korrekten Parametern aufgerufen wurde
      expect(carousel.scrollBy).toHaveBeenCalledWith({ left: 245, behavior: 'smooth' });
    });

    test('Scrollt bei Klick auf "Zurück" um 245 Pixel nach links', () => {
      const prevBtn = document.getElementById('prevBtn');
      const carousel = document.getElementById('carousel');

      // Act: Klick-Event auf 'Zurück'-Button auslösen
      prevBtn.dispatchEvent(new window.Event('click'));

      // Assert: Verifizieren der korrekten negativen Scroll-Parameter
      expect(carousel.scrollBy).toHaveBeenCalledWith({ left: -245, behavior: 'smooth' });
    });
  });

});