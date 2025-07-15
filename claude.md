# MCP Swagger Generator

A TypeScript-based framework for generating MCP servers from Swagger/OpenAPI specifications.

## Project Overview

This framework automatically generates Model Context Protocol (MCP) servers from OpenAPI/Swagger specifications, enabling seamless integration of REST APIs into MCP-compatible applications.

## Features

- 🔄 **OpenAPI/Swagger Parser**: Supports OpenAPI 3.0+ specifications
- 🛠️ **MCP Tool Generation**: Converts API operations to MCP tools
- 📝 **Description Enhancement**: AI-powered improvement of API descriptions
- 🎯 **Template-Based Generation**: Uses Handlebars templates for customizable output
- 🔧 **CLI Interface**: Command-line tool for easy usage
- 📦 **Batch Processing**: Handle multiple API specifications
- 🔐 **Authentication Support**: Various auth methods (API Key, OAuth, Basic Auth)
- ☁️ **Cloud Deployment**: Templates for cloud deployment

## Architecture

```
mcp-swagger-generator/
├── src/
│   ├── core/                 # Core framework components
│   │   ├── parser.ts         # OpenAPI specification parser
│   │   ├── enhancer.ts       # Description enhancement engine
│   │   ├── generator.ts      # MCP tool generator
│   │   └── validator.ts      # Schema validation
│   ├── templates/            # Handlebars templates
│   │   ├── server.hbs        # Main server template
│   │   ├── tool.hbs          # Individual tool template
│   │   ├── types.hbs         # TypeScript types template
│   │   └── partials/         # Reusable template parts
│   ├── cli/                  # CLI interface
│   │   ├── commands/         # CLI command implementations
│   │   └── index.ts          # CLI entry point
│   └── utils/                # Utility functions
│       ├── file-utils.ts     # File system utilities
│       ├── http-utils.ts     # HTTP request utilities
│       └── template-utils.ts # Template rendering utilities
├── examples/                 # Example configurations
│   ├── petstore/            # Petstore example
│   └── custom-api/          # Custom API example
├── tests/                   # Test suites
└── templates/               # Default Handlebars templates
```

## Technology Stack

- **Core Framework**: TypeScript with Node.js
- **OpenAPI Parsing**: `@apidevtools/swagger-parser`
- **Code Generation**: Handlebars templates
- **CLI Framework**: `commander.js`
- **HTTP Client**: `axios`
- **Validation**: `zod`
- **Testing**: `jest`
- **Build System**: TypeScript compiler

## Dependencies (Latest Versions)

### Production Dependencies
- `@apidevtools/swagger-parser`: ^10.1.0 - OpenAPI/Swagger specification parser
- `@modelcontextprotocol/sdk`: ^0.5.0 - MCP SDK for server development
- `axios`: ^1.6.0 - HTTP client for API requests
- `commander`: ^11.1.0 - Command-line interface framework
- `handlebars`: ^4.7.8 - Template engine for code generation
- `yaml`: ^2.3.4 - YAML parsing support
- `zod`: ^3.22.4 - Schema validation library

### Development Dependencies
- `@types/jest`: ^29.5.8 - TypeScript definitions for Jest
- `@types/node`: ^20.9.0 - TypeScript definitions for Node.js
- `@typescript-eslint/eslint-plugin`: ^6.12.0 - ESLint plugin for TypeScript
- `@typescript-eslint/parser`: ^6.12.0 - ESLint parser for TypeScript
- `eslint`: ^8.54.0 - JavaScript/TypeScript linter
- `jest`: ^29.7.0 - Testing framework
- `prettier`: ^3.1.0 - Code formatter
- `ts-jest`: ^29.1.1 - TypeScript preprocessor for Jest
- `typescript`: ^5.2.2 - TypeScript compiler

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev    # Watch mode compilation
npm run build  # Production build
npm run test   # Run tests
npm run lint   # Lint code
```

### Usage

```bash
# Generate MCP server from Petstore spec
npm run cli -- generate \
  --input https://petstore.swagger.io/v2/swagger.json \
  --output ./generated-servers/petstore \
  --enhance-descriptions true

# Generate MCP server from Fintech API spec
npm run cli -- generate \
  --input /Users/Sharaf.Aboobacker/Downloads/fintech-client-api.yaml \
  --output ./generated-servers/fintech \
  --base-url https://api.uat.zand.ae

# Batch process multiple specs
npm run cli -- batch \
  --config ./specs-config.json \
  --output ./generated-servers/combined
```

## Development Phases

### Phase 1: Core Framework
- [x] Project structure setup
- [ ] OpenAPI specification parser
- [ ] MCP tool generator
- [ ] Description enhancement system
- [ ] Template-based code generation
- [ ] CLI interface
- [ ] Petstore example implementation

### Phase 2: Advanced Features
- [ ] Batch processing system
- [ ] Authentication handling
- [ ] Validation system
- [ ] Configuration management
- [ ] Testing framework
- [ ] Documentation generation

### Phase 3: Cloud Deployment
- [ ] Cloud deployment templates
- [ ] CI/CD pipeline setup
- [ ] Docker containerization
- [ ] Serverless deployment options

## Example Generated Output

The framework transforms OpenAPI operations like:
- `GET /pet/{petId}` → `get_pet_by_id` MCP tool
- `POST /pet` → `create_pet` MCP tool
- `PUT /pet/{petId}` → `update_pet` MCP tool

With enhanced descriptions:
- Original: "Find pet by ID"
- Enhanced: "Retrieve detailed information about a specific pet using its unique identifier"

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run tests and linting
6. Submit a pull request

## License

MIT License - see LICENSE file for details