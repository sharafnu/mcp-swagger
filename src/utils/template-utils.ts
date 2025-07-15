/**
 * Template rendering utilities using Handlebars - Functional approach
 */

import Handlebars from 'handlebars';
import { FileUtils } from './file-utils.js';
import { TemplateContext } from '../types/index.js';

// Template registry
const templates = new Map<string, HandlebarsTemplateDelegate>();

/**
 * Register Handlebars helpers
 */
export const registerHelpers = (): void => {
  // Helper for converting strings to camelCase
  Handlebars.registerHelper('camelCase', (str: string) => {
    return str.replace(/-([a-z])/g, (g) => g[1]?.toUpperCase() || '');
  });

  // Helper for converting strings to PascalCase
  Handlebars.registerHelper('pascalCase', (str: string) => {
    return str.replace(/(?:^|-)([a-z])/g, (g) => g.slice(-1).toUpperCase());
  });

  // Helper for converting strings to snake_case
  Handlebars.registerHelper('snakeCase', (str: string) => {
    return str.replace(/[-\s]/g, '_').toLowerCase();
  });

  // Helper for converting strings to kebab-case
  Handlebars.registerHelper('kebabCase', (str: string) => {
    return str.replace(/[_\s]/g, '-').toLowerCase();
  });

  // Helper for converting strings to CONSTANT_CASE (for environment variables)
  Handlebars.registerHelper('constantCase', (str: string) => {
    return str.replace(/[-\s]/g, '_').toUpperCase();
  });

  // Helper for JSON stringification with proper indentation
  Handlebars.registerHelper('json', (obj: any, indent: number = 2) => {
    return JSON.stringify(obj, null, indent);
  });

  // Helper for safe string escaping in template literals with HTML entity decoding
  Handlebars.registerHelper('safeString', (str: string) => {
    if (typeof str !== 'string') return str;
    
    // First decode HTML entities
    const decoded = str
      .replace(/\\&#x60;/g, '`')     // backticks with backslash
      .replace(/\\&#x27;/g, "'")     // apostrophes with backslash
      .replace(/&#x60;/g, '`')       // backticks without backslash
      .replace(/&#x27;/g, "'")       // apostrophes without backslash
      .replace(/&quot;/g, '"')       // quotes
      .replace(/&lt;/g, '<')         // less than
      .replace(/&gt;/g, '>')         // greater than
      .replace(/&amp;/g, '&');       // ampersand (must be last)
    
    // Escape for JSON string literals (double quotes)
    return decoded
      .replace(/\\/g, '\\\\')        // escape backslashes first
      .replace(/"/g, '\\"')          // escape double quotes
      .replace(/\r?\n/g, '\\n')      // escape newlines
      .replace(/\r/g, '\\r')         // escape carriage returns
      .replace(/\t/g, '\\t');        // escape tabs
  });

  // Helper for escaping strings for TypeScript
  Handlebars.registerHelper('escape', (str: string) => {
    return str.replace(/'/g, "\\'").replace(/"/g, '\\"');
  });

  // Helper for conditional rendering
  Handlebars.registerHelper('ifEquals', function(this: any, arg1: any, arg2: any, options: any) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
  });

  // Helper for array length check
  Handlebars.registerHelper('ifNotEmpty', function(this: any, array: any[], options: any) {
    return array && array.length > 0 ? options.fn(this) : options.inverse(this);
  });

  // Helper for uppercase
  Handlebars.registerHelper('upper', (str: string) => {
    return str.toUpperCase();
  });

  // Helper for lowercase
  Handlebars.registerHelper('lower', (str: string) => {
    return str.toLowerCase();
  });

  // Helper for getting current timestamp
  Handlebars.registerHelper('timestamp', () => {
    return new Date().toISOString();
  });

  // Helper for formatting parameter types
  Handlebars.registerHelper('formatType', (type: string) => {
    switch (type) {
      case 'integer':
        return 'number';
      case 'array':
        return 'any[]';
      case 'object':
        return 'any';
      default:
        return type;
    }
  });

  // Helper to convert parameter name to valid JS identifier
  Handlebars.registerHelper('toValidIdentifier', (name: string) => {
    return name.replace(/[^a-zA-Z0-9_$]/g, '_').replace(/^[0-9]/, '_$&');
  });
  
  // Phase 3: Helper to check if a parameter is a header parameter
  Handlebars.registerHelper('isHeaderParam', function(paramKey: string, headerParams?: any[]) {
    if (!headerParams || !Array.isArray(headerParams)) {
      return false;
    }
    
    return headerParams.some(header => header.paramName === paramKey);
  });

  // Helper for JSON stringification
  Handlebars.registerHelper('toJSON', (obj: any) => {
    return JSON.stringify(obj, null, 2);
  });

  // Helper to check if there are path parameters
  Handlebars.registerHelper('hasPathParams', function(properties: any) {
    if (!properties) return false;
    return Object.values(properties).some((prop: any) => prop.isPathParam);
  });

  // Helper to check if parameter is path parameter
  Handlebars.registerHelper('isPathParam', function(key: string, properties: any) {
    return properties && properties[key] && properties[key].isPathParam;
  });

  // Helper to get original parameter name
  Handlebars.registerHelper('getOriginalParamName', function(key: string) {
    return key;
  });

  // Helper to get parameter name with curly braces for URL replacement
  Handlebars.registerHelper('getParamWithBraces', function(key: string) {
    return `{${key}}`;
  });

  // Helper for equality comparison
  Handlebars.registerHelper('eq', function(a: any, b: any) {
    return a === b;
  });

  // Helper to check if array includes a value
  Handlebars.registerHelper('includes', function(array: any[], value: any) {
    if (!Array.isArray(array)) return false;
    return array.includes(value);
  });
};

/**
 * Load template from file
 */
export const loadTemplate = async (templatePath: string): Promise<void> => {
  const templateContent = await FileUtils.readFile(templatePath);
  const template = Handlebars.compile(templateContent);
  const templateName = FileUtils.getBasename(templatePath, false);
  templates.set(templateName, template);
};

/**
 * Load templates from directory
 */
export const loadTemplatesFromDir = async (templatesDir: string): Promise<void> => {
  const templateFiles = await FileUtils.listFiles(templatesDir, '.hbs');
  
  for (const templateFile of templateFiles) {
    const templatePath = FileUtils.joinPath(templatesDir, templateFile);
    await loadTemplate(templatePath);
  }
};

/**
 * Register template from string
 */
export const registerTemplate = (name: string, templateString: string): void => {
  const template = Handlebars.compile(templateString);
  templates.set(name, template);
};

/**
 * Render template with context
 */
export const render = (templateName: string, context: TemplateContext | Record<string, unknown>): string => {
  const template = templates.get(templateName);
  if (!template) {
    throw new Error(`Template '${templateName}' not found`);
  }
  
  return template(context);
};

/**
 * Render template from string
 */
export const renderString = (templateString: string, context: TemplateContext): string => {
  const template = Handlebars.compile(templateString);
  return template(context);
};

/**
 * Check if template exists
 */
export const hasTemplate = (templateName: string): boolean => {
  return templates.has(templateName);
};

/**
 * Get list of registered templates
 */
export const getTemplateNames = (): string[] => {
  return Array.from(templates.keys());
};

/**
 * Clear all templates
 */
export const clearTemplates = (): void => {
  templates.clear();
};

/**
 * Register partial template
 */
export const registerPartial = (name: string, templateString: string): void => {
  Handlebars.registerPartial(name, templateString);
};

/**
 * Load partials from directory
 */
export const loadPartialsFromDir = async (partialsDir: string): Promise<void> => {
  const partialFiles = await FileUtils.listFiles(partialsDir, '.hbs');
  
  for (const partialFile of partialFiles) {
    const partialPath = FileUtils.joinPath(partialsDir, partialFile);
    const partialContent = await FileUtils.readFile(partialPath);
    const partialName = FileUtils.getBasename(partialFile, false);
    registerPartial(partialName, partialContent);
  }
};

/**
 * Initialize template system with default helpers
 */
export const initializeTemplateSystem = (): void => {
  registerHelpers();
};

/**
 * Get default templates
 */
export const getDefaultTemplates = (): Record<string, string> => {
  return {
    server: `#!/usr/bin/env node
/**
 * Generated MCP Server: {{serverName}}
 * Generated at: {{timestamp}}
 * Source: {{metadata.sourceSpec}}
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios, { AxiosInstance } from 'axios';

{{#each imports}}
import {{this}};
{{/each}}

// Server configuration
const server = new McpServer({
  name: "{{kebabCase serverName}}",
  version: "{{serverVersion}}"
});

// HTTP client setup
const apiClient: AxiosInstance = axios.create({
  timeout: 30000,
  headers: {
    'User-Agent': '{{serverName}} MCP Server/{{serverVersion}}'
  }
});

{{#ifNotEmpty tools}}
// MCP Tools
{{#each tools}}
server.tool(
  "{{name}}",
  {
    {{#each inputSchema.properties}}
    {{@key}}: z.{{formatType type}}(){{#if ../inputSchema.required}}{{#ifEquals @key ../inputSchema.required}}{{else}}.optional(){{/ifEquals}}{{else}}.optional(){{/if}}.describe("{{description}}"),
    {{/each}}
  },
  async ({{#each inputSchema.properties}}{{#unless @first}}, {{/unless}}{{@key}}{{/each}}) => {
    try {
      const url = \`{{baseUrl}}{{path}}\`;
      
      {{#ifEquals method "GET"}}
      const response = await apiClient.get(url, {
        params: { {{#each inputSchema.properties}}{{#ifEquals ../method "GET"}}{{@key}}{{#unless @last}}, {{/unless}}{{/ifEquals}}{{/each}} }
      });
      {{/ifEquals}}
      
      {{#ifEquals method "POST"}}
      const response = await apiClient.post(url, {
        {{#each inputSchema.properties}}{{@key}}{{#unless @last}}, {{/unless}}{{/each}}
      });
      {{/ifEquals}}
      
      {{#ifEquals method "PUT"}}
      const response = await apiClient.put(url, {
        {{#each inputSchema.properties}}{{@key}}{{#unless @last}}, {{/unless}}{{/each}}
      });
      {{/ifEquals}}
      
      {{#ifEquals method "DELETE"}}
      const response = await apiClient.delete(url);
      {{/ifEquals}}

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          content: [
            {
              type: "text",
              text: \`API Error: \${error.response?.data?.message || error.message}\`,
            },
          ],
          isError: true,
        };
      }
      throw error;
    }
  }
);

{{/each}}
{{/ifNotEmpty}}

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport);
console.error('{{serverName}} MCP server running on stdio');
`,

    packageJson: `{
  "name": "{{kebabCase serverName}}",
  "version": "{{serverVersion}}",
  "description": "{{description}}",
  "type": "module",
  "main": "index.js",
  "scripts": {
    "build": "tsc",
    "start": "node index.js"
  },
  "dependencies": {
    {{#each dependencies}}
    "{{@key}}": "{{this}}"{{#unless @last}},{{/unless}}
    {{/each}}
  },
  "devDependencies": {
    "typescript": "^5.2.2",
    "@types/node": "^20.9.0"
  }
}`,

    tsconfig: `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`,

    readme: `# {{serverName}}

{{description}}

## Installation

\`\`\`bash
npm install
npm run build
\`\`\`

## Usage

\`\`\`bash
node index.js
\`\`\`

## Generated Tools

{{#each tools}}
### {{name}}

{{description}}

**Parameters:**
{{#each inputSchema.properties}}
- \`{{@key}}\` ({{type}}){{#if description}} - {{description}}{{/if}}
{{/each}}

{{/each}}

## Generated at

{{metadata.generatedAt}} from {{metadata.sourceSpec}}
`
  };
};

// Export as a convenient renderer object for compatibility
export const TemplateRenderer = {
  loadTemplate,
  loadTemplatesFromDir,
  registerTemplate,
  render,
  renderString,
  hasTemplate,
  getTemplateNames,
  clear: clearTemplates,
  registerPartial,
  loadPartialsFromDir,
  getDefaultTemplates
};