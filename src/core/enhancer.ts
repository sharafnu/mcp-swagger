/**
 * Description Enhancement Engine - Functional approach
 * Improves API descriptions and summaries for better clarity
 */

import { 
  SwaggerSpec, 
  ParsedApiSpec, 
  EnhancedDescription, 
  EnhancementOptions,
  EnhancementError,
  ApiEndpoint
} from '../types/index.js';

/**
 * Enhance descriptions in a parsed API specification
 */
export const enhance = async (
  spec: ParsedApiSpec, 
  options: EnhancementOptions = { enabled: true }
): Promise<ParsedApiSpec> => {
  if (!options.enabled) {
    return spec;
  }

  try {
    const enhancedEndpoints = await Promise.all(
      spec.endpoints.map(endpoint => enhanceEndpoint(endpoint, options))
    );

    return {
      ...spec,
      endpoints: enhancedEndpoints
    };
  } catch (error) {
    throw new EnhancementError(
      `Failed to enhance descriptions: ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error : undefined
    );
  }
};

/**
 * Enhance a single API endpoint
 */
const enhanceEndpoint = async (
  endpoint: ApiEndpoint, 
  options: EnhancementOptions
): Promise<ApiEndpoint> => {
  const enhanced = { ...endpoint };

  // Enhance summary
  if (enhanced.summary) {
    const enhancedSummary = await enhanceText(enhanced.summary, 'summary', options);
    if (enhancedSummary.enhanced !== enhancedSummary.original) {
      enhanced.summary = enhancedSummary.enhanced;
    }
  }

  // Enhance description
  if (enhanced.description) {
    const enhancedDescription = await enhanceText(enhanced.description, 'description', options);
    if (enhancedDescription.enhanced !== enhancedDescription.original) {
      enhanced.description = enhancedDescription.enhanced;
    }
  } else if (enhanced.summary) {
    // Generate description from summary if missing
    const generatedDescription = await generateDescription(endpoint, options);
    if (generatedDescription) {
      enhanced.description = generatedDescription.enhanced;
    }
  }

  return enhanced;
};

/**
 * Enhance text using various strategies
 */
const enhanceText = async (
  text: string, 
  type: 'summary' | 'description',
  options: EnhancementOptions
): Promise<EnhancedDescription> => {
  try {
    // For now, use rule-based enhancement
    // In the future, this could integrate with AI services
    const enhanced = await ruleBasedEnhancement(text, type);
    
    return {
      original: text,
      enhanced,
      confidence: 0.8,
      reasoning: 'Rule-based text enhancement applied'
    };
  } catch (error) {
    return {
      original: text,
      enhanced: text,
      confidence: 1.0,
      reasoning: 'No enhancement applied due to error'
    };
  }
};

/**
 * Generate description from endpoint information
 */
const generateDescription = async (
  endpoint: ApiEndpoint,
  options: EnhancementOptions
): Promise<EnhancedDescription | null> => {
  try {
    const method = endpoint.method.toLowerCase();
    const resource = extractResourceName(endpoint.path);
    const action = getActionVerb(method);
    
    let description = '';
    
    // Generate basic description based on HTTP method and path
    switch (method) {
      case 'get':
        if (hasPathParameters(endpoint.path)) {
          description = `${action} detailed information about a specific ${resource} using its identifier`;
        } else {
          description = `${action} a list of ${resource}s with optional filtering and pagination`;
        }
        break;
      case 'post':
        description = `${action} a new ${resource} with the provided data`;
        break;
      case 'put':
        description = `${action} an existing ${resource} with new data, replacing all fields`;
        break;
      case 'patch':
        description = `${action} specific fields of an existing ${resource}`;
        break;
      case 'delete':
        description = `${action} a specific ${resource} from the system`;
        break;
      default:
        description = `${action} ${resource} using ${method.toUpperCase()} method`;
    }

    // Add parameter information if available
    if (endpoint.parameters && endpoint.parameters.length > 0) {
      const paramTypes = endpoint.parameters
        .map(p => p.in)
        .filter((value, index, self) => self.indexOf(value) === index);
      
      if (paramTypes.length > 0) {
        description += `. Accepts ${paramTypes.join(', ')} parameters`;
      }
    }

    return {
      original: '',
      enhanced: description,
      confidence: 0.7,
      reasoning: 'Generated from endpoint method and path analysis'
    };
  } catch (error) {
    return null;
  }
};

/**
 * Rule-based text enhancement
 */
const ruleBasedEnhancement = async (text: string, type: 'summary' | 'description'): Promise<string> => {
  let enhanced = text;

  // Basic cleaning and improvements
  enhanced = enhanced.trim();
  
  // Ensure proper capitalization
  if (enhanced.length > 0) {
    enhanced = enhanced.charAt(0).toUpperCase() + enhanced.slice(1);
  }

  // Ensure proper ending punctuation for descriptions
  if (type === 'description' && enhanced.length > 0 && !enhanced.match(/[.!?]$/)) {
    enhanced += '.';
  }

  // Replace common abbreviations and improve clarity
  const replacements: { [key: string]: string } = {
    'Get ': 'Retrieve ',
    'Gets ': 'Retrieves ',
    'Post ': 'Create ',
    'Posts ': 'Creates ',
    'Put ': 'Update ',
    'Puts ': 'Updates ',
    'Delete ': 'Remove ',
    'Deletes ': 'Removes ',
    'API': 'API',
    'ID': 'identifier',
    'IDs': 'identifiers',
    'JSON': 'JSON',
    'HTTP': 'HTTP',
    'URL': 'URL',
    'URI': 'URI'
  };

  for (const [original, replacement] of Object.entries(replacements)) {
    enhanced = enhanced.replace(new RegExp(original, 'g'), replacement);
  }

  // Improve common phrases
  enhanced = enhanced
    .replace(/find (.+) by (.+)/gi, 'retrieve $1 using $2')
    .replace(/get (.+) by (.+)/gi, 'retrieve $1 using $2')
    .replace(/create new (.+)/gi, 'create a new $1')
    .replace(/update (.+) by (.+)/gi, 'update $1 using $2')
    .replace(/delete (.+) by (.+)/gi, 'remove $1 using $2');

  // Add context for better understanding
  if (type === 'description') {
    // Add helpful context for common API operations
    if (enhanced.includes('retrieve') && enhanced.includes('identifier')) {
      enhanced = enhanced.replace(
        /retrieve (.+) using (.+)/gi,
        'retrieve detailed information about $1 using its unique $2'
      );
    }
  }

  return enhanced;
};

/**
 * Extract resource name from API path
 */
const extractResourceName = (path: string): string => {
  const segments = path.split('/').filter(segment => segment && !segment.startsWith('{'));
  const lastSegment = segments[segments.length - 1];
  
  if (!lastSegment) return 'resource';
  
  // Convert plural to singular for better readability
  if (lastSegment.endsWith('s') && lastSegment.length > 1) {
    return lastSegment.slice(0, -1);
  }
  
  return lastSegment;
};

/**
 * Get action verb for HTTP method
 */
const getActionVerb = (method: string): string => {
  const verbs: { [key: string]: string } = {
    get: 'Retrieve',
    post: 'Create',
    put: 'Update',
    patch: 'Modify',
    delete: 'Remove',
    head: 'Check',
    options: 'Query options for'
  };
  
  return verbs[method.toLowerCase()] || 'Process';
};

/**
 * Check if path has parameters
 */
const hasPathParameters = (path: string): boolean => {
  return path.includes('{') && path.includes('}');
};

/**
 * Enhance parameter descriptions
 */
export const enhanceParameterDescription = (
  paramName: string,
  paramType: string,
  originalDescription?: string
): string => {
  if (originalDescription && originalDescription.trim()) {
    return originalDescription;
  }

  // Generate description based on parameter name and type
  const commonDescriptions: { [key: string]: string } = {
    id: 'Unique identifier for the resource',
    limit: 'Maximum number of results to return',
    offset: 'Number of results to skip for pagination',
    page: 'Page number for pagination',
    sort: 'Field to sort results by',
    order: 'Sort order (asc or desc)',
    filter: 'Filter criteria for results',
    search: 'Search query string',
    status: 'Status filter for results',
    type: 'Type filter for results',
    format: 'Response format preference',
    version: 'API version to use'
  };

  const lowerName = paramName.toLowerCase();
  for (const [key, description] of Object.entries(commonDescriptions)) {
    if (lowerName.includes(key)) {
      return description;
    }
  }

  // Generate generic description based on type
  switch (paramType) {
    case 'string':
      return `String value for ${paramName}`;
    case 'number':
    case 'integer':
      return `Numeric value for ${paramName}`;
    case 'boolean':
      return `Boolean flag for ${paramName}`;
    case 'array':
      return `Array of values for ${paramName}`;
    default:
      return `Value for ${paramName}`;
  }
};

/**
 * Create enhancement summary
 */
export const createEnhancementSummary = (
  original: ParsedApiSpec,
  enhanced: ParsedApiSpec
): {
  totalEndpoints: number;
  enhancedEndpoints: number;
  enhancementRate: number;
  improvements: string[];
} => {
  const totalEndpoints = original.endpoints.length;
  let enhancedEndpoints = 0;
  const improvements: string[] = [];

  for (let i = 0; i < totalEndpoints; i++) {
    const originalEndpoint = original.endpoints[i];
    const enhancedEndpoint = enhanced.endpoints[i];

    if (!originalEndpoint || !enhancedEndpoint) continue;

    let hasImprovement = false;

    if (originalEndpoint.summary !== enhancedEndpoint.summary) {
      hasImprovement = true;
      improvements.push(`Enhanced summary for ${originalEndpoint.method} ${originalEndpoint.path}`);
    }

    if (originalEndpoint.description !== enhancedEndpoint.description) {
      hasImprovement = true;
      improvements.push(`Enhanced description for ${originalEndpoint.method} ${originalEndpoint.path}`);
    }

    if (hasImprovement) {
      enhancedEndpoints++;
    }
  }

  return {
    totalEndpoints,
    enhancedEndpoints,
    enhancementRate: totalEndpoints > 0 ? enhancedEndpoints / totalEndpoints : 0,
    improvements
  };
};

// Export as convenient enhancer object for compatibility
export const DescriptionEnhancer = {
  enhance,
  enhanceParameterDescription,
  createEnhancementSummary
};