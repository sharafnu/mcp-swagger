# MCP Swagger Generator

A TypeScript-based framework for generating MCP (Model Context Protocol) servers from OpenAPI/Swagger specifications. Transform your REST APIs into MCP tools that can be used with Claude Desktop and other MCP-compatible applications.

## 🚀 What is MCP?

The Model Context Protocol (MCP) is a standard for connecting AI assistants to external tools and data sources. This generator automatically creates MCP servers from your OpenAPI specifications, allowing AI assistants to interact with your APIs seamlessly.

## ✨ Features

- 🔄 **OpenAPI/Swagger Parser**: Supports OpenAPI 3.0+ specifications
- 🛠️ **MCP Tool Generation**: Converts API operations to MCP tools
- 📝 **Description Enhancement**: AI-powered improvement of API descriptions
- 🎯 **Template-Based Generation**: Uses Handlebars templates for customizable output
- 🔧 **CLI Interface**: Command-line tool for easy usage
- 📦 **Batch Processing**: Handle multiple API specifications
- 🔐 **Authentication Support**: Various auth methods (API Key, OAuth, Basic Auth)
- 🏗️ **Modular Architecture**: Clean separation of concerns with individual tool files

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager
- Basic understanding of OpenAPI/Swagger specifications

## 🔧 Installation

### Clone and Setup

```bash
git clone <repository-url>
cd mcp-swagger-generator
npm install
```

### Build the Project

```bash
npm run build
```

## 🎯 Quick Start

### 1. Generate MCP Server from OpenAPI Spec

```bash
# From a URL
npm run cli -- generate \
  --input https://petstore.swagger.io/v2/swagger.json \
  --output ./generated-servers/petstore

# From a local file
npm run cli -- generate \
  --input ./my-api-spec.yaml \
  --output ./generated-servers/my-api \
  --base-url https://api.example.com
```

### 2. Build and Test the Generated Server

```bash
cd generated-servers/petstore
npm install
npm run build
npm start
```

### 3. Connect to Claude Desktop

Add the generated server to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "petstore": {
      "command": "node",
      "args": ["path/to/generated-servers/petstore/dist/index.js"],
      "env": {
        "CLIENT_ID": "your-client-id",
        "CLIENT_SECRET": "your-client-secret",
        "API_BASE_URL": "https://api.example.com"
      }
    }
  }
}
```

## 📖 Detailed Usage

### CLI Commands

#### Generate Command

Generate an MCP server from a single OpenAPI specification:

```bash
npm run cli -- generate [options]
```

**Options:**
- `-i, --input <path>` - Input OpenAPI specification file or URL (required)
- `-o, --output <path>` - Output directory for generated server (required)
- `-n, --name <name>` - Server name (optional)
- `-b, --base-url <url>` - Override base URL for API calls (optional)
- `-e, --enhance` - Enable description enhancement (optional)
- `-t, --template <path>` - Custom template path (optional)

**Examples:**

```bash
# Basic generation
npm run cli -- generate \
  --input https://api.example.com/openapi.json \
  --output ./my-server

# With custom settings
npm run cli -- generate \
  --input ./api-spec.yaml \
  --output ./custom-server \
  --name "My Custom API" \
  --base-url https://staging.api.example.com \
  --enhance
```

#### Batch Command

Generate an MCP server from multiple OpenAPI specifications:

```bash
npm run cli -- batch [options]
```

**Options:**
- `-c, --config <path>` - Configuration file with specification list (required)
- `-o, --output <path>` - Output directory for generated server (required)
- `-n, --name <name>` - Server name (optional)
- `-e, --enhance` - Enable description enhancement (optional)
- `-t, --template <path>` - Custom template path (optional)

**Configuration file format:**

```json
{
  "specifications": [
    {
      "input": "https://api1.example.com/openapi.json",
      "baseUrl": "https://api1.example.com"
    },
    {
      "input": "./local-spec.yaml",
      "baseUrl": "https://api2.example.com"
    }
  ]
}
```

#### Validate Command

Validate an OpenAPI specification:

```bash
npm run cli -- validate --input <path>
```

### Programmatic Usage

You can also use the generator programmatically:

```typescript
import { generateServer, generateBatchServer } from 'mcp-swagger-generator';

// Generate single server
await generateServer(
  'https://petstore.swagger.io/v2/swagger.json',
  './output/petstore',
  {
    serverName: 'Petstore API',
    baseUrl: 'https://petstore.swagger.io',
    enhanceDescriptions: true
  }
);

// Generate batch server
await generateBatchServer(
  [
    'https://api1.example.com/openapi.json',
    'https://api2.example.com/openapi.json'
  ],
  './output/combined',
  {
    serverName: 'Combined API Server',
    enhanceDescriptions: true
  }
);
```

## 🏗️ Generated Server Structure

The generator creates a clean, modular server structure:

```
generated-server/
├── src/
│   ├── index.ts              # Main server entry point
│   ├── tools/
│   │   ├── index.ts          # Tool registration
│   │   ├── getPetById.ts     # Individual tool files
│   │   └── createPet.ts      # Individual tool files
│   ├── types/
│   │   └── index.ts          # TypeScript type definitions
│   └── utils/
│       └── index.ts          # Utility functions (auth, etc.)
├── package.json
├── tsconfig.json
└── README.md                 # Generated server documentation
```

## 🔐 Authentication Setup

### Environment Variables

Set up authentication for your generated server:

```bash
# OAuth2/API Key authentication
export CLIENT_ID="your-client-id"
export CLIENT_SECRET="your-client-secret"
export API_BASE_URL="https://api.example.com"
export AUTH_ENDPOINT="/v2/auth/login"
```

### Claude Desktop Configuration

```json
{
  "mcpServers": {
    "my-api": {
      "command": "node",
      "args": ["path/to/generated-server/dist/index.js"],
      "env": {
        "CLIENT_ID": "your-client-id",
        "CLIENT_SECRET": "your-client-secret",
        "API_BASE_URL": "https://api.example.com"
      }
    }
  }
}
```

## 🧪 Testing Your Generated Server

### 1. Build the Server

```bash
cd generated-servers/your-server
npm install
npm run build
```

### 2. Test with MCP Inspector

The MCP Inspector is a tool for testing MCP servers:

```bash
# Install MCP Inspector globally
npm install -g @modelcontextprotocol/inspector

# Test your server
mcp-inspector path/to/your-server/dist/index.js
```

### 3. Manual Testing

You can also test the server directly:

```bash
# Run the server
npm start

# The server will output connection information
# Use MCP client tools to connect and test
```

## 🔧 Development Commands

### Generator Development

```bash
# Watch mode for development
npm run dev

# Build the generator
npm run build

# Run tests
npm run test

# Lint code
npm run lint

# Format code
npm run format
```

### Generated Server Development

```bash
# In your generated server directory
npm run build        # Build the server
npm run dev          # Build in watch mode
npm start           # Run the server
npm run lint        # Lint the generated code
npm run clean       # Clean build artifacts
```

## 📝 Common Use Cases

### 1. REST API Integration

Transform any REST API into MCP tools:

```bash
npm run cli -- generate \
  --input https://jsonplaceholder.typicode.com/openapi.json \
  --output ./servers/jsonplaceholder
```

### 2. Internal API Documentation

Generate MCP servers for internal APIs:

```bash
npm run cli -- generate \
  --input ./internal-api-spec.yaml \
  --output ./servers/internal \
  --base-url https://internal-api.company.com
```

### 3. Multi-API Aggregation

Combine multiple APIs into a single MCP server:

```bash
npm run cli -- batch \
  --config ./multi-api-config.json \
  --output ./servers/combined
```

## 🔍 Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Ensure `CLIENT_ID` and `CLIENT_SECRET` are set
   - Check if the API base URL is correct
   - Verify the authentication endpoint path

2. **Build Errors**
   - Run `npm install` in the generated server directory
   - Ensure TypeScript is properly configured
   - Check for missing dependencies

3. **Connection Issues**
   - Verify the server is built (`npm run build`)
   - Check Claude Desktop configuration
   - Ensure proper file paths in configuration

### Debug Mode

Enable debug logging:

```bash
DEBUG=mcp-swagger-generator npm run cli -- generate --input <spec> --output <dir>
```

## 📚 Architecture Overview

### Core Components

- **Parser** ([`src/core/parser.ts`](src/core/parser.ts)) - OpenAPI specification parsing
- **Generator** ([`src/core/generator.ts`](src/core/generator.ts)) - MCP tool generation
- **Enhancer** ([`src/core/enhancer.ts`](src/core/enhancer.ts)) - Description enhancement
- **Validator** ([`src/core/validator.ts`](src/core/validator.ts)) - Schema validation

### Template System

- **Handlebars Templates** ([`templates/`](templates/)) - Code generation templates
- **Modular Output** - Separate files for tools, types, and utilities
- **Customizable** - Override templates for specific needs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Run tests and linting (`npm test && npm run lint`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io/) for the MCP specification
- [OpenAPI Initiative](https://www.openapis.org/) for the OpenAPI specification
- [Anthropic](https://anthropic.com/) for Claude Desktop MCP support

---

**Happy API integrating! 🚀**

For more examples and advanced usage, check out the [examples](examples/) directory.
