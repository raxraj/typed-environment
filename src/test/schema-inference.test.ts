import TypedEnv from '../index';
import * as path from 'path';
import * as fs from 'fs';

describe('Schema Inference Tests', () => {
  const tempEnvPath = path.resolve(process.cwd(), '.env.test');

  afterEach(() => {
    // Clean up temp files after tests
    if (fs.existsSync(tempEnvPath)) {
      fs.unlinkSync(tempEnvPath);
    }
  });

  describe('Type Inference', () => {
    it('should infer string types for text values', () => {
      fs.writeFileSync(
        tempEnvPath,
        'STRING_VALUE=hello\nANOTHER_STRING="world with spaces"',
      );

      const env = new TypedEnv();
      const schema = env.inferSchemaFromEnv('.env.test');

      expect(schema.STRING_VALUE).toEqual({
        type: 'string',
        required: true,
      });
      expect(schema.ANOTHER_STRING).toEqual({
        type: 'string',
        required: true,
      });
    });

    it('should infer number types for numeric values', () => {
      fs.writeFileSync(
        tempEnvPath,
        'INTEGER_VALUE=42\nFLOAT_VALUE=3.14\nNEGATIVE_VALUE=-100',
      );

      const env = new TypedEnv();
      const schema = env.inferSchemaFromEnv('.env.test');

      expect(schema.INTEGER_VALUE).toEqual({
        type: 'number',
        required: true,
      });
      expect(schema.FLOAT_VALUE).toEqual({
        type: 'number',
        required: true,
      });
      expect(schema.NEGATIVE_VALUE).toEqual({
        type: 'number',
        required: true,
      });
    });

    it('should infer boolean types for boolean values', () => {
      fs.writeFileSync(
        tempEnvPath,
        'BOOL_TRUE=true\nBOOL_FALSE=false\nBOOL_YES=yes\nBOOL_NO=no\nBOOL_1=1\nBOOL_0=0',
      );

      const env = new TypedEnv();
      const schema = env.inferSchemaFromEnv('.env.test');

      expect(schema.BOOL_TRUE).toEqual({
        type: 'boolean',
        required: true,
      });
      expect(schema.BOOL_FALSE).toEqual({
        type: 'boolean',
        required: true,
      });
      expect(schema.BOOL_YES).toEqual({
        type: 'boolean',
        required: true,
      });
      expect(schema.BOOL_NO).toEqual({
        type: 'boolean',
        required: true,
      });
      expect(schema.BOOL_1).toEqual({
        type: 'boolean',
        required: true,
      });
      expect(schema.BOOL_0).toEqual({
        type: 'boolean',
        required: true,
      });
    });

    it('should handle mixed types in the same file', () => {
      fs.writeFileSync(
        tempEnvPath,
        'DATABASE_URL=postgresql://localhost:5432/myapp\nPORT=3000\nDEBUG=true\nNODE_ENV=development',
      );

      const env = new TypedEnv();
      const schema = env.inferSchemaFromEnv('.env.test');

      expect(schema.DATABASE_URL).toEqual({
        type: 'string',
        required: true,
      });
      expect(schema.PORT).toEqual({
        type: 'number',
        required: true,
      });
      expect(schema.DEBUG).toEqual({
        type: 'boolean',
        required: true,
      });
      expect(schema.NODE_ENV).toEqual({
        type: 'string',
        required: true,
      });
    });

    it('should handle edge cases and ambiguous values', () => {
      fs.writeFileSync(
        tempEnvPath,
        'EMPTY_VALUE=\nZERO_STRING="0"\nNUMBER_STRING="123"\nQUOTED_TRUE="true"',
      );

      const env = new TypedEnv();
      const schema = env.inferSchemaFromEnv('.env.test');

      // Empty values should default to string
      expect(schema.EMPTY_VALUE).toEqual({
        type: 'string',
        required: true,
      });

      // Quoted values should be treated as strings
      expect(schema.ZERO_STRING).toEqual({
        type: 'string',
        required: true,
      });
      expect(schema.NUMBER_STRING).toEqual({
        type: 'string',
        required: true,
      });
      expect(schema.QUOTED_TRUE).toEqual({
        type: 'string',
        required: true,
      });
    });
  });

  describe('Schema-Free Initialization', () => {
    it('should initialize TypedEnv without schema and infer from env file', () => {
      fs.writeFileSync(
        tempEnvPath,
        'DATABASE_URL=postgresql://localhost:5432/myapp\nPORT=8080\nDEBUG=true\nNODE_ENV=development',
      );

      const env = new TypedEnv();
      const config = env.initFromEnv('.env.test');

      expect(config.DATABASE_URL).toBe('postgresql://localhost:5432/myapp');
      expect(config.PORT).toBe(8080);
      expect(config.DEBUG).toBe(true);
      expect(config.NODE_ENV).toBe('development');
    });

    it('should handle empty env file gracefully', () => {
      fs.writeFileSync(tempEnvPath, '# Just a comment\n\n');

      const env = new TypedEnv();
      const config = env.initFromEnv('.env.test');

      expect(config).toEqual({});
    });

    it('should skip comments and empty lines during inference', () => {
      fs.writeFileSync(
        tempEnvPath,
        '# Database configuration\nDATABASE_URL=postgresql://localhost:5432/myapp\n\n# Server configuration\nPORT=3000\n\n# Debug settings\nDEBUG=true',
      );

      const env = new TypedEnv();
      const schema = env.inferSchemaFromEnv('.env.test');

      expect(Object.keys(schema)).toEqual(['DATABASE_URL', 'PORT', 'DEBUG']);
      expect(schema.DATABASE_URL.type).toBe('string');
      expect(schema.PORT.type).toBe('number');
      expect(schema.DEBUG.type).toBe('boolean');
    });
  });

  describe('Backward Compatibility', () => {
    it('should still work with explicit schema as before', () => {
      fs.writeFileSync(
        tempEnvPath,
        'DATABASE_URL=postgresql://localhost:5432/myapp\nPORT=8080\nDEBUG=true',
      );

      const explicitSchema = {
        DATABASE_URL: {type: 'string', required: true},
        PORT: {type: 'number', required: true},
        DEBUG: {type: 'boolean', required: true},
      } as const;

      const env = new TypedEnv(explicitSchema);
      env.configEnvironment('.env.test');
      const config = env.init();

      expect(config.DATABASE_URL).toBe('postgresql://localhost:5432/myapp');
      expect(config.PORT).toBe(8080);
      expect(config.DEBUG).toBe(true);
    });

    it('should support enhanced boolean values with explicit schema', () => {
      fs.writeFileSync(
        tempEnvPath,
        'ENABLE_YES=yes\nENABLE_NO=no\nENABLE_1=1\nENABLE_0=0\nENABLE_TRUE=true\nENABLE_FALSE=false',
      );

      const explicitSchema = {
        ENABLE_YES: {type: 'boolean', required: true},
        ENABLE_NO: {type: 'boolean', required: true},
        ENABLE_1: {type: 'boolean', required: true},
        ENABLE_0: {type: 'boolean', required: true},
        ENABLE_TRUE: {type: 'boolean', required: true},
        ENABLE_FALSE: {type: 'boolean', required: true},
      } as const;

      const env = new TypedEnv(explicitSchema);
      env.configEnvironment('.env.test');
      const config = env.init();

      expect(config.ENABLE_YES).toBe(true);
      expect(config.ENABLE_NO).toBe(false);
      expect(config.ENABLE_1).toBe(true);
      expect(config.ENABLE_0).toBe(false);
      expect(config.ENABLE_TRUE).toBe(true);
      expect(config.ENABLE_FALSE).toBe(false);
    });
  });
});
