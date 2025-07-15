# Petstore API Example

This example demonstrates how to generate an MCP server from the classic Petstore OpenAPI specification.

## Overview

The Petstore API is a simple REST API that manages a pet store with operations to:
- Find pets by ID, status, or tags
- Add new pets
- Update existing pets
- Delete pets
- Manage store inventory and orders

## Quick Start

### 1. Generate the MCP Server

```bash
# From the project root directory
npm run cli -- generate \
  --input https://petstore.swagger.io/v2/swagger.json \
  --output ./examples/petstore/generated-server \
  --name "Petstore API" \
  --base-url https://petstore.swagger.io/v2
```

Or use the provided script:

```bash
cd examples/petstore
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
    "petstore": {
      "command": "node",
      "args": ["./examples/petstore/generated-server/dist/index.js"]
    }
  }
}
```

## Generated Tools

The generator will create MCP tools for these API operations:

- `findPetsByStatus` - Find pets by status (available, pending, sold)
- `findPetsByTags` - Find pets by tags
- `getPetById` - Get a specific pet by ID
- `updatePet` - Update an existing pet
- `addPet` - Add a new pet to the store
- `deletePet` - Delete a pet
- `getInventory` - Get store inventory
- `placeOrder` - Place an order for a pet
- `getOrderById` - Get order details
- `deleteOrder` - Delete an order

## Testing with Claude

Once connected to Claude Desktop, you can ask Claude to:

```
"Find all available pets in the petstore"
"Get details for pet ID 1"
"Add a new pet named 'Buddy' with status 'available'"
"Check the store inventory"
"Place an order for pet ID 1"
```

## Files Generated

The generator creates these files:

```
generated-server/
├── src/
│   ├── index.ts              # Main server entry point
│   ├── tools/
│   │   ├── index.ts          # Tool registration
│   │   ├── findPetsByStatus.ts
│   │   ├── findPetsByTags.ts
│   │   ├── getPetById.ts
│   │   ├── updatePet.ts
│   │   ├── addPet.ts
│   │   ├── deletePet.ts
│   │   ├── getInventory.ts
│   │   ├── placeOrder.ts
│   │   ├── getOrderById.ts
│   │   └── deleteOrder.ts
│   ├── types/
│   │   └── index.ts          # TypeScript type definitions
│   └── utils/
│       └── index.ts          # Utility functions
├── package.json
├── tsconfig.json
└── README.md
```

## Notes

- The Petstore API is public and doesn't require authentication
- This is a great example for learning MCP server generation
- The API includes both simple GET operations and complex POST/PUT operations
- All tools include proper TypeScript typing and error handling