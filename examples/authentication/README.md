# Authentication Example

This example demonstrates how to generate MCP servers for APIs that require authentication, including OAuth2, API keys, and custom authentication methods.

## Overview

This example shows different authentication patterns:
- **OAuth2** - Client credentials flow
- **API Key** - Header-based authentication
- **Custom Auth** - Custom authentication endpoints

## Authentication Types Supported

### 1. OAuth2 Client Credentials

For APIs that use OAuth2 client credentials flow:

```bash
npm run cli -- generate \
  --input ./api-spec.yaml \
  --output ./generated-server \
  --name "OAuth2 API" \
  --base-url https://api.example.com
```

**Environment variables required:**
```bash
export CLIENT_ID="your-client-id"
export CLIENT_SECRET="your-client-secret"
export AUTH_ENDPOINT="/oauth/token"  # Optional, defaults to /oauth/token
```

### 2. API Key Authentication

For APIs that use API key authentication:

```bash
npm run cli -- generate \
  --input ./api-spec.yaml \
  --output ./generated-server \
  --name "API Key API" \
  --base-url https://api.example.com
```

**Environment variables required:**
```bash
export API_KEY="your-api-key"
export API_KEY_HEADER="X-API-Key"  # Optional, defaults to X-API-Key
```

### 3. Custom Authentication

For APIs with custom authentication flows:

```bash
npm run cli -- generate \
  --input ./custom-auth-spec.yaml \
  --output ./generated-server \
  --name "Custom Auth API" \
  --base-url https://api.example.com
```

## Example: Fintech API with OAuth2

This example uses a fintech API that requires OAuth2 authentication:

### Generate the Server

```bash
npm run cli -- generate \
  --input ./fintech-api-spec.yaml \
  --output ./generated-servers/fintech \
  --name "Fintech API" \
  --base-url https://api.uat.zand.ae
```

### Environment Setup

```bash
# Required environment variables
export CLIENT_ID="your-fintech-client-id"
export CLIENT_SECRET="your-fintech-client-secret"
export API_BASE_URL="https://api.uat.zand.ae"
export AUTH_ENDPOINT="/v2/auth/login"
```

### Claude Desktop Configuration

```json
{
  "mcpServers": {
    "fintech-api": {
      "command": "node",
      "args": ["./examples/authentication/generated-servers/fintech/dist/index.js"],
      "env": {
        "CLIENT_ID": "your-fintech-client-id",
        "CLIENT_SECRET": "your-fintech-client-secret",
        "API_BASE_URL": "https://api.uat.zand.ae",
        "AUTH_ENDPOINT": "/v2/auth/login"
      }
    }
  }
}
```

## Generated Authentication Flow

The generated server includes:

1. **Token Management** - Automatic token acquisition and refresh
2. **Error Handling** - Proper handling of authentication failures
3. **Token Caching** - Efficient token reuse until expiration
4. **Security** - Secure token storage and transmission

### Token Manager Features

```typescript
// Generated in utils/index.ts
export const createTokenManager = (authConfig: AuthConfig) => {
  return {
    async getValidToken(): Promise<string> {
      // Returns valid token, refreshing if needed
    },
    
    async refreshToken(): Promise<void> {
      // Refreshes the authentication token
    },
    
    cleanup(): void {
      // Cleanup resources on shutdown
    },
    
    getStats(): TokenStats {
      // Returns token statistics for debugging
    }
  };
};
```

## Testing Authentication

### 1. Test Token Acquisition

```bash
# Set environment variables
export CLIENT_ID="test-client-id"
export CLIENT_SECRET="test-client-secret"

# Run the server
cd generated-server
npm run build
npm start
```

### 2. Monitor Authentication

The server logs authentication events:

```
🔐 Acquiring authentication token...
✅ Token acquired successfully (expires in 3600s)
🔄 Token refreshed (expires in 3600s)
⚠️  Authentication warning: Token expires in 5 minutes
```

### 3. Handle Authentication Errors

Common authentication errors and solutions:

```
❌ Authentication failed: Invalid client credentials
   → Check CLIENT_ID and CLIENT_SECRET

❌ Authentication failed: Invalid endpoint
   → Verify AUTH_ENDPOINT and API_BASE_URL

❌ Token expired and refresh failed
   → Check if credentials are still valid
```

## Security Best Practices

1. **Environment Variables** - Never hardcode credentials
2. **Token Security** - Tokens are stored in memory only
3. **Automatic Cleanup** - Tokens are cleared on process exit
4. **Error Handling** - Graceful handling of authentication failures
5. **Logging** - Authentication events are logged for debugging

## Claude Desktop Security

When using with Claude Desktop:

```json
{
  "mcpServers": {
    "secure-api": {
      "command": "node",
      "args": ["./path/to/server/dist/index.js"],
      "env": {
        "CLIENT_ID": "your-client-id",
        "CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}
```

**Important Notes:**
- Credentials are passed as environment variables
- They're not stored in the generated code
- Each server instance has its own authentication context
- Tokens are automatically managed and refreshed

## Debugging Authentication

Enable authentication debugging:

```bash
DEBUG=mcp-swagger-generator:auth npm start
```

This will show detailed authentication logs:

```
mcp-swagger-generator:auth Token acquisition started
mcp-swagger-generator:auth POST /oauth/token - 200 OK
mcp-swagger-generator:auth Token acquired: expires_in=3600
mcp-swagger-generator:auth Token cached for 3600 seconds
```

## Multiple Authentication Methods

For APIs supporting multiple authentication methods:

```bash
# OAuth2 with fallback to API key
export CLIENT_ID="oauth-client-id"
export CLIENT_SECRET="oauth-client-secret"
export API_KEY="fallback-api-key"  # Used if OAuth2 fails
```

The generated server will try OAuth2 first, then fall back to API key if OAuth2 fails.

## Files Generated

```
generated-server/
├── src/
│   ├── index.ts              # Main server with lazy auth initialization
│   ├── tools/
│   │   ├── index.ts          # Tool registration
│   │   └── *.ts              # Individual authenticated tools
│   ├── types/
│   │   └── index.ts          # Auth types and interfaces
│   └── utils/
│       └── index.ts          # Token manager and auth utilities
├── package.json
├── tsconfig.json
└── README.md                 # Generated server documentation
```

## Notes

- Authentication is configured per API specification
- Tokens are automatically refreshed before expiration
- All API calls include proper authentication headers
- Error handling includes authentication-specific error messages
- The server gracefully handles authentication failures