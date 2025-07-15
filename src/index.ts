#!/usr/bin/env node

/**
 * MCP Swagger Generator
 * Main entry point for the framework - Functional approach
 */

export { SwaggerParser, parse, validateSpec, getBaseUrl, getOperationId, getOperationTags, getSecurityRequirements } from './core/parser.js';
export { DescriptionEnhancer, enhance, enhanceParameterDescription, createEnhancementSummary } from './core/enhancer.js';
export { McpToolGenerator, generate, generateServerCode } from './core/generator.js';
export { SchemaValidator, validate, validateParameterSchema, validateMcpTool, validateServerConfig } from './core/validator.js';
export { TemplateRenderer, initializeTemplateSystem, registerTemplate, render, renderString, getDefaultTemplates } from './utils/template-utils.js';
export { FileUtils, readFile, writeFile, readJson, writeJson, exists, ensureDir } from './utils/file-utils.js';
export { HttpUtils } from './utils/http-utils.js';

// Types
export type {
  SwaggerSpec,
  McpToolSpec,
  GeneratorConfig,
  EnhancedDescription,
  ValidationResult,
  ParsedApiSpec,
  ApiEndpoint,
  TemplateContext,
  AuthenticationSpec,
  Parameter,
  Schema,
  SecurityScheme,
  SecurityRequirement,
  RequestBody,
  Response,
  HttpMethod,
  EnhancementOptions,
  GeneratorOptions,
  ValidationOptions,
  AuthenticationOptions,
  ErrorHandlingOptions,
  OutputOptions,
  NamingOptions,
  BatchConfig,
  CliOptions
} from './types/index.js';

import { parse } from './core/parser.js';
import { enhance } from './core/enhancer.js';
import { generate, generateServerCode } from './core/generator.js';
import { validate, validateParsedSpec } from './core/validator.js';
import { 
  SwaggerSpec, 
  ParsedApiSpec, 
  McpToolSpec, 
  GeneratorConfig,
  EnhancementOptions,
  GeneratorOptions 
} from './types/index.js';

/**
 * Main framework function for generating MCP server from a single Swagger specification
 */
export const generateServer = async (
  input: string | SwaggerSpec,
  outputPath: string,
  options: {
    enhanceDescriptions?: boolean;
    templatePath?: string;
    serverName?: string;
    baseUrl?: string;
  } = {}
): Promise<void> => {
  console.log('🚀 Starting MCP server generation...');
  
  // Parse the swagger specification
  const spec = await parse(input);
  console.log(`📋 Parsed specification: ${spec.info.title}`);

  // Validate the specification
  const validationResult = validateParsedSpec(spec);
  if (!validationResult.isValid) {
    throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
  }

  // Enhance descriptions if requested
  const enhancedSpec = options.enhanceDescriptions
    ? await enhance(spec, { enabled: true })
    : spec;

  // Generate MCP tools
  const mcpTools = await generate(enhancedSpec);
  console.log(`🛠️  Generated ${mcpTools.length} MCP tools`);

  // Generate server code
  const generateOptions: { serverName: string; templatePath?: string; baseUrl?: string } = {
    serverName: options.serverName || spec.info.title
  };
  
  if (options.templatePath) {
    generateOptions.templatePath = options.templatePath;
  }
  
  if (options.baseUrl) {
    generateOptions.baseUrl = options.baseUrl;
  }

  await generateServerCode(mcpTools, outputPath, generateOptions);

  console.log(`✅ MCP server generated successfully at: ${outputPath}`);
};

/**
 * Generate MCP server from multiple Swagger specifications
 */
export const generateBatchServer = async (
  inputs: Array<string | SwaggerSpec>,
  outputPath: string,
  options: {
    enhanceDescriptions?: boolean;
    templatePath?: string;
    serverName?: string;
  } = {}
): Promise<void> => {
  console.log('🚀 Starting batch MCP server generation...');
  
  const allMcpTools: McpToolSpec[] = [];
  
  for (const input of inputs) {
    const spec = await parse(input);
    console.log(`📋 Parsed specification: ${spec.info.title}`);

    const validationResult = validateParsedSpec(spec);
    if (!validationResult.isValid) {
      console.warn(`⚠️  Validation warnings for ${spec.info.title}: ${validationResult.errors.join(', ')}`);
    }

    const enhancedSpec = options.enhanceDescriptions
      ? await enhance(spec, { enabled: true })
      : spec;

    const mcpTools = await generate(enhancedSpec);
    allMcpTools.push(...mcpTools);
  }

  console.log(`🛠️  Generated ${allMcpTools.length} MCP tools from ${inputs.length} specifications`);

  // Generate combined server code
  const generateOptions: { serverName: string; templatePath?: string } = {
    serverName: options.serverName || 'Combined MCP Server'
  };
  
  if (options.templatePath) {
    generateOptions.templatePath = options.templatePath;
  }

  await generateServerCode(allMcpTools, outputPath, generateOptions);

  console.log(`✅ Batch MCP server generated successfully at: ${outputPath}`);
};

/**
 * Main framework class for backward compatibility
 */
export class McpSwaggerGenerator {
  private config: GeneratorConfig;

  constructor(config: GeneratorConfig = {}) {
    this.config = config;
  }

  /**
   * Generate MCP server from a single Swagger specification
   */
  async generateServer(
    input: string | SwaggerSpec,
    outputPath: string,
    options: {
      enhanceDescriptions?: boolean;
      templatePath?: string;
      serverName?: string;
    } = {}
  ): Promise<void> {
    return generateServer(input, outputPath, options);
  }

  /**
   * Generate MCP server from multiple Swagger specifications
   */
  async generateBatchServer(
    inputs: Array<string | SwaggerSpec>,
    outputPath: string,
    options: {
      enhanceDescriptions?: boolean;
      templatePath?: string;
      serverName?: string;
    } = {}
  ): Promise<void> {
    return generateBatchServer(inputs, outputPath, options);
  }
}

// Export default instance
export default new McpSwaggerGenerator();