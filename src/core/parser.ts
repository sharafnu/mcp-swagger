/**
 * OpenAPI/Swagger Specification Parser - Functional approach
 * Handles parsing and validation of OpenAPI 3.0+ and Swagger 2.0 specifications
 */

import * as SwaggerParserLib from '@apidevtools/swagger-parser';
import { HttpUtils } from '../utils/http-utils.js';
import { 
  SwaggerSpec, 
  ParsedApiSpec, 
  ApiEndpoint, 
  HttpMethod, 
  SwaggerParseError 
} from '../types/index.js';

// HTTP client instance
const httpUtils = new HttpUtils();

/**
 * Parse a Swagger/OpenAPI specification from URL or file path
 */
export const parse = async (input: string | SwaggerSpec): Promise<ParsedApiSpec> => {
  try {
    let spec: SwaggerSpec;

    if (typeof input === 'string') {
      // Check if it's a URL or file path
      if (input.startsWith('http://') || input.startsWith('https://')) {
        spec = await parseFromUrl(input);
      } else {
        spec = await parseFromFile(input);
      }
    } else {
      spec = input;
    }

    // Convert to our internal format (skip complex dereference for now)
    return convertToInternalFormat(spec);
  } catch (error) {
    throw new SwaggerParseError(
      `Failed to parse specification: ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error : undefined
    );
  }
};

/**
 * Parse specification from URL
 */
const parseFromUrl = async (url: string): Promise<SwaggerSpec> => {
  try {
    const response = await httpUtils.get(url);
    
    // Try to parse as JSON first, then YAML
    if (typeof response.data === 'string') {
      try {
        return JSON.parse(response.data);
      } catch {
        // If JSON parsing fails, try YAML
        const yaml = await import('yaml');
        return yaml.parse(response.data);
      }
    }
    
    return response.data;
  } catch (error) {
    throw new SwaggerParseError(
      `Failed to fetch specification from URL: ${url}`,
      error instanceof Error ? error : undefined
    );
  }
};

/**
 * Parse specification from file
 */
const parseFromFile = async (filePath: string): Promise<SwaggerSpec> => {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const content = await fs.readFile(filePath, 'utf-8');
    
    const ext = path.extname(filePath).toLowerCase();
    
    if (ext === '.json') {
      return JSON.parse(content);
    } else if (ext === '.yaml' || ext === '.yml') {
      const yaml = await import('yaml');
      return yaml.parse(content);
    } else {
      // Try to auto-detect format
      try {
        return JSON.parse(content);
      } catch {
        const yaml = await import('yaml');
        return yaml.parse(content);
      }
    }
  } catch (error) {
    throw new SwaggerParseError(
      `Failed to read specification file: ${filePath}`,
      error instanceof Error ? error : undefined
    );
  }
};

/**
 * Convert OpenAPI spec to internal format
 */
const convertToInternalFormat = (spec: SwaggerSpec): ParsedApiSpec => {
  const endpoints: ApiEndpoint[] = [];
  
  // Extract endpoints from paths
  for (const [path, pathItem] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (isValidHttpMethod(method)) {
        const endpoint: ApiEndpoint = {
          path,
          method: method.toUpperCase() as HttpMethod,
          ...(operation.operationId && { operationId: operation.operationId }),
          ...(operation.summary && { summary: operation.summary }),
          ...(operation.description && { description: operation.description }),
          ...(operation.tags && { tags: operation.tags }),
          parameters: operation.parameters || [],
          ...(operation.requestBody && { requestBody: operation.requestBody }),
          responses: operation.responses,
          ...(operation.security && { security: operation.security })
        };
        
        endpoints.push(endpoint);
      }
    }
  }

  return {
    info: spec.info,
    ...(spec.servers && { servers: spec.servers }),
    endpoints,
    // Handle both OpenAPI 3.0 (components.schemas) and Swagger 2.0 (definitions)
    schemas: spec.components?.schemas || (spec as any).definitions || {},
    securitySchemes: spec.components?.securitySchemes || (spec as any).securityDefinitions || {},
    ...(spec.security && { globalSecurity: spec.security })
  };
};

/**
 * Check if method is a valid HTTP method
 */
const isValidHttpMethod = (method: string): boolean => {
  const validMethods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'];
  return validMethods.includes(method.toLowerCase());
};

/**
 * Validate specification structure
 */
export const validateSpec = async (spec: SwaggerSpec): Promise<{ isValid: boolean; errors: string[] }> => {
  const errors: string[] = [];

  // Check required fields
  if (!spec.info) {
    errors.push('Missing required field: info');
  } else {
    if (!spec.info.title) {
      errors.push('Missing required field: info.title');
    }
    if (!spec.info.version) {
      errors.push('Missing required field: info.version');
    }
  }

  if (!spec.paths || Object.keys(spec.paths).length === 0) {
    errors.push('No paths defined in specification');
  }

  // Check OpenAPI/Swagger version
  if (!spec.openapi && !spec.swagger) {
    errors.push('Missing OpenAPI or Swagger version field');
  }

  // Validate paths
  for (const [path, pathItem] of Object.entries(spec.paths)) {
    if (!path.startsWith('/')) {
      errors.push(`Path must start with '/': ${path}`);
    }

    for (const [method, operation] of Object.entries(pathItem)) {
      if (isValidHttpMethod(method)) {
        if (!operation.responses) {
          errors.push(`Missing responses for ${method.toUpperCase()} ${path}`);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Extract server base URL from specification
 */
export const getBaseUrl = (spec: SwaggerSpec): string => {
  if (spec.servers && spec.servers.length > 0) {
    return spec.servers[0]!.url;
  }
  
  // Fallback for Swagger 2.0
  if ('host' in spec && 'basePath' in spec) {
    const swaggerSpec = spec as any;
    const protocol = swaggerSpec.schemes?.includes('https') ? 'https' : 'http';
    return `${protocol}://${swaggerSpec.host}${swaggerSpec.basePath || ''}`;
  }
  
  return '';
};

/**
 * Extract operation ID or generate one
 */
export const getOperationId = (method: string, path: string, operation: any): string => {
  if (operation.operationId) {
    return operation.operationId;
  }
  
  // Generate operation ID from method and path
  const cleanPath = path
    .replace(/[{}]/g, '') // Remove parameter braces
    .replace(/[^a-zA-Z0-9]/g, '_') // Replace non-alphanumeric with underscore
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
  
  return `${method.toLowerCase()}_${cleanPath}`;
};

/**
 * Extract tags from operation
 */
export const getOperationTags = (operation: any): string[] => {
  return operation.tags || [];
};

/**
 * Get security requirements for operation
 */
export const getSecurityRequirements = (operation: any, globalSecurity?: any[]): any[] => {
  if (operation.security) {
    return operation.security;
  }
  
  return globalSecurity || [];
};

// Export as a convenient parser object for compatibility
export const SwaggerParser = {
  parse,
  validateSpec,
  getBaseUrl,
  getOperationId,
  getOperationTags,
  getSecurityRequirements
};