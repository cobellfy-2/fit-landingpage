/**
 * @jest-environment jsdom
 */

describe('UI Interaktionen: FAQ und Carousel', () => {
  
  beforeEach(() => {
    jest.resetModules();

    // 1. MOCKING: Wir bringen JSDOM bei, wie man "scrollt"
    // Da JSDOM nicht wirklich scrollen kann, faken wir die Funktion.
    // jest.fn() ist ein Spion, der sich merkt, ob und mit welchen Werten er aufgerufen wurde.
    window.HTMLElement.prototype.scrollBy = jest.fn();

    // 2. MOCKING: Wir geben HTML-Elementen eine künstliche Höhe
    // Damit das FAQ klappt, tun wir so, als wäre der Inhalt 100 Pixel hoch.
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { 
      configurable: true, 
      value: 100 
    });

    // 3. Mini-HTML für FAQ und Carousel aufbauen
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

    // Skript laden, um Event-Listener an unsere Fake-Elemente zu hängen
    require('./www/assets/js/script');
  });

  /* ========================================================================== */

  describe('FAQ Akkordeon', () => {
    test('Öffnet und schließt die Antwort beim Klicken und ändert das Icon', () => {
      const question = document.querySelector('.faq-question');
      const answer = document.querySelector('.faq-answer');
      const icon = document.querySelector('.faq-icon');

      // Zustand VOR dem Klick: Sollte geschlossen sein
      expect(answer.classList.contains('open')).toBe(false);
      expect(icon.textContent).toBe('+');

      // Act: 1. Klick (Öffnen simulieren)
      question.dispatchEvent(new window.Event('click'));
      
      // Assert: Prüfen, ob die Klasse da ist, die Höhe 100px beträgt und das Icon "-" ist
      expect(answer.classList.contains('open')).toBe(true);
      expect(answer.style.maxHeight).toBe('100px'); // Dank unseres scrollHeight-Mocks!
      expect(icon.textContent).toBe('-');

      // Act: 2. Klick (Wieder schließen simulieren)
      question.dispatchEvent(new window.Event('click'));
      
      // Assert: Alles muss wieder im Ursprungszustand sein
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

      // Act: Auf Weiter klicken
      nextBtn.dispatchEvent(new window.Event('click'));

      // Assert: Wir fragen unseren Spion (jest.fn()), ob er mit den richtigen Werten beauftragt wurde!
      expect(carousel.scrollBy).toHaveBeenCalledWith({ left: 245, behavior: 'smooth' });
    });

    test('Scrollt bei Klick auf "Zurück" um 245 Pixel nach links', () => {
      const prevBtn = document.getElementById('prevBtn');
      const carousel = document.getElementById('carousel');

      // Act: Auf Zurück klicken
      prevBtn.dispatchEvent(new window.Event('click'));

      // Assert: Spion abfragen
      expect(carousel.scrollBy).toHaveBeenCalledWith({ left: -245, behavior: 'smooth' });
    });
  });

});