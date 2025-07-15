# Multi-API Example

This example demonstrates how to combine multiple OpenAPI specifications into a single MCP server using the batch generation feature.

## Overview

This example combines multiple public APIs into one MCP server:
- **JSONPlaceholder** - Posts, comments, users, and todos
- **Petstore** - Pet management operations
- **OpenWeatherMap** - Weather data (requires API key)

## Configuration

The batch generation uses a configuration file that lists all the APIs to combine:

```json
{
  "specifications": [
    {
      "input": "https://jsonplaceholder.typicode.com/openapi.json",
      "baseUrl": "https://jsonplaceholder.typicode.com"
    },
    {
      "input": "https://petstore.swagger.io/v2/swagger.json",
      "baseUrl": "https://petstore.swagger.io/v2"
    }
  ]
}
```

## Quick Start

### 1. Generate the Combined MCP Server

```bash
# From the project root directory
npm run cli -- batch \
  --config ./examples/multi-api/config.json \
  --output ./examples/multi-api/generated-server \
  --name "Multi-API Server"
```

Or use the provided script:

```bash
cd examples/multi-api
./generate.sh
```

### 2. Build and Test

```bash
cd generated-server
npm install
npm run build
npm start
```

### 3. Connect to Claude Desktop

Add this configuration to your Claude Desktop settings:

```json
{
  "mcpServers": {
    "multi-api": {
      "command": "node",
      "args": ["./examples/multi-api/generated-server/dist/index.js"]
    }
  }
}
```

## Generated Tools

The combined server will include tools from all APIs:

### JSONPlaceholder Tools
- `getPosts` - Get all posts
- `getPostById` - Get a specific post
- `createPost` - Create a new post
- `updatePost` - Update an existing post
- `deletePost` - Delete a post
- `getComments` - Get all comments
- `getUsers` - Get all users
- `getTodos` - Get all todos

### Petstore Tools
- `findPetsByStatus` - Find pets by status
- `getPetById` - Get a specific pet
- `addPet` - Add a new pet
- `updatePet` - Update an existing pet
- `deletePet` - Delete a pet
- `getInventory` - Get store inventory

## Testing with Claude

Once connected, you can ask Claude to use tools from different APIs:

```
"Get all posts from JSONPlaceholder"
"Find available pets in the petstore"
"Create a new post with title 'Hello World'"
"Get details for pet ID 1"
"Show me all todos from JSONPlaceholder"
```

## Benefits of Multi-API Servers

1. **Unified Interface** - Access multiple APIs through a single MCP server
2. **Reduced Complexity** - One server configuration instead of multiple
3. **Cross-API Operations** - Claude can use data from multiple APIs in one response
4. **Resource Efficiency** - Single server process handles multiple API connections

## Advanced Configuration

You can also include APIs that require authentication:

```json
{
  "specifications": [
    {
      "input": "https://jsonplaceholder.typicode.com/openapi.json",
      "baseUrl": "https://jsonplaceholder.typicode.com"
    },
    {
      "input": "./private-api-spec.yaml",
      "baseUrl": "https://api.internal.company.com",
      "authentication": {
        "type": "oauth2",
        "clientId": "${CLIENT_ID}",
        "clientSecret": "${CLIENT_SECRET}"
      }
    }
  ]
}
```

## Files Generated

The generator creates a combined server with tools from all APIs:

```
generated-server/
├── src/
│   ├── index.ts              # Main server entry point
│   ├── tools/
│   │   ├── index.ts          # Tool registration for all APIs
│   │   ├── getPosts.ts       # JSONPlaceholder tools
│   │   ├── getPostById.ts
│   │   ├── createPost.ts
│   │   ├── findPetsByStatus.ts # Petstore tools
│   │   ├── getPetById.ts
│   │   └── addPet.ts
│   ├── types/
│   │   └── index.ts          # Combined type definitions
│   └── utils/
│       └── index.ts          # Shared utility functions
├── package.json
├── tsconfig.json
└── README.md
```

## Notes

- Tool names are automatically prefixed to avoid conflicts (e.g., `jsonplaceholder_getPosts`)
- All tools are type-safe and include proper error handling
- The server handles authentication for individual APIs as configured
- Tools from different APIs can be used in the same Claude conversation