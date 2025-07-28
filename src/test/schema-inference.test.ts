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
      const config = env.init('.env.test');

      // Verify that the values are parsed correctly based on inferred types
      expect(config.STRING_VALUE).toBe('hello');
      expect(config.ANOTHER_STRING).toBe('world with spaces');
    });

    it('should infer number types for numeric values', () => {
      fs.writeFileSync(
        tempEnvPath,
        'INTEGER_VALUE=42\nFLOAT_VALUE=3.14\nNEGATIVE_VALUE=-100',
      );

      const env = new TypedEnv();
      const config = env.init('.env.test');

      expect(config.INTEGER_VALUE).toBe(42);
      expect(config.FLOAT_VALUE).toBe(3.14);
      expect(config.NEGATIVE_VALUE).toBe(-100);
    });

    it('should infer boolean types for boolean values', () => {
      fs.writeFileSync(tempEnvPath, 'BOOL_TRUE=true\nBOOL_FALSE=false');

      const env = new TypedEnv();
      const config = env.init('.env.test');

      expect(config.BOOL_TRUE).toBe(true);
      expect(config.BOOL_FALSE).toBe(false);
    });

    it('should infer previously supported boolean values as strings', () => {
      fs.writeFileSync(
        tempEnvPath,
        'BOOL_YES=yes\nBOOL_NO=no\nBOOL_1=1\nBOOL_0=0',
      );

      const env = new TypedEnv();
      const config = env.init('.env.test');

      // These should now be inferred as strings/numbers since we only support true/false for booleans
      expect(config.BOOL_YES).toBe('yes');
      expect(config.BOOL_NO).toBe('no');
      expect(config.BOOL_1).toBe(1);
      expect(config.BOOL_0).toBe(0);
    });

    it('should handle mixed types in the same file', () => {
      fs.writeFileSync(
        tempEnvPath,
        'DATABASE_URL=postgresql://localhost:5432/myapp\nPORT=3000\nDEBUG=true\nNODE_ENV=development',
      );

      const env = new TypedEnv();
      const config = env.init('.env.test');

      expect(config.DATABASE_URL).toBe('postgresql://localhost:5432/myapp');
      expect(config.PORT).toBe(3000);
      expect(config.DEBUG).toBe(true);
      expect(config.NODE_ENV).toBe('development');
    });

    it('should handle edge cases and ambiguous values', () => {
      fs.writeFileSync(
        tempEnvPath,
        'EMPTY_VALUE=\nZERO_STRING="0"\nNUMBER_STRING="123"\nQUOTED_TRUE="true"',
      );

      const env = new TypedEnv();
      const config = env.init('.env.test');

      // Empty values should default to string
      expect(config.EMPTY_VALUE).toBe('');

      // Quoted values should be treated as strings
      expect(config.ZERO_STRING).toBe('0');
      expect(config.NUMBER_STRING).toBe('123');
      expect(config.QUOTED_TRUE).toBe('true');
    });
  });

  describe('Schema-Free Initialization', () => {
    it('should initialize TypedEnv without schema and infer from env file', () => {
      fs.writeFileSync(
        tempEnvPath,
        'DATABASE_URL=postgresql://localhost:5432/myapp\nPORT=8080\nDEBUG=true\nNODE_ENV=development',
      );

      const env = new TypedEnv();
      const config = env.init('.env.test');

      expect(config.DATABASE_URL).toBe('postgresql://localhost:5432/myapp');
      expect(config.PORT).toBe(8080);
      expect(config.DEBUG).toBe(true);
      expect(config.NODE_ENV).toBe('development');
    });

    it('should handle empty env file gracefully', () => {
      fs.writeFileSync(tempEnvPath, '# Just a comment\n\n');

      const env = new TypedEnv();
      const config = env.init('.env.test');

      expect(config).toEqual({});
    });

    it('should skip comments and empty lines during inference', () => {
      fs.writeFileSync(
        tempEnvPath,
        '# Database configuration\nDATABASE_URL=postgresql://localhost:5432/myapp\n\n# Server configuration\nPORT=3000\n\n# Debug settings\nDEBUG=true',
      );

      const env = new TypedEnv();
      const config = env.init('.env.test');

      expect(config.DATABASE_URL).toBe('postgresql://localhost:5432/myapp');
      expect(config.PORT).toBe(3000);
      expect(config.DEBUG).toBe(true);
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
      const config = env.init('.env.test');

      expect(config.DATABASE_URL).toBe('postgresql://localhost:5432/myapp');
      expect(config.PORT).toBe(8080);
      expect(config.DEBUG).toBe(true);
    });

    it('should support boolean values with explicit schema', () => {
      fs.writeFileSync(tempEnvPath, 'ENABLE_TRUE=true\nENABLE_FALSE=false');

      const explicitSchema = {
        ENABLE_TRUE: {type: 'boolean', required: true},
        ENABLE_FALSE: {type: 'boolean', required: true},
      } as const;

      const env = new TypedEnv(explicitSchema);
      const config = env.init('.env.test');

      expect(config.ENABLE_TRUE).toBe(true);
      expect(config.ENABLE_FALSE).toBe(false);
    });
  });
});
