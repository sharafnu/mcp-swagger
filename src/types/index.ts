/**
 * Type definitions for MCP Swagger Generator
 */

// OpenAPI/Swagger specification types
export interface SwaggerSpec {
  openapi?: string;
  swagger?: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  paths: {
    [path: string]: {
      [method: string]: {
        operationId?: string;
        summary?: string;
        description?: string;
        tags?: string[];
        parameters?: Parameter[];
        requestBody?: RequestBody;
        responses: {
          [statusCode: string]: Response;
        };
        security?: SecurityRequirement[];
      };
    };
  };
  components?: {
    schemas?: { [key: string]: Schema };
    securitySchemes?: { [key: string]: SecurityScheme };
  };
  security?: SecurityRequirement[];
}

export interface Parameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie' | 'body';
  required?: boolean;
  schema: Schema;
  description?: string;
}

export interface RequestBody {
  description?: string;
  content: {
    [mediaType: string]: {
      schema: Schema;
    };
  };
  required?: boolean;
}

export interface Response {
  description: string;
  content?: {
    [mediaType: string]: {
      schema: Schema;
    };
  };
}

export interface Schema {
  type?: string;
  format?: string;
  items?: Schema;
  properties?: { [key: string]: Schema };
  required?: string[];
  enum?: any[];
  $ref?: string;
  description?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  multipleOf?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  example?: any;
  default?: any;
  nullable?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  xml?: any;
  externalDocs?: any;
  deprecated?: boolean;
  discriminator?: any;
  additionalProperties?: boolean | Schema;
  allOf?: Schema[];
  oneOf?: Schema[];
  anyOf?: Schema[];
  not?: Schema;
}

export interface SecurityScheme {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  description?: string;
  name?: string;
  in?: 'query' | 'header' | 'cookie';
  scheme?: string;
  bearerFormat?: string;
  flows?: any;
  openIdConnectUrl?: string;
}

export interface SecurityRequirement {
  [key: string]: string[];
}

// MCP Tool specification types
export interface McpToolSpec {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: { [key: string]: any };
    required?: string[];
  };
  method: string;
  path: string;
  baseUrl?: string;
  authentication?: AuthenticationSpec;
  responseHandling?: ResponseHandlingSpec;
  errorHandling?: ErrorHandlingSpec;
}

export interface AuthenticationSpec {
  type: 'apiKey' | 'bearer' | 'basic' | 'oauth2';
  location?: 'header' | 'query' | 'cookie';
  name?: string;
  value?: string;
  envVariable?: string;
}

export interface ResponseHandlingSpec {
  successCodes: number[];
  responseType: 'json' | 'text' | 'binary';
  extractPath?: string;
}

export interface ErrorHandlingSpec {
  retryCount: number;
  timeoutMs: number;
  errorCodes: { [code: number]: string };
}

// Enhanced description types
export interface EnhancedDescription {
  original: string;
  enhanced: string;
  confidence: number;
  reasoning: string;
}

export interface EnhancementOptions {
  enabled: boolean;
  provider?: 'openai' | 'anthropic' | 'local';
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  preserveOriginal?: boolean;
}

// Generator configuration types
export interface GeneratorConfig {
  enhancementOptions?: EnhancementOptions;
  generatorOptions?: GeneratorOptions;
  outputOptions?: OutputOptions;
}

export interface GeneratorOptions {
  naming?: NamingOptions;
  validation?: ValidationOptions;
  authentication?: AuthenticationOptions;
  errorHandling?: ErrorHandlingOptions;
}

export interface NamingOptions {
  caseStyle: 'camelCase' | 'snake_case' | 'kebab-case';
  prefix?: string;
  suffix?: string;
  removeCommonPrefixes?: boolean;
}

export interface ValidationOptions {
  strictMode: boolean;
  validateInputs: boolean;
  validateOutputs: boolean;
  allowAdditionalProperties: boolean;
}

export interface AuthenticationOptions {
  defaultAuth?: AuthenticationSpec;
  envVariablePrefix?: string;
  supportedSchemes: string[];
}

export interface ErrorHandlingOptions {
  defaultRetryCount: number;
  defaultTimeoutMs: number;
  logErrors: boolean;
  throwOnError: boolean;
}

export interface OutputOptions {
  format: 'typescript' | 'javascript';
  includeTests: boolean;
  includeDocumentation: boolean;
  packageJson?: boolean;
  templatePath?: string;
}

// Validation result types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

// Template context types
export interface TemplateContext {
  serverName: string;
  serverVersion: string;
  description: string;
  tools: McpToolSpec[];
  imports: string[];
  dependencies: { [key: string]: string };
  config: any;
  metadata: {
    generatedAt: string;
    generatorVersion: string;
    sourceSpec: string;
  };
}

// CLI types
export interface CliOptions {
  input: string;
  output: string;
  config?: string;
  enhanceDescriptions?: boolean;
  templatePath?: string;
  serverName?: string;
  verbose?: boolean;
  dryRun?: boolean;
}

export interface BatchConfig {
  specs: Array<{
    input: string;
    name?: string;
    weight?: number;
    enabled?: boolean;
  }>;
  output: string;
  serverName: string;
  enhanceDescriptions: boolean;
  templatePath?: string;
  mergeStrategy: 'combine' | 'namespace' | 'separate';
}

// Utility types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export interface ApiEndpoint {
  path: string;
  method: HttpMethod;
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters: Parameter[];
  requestBody?: RequestBody;
  responses: { [statusCode: string]: Response };
  security?: SecurityRequirement[];
}

export interface ParsedApiSpec {
  info: SwaggerSpec['info'];
  servers?: SwaggerSpec['servers'];
  endpoints: ApiEndpoint[];
  schemas: { [key: string]: Schema };
  securitySchemes: { [key: string]: SecurityScheme };
  globalSecurity?: SecurityRequirement[];
}

// Error types
export class SwaggerParseError extends Error {
  constructor(message: string, public override readonly cause?: Error) {
    super(message);
    this.name = 'SwaggerParseError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public readonly errors: string[]) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class GenerationError extends Error {
  constructor(message: string, public override readonly cause?: Error) {
    super(message);
    this.name = 'GenerationError';
  }
}

export class EnhancementError extends Error {
  constructor(message: string, public override readonly cause?: Error) {
    super(message);
    this.name = 'EnhancementError';
  }
}