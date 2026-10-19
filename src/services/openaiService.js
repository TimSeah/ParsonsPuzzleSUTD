// OpenAI API service for puzzle generation
class OpenAIService {
  constructor() {
    // Direct browser calls are intentionally disabled so API keys never ship
    // in the frontend bundle. Production generation uses /api/generate.
    this.apiKey = null;
    this.baseURL = 'https://api.openai.com/v1';
    this.timeout = 30000; // 30 seconds as per requirements
  }

  /**
   * Get API key from environment variables
   */
  getApiKey() {
    return null;
  }

  /**
   * Check if API key is configured
   */
  isConfigured() {
    return !!this.apiKey;
  }

  /**
   * Get configuration error message if API key is missing
   */
  getConfigurationError() {
    if (!this.apiKey) {
      return 'Direct browser OpenAI access is disabled. Use the secure /api/generate endpoint.';
    }
    return null;
  }

  /**
   * Make authenticated request to OpenAI API with timeout and error handling
   */
  async makeRequest(endpoint, options = {}) {
    if (!this.isConfigured()) {
      throw new Error(this.getConfigurationError());
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const fetchOptions = {
        method: options.method || 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...options.headers
        },
        signal: controller.signal
      };

      // Only add body if it exists and method is not GET
      if (options.body && fetchOptions.method !== 'GET') {
        fetchOptions.body = JSON.stringify(options.body);
      }

      console.log('🌐 Making OpenAI API request:', {
        url: `${this.baseURL}${endpoint}`,
        method: fetchOptions.method,
        hasBody: !!fetchOptions.body,
        bodyPreview: fetchOptions.body ? fetchOptions.body.substring(0, 100) + '...' : 'none'
      });

      const response = await fetch(`${this.baseURL}${endpoint}`, fetchOptions);

      console.log('📥 OpenAI API response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      console.error('❌ OpenAI API request failed:', {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack
      });
      
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      
      if (error.message.includes('fetch') || error.name === 'TypeError') {
        throw new Error('Network error. Please check your connection and API key.');
      }
      
      throw error;
    }
  }
  /**
   * Handle different HTTP error status codes with appropriate messages
   */
  async handleErrorResponse(response) {
    let errorMessage;
    
    switch (response.status) {
      case 401:
        errorMessage = 'API authentication failed. Please check your API key.';
        break;
      case 429:
        errorMessage = 'Rate limit exceeded. Please wait and try again.';
        break;
      case 500:
        errorMessage = 'OpenAI service error. Please try again later.';
        break;
      default:
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || `HTTP error! status: ${response.status}`;
        } catch {
          errorMessage = `HTTP error! status: ${response.status}`;
        }
    }
    
    // Log error for debugging (but not the API key)
    console.error('OpenAI API Error:', {
      status: response.status,
      message: errorMessage,
      url: response.url
    });
    
    throw new Error(errorMessage);
  }

  /**
   * Generate puzzle using OpenAI Chat Completions API
   */
  async generatePuzzle(prompt) {
    try {
      const response = await this.makeRequest('/chat/completions', {
        body: {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.7
        }
      });

      if (!response.choices || response.choices.length === 0) {
        throw new Error('No response generated from OpenAI API');
      }

      const content = response.choices[0].message?.content;
      if (!content) {
        throw new Error('Empty response from OpenAI API');
      }

      return content;
    } catch (error) {
      console.error('Error generating puzzle:', error.message);
      throw error;
    }
  }

  /**
   * Test API connection and authentication
   */
  async testConnection() {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: this.getConfigurationError()
      };
    }

    try {
      await this.makeRequest('/models', {
        method: 'GET',
        body: undefined
      });
      
      return {
        success: true,
        message: 'OpenAI API connection successful'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Create and export singleton instance
const openaiService = new OpenAIService();
export default openaiService;

// Also export the class for testing
export { OpenAIService };
