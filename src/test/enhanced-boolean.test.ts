import TypedEnv from '../index';
import * as path from 'path';
import * as fs from 'fs';

describe('Enhanced Boolean Support Tests', () => {
  const tempEnvPath = path.resolve(process.cwd(), '.env.test');

  afterEach(() => {
    // Clean up temp files after tests
    if (fs.existsSync(tempEnvPath)) {
      fs.unlinkSync(tempEnvPath);
    }
  });

  it('should parse boolean values correctly', () => {
    fs.writeFileSync(tempEnvPath, 'BOOL_TRUE=true\nBOOL_FALSE=false');

    const schema = {
      BOOL_TRUE: {type: 'boolean', required: true},
      BOOL_FALSE: {type: 'boolean', required: true},
    } as const;

    const env = new TypedEnv(schema);
    env.configEnvironment('.env.test');
    const config = env.init();

    expect(config.BOOL_TRUE).toBe(true);
    expect(config.BOOL_FALSE).toBe(false);
  });

  it('should throw error for invalid boolean values', () => {
    fs.writeFileSync(tempEnvPath, 'INVALID_BOOL=maybe');

    const schema = {
      INVALID_BOOL: {type: 'boolean', required: true},
    } as const;

    const env = new TypedEnv(schema);
    env.configEnvironment('.env.test');

    expect(() => env.init()).toThrow(
      'Environment variable "INVALID_BOOL" must be a boolean (true/false), but received "maybe".',
    );
  });

  it('should handle case sensitivity for boolean values', () => {
    fs.writeFileSync(
      tempEnvPath,
      'BOOL_TRUE_UPPER=TRUE\nBOOL_FALSE_UPPER=FALSE',
    );

    const schema = {
      BOOL_TRUE_UPPER: {type: 'boolean', required: true},
      BOOL_FALSE_UPPER: {type: 'boolean', required: true},
    } as const;

    const env = new TypedEnv(schema);
    env.configEnvironment('.env.test');
    const config = env.init();

    expect(config.BOOL_TRUE_UPPER).toBe(true);
    expect(config.BOOL_FALSE_UPPER).toBe(false);
  });

  it('should throw error for previously supported extended boolean values', () => {
    // Test that yes/no/1/0 are no longer supported
    fs.writeFileSync(tempEnvPath, 'BOOL_YES=yes');

    const schema = {
      BOOL_YES: {type: 'boolean', required: true},
    } as const;

    const env = new TypedEnv(schema);
    env.configEnvironment('.env.test');

    expect(() => env.init()).toThrow(
      'Environment variable "BOOL_YES" must be a boolean (true/false), but received "yes".',
    );
  });
});
