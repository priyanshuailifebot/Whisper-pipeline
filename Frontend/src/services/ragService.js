/**
 * Dynamic RAG Service Client
 * Communicates with the FastAPI RAG service on port 8001
 */

const RAG_SERVICE_URL = 'http://localhost:8001';

/**
 * Get immediate acknowledgment for query (NEW)
 */
export async function getImmediateAcknowledgment(query) {
  try {
    const response = await fetch(`${RAG_SERVICE_URL}/query/acknowledge`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ query })
    });
    if (!response.ok) {
      throw new Error(`Acknowledgment failed: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('❌ Acknowledgment failed:', error);
    return {
      acknowledgment: "Let me check that for you...",
      use_rag: true
    };
  }
}

/**
 * Query the RAG service for dynamic content (EXISTING)
 */
export async function queryRAGService(query, intent = null, context = null, userId = null) {
  try {
    const response = await fetch(`${RAG_SERVICE_URL}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        intent,
        context,
        user_id: userId
      })
    });

    if (!response.ok) {
      throw new Error(`RAG service error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('🎯 RAG service response:', result);

    return result;
  } catch (error) {
    console.error('❌ RAG service query failed:', error);
    return null;
  }
}

/**
 * Get RAG service health status
 */
export async function getRAGHealth() {
  try {
    const response = await fetch(`${RAG_SERVICE_URL}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('❌ RAG health check failed:', error);
    return { status: 'unhealthy', error: error.message };
  }
}

/**
 * Get RAG service statistics
 */
export async function getRAGStats() {
  try {
    const response = await fetch(`${RAG_SERVICE_URL}/stats`);
    if (!response.ok) {
      throw new Error(`Stats request failed: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('❌ RAG stats request failed:', error);
    return null;
  }
}

/**
 * Register a new plugin with the RAG service
 */
export async function registerRAGPlugin(pluginName, pluginConfig) {
  try {
    const response = await fetch(`${RAG_SERVICE_URL}/plugins/${pluginName}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pluginConfig)
    });

    if (!response.ok) {
      throw new Error(`Plugin registration failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Plugin registration failed:', error);
    return null;
  }
}

/**
 * List available RAG plugins
 */
export async function listRAGPlugins() {
  try {
    const response = await fetch(`${RAG_SERVICE_URL}/plugins`);
    if (!response.ok) {
      throw new Error(`Plugin list request failed: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('❌ Plugin list request failed:', error);
    return {};
  }
}

export default {
  getImmediateAcknowledgment,
  queryRAGService,
  getRAGHealth,
  getRAGStats,
  registerRAGPlugin,
  listRAGPlugins
};
