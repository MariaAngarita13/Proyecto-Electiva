// src/environments/environment.ts
// UN SOLO environment — el tema se aplica dinámicamente según el tenant

export const environment = {
  production: false,
  name: 'jugador',          // valor por defecto, se sobreescribe en runtime
  apiUrl: 'http://localhost:5000',   // ← UN SOLO backend para todos los tenants

  // Temas por tenant — se aplica según el dominio del correo al hacer login
  themes: {
    empresa_a: {
      name:           'Empresa A',
      primaryColor:   '#1e90ff',     // azul
      secondaryColor: '#0055cc',
      accentColor:    '#4db8ff',
      background:     '#06101e',
      cardBg:         '#0d1f3c',
      borderColor:    'rgba(30,144,255,0.25)',
      textColor:      '#e0eaff',
      navActive:      'rgba(30,144,255,0.14)',
    },
    empresa_b: {
      name:           'Empresa B',
      primaryColor:   '#c0392b',     // rojo
      secondaryColor: '#922b21',
      accentColor:    '#e74c3c',
      background:     '#0e0e0e',
      cardBg:         '#161616',
      borderColor:    'rgba(192,57,43,0.25)',
      textColor:      '#e8e8e8',
      navActive:      'rgba(192,57,43,0.14)',
    }
  },

  // Tema por defecto (antes de login)
  theme: {
    primaryColor:   '#1e90ff',
    secondaryColor: '#0055cc',
    accentColor:    '#4db8ff',
    background:     '#06101e',
    cardBg:         '#0d1f3c',
    borderColor:    'rgba(30,144,255,0.25)',
    textColor:      '#e0eaff',
    navActive:      'rgba(30,144,255,0.14)',
  }
};