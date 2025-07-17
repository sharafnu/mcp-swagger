/**
 * MCP Tool Generator - Functional approach
 * Converts OpenAPI operations to MCP tool specifications
 */

import { z } from 'zod';
import { 
  ParsedApiSpec, 
  ApiEndpoint, 
  McpToolSpec, 
  Parameter, 
  Schema,
  AuthenticationSpec,
  GenerationError,
  HttpMethod
} from '../types/index.js';
import { TemplateRenderer, getDefaultTemplates, initializeTemplateSystem } from '../utils/template-utils.js';
import { FileUtils } from '../utils/file-utils.js';

/**
 * Check if an endpoint is authentication-related and should be handled internally
 */
const isAuthenticationEndpoint = (endpoint: ApiEndpoint): boolean => {
  const authPatterns = [
    '/auth/login',
    '/auth/token',
    '/token',
    '/login',
    '/oauth/token',
    '/auth/oauth/token',
    '/v2/auth/login'
  ];
  
  // Check if path matches authentication patterns
  const pathMatches = authPatterns.some(pattern =>
    endpoint.path.toLowerCase().includes(pattern.toLowerCase())
  );
  
  // Check if operation ID suggests authentication
  const operationIdMatches = endpoint.operationId ?
    ['token', 'auth', 'login', 'authenticate'].some(keyword =>
      endpoint.operationId!.toLowerCase().includes(keyword)
    ) : false;
  
  // Check if description suggests authentication
  const descriptionMatches = (endpoint.description || endpoint.summary) ?
    ['access token', 'authentication', 'login', 'auth'].some(keyword =>
      (endpoint.description || endpoint.summary || '').toLowerCase().includes(keyword)
    ) : false;
  
  return pathMatches || operationIdMatches || descriptionMatches;
};

/**
 * Generate MCP tools from parsed API specification
 */
export const generate = async (spec: ParsedApiSpec): Promise<McpToolSpec[]> => {
  try {
    const tools: McpToolSpec[] = [];
    
    for (const endpoint of spec.endpoints) {
      // Skip authentication-related endpoints since we handle auth internally
      if (isAuthenticationEndpoint(endpoint)) {
        continue;
      }
      
      const tool = await generateMcpTool(endpoint, spec);
      if (tool) {
        tools.push(tool);
      }
    }
    
    return tools;
  } catch (error) {
    throw new GenerationError(
      `Failed to generate MCP tools: ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error : undefined
    );
  }
};

/**
 * Generate MCP tool from API endpoint
 */
const generateMcpTool = async (endpoint: ApiEndpoint, spec: ParsedApiSpec): Promise<McpToolSpec | null> => {
  try {
    // Generate tool name
    const toolName = generateToolName(endpoint);
    
    // Generate description
    const description = generateToolDescription(endpoint);
    
    // Generate input schema with access to schemas for reference resolution
    const inputSchema = generateInputSchema(endpoint, spec);
    
    // Get base URL
    const baseUrl = getBaseUrl(spec);
    
    // Generate authentication spec
    const authentication = generateAuthenticationSpec(endpoint, spec);
    
    // Phase 3: Extract header parameter metadata
    const headerParams = endpoint.parameters
      .filter(param => param.in === 'header')
      .map(param => ({
        name: param.name,
        paramName: param.name.replace(/-/g, '_'),
        required: param.required || false,
        description: param.description || `Header parameter: ${param.name}`
      }));
    
    const tool: McpToolSpec = {
      name: toolName,
      description,
      inputSchema,
      method: endpoint.method,
      path: endpoint.path,
      baseUrl,
      ...(authentication && { authentication }),
      ...(headerParams.length > 0 && { headerParams }), // Phase 3: Include header metadata
      responseHandling: {
        successCodes: [200, 201, 204],
        responseType: 'json'
      },
      errorHandling: {
        retryCount: 3,
        timeoutMs: 30000,
        errorCodes: {
          400: 'Bad Request',
          401: 'Unauthorized',
          403: 'Forbidden',
          404: 'Not Found',
          500: 'Internal Server Error'
        }
      }
    };
    
    return tool;
  } catch (error) {
    return null;
  }
};

/**
 * Generate tool name from endpoint
 */
const generateToolName = (endpoint: ApiEndpoint): string => {
  if (endpoint.operationId) {
    return camelToSnakeCase(endpoint.operationId);
  }
  
  // Generate from method and path
  const method = endpoint.method.toLowerCase();
  const pathParts = endpoint.path
    .split('/')
    .filter(part => part && !part.startsWith('{'))
    .map(part => part.replace(/[^a-zA-Z0-9]/g, ''));
  
  const pathName = pathParts.join('_');
  return `${method}_${pathName}`;
};

/**
 * Generate tool description from endpoint
 */
const generateToolDescription = (endpoint: ApiEndpoint): string => {
  if (endpoint.description) {
    return endpoint.description;
  }
  
  if (endpoint.summary) {
    return endpoint.summary;
  }
  
  // Generate basic description
  const action = getActionFromMethod(endpoint.method);
  const resource = getResourceFromPath(endpoint.path);
  
  return `${action} ${resource}`;
};

/**
 * Generate input schema for MCP tool
 */
const generateInputSchema = (endpoint: ApiEndpoint, spec: ParsedApiSpec): McpToolSpec['inputSchema'] => {
  const properties: { [key: string]: any } = {};
  const required: string[] = [];
  
  // Add path parameters
  for (const param of endpoint.parameters) {
    if (param.in === 'path') {
      const propSchema = convertSchemaToZod(param.schema, param.name, param.description);
      propSchema.isPathParam = true;
      properties[param.name] = propSchema;
      required.push(param.name);
    }
  }
  
  // Add query parameters
  for (const param of endpoint.parameters) {
    if (param.in === 'query') {
      const propSchema = convertSchemaToZod(param.schema, param.name, param.description);
      propSchema.isQueryParam = true;
      properties[param.name] = propSchema;
      if (param.required) {
        required.push(param.name);
      }
    }
  }
  
  // Add header parameters (excluding signature headers which are auto-generated)
  for (const param of endpoint.parameters) {
    if (param.in === 'header') {
      // Skip signature headers - they should be auto-generated, not user-provided
      const isSignatureHeader = param.name.toLowerCase().includes('signature') ||
                               param.name.toLowerCase().includes('x-payload-signature');
      
      if (!isSignatureHeader) {
        const propSchema = convertSchemaToZod(param.schema, param.name, param.description);
        propSchema.isHeaderParam = true;
        properties[param.name] = propSchema;
        if (param.required) {
          required.push(param.name);
        }
      }
    }
  }
  
  // Add request body properties (OpenAPI 3.0 format)
  if (endpoint.requestBody && endpoint.requestBody.content) {
    const jsonContent = endpoint.requestBody.content['application/json'];
    if (jsonContent && jsonContent.schema) {
      const bodyProperties = extractSchemaProperties(jsonContent.schema, spec);
      
      // Mark all body properties as body parameters
      for (const [propName, propSchema] of Object.entries(bodyProperties.properties)) {
        (propSchema as any).isBodyParam = true;
        properties[propName] = propSchema;
      }
      if (endpoint.requestBody.required) {
        required.push(...bodyProperties.required);
      }
    }
  }
  
  // Add request body properties (Swagger 2.0 format)
  for (const param of endpoint.parameters) {
    if (param.in === 'body' && param.schema) {
      const bodyProperties = extractSchemaProperties(param.schema, spec);
      // Mark all body properties as body parameters
      for (const [propName, propSchema] of Object.entries(bodyProperties.properties)) {
        (propSchema as any).isBodyParam = true;
        properties[propName] = propSchema;
      }
      if (param.required) {
        required.push(...bodyProperties.required);
      }
    }
  }
  
  return {
    type: 'object',
    properties,
    ...(required.length > 0 && { required })
  };
};

/**
 * Convert OpenAPI schema to simplified property definition
 */
const convertSchemaToZod = (schema: Schema | undefined, paramName?: string, paramDescription?: string): any => {
  if (!schema) {
    return {
      type: 'string',
      description: paramDescription || 'Parameter value'
    };
  }
  
  const baseSchema: any = {
    type: mapOpenApiTypeToZod(schema.type || 'string'),
    description: schema.description || paramDescription || 'Parameter value'
  };
  
  if (schema.enum) {
    baseSchema.enum = schema.enum;
  }
  
  if (schema.format) {
    baseSchema.format = schema.format;
  }
  
  if (schema.minimum !== undefined) {
    baseSchema.minimum = schema.minimum;
  }
  
  if (schema.maximum !== undefined) {
    baseSchema.maximum = schema.maximum;
  }
  
  if (schema.minLength !== undefined) {
    baseSchema.minLength = schema.minLength;
  }
  
  if (schema.maxLength !== undefined) {
    baseSchema.maxLength = schema.maxLength;
  }
  
  if (schema.pattern) {
    baseSchema.pattern = schema.pattern;
  }
  
  if (schema.items && schema.type === 'array') {
    baseSchema.items = convertSchemaToZod(schema.items);
  }
  
  return baseSchema;
};

/**
 * Extract properties from schema with reference resolution and nested object flattening
 */
const extractSchemaProperties = (schema: Schema, spec: ParsedApiSpec): { properties: any; required: string[] } => {
  const properties: any = {};
  const required: string[] = [];
  
  // Handle schema references
  if (schema.$ref) {
    const resolvedSchema = resolveSchemaReference(schema.$ref, spec);
    if (resolvedSchema) {
      return extractSchemaProperties(resolvedSchema, spec);
    }
  }
  
  // Handle schema composition (allOf, oneOf, anyOf)
  const resolvedSchema = resolveSchemaComposition(schema, spec);
  
  if (resolvedSchema.properties) {
    for (const [propName, propSchema] of Object.entries(resolvedSchema.properties)) {
      // Log each property being processed
      
      // Recursively resolve nested references
      if (propSchema.$ref) {
        const nestedResolvedSchema = resolveSchemaReference(propSchema.$ref, spec);
        if (nestedResolvedSchema) {
          // Check if this is a complex object that should be flattened
          if (shouldFlattenObject(nestedResolvedSchema)) {
            const flattenedProps = flattenNestedObject(nestedResolvedSchema, spec, propName);
            Object.assign(properties, flattenedProps.properties);
            required.push(...flattenedProps.required);
          } else {
            properties[propName] = convertSchemaToZod(nestedResolvedSchema, propName, nestedResolvedSchema.description);
          }
        } else {
          properties[propName] = convertSchemaToZod(propSchema, propName, propSchema.description);
        }
      } else if (propSchema.type === 'object' && shouldFlattenObject(propSchema)) {
        // Flatten nested objects directly
        const flattenedProps = flattenNestedObject(propSchema, spec, propName);
        Object.assign(properties, flattenedProps.properties);
        required.push(...flattenedProps.required);
      } else {
        // Handle schema composition for this property too
        const compositeResolvedPropSchema = resolveSchemaComposition(propSchema, spec);
        if (compositeResolvedPropSchema.type === 'object' && shouldFlattenObject(compositeResolvedPropSchema)) {
          const flattenedProps = flattenNestedObject(compositeResolvedPropSchema, spec, propName);
          Object.assign(properties, flattenedProps.properties);
          required.push(...flattenedProps.required);
        } else {
          properties[propName] = convertSchemaToZod(compositeResolvedPropSchema, propName, compositeResolvedPropSchema.description);
        }
      }
    }
  } else {
  }
  
  if (resolvedSchema.required) {
    required.push(...resolvedSchema.required);
  }
  
  return { properties, required };
};

/**
 * Resolve schema composition (allOf, oneOf, anyOf) into a flattened schema
 */
const resolveSchemaComposition = (schema: Schema, spec: ParsedApiSpec): Schema => {
  let resolvedSchema = { ...schema };
  
  // Handle allOf - merge all schemas
  if (schema.allOf && Array.isArray(schema.allOf)) {
    resolvedSchema.properties = {};
    resolvedSchema.required = [];
    
    for (const subSchema of schema.allOf) {
      let resolvedSubSchema = subSchema;
      if (subSchema.$ref) {
        resolvedSubSchema = resolveSchemaReference(subSchema.$ref, spec) || subSchema;
      }
      
      if (resolvedSubSchema.properties) {
        Object.assign(resolvedSchema.properties, resolvedSubSchema.properties);
      }
      
      if (resolvedSubSchema.required) {
        resolvedSchema.required.push(...resolvedSubSchema.required);
      }
      
      // Inherit type if not already set
      if (!resolvedSchema.type && resolvedSubSchema.type) {
        resolvedSchema.type = resolvedSubSchema.type;
      }
    }
  }
  
  // Handle oneOf - use first schema (could be enhanced to choose best match)
  if (schema.oneOf && Array.isArray(schema.oneOf) && schema.oneOf.length > 0) {
    let firstSchema = schema.oneOf[0];
    if (firstSchema && firstSchema.$ref) {
      firstSchema = resolveSchemaReference(firstSchema.$ref, spec) || firstSchema;
    }
    if (firstSchema) {
      resolvedSchema = { ...resolvedSchema, ...firstSchema };
    }
  }
  
  // Handle anyOf - merge all schemas (similar to allOf but more permissive)
  if (schema.anyOf && Array.isArray(schema.anyOf)) {
    resolvedSchema.properties = {};
    resolvedSchema.required = [];
    
    for (const subSchema of schema.anyOf) {
      let resolvedSubSchema = subSchema;
      if (subSchema.$ref) {
        resolvedSubSchema = resolveSchemaReference(subSchema.$ref, spec) || subSchema;
      }
      
      if (resolvedSubSchema.properties) {
        Object.assign(resolvedSchema.properties, resolvedSubSchema.properties);
      }
      
      if (resolvedSubSchema.required) {
        resolvedSchema.required.push(...resolvedSubSchema.required);
      }
      
      if (!resolvedSchema.type && resolvedSubSchema.type) {
        resolvedSchema.type = resolvedSubSchema.type;
      }
    }
  }
  
  return resolvedSchema;
};

/**
 * Determine if an object should be flattened (has multiple primitive properties)
 */
const shouldFlattenObject = (schema: Schema): boolean => {
  if (!schema.properties || Object.keys(schema.properties).length === 0) {
    return false;
  }
  
  // Always flatten objects with properties - this gives better UX
  // by converting complex JSON objects into individual parameters
  return true;
};

/**
 * Flatten nested object properties with proper naming and reconstruction metadata
 */
const flattenNestedObject = (
  schema: Schema,
  spec: ParsedApiSpec,
  parentName: string,
  prefix: string = ''
): { properties: any; required: string[] } => {
  const properties: any = {};
  const required: string[] = [];
  
  if (!schema.properties) {
    return { properties, required };
  }
  
  for (const [propName, propSchema] of Object.entries(schema.properties)) {
    const flattenedName = prefix ? `${prefix}_${propName}` : `${parentName}_${propName}`;
    
    // Resolve references
    let resolvedSchema = propSchema;
    if (propSchema.$ref) {
      resolvedSchema = resolveSchemaReference(propSchema.$ref, spec) || propSchema;
    }
    
    if (resolvedSchema.type === 'object' && resolvedSchema.properties) {
      // Recursively flatten nested objects
      const nestedFlattened = flattenNestedObject(resolvedSchema, spec, parentName, flattenedName);
      Object.assign(properties, nestedFlattened.properties);
      required.push(...nestedFlattened.required);
    } else {
      // Create flattened property with reconstruction metadata
      const flatProp = convertSchemaToZod(resolvedSchema, flattenedName, resolvedSchema.description);
      flatProp.originalPath = prefix ? `${parentName}.${prefix.replace(parentName + '_', '').replace(/_/g, '.')}.${propName}` : `${parentName}.${propName}`;
      flatProp.parentObject = parentName;
      flatProp.isFlattened = true;
      properties[flattenedName] = flatProp;
      
      // Handle required fields
      if (schema.required && schema.required.includes(propName)) {
        required.push(flattenedName);
      }
    }
  }
  
  return { properties, required };
};

/**
 * Resolve schema reference to actual schema
 */
const resolveSchemaReference = (ref: string, spec: ParsedApiSpec): Schema | null => {
  try {
    // Handle both OpenAPI 3.0 (#/components/schemas/...) and Swagger 2.0 (#/definitions/...) references
    if (ref.startsWith('#/components/schemas/')) {
      const schemaName = ref.replace('#/components/schemas/', '');
      return spec.schemas[schemaName] || null;
    } else if (ref.startsWith('#/definitions/')) {
      const schemaName = ref.replace('#/definitions/', '');
      return spec.schemas[schemaName] || null;
    }
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Map OpenAPI types to simplified types
 */
const mapOpenApiTypeToZod = (type: string): string => {
  switch (type) {
    case 'integer':
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'array':
      return 'array';
    case 'object':
      return 'object';
    default:
      return 'string';
  }
};

/**
 * Get base URL from specification
 */
const getBaseUrl = (spec: ParsedApiSpec): string => {
  if (spec.servers && spec.servers.length > 0 && spec.servers[0]) {
    return spec.servers[0].url;
  }
  return '';
};

/**
 * Generate authentication specification
 */
const generateAuthenticationSpec = (endpoint: ApiEndpoint, spec: ParsedApiSpec): AuthenticationSpec | undefined => {
  // Check endpoint-specific security
  if (endpoint.security && endpoint.security.length > 0) {
    return createAuthSpec(endpoint.security[0], spec);
  }
  
  // Check global security
  if (spec.globalSecurity && spec.globalSecurity.length > 0) {
    return createAuthSpec(spec.globalSecurity[0], spec);
  }
  
  return undefined;
};

/**
 * Create authentication spec from security requirement
 */
const createAuthSpec = (securityReq: any, spec: ParsedApiSpec): AuthenticationSpec | undefined => {
  const schemeName = Object.keys(securityReq)[0];
  if (!schemeName) return undefined;
  
  const scheme = spec.securitySchemes[schemeName];
  if (!scheme) return undefined;
  
  switch (scheme.type) {
    case 'apiKey':
      return {
        type: 'apiKey',
        location: scheme.in as 'header' | 'query' | 'cookie',
        name: scheme.name || 'apikey',
        envVariable: `${schemeName.toUpperCase()}_API_KEY`
      };
    case 'http':
      if (scheme.scheme === 'bearer') {
        return {
          type: 'bearer',
          envVariable: `${schemeName.toUpperCase()}_TOKEN`
        };
      } else if (scheme.scheme === 'basic') {
        return {
          type: 'basic',
          envVariable: `${schemeName.toUpperCase()}_CREDENTIALS`
        };
      }
      break;
    case 'oauth2':
      return {
        type: 'oauth2',
        envVariable: `${schemeName.toUpperCase()}_ACCESS_TOKEN`
      };
  }
  
  return undefined;
};

/**
 * Generate server code from MCP tools
 */
export const generateServerCode = async (
  tools: McpToolSpec[],
  outputPath: string,
  options: {
    serverName?: string;
    templatePath?: string;
    baseUrl?: string;
  } = {}
): Promise<void> => {
  try {
    // Initialize template system
    initializeTemplateSystem();
    
    // Prepare template context
    const context = {
      serverName: options.serverName || 'Generated MCP Server',
      serverVersion: '1.0.0',
      description: `Generated MCP server with ${tools.length} tools`,
      tools,
      baseUrl: options.baseUrl,
      imports: [],
      dependencies: {
        '@modelcontextprotocol/sdk': '1.12.1',
        'axios': '^1.6.0',
        'zod': '^3.22.4'
      },
      config: {},
      metadata: {
        generatedAt: new Date().toISOString(),
        generatorVersion: '1.0.0',
        sourceSpec: 'OpenAPI Specification'
      }
    };
    
    // Load templates from template directory
    const templatePath = options.templatePath || 'templates';
    await TemplateRenderer.loadTemplatesFromDir(templatePath);
    
    // Generate main server file with proper imports
    const serverContext = {
      ...context,
      mcpSdkPath: '@modelcontextprotocol/sdk/server/index.js',
      processImport: 'node:process'
    };
    const serverCode = TemplateRenderer.render('server', serverContext);
    await FileUtils.writeFile(`${outputPath}/src/index.ts`, serverCode);
    
    // Generate individual tool files
    for (const tool of tools) {
      const toolCode = TemplateRenderer.render('tool', tool as unknown as Record<string, unknown>);
      await FileUtils.writeFile(`${outputPath}/src/tools/${tool.name}.ts`, toolCode);
    }
    
    // Generate tools index file
    const toolsIndexCode = TemplateRenderer.render('toolsIndex', context);
    await FileUtils.writeFile(`${outputPath}/src/tools/index.ts`, toolsIndexCode);
    
    // Generate types file
    const typesCode = TemplateRenderer.render('types', context);
    await FileUtils.writeFile(`${outputPath}/src/types/index.ts`, typesCode);
    
    // Generate utils file
    const utilsCode = TemplateRenderer.render('utils', context);
    await FileUtils.writeFile(`${outputPath}/src/utils/index.ts`, utilsCode);
    
    // Generate package.json
    const packageJson = TemplateRenderer.render('packageJson', context);
    await FileUtils.writeFile(`${outputPath}/package.json`, packageJson);
    
    // Generate tsconfig.json
    const tsConfig = TemplateRenderer.render('tsconfig', context);
    await FileUtils.writeFile(`${outputPath}/tsconfig.json`, tsConfig);
    
    // Generate README.md
    const readme = TemplateRenderer.render('readme', context);
    await FileUtils.writeFile(`${outputPath}/README.md`, readme);
    
  } catch (error) {
    throw new GenerationError(
      `Failed to generate server code: ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error : undefined
    );
  }
};

/**
 * Utility functions
 */
const camelToSnakeCase = (str: string): string => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '');
};

const getActionFromMethod = (method: HttpMethod): string => {
  switch (method.toLowerCase()) {
    case 'get': return 'Retrieve';
    case 'post': return 'Create';
    case 'put': return 'Update';
    case 'patch': return 'Modify';
    case 'delete': return 'Delete';
    default: return 'Process';
  }
};

const getResourceFromPath = (path: string): string => {
  const parts = path.split('/').filter(part => part && !part.startsWith('{'));
  return parts[parts.length - 1] || 'resource';
};

// Export as convenient generator object for compatibility
export const McpToolGenerator = {
  generate,
  generateServerCode
};