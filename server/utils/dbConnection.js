const mongoose = require('mongoose');

// Export function to get read connection
// Returns read connection if available, otherwise returns main connection
function getReadConnection() {
  // Check if read connection exists (set in server.js)
  if (global.mongooseReadConnection && global.mongooseReadConnection.readyState === 1) {
    return global.mongooseReadConnection;
  }
  // Fallback to main connection
  return mongoose;
}

// Export function to get write connection (always main connection)
function getWriteConnection() {
  return mongoose;
}

// Get model from read connection if available, otherwise from main connection
function getReadModel(modelName, ModelClass) {
  const readConnection = getReadConnection();
  
  // If read connection is different from main connection, register model on it
  if (readConnection !== mongoose && !readConnection.models[modelName]) {
    // Register model on read connection using the same schema
    const schema = ModelClass.schema;
    readConnection.model(modelName, schema);
  }
  
  // Return model from read connection or main connection
  return readConnection.models[modelName] || ModelClass;
}

module.exports = {
  getReadConnection,
  getWriteConnection,
  getReadModel
};

