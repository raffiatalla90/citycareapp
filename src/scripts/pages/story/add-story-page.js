import { addStory } from '../../data/api';
import { announceToScreenReader, dbManager, syncManager } from '../../utils';
import CONFIG from '../../config';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

export default class AddStoryPage {
  #map = null;
  #marker = null;
  #selectedLat = null;
  #selectedLon = null;
  #stream = null;
  #photoFile = null;
  #defaultIcon = null;

  async render() {
    return `
      <section class="add-story-section container">
        <div class="add-story-container">
          <h1>Add New Story</h1>
          
          <form id="add-story-form" class="story-form">
            <div class="form-group">
              <label for="description">Description</label>
              <textarea 
                id="description" 
                name="description" 
                required 
                aria-required="true"
                autocomplete="off"
                rows="4"
                placeholder="Tell your story..."
              ></textarea>
              <span class="error-message" id="description-error"></span>
            </div>
            
            <div class="form-group">
              <label for="photo">Photo</label>
              <div class="photo-input-group">
                <input 
                  type="file" 
                  id="photo" 
                  name="photo" 
                  accept="image/*"
                  required 
                  aria-required="true"
                />
                <button type="button" id="camera-button" class="btn-secondary">
                  📷 Use Camera
                </button>
              </div>
              <div id="camera-preview" class="camera-preview" style="display: none;">
                <video id="camera-stream" autoplay playsinline></video>
                <div class="camera-controls">
                  <button type="button" id="capture-button" class="btn-primary">Capture</button>
                  <button type="button" id="close-camera-button" class="btn-secondary">Close</button>
                </div>
              </div>
              <div id="photo-preview" class="photo-preview"></div>
              <span class="error-message" id="photo-error"></span>
            </div>
            
            <div class="form-group">
              <label for="location-map">Location</label>
              <button type="button" id="detect-location-button" class="btn-secondary">
                📍 Detect My Location
              </button>
              <div id="location-map" class="location-map"></div>
              <p class="location-info">
                Selected: <span id="selected-coords">Click on map or detect your location</span>
              </p>
              <span class="error-message" id="location-error"></span>
            </div>
            
            <button type="submit" class="btn-primary">Submit Story</button>
            <div id="form-message" class="form-message"></div>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this._configureLeafletIcons();
    this.#defaultIcon = L.icon({
      iconRetinaUrl: markerIcon2x,
      iconUrl: markerIcon,
      shadowUrl: markerShadow,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
    this._initializeMap();
    this._setupLocationDetection();
    this._setupPhotoInput();
    this._setupCamera();
    this._setupForm();
  }

  _configureLeafletIcons() {
    // Ensure default marker icons resolve correctly in the bundle.
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: markerIcon2x,
      iconUrl: markerIcon,
      shadowUrl: markerShadow,
    });
  }

  _initializeMap() {
    // Initialize map centered on Indonesia
    this.#map = L.map('location-map').setView([-2.5489, 118.0149], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.#map);

    // Add click event to map
    this.#map.on('click', (e) => {
      this._selectLocation(e.latlng.lat, e.latlng.lng);
    });
  }

  _selectLocation(lat, lon) {
    this.#selectedLat = lat;
    this.#selectedLon = lon;

    // Remove existing marker
    if (this.#marker) {
      this.#map.removeLayer(this.#marker);
    }

    // Add new marker
    this.#marker = L.marker([lat, lon], { icon: this.#defaultIcon }).addTo(this.#map);
    
    // Update coords display
    const coordsDisplay = document.getElementById('selected-coords');
    coordsDisplay.textContent = `Latitude: ${lat.toFixed(6)}, Longitude: ${lon.toFixed(6)}`;
    
    // Clear error
    document.getElementById('location-error').textContent = '';
  }

  _setupLocationDetection() {
    const detectButton = document.getElementById('detect-location-button');
    
    detectButton.addEventListener('click', () => {
      detectButton.disabled = true;
      detectButton.textContent = '📍 Detecting...';
      
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        detectButton.disabled = false;
        detectButton.textContent = '📍 Detect My Location';
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          
          // Set location on map
          this._selectLocation(lat, lon);
          
          // Center map on detected location
          this.#map.setView([lat, lon], 13);
          
          detectButton.disabled = false;
          detectButton.textContent = '📍 Detect My Location';
          
          announceToScreenReader(`Location detected: ${lat.toFixed(6)}, ${lon.toFixed(6)}`);
        },
        (error) => {
          console.error('Geolocation error:', error);
          let errorMessage = 'Unable to detect location';
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable location access.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }
          
          document.getElementById('location-error').textContent = errorMessage;
          detectButton.disabled = false;
          detectButton.textContent = '📍 Detect My Location';
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  _setupPhotoInput() {
    const photoInput = document.getElementById('photo');
    const photoPreview = document.getElementById('photo-preview');

    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.#photoFile = file;
        this._showPhotoPreview(file);
      }
    });
  }

  _showPhotoPreview(file) {
    const photoPreview = document.getElementById('photo-preview');
    photoPreview.innerHTML = '';
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.alt = 'Photo preview';
      photoPreview.appendChild(img);
    };
    reader.readAsDataURL(file);
  }

  _setupCamera() {
    const cameraButton = document.getElementById('camera-button');
    const cameraPreview = document.getElementById('camera-preview');
    const captureButton = document.getElementById('capture-button');
    const closeCameraButton = document.getElementById('close-camera-button');
    const video = document.getElementById('camera-stream');

    cameraButton.addEventListener('click', async () => {
      try {
        this.#stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' },
          audio: false 
        });
        video.srcObject = this.#stream;
        cameraPreview.style.display = 'block';
        cameraButton.style.display = 'none';
      } catch (error) {
        alert('Could not access camera: ' + error.message);
      }
    });

    captureButton.addEventListener('click', () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        this.#photoFile = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
        this._showPhotoPreview(this.#photoFile);
        this._closeCamera();
      }, 'image/jpeg');
    });

    closeCameraButton.addEventListener('click', () => {
      this._closeCamera();
    });
  }

  _closeCamera() {
    if (this.#stream) {
      this.#stream.getTracks().forEach(track => track.stop());
      this.#stream = null;
    }
    const cameraPreview = document.getElementById('camera-preview');
    const cameraButton = document.getElementById('camera-button');
    cameraPreview.style.display = 'none';
    cameraButton.style.display = 'inline-block';
  }

  _setupForm() {
    const form = document.getElementById('add-story-form');
    const descriptionInput = document.getElementById('description');

    descriptionInput.addEventListener('blur', () => {
      this._validateDescription(descriptionInput);
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const isDescriptionValid = this._validateDescription(descriptionInput);
      const isPhotoValid = this._validatePhoto();
      const isLocationValid = this._validateLocation();
      
      if (!isDescriptionValid || !isPhotoValid || !isLocationValid) {
        return;
      }

      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = 'Submitting...';

      const description = descriptionInput.value.trim();

      // Check if online
      if (navigator.onLine) {
        // Try to submit normally
        try {
          const response = await addStory(
            description, 
            this.#photoFile, 
            this.#selectedLat, 
            this.#selectedLon
          );
          
          if (response.error === false) {
            this._showMessage('Story added successfully! Redirecting...', 'success');
            
            setTimeout(() => {
              window.location.hash = '#/';
            }, 1500);
          }
        } catch (error) {
          this._showMessage(error.message || 'Failed to add story. Please try again.', 'error');
          submitButton.disabled = false;
          submitButton.textContent = 'Submit Story';
        }
      } else {
        // Save offline for later sync
        try {
          await this._saveOfflineStory(description);
          this._showMessage('You are offline. Story saved and will be uploaded when online.', 'success');
          
          // Register background sync if supported
          await syncManager.requestBackgroundSync();
          
          setTimeout(() => {
            window.location.hash = '#/';
          }, 2000);
        } catch (error) {
          this._showMessage('Failed to save story offline: ' + error.message, 'error');
          submitButton.disabled = false;
          submitButton.textContent = 'Submit Story';
        }
      }
    });
  }

  async _saveOfflineStory(description) {
    // Convert photo to base64 for storage
    const photoBase64 = await this._fileToBase64(this.#photoFile);
    const token = localStorage.getItem(CONFIG.TOKEN_KEY);
    
    const offlineStory = {
      description,
      photo: photoBase64,
      photoFile: this.#photoFile,
      lat: this.#selectedLat,
      lon: this.#selectedLon,
      token,
    };

    await dbManager.addOfflineStory(offlineStory);
  }

  _fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  _validateDescription(descriptionInput) {
    const descriptionError = document.getElementById('description-error');
    const description = descriptionInput.value.trim();
    
    if (!description) {
      descriptionError.textContent = 'Description is required';
      descriptionInput.setAttribute('aria-invalid', 'true');
      return false;
    }
    
    if (description.length < 10) {
      descriptionError.textContent = 'Description must be at least 10 characters';
      descriptionInput.setAttribute('aria-invalid', 'true');
      return false;
    }
    
    descriptionError.textContent = '';
    descriptionInput.setAttribute('aria-invalid', 'false');
    return true;
  }

  _validatePhoto() {
    const photoError = document.getElementById('photo-error');
    
    if (!this.#photoFile) {
      photoError.textContent = 'Photo is required';
      return false;
    }
    
    // Check file size (max 1MB)
    if (this.#photoFile.size > 1024 * 1024) {
      photoError.textContent = 'Photo size must be less than 1MB';
      return false;
    }
    
    photoError.textContent = '';
    return true;
  }

  _validateLocation() {
    const locationError = document.getElementById('location-error');
    
    if (!this.#selectedLat || !this.#selectedLon) {
      locationError.textContent = 'Please select a location on the map';
      return false;
    }
    
    locationError.textContent = '';
    return true;
  }

  _showMessage(message, type) {
    const messageDiv = document.getElementById('form-message');
    messageDiv.textContent = message;
    messageDiv.className = `form-message ${type}`;
    announceToScreenReader(message);
  }
}
