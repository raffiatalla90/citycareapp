import routes from '../routes/routes';
import { getActiveRoute } from '../routes/url-parser';

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this._setupDrawer();
  }

  _setupDrawer() {
    this.#drawerButton.addEventListener('click', () => {
      const isOpen = this.#navigationDrawer.classList.toggle('open');
      this.#drawerButton.setAttribute('aria-expanded', isOpen);
    });

    document.body.addEventListener('click', (event) => {
      if (!this.#navigationDrawer.contains(event.target) && !this.#drawerButton.contains(event.target)) {
        this.#navigationDrawer.classList.remove('open');
        this.#drawerButton.setAttribute('aria-expanded', 'false');
      }

      this.#navigationDrawer.querySelectorAll('a').forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove('open');
          this.#drawerButton.setAttribute('aria-expanded', 'false');
        }
      })
    });
  }

  async renderPage() {
    const url = getActiveRoute();
    const page = routes[url];
    const transitionDuration = 250;

    // Custom view transitions (Advance criteria for Kriteria 1)
    if (document.startViewTransition) {
      // Use View Transitions API with custom transitions
      await document.startViewTransition(async () => {
        this.#content.innerHTML = await page.render();
      }).finished;
      await page.afterRender();
    } else {
      // Fallback for browsers that don't support View Transitions API
      // Use CSS transitions
      this.#content.classList.add('is-exiting');

      setTimeout(async () => {
        this.#content.innerHTML = await page.render();
        await page.afterRender();
        this.#content.classList.remove('is-exiting');
        this.#content.classList.add('is-entering');
        requestAnimationFrame(() => {
          this.#content.classList.remove('is-entering');
        });
      }, transitionDuration);
    }
  }
}

export default App;
