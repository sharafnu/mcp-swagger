/**
 * Schema validation utilities - Functional approach
 */

import { z } from 'zod';
import { SwaggerSpec, ParsedApiSpec, ValidationResult, ValidationError } from '../types/index.js';

/**
 * Validate OpenAPI/Swagger specification
 */
export const validate = (spec: SwaggerSpec): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  try {
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

    // Check paths
    if (!spec.paths || Object.keys(spec.paths).length === 0) {
      errors.push('No paths defined in specification');
    } else {
      validatePaths(spec.paths, errors, warnings, suggestions);
    }

    // Check OpenAPI/Swagger version
    if (!spec.openapi && !spec.swagger) {
      errors.push('Missing OpenAPI or Swagger version field');
    }

    // Check servers (for OpenAPI 3.0+)
    if (spec.openapi && (!spec.servers || spec.servers.length === 0)) {
      warnings.push('No servers defined - consider adding server URLs');
    }

    // Check security schemes
    if (spec.components?.securitySchemes) {
      validateSecuritySchemes(spec.components.securitySchemes, errors, warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [`Validation failed: ${error instanceof Error ? error.message : String(error)}`],
      warnings,
      suggestions
    };
  }
};

/**
 * Validate paths section
 */
const validatePaths = (
  paths: SwaggerSpec['paths'], 
  errors: string[], 
  warnings: string[], 
  suggestions: string[]
): void => {
  for (const [path, pathItem] of Object.entries(paths)) {
    if (!path.startsWith('/')) {
      errors.push(`Path must start with '/': ${path}`);
    }

    for (const [method, operation] of Object.entries(pathItem)) {
      const validMethods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'];
      if (validMethods.includes(method.toLowerCase())) {
        validateOperation(path, method, operation, errors, warnings, suggestions);
      }
    }
  }
};

/**
 * Validate individual operation
 */
const validateOperation = (
  path: string,
  method: string,
  operation: any,
  errors: string[],
  warnings: string[],
  suggestions: string[]
): void => {
  const operationKey = `${method.toUpperCase()} ${path}`;

  // Check required fields
  if (!operation.responses) {
    errors.push(`Missing responses for ${operationKey}`);
  }

  // Check operation ID
  if (!operation.operationId) {
    suggestions.push(`Consider adding operationId for ${operationKey}`);
  }

  // Check summary and description
  if (!operation.summary && !operation.description) {
    warnings.push(`Missing summary and description for ${operationKey}`);
  }

  // Check parameters
  if (operation.parameters) {
    validateParameters(operation.parameters, operationKey, errors, warnings);
  }

  // Check request body for methods that typically have one
  if (['post', 'put', 'patch'].includes(method.toLowerCase()) && !operation.requestBody) {
    warnings.push(`${operationKey} might need a request body`);
  }

  // Check tags
  if (!operation.tags || operation.tags.length === 0) {
    suggestions.push(`Consider adding tags for ${operationKey} for better organization`);
  }
};

/**
 * Validate parameters
 */
const validateParameters = (
  parameters: any[],
  operationKey: string,
  errors: string[],
  warnings: string[]
): void => {
  const paramNames = new Set<string>();

  for (const param of parameters) {
    if (!param.name) {
      errors.push(`Parameter missing name in ${operationKey}`);
      continue;
    }

    if (!param.in) {
      errors.push(`Parameter '${param.name}' missing 'in' field in ${operationKey}`);
    }

    if (!param.schema && !param.type) {
      errors.push(`Parameter '${param.name}' missing schema/type in ${operationKey}`);
    }

    // Check for duplicate parameter names
    const paramKey = `${param.name}-${param.in}`;
    if (paramNames.has(paramKey)) {
      errors.push(`Duplicate parameter '${param.name}' in '${param.in}' for ${operationKey}`);
    }
    paramNames.add(paramKey);

    // Check required path parameters
    if (param.in === 'path' && !param.required) {
      errors.push(`Path parameter '${param.name}' must be required in ${operationKey}`);
    }
  }
};

/**
 * Validate security schemes
 */
const validateSecuritySchemes = (
  securitySchemes: { [key: string]: any },
  errors: string[],
  warnings: string[]
): void => {
  for (const [name, scheme] of Object.entries(securitySchemes)) {
    if (!scheme.type) {
      errors.push(`Security scheme '${name}' missing type`);
      continue;
    }

    switch (scheme.type) {
      case 'apiKey':
        if (!scheme.name || !scheme.in) {
          errors.push(`API key security scheme '${name}' missing name or in field`);
        }
        break;
      case 'http':
        if (!scheme.scheme) {
          errors.push(`HTTP security scheme '${name}' missing scheme field`);
        }
        break;
      case 'oauth2':
        if (!scheme.flows) {
          errors.push(`OAuth2 security scheme '${name}' missing flows`);
        }
        break;
      case 'openIdConnect':
        if (!scheme.openIdConnectUrl) {
          errors.push(`OpenID Connect security scheme '${name}' missing openIdConnectUrl`);
        }
        break;
      default:
        warnings.push(`Unknown security scheme type '${scheme.type}' for '${name}'`);
    }
  }
};

/**
 * Validate parameter schema using Zod
 */
export const validateParameterSchema = (schema: any, paramName: string): ValidationResult => {
  try {
    const paramSchema = z.object({
      type: z.string(),
      format: z.string().optional(),
      enum: z.array(z.any()).optional(),
      minimum: z.number().optional(),
      maximum: z.number().optional(),
      pattern: z.string().optional(),
      items: z.any().optional()
    });

    paramSchema.parse(schema);

    return {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [`Invalid schema for parameter '${paramName}': ${error instanceof Error ? error.message : String(error)}`],
      warnings: [],
      suggestions: []
    };
  }
};

/**
 * Validate MCP tool specification
 */
export const validateMcpTool = (tool: any): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  if (!tool.name) {
    errors.push('MCP tool missing name');
  }

  if (!tool.description) {
    warnings.push('MCP tool missing description');
  }

  if (!tool.inputSchema) {
    errors.push('MCP tool missing inputSchema');
  } else {
    if (tool.inputSchema.type !== 'object') {
      errors.push('MCP tool inputSchema must be of type object');
    }
    if (!tool.inputSchema.properties) {
      warnings.push('MCP tool inputSchema has no properties');
    }
  }

  if (!tool.method) {
    errors.push('MCP tool missing HTTP method');
  }

  if (!tool.path) {
    errors.push('MCP tool missing path');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions
  };
};

/**
 * Validate generated server configuration
 */
export const validateServerConfig = (config: any): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  if (!config.serverName) {
    errors.push('Server configuration missing serverName');
  }

  if (!config.tools || !Array.isArray(config.tools)) {
    errors.push('Server configuration missing tools array');
  } else if (config.tools.length === 0) {
    warnings.push('Server configuration has no tools');
  }

  if (!config.description) {
    suggestions.push('Consider adding a description to the server configuration');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions
  };
};

/**
 * Validate parsed API specification
 */
export const validateParsedSpec = (spec: ParsedApiSpec): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  try {
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

    // Check endpoints
    if (!spec.endpoints || spec.endpoints.length === 0) {
      errors.push('No endpoints defined in specification');
    } else {
      for (const endpoint of spec.endpoints) {
        if (!endpoint.path) {
          errors.push('Endpoint missing path');
        }
        if (!endpoint.method) {
          errors.push('Endpoint missing method');
        }
        if (!endpoint.responses) {
          errors.push(`Missing responses for ${endpoint.method} ${endpoint.path}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [`Validation failed: ${error instanceof Error ? error.message : String(error)}`],
      warnings,
      suggestions
    };
  }
};

// Export as convenient validator object for compatibility
export const SchemaValidator = {
  validate,
  validateParsedSpec,
  validateParameterSchema,
  validateMcpTool,
  validateServerConfig
};