export default class AboutPage {
  async render() {
    return `
      <section class="container about-section">
        <article class="about-container">
          <h1>About Story App</h1>
          
          <section class="about-content">
            <h2>What is Story App?</h2>
            <p>
              Story App is a platform where users can share their stories with photos and locations. 
              Each story is visualized on an interactive map, making it easy to explore stories from different places.
            </p>
            
            <h2>Features</h2>
            <ul>
              <li>📝 Share stories with descriptions and photos</li>
              <li>📍 Add location information to your stories</li>
              <li>🗺️ Interactive map with multiple tile layers</li>
              <li>📷 Capture photos directly from your camera</li>
              <li>🔍 Filter and search stories</li>
              <li>♿ Fully accessible and responsive design</li>
            </ul>
            
            <h2>Technology Stack</h2>
            <ul>
              <li>Single-Page Application (SPA) with hash routing</li>
              <li>Leaflet for interactive maps</li>
              <li>Story API for backend services</li>
              <li>Webpack for module bundling</li>
              <li>Responsive design for all devices</li>
            </ul>
            
            <h2>Accessibility</h2>
            <p>
              This application is built with accessibility in mind, ensuring that all users, 
              including those using assistive technologies, can use the app effectively. 
              Features include semantic HTML, keyboard navigation, and screen reader support.
            </p>
          </section>
          
          <div class="about-actions">
            <a href="#/" class="btn-primary">Back to Home</a>
          </div>
        </article>
      </section>
    `;
  }

  async afterRender() {
    // No additional functionality needed
  }
}

