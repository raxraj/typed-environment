const TypedEnv = require('./dist/index.js').default;

// Example demonstrating object support
const schema = {
  DATABASE_CONFIG: {
    type: 'object',
    required: true,
    customValidator: (value) => {
      const config = value;
      return config.host && config.port && config.database;
    }
  },
  API_ENDPOINTS: {
    type: 'object',
    required: true,
  },
  FEATURE_FLAGS: {
    type: 'object',
    required: true,
  },
  SETTINGS_ARRAY: {
    type: 'object',
    required: true,
  },
  OPTIONAL_CONFIG: {
    type: 'object',
    required: false,
    default: { fallback: true },
  },
};

// Create environment instance
const env = new TypedEnv(schema);

// Copy the example file for testing
const fs = require('fs');
const path = require('path');

const examplePath = path.join(__dirname, '.env.example');
const envPath = path.join(__dirname, '.env');

if (fs.existsSync(examplePath)) {
  fs.copyFileSync(examplePath, envPath);
  console.log('Using .env.example for demonstration');
} else {
  console.log('No .env.example found, using empty environment');
}

// Initialize and get the configuration
try {
  const config = env.init();
  
  console.log('Configuration loaded successfully:');
  console.log('DATABASE_CONFIG:', config.DATABASE_CONFIG);
  console.log('API_ENDPOINTS:', config.API_ENDPOINTS);
  console.log('FEATURE_FLAGS:', config.FEATURE_FLAGS);
  console.log('SETTINGS_ARRAY:', config.SETTINGS_ARRAY);
  console.log('OPTIONAL_CONFIG:', config.OPTIONAL_CONFIG);
  
  // Type safety demonstration
  const dbConfig = config.DATABASE_CONFIG;
  console.log(`\nConnecting to database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
  
} catch (error) {
  console.error('Error loading configuration:', error.message);
}

// Clean up
if (fs.existsSync(envPath)) {
  fs.unlinkSync(envPath);
}