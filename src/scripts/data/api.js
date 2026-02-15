import CONFIG from '../config';

const ENDPOINTS = {
  REGISTER: `${CONFIG.BASE_URL}/register`,
  LOGIN: `${CONFIG.BASE_URL}/login`,
  STORIES: `${CONFIG.BASE_URL}/stories`,
  ADD_STORY: `${CONFIG.BASE_URL}/stories`,
};

export async function register(name, email, password) {
  const response = await fetch(ENDPOINTS.REGISTER, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to register');
  }
  return data;
}

export async function login(email, password) {
  const response = await fetch(ENDPOINTS.LOGIN, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to login');
  }
  return data;
}

export async function getStories() {
  const token = localStorage.getItem(CONFIG.TOKEN_KEY);
  if (!token) {
    throw new Error('Not authenticated');
  }

  // Add location=1 parameter to get stories with lat/lon data
  const response = await fetch(`${ENDPOINTS.STORIES}?location=1`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch stories');
  }
  return data;
}

export async function addStory(description, photoFile, lat, lon) {
  const token = localStorage.getItem(CONFIG.TOKEN_KEY);
  if (!token) {
    throw new Error('Not authenticated');
  }

  const formData = new FormData();
  formData.append('description', description);
  formData.append('photo', photoFile);
  if (lat && lon) {
    formData.append('lat', lat);
    formData.append('lon', lon);
  }

  const response = await fetch(ENDPOINTS.ADD_STORY, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to add story');
  }
  return data;
}