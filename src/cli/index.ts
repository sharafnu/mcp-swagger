#!/usr/bin/env node

/**
 * CLI Interface for MCP Swagger Generator
 */

import { Command } from 'commander';
import { generateServer, generateBatchServer } from '../index.js';
import { readFile } from 'fs/promises';
import { join } from 'path';

const program = new Command();

program
  .name('mcp-swagger-generator')
  .description('Generate MCP servers from OpenAPI/Swagger specifications')
  .version('1.0.0');

program
  .command('generate')
  .description('Generate MCP server from a single OpenAPI specification')
  .requiredOption('-i, --input <path>', 'Input OpenAPI specification file or URL')
  .requiredOption('-o, --output <path>', 'Output directory for generated server')
  .option('-n, --name <name>', 'Server name')
  .option('-b, --base-url <url>', 'Override base URL for API calls (can be set via environment variable at runtime)')
  .option('-e, --enhance', 'Enable description enhancement', false)
  .option('-t, --template <path>', 'Custom template path')
  .action(async (options) => {
    try {
      console.log('🚀 Generating MCP server...');
      
      await generateServer(
        options.input,
        options.output,
        {
          serverName: options.name,
          baseUrl: options.baseUrl,
          enhanceDescriptions: options.enhance,
          templatePath: options.template
        }
      );
      
      console.log('✅ MCP server generated successfully!');
    } catch (error) {
      console.error('❌ Generation failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('batch')
  .description('Generate MCP server from multiple OpenAPI specifications')
  .requiredOption('-c, --config <path>', 'Configuration file with specification list')
  .requiredOption('-o, --output <path>', 'Output directory for generated server')
  .option('-n, --name <name>', 'Server name')
  .option('-e, --enhance', 'Enable description enhancement', false)
  .option('-t, --template <path>', 'Custom template path')
  .action(async (options) => {
    try {
      console.log('🚀 Generating batch MCP server...');
      
      // Read configuration file
      const configPath = join(process.cwd(), options.config);
      const configContent = await readFile(configPath, 'utf-8');
      const config = JSON.parse(configContent);
      
      if (!config.specifications || !Array.isArray(config.specifications)) {
        throw new Error('Configuration must contain a "specifications" array');
      }
      
      await generateBatchServer(
        config.specifications,
        options.output,
        {
          serverName: options.name,
          enhanceDescriptions: options.enhance,
          templatePath: options.template
        }
      );
      
      console.log('✅ Batch MCP server generated successfully!');
    } catch (error) {
      console.error('❌ Generation failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate an OpenAPI specification')
  .requiredOption('-i, --input <path>', 'Input OpenAPI specification file or URL')
  .action(async (options) => {
    try {
      console.log('🔍 Validating OpenAPI specification...');
      
      const { parse } = await import('../core/parser.js');
      const { validateParsedSpec } = await import('../core/validator.js');
      
      const spec = await parse(options.input);
      const result = validateParsedSpec(spec);
      
      console.log(`📊 Validation Results:`);
      console.log(`  - Valid: ${result.isValid ? '✅' : '❌'}`);
      console.log(`  - Errors: ${result.errors.length}`);
      console.log(`  - Warnings: ${result.warnings.length}`);
      console.log(`  - Suggestions: ${result.suggestions.length}`);
      
      if (result.errors.length > 0) {
        console.log('\n❌ Errors:');
        result.errors.forEach(error => console.log(`  - ${error}`));
      }
      
      if (result.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        result.warnings.forEach(warning => console.log(`  - ${warning}`));
      }
      
      if (result.suggestions.length > 0) {
        console.log('\n💡 Suggestions:');
        result.suggestions.forEach(suggestion => console.log(`  - ${suggestion}`));
      }
      
      process.exit(result.isValid ? 0 : 1);
    } catch (error) {
      console.error('❌ Validation failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();