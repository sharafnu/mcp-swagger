# MCP Swagger Generator Examples

This directory contains practical examples of how to use the MCP Swagger Generator with different types of APIs and configurations.

## Examples Overview

1. **[Getting Started](./getting-started/)** - Step-by-step guide for MCP beginners
2. **[Petstore](./petstore/)** - Basic REST API example using the classic Petstore API
3. **[Multi-API](./multi-api/)** - Combining multiple APIs into one MCP server
4. **[Authentication](./authentication/)** - Different authentication methods and patterns

## Quick Start

Each example includes:
- Generation command
- Configuration files
- Claude Desktop setup
- Testing instructions

Navigate to any example directory and follow the README instructions to get started.

## Running Examples

```bash
# Clone the repository
git clone <repository-url>
cd mcp-swagger-generator

# Build the generator
npm install
npm run build

# Run any example
cd examples/petstore
./generate.sh
```

## Need Help?

- Check the main [README](../README.md) for detailed documentation
- Each example has its own README with specific instructions
- Common issues are covered in the main troubleshooting section