#!/bin/bash

# Generate MCP server from multiple OpenAPI specifications

echo "🚀 Generating Multi-API MCP server..."

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Navigate to project root
cd ../..

# Generate the server
npm run cli -- batch \
  --config ./examples/multi-api/config.json \
  --output ./examples/multi-api/generated-server \
  --name "Multi-API Server"

echo "✅ Generation complete!"
echo ""
echo "Next steps:"
echo "1. cd examples/multi-api/generated-server"
echo "2. npm install"
echo "3. npm run build"
echo "4. npm start"
echo ""
echo "To connect to Claude Desktop, add this to your configuration:"
echo '{'
echo '  "mcpServers": {'
echo '    "multi-api": {'
echo '      "command": "node",'
echo '      "args": ["./examples/multi-api/generated-server/dist/index.js"]'
echo '    }'
echo '  }'
echo '}'