#!/bin/bash

# Generate MCP server from Petstore OpenAPI specification

echo "🚀 Generating MCP server from Petstore API..."

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Navigate to project root
cd ../..

# Generate the server
npm run cli -- generate \
  --input https://petstore.swagger.io/v2/swagger.json \
  --output ./examples/petstore/generated-server \
  --name "Petstore API" \
  --base-url https://petstore.swagger.io/v2

echo "✅ Generation complete!"
echo ""
echo "Next steps:"
echo "1. cd examples/petstore/generated-server"
echo "2. npm install"
echo "3. npm run build"
echo "4. npm start"
echo ""
echo "To connect to Claude Desktop, add this to your configuration:"
echo '{'
echo '  "mcpServers": {'
echo '    "petstore": {'
echo '      "command": "node",'
echo '      "args": ["./examples/petstore/generated-server/dist/index.js"]'
echo '    }'
echo '  }'
echo '}'