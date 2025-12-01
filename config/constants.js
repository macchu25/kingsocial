// API Configuration
export const API_URL = 'http://192.168.1.7:3000/api/auth'; // Thay đổi IP nếu chạy trên thiết bị thật

// Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
};

// Validation Rules
export const VALIDATION = {
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 20,
  PASSWORD_MIN_LENGTH: 6,
};

// OpenAI Configuration
// Note: API key is now stored securely on the server in .env file
// No need to configure it here anymore
export const OPENAI_CONFIG = {
  MODEL: 'gpt-3.5-turbo',
  MAX_TOKENS: 500,
  TEMPERATURE: 0.7,
};





