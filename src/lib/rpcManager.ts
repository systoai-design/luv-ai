import { Connection } from '@solana/web3.js';

// RPC endpoints with priority order (primary, then fallbacks)
const RPC_ENDPOINTS = [
  // Primary: Helius (configured via env)
  import.meta.env.VITE_SOLANA_RPC_URL,
  // Fallback 1: Alternative Helius endpoint
  'https://rpc.helius.xyz/?api-key=a181d89a-54f8-4a83-a857-a760d595180f',
  // Fallback 2: Public Solana RPC
  'https://api.mainnet-beta.solana.com',
  // Fallback 3: Solana public RPC (alternative)
  'https://solana-api.projectserum.com',
].filter(Boolean); // Remove any undefined values

let cachedEndpoint: string | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Test an RPC endpoint for responsiveness
 */
async function testEndpoint(endpoint: string, timeout = 3000): Promise<number> {
  const start = Date.now();
  
  try {
    const connection = new Connection(endpoint, 'confirmed');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    await connection.getLatestBlockhash();
    clearTimeout(timeoutId);
    
    const latency = Date.now() - start;
    console.log(`[RPC Manager] ${endpoint} responded in ${latency}ms`);
    return latency;
  } catch (error) {
    console.warn(`[RPC Manager] ${endpoint} failed:`, error instanceof Error ? error.message : error);
    return Infinity; // Failed endpoints get infinite latency
  }
}

/**
 * Get the best performing RPC endpoint
 */
export async function getBestRpcEndpoint(): Promise<string> {
  // Return cached endpoint if still valid
  if (cachedEndpoint && Date.now() - cacheTimestamp < CACHE_DURATION) {
    console.log('[RPC Manager] Using cached endpoint:', cachedEndpoint);
    return cachedEndpoint;
  }

  console.log('[RPC Manager] Testing RPC endpoints...');
  
  // Test all endpoints in parallel
  const results = await Promise.all(
    RPC_ENDPOINTS.map(async (endpoint) => ({
      endpoint,
      latency: await testEndpoint(endpoint),
    }))
  );

  // Sort by latency (fastest first)
  results.sort((a, b) => a.latency - b.latency);
  
  // Get the fastest working endpoint
  const best = results[0];
  
  if (best.latency === Infinity) {
    console.error('[RPC Manager] All RPC endpoints failed!');
    // Return the first endpoint as last resort
    return RPC_ENDPOINTS[0];
  }

  cachedEndpoint = best.endpoint;
  cacheTimestamp = Date.now();
  
  console.log(`[RPC Manager] Selected fastest endpoint: ${best.endpoint} (${best.latency}ms)`);
  return best.endpoint;
}

/**
 * Create a connection with automatic fallback
 */
export async function createResilientConnection(): Promise<Connection> {
  const endpoint = await getBestRpcEndpoint();
  return new Connection(endpoint, 'confirmed');
}

/**
 * Execute an RPC call with automatic retry and fallback
 */
export async function executeWithRetry<T>(
  operation: (connection: Connection) => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const connection = await createResilientConnection();
      return await operation(connection);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`[RPC Manager] Attempt ${attempt + 1}/${maxRetries} failed:`, lastError.message);
      
      // Clear cache on error to force re-testing endpoints
      if (error instanceof Error && 
          (error.message.includes('403') || error.message.includes('429') || error.message.includes('Too Many Requests'))) {
        cachedEndpoint = null;
        console.log('[RPC Manager] Cleared endpoint cache due to rate limit');
      }
      
      // Exponential backoff
      if (attempt < maxRetries - 1) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        console.log(`[RPC Manager] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('All retry attempts failed');
}

/**
 * Clear the cached endpoint (useful for manual reset)
 */
export function clearEndpointCache(): void {
  cachedEndpoint = null;
  cacheTimestamp = 0;
  console.log('[RPC Manager] Endpoint cache cleared');
}
