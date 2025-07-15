# Getting Started with MCP Swagger Generator

A step-by-step guide for developers new to MCP (Model Context Protocol) to generate and use MCP servers from OpenAPI specifications.

## What You'll Learn

- What MCP is and why it's useful
- How to generate your first MCP server
- How to connect it to Claude Desktop
- How to test and debug your MCP server

## Prerequisites

- Node.js 18+ installed
- Basic understanding of REST APIs
- Claude Desktop installed (optional but recommended)

## Step 1: Understanding MCP

MCP (Model Context Protocol) is a way to connect AI assistants like Claude to external tools and data sources. Think of it as a bridge between AI and your APIs.

**Benefits:**
- AI assistants can use your APIs directly
- No need to write custom integrations
- Standardized protocol for tool communication
- Type-safe interactions

## Step 2: Install and Setup

```bash
# Clone the repository
git clone <repository-url>
cd mcp-swagger-generator

# Install dependencies
npm install

# Build the generator
npm run build
```

## Step 3: Your First MCP Server

Let's start with a simple public API - JSONPlaceholder:

```bash
# Generate MCP server
npm run cli -- generate \
  --input https://jsonplaceholder.typicode.com/posts \
  --output ./my-first-server \
  --name "My First MCP Server"

# Navigate to the generated server
cd my-first-server

# Install dependencies
npm install

# Build the server
npm run build
```

## Step 4: Test Your Server

```bash
# Run the server
npm start
```

You should see output like:
```
My First MCP Server MCP server running on stdio
```

The server is now running and waiting for connections!

## Step 5: Connect to Claude Desktop

### Install Claude Desktop
If you haven't already, install Claude Desktop from [claude.ai](https://claude.ai/download).

### Configure Claude Desktop

1. Open Claude Desktop
2. Go to Settings (gear icon)
3. Navigate to "Developer" tab
4. Add this configuration:

```json
{
  "mcpServers": {
    "my-first-server": {
      "command": "node",
      "args": ["./path/to/my-first-server/dist/index.js"]
    }
  }
}
```

**Important:** Replace `./path/to/my-first-server/dist/index.js` with the actual path to your generated server.

### Restart Claude Desktop

Close and reopen Claude Desktop for the changes to take effect.

## Step 6: Test with Claude

In Claude Desktop, you can now ask:

```
"What posts are available?"
"Get post with ID 1"
"Create a new post with title 'Hello MCP!'"
```

Claude will use your MCP server to interact with the JSONPlaceholder API!

## Step 7: Understanding What Happened

When you ask Claude to "Get post with ID 1", here's what happens:

1. **Claude receives your request** and identifies it needs to use an API
2. **Claude calls your MCP server** using the `getPostById` tool
3. **Your MCP server** makes an HTTP request to JSONPlaceholder API
4. **The API response** is returned to Claude
5. **Claude presents** the formatted result to you

## Step 8: Try a More Complex Example

Let's try with an API that requires authentication:

```bash
# Generate a server for a protected API
npm run cli -- generate \
  --input https://api.github.com/openapi.yaml \
  --output ./github-server \
  --name "GitHub API" \
  --base-url https://api.github.com

cd github-server
npm install
npm run build
```

For this to work, you'll need to set environment variables:

```bash
export GITHUB_TOKEN="your-github-token"
```

Then update your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "github-api": {
      "command": "node",
      "args": ["./path/to/github-server/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "your-github-token"
      }
    }
  }
}
```

## Step 9: Common Issues and Solutions

### Server Won't Start
```bash
# Check if the build succeeded
npm run build

# Check for TypeScript errors
npm run lint
```

### Claude Can't Connect
- Verify the file path in your configuration
- Make sure the server builds without errors
- Check Claude Desktop logs for error messages

### API Calls Fail
- Verify API endpoints are accessible
- Check if authentication is required
- Ensure environment variables are set correctly

## Step 10: Next Steps

Now that you have a working MCP server, you can:

1. **Explore More Examples**
   - [Petstore Example](../petstore/) - Classic REST API
   - [Multi-API Example](../multi-api/) - Combining multiple APIs
   - [Authentication Example](../authentication/) - APIs with auth

2. **Customize Your Server**
   - Modify the generated templates
   - Add custom validation
   - Implement custom error handling

3. **Deploy Your Server**
   - Use it in production environments
   - Share with your team
   - Create documentation

## Understanding the Generated Code

Your generated server has this structure:

```
my-first-server/
├── src/
│   ├── index.ts              # Main server entry point
│   ├── tools/
│   │   ├── index.ts          # Tool registration
│   │   ├── getPosts.ts       # Get all posts
│   │   ├── getPostById.ts    # Get specific post
│   │   └── createPost.ts     # Create new post
│   ├── types/
│   │   └── index.ts          # TypeScript types
│   └── utils/
│       └── index.ts          # Utility functions
├── package.json              # Node.js dependencies
├── tsconfig.json             # TypeScript configuration
└── README.md                 # Generated documentation
```

Each tool file contains:
- **Input validation** using Zod schemas
- **HTTP client** for API calls
- **Error handling** with proper error messages
- **Type safety** with TypeScript

## Tips for Success

1. **Start Simple** - Begin with public APIs that don't require authentication
2. **Test Early** - Test each generated server before moving to complex APIs
3. **Read the Logs** - Server logs contain valuable debugging information
4. **Use Type Safety** - The generated TypeScript types help catch errors early
5. **Environment Variables** - Always use environment variables for sensitive data

## Resources

- [MCP Official Documentation](https://modelcontextprotocol.io/)
- [Claude Desktop Download](https://claude.ai/download)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Project Examples](../README.md)

## Getting Help

If you encounter issues:

1. Check the [main README](../../README.md) for detailed documentation
2. Review the [troubleshooting section](../../README.md#troubleshooting)
3. Look at other examples in this directory
4. Check server logs for error messages

**Congratulations!** You've successfully created your first MCP server. You're now ready to connect any OpenAPI-compatible API to Claude Desktop and other MCP clients.