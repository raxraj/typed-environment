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

  it('should parse extended boolean values correctly', () => {
    fs.writeFileSync(
      tempEnvPath,
      'BOOL_TRUE=true\nBOOL_FALSE=false\nBOOL_YES=yes\nBOOL_NO=no\nBOOL_1=1\nBOOL_0=0',
    );

    const schema = {
      BOOL_TRUE: {type: 'boolean', required: true},
      BOOL_FALSE: {type: 'boolean', required: true},
      BOOL_YES: {type: 'boolean', required: true},
      BOOL_NO: {type: 'boolean', required: true},
      BOOL_1: {type: 'boolean', required: true},
      BOOL_0: {type: 'boolean', required: true},
    } as const;

    const env = new TypedEnv(schema);
    env.configEnvironment('.env.test');
    const config = env.init();

    expect(config.BOOL_TRUE).toBe(true);
    expect(config.BOOL_FALSE).toBe(false);
    expect(config.BOOL_YES).toBe(true);
    expect(config.BOOL_NO).toBe(false);
    expect(config.BOOL_1).toBe(true);
    expect(config.BOOL_0).toBe(false);
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
      'BOOL_TRUE_UPPER=TRUE\nBOOL_FALSE_UPPER=FALSE\nBOOL_YES_UPPER=YES\nBOOL_NO_UPPER=NO',
    );

    const schema = {
      BOOL_TRUE_UPPER: {type: 'boolean', required: true},
      BOOL_FALSE_UPPER: {type: 'boolean', required: true},
      BOOL_YES_UPPER: {type: 'boolean', required: true},
      BOOL_NO_UPPER: {type: 'boolean', required: true},
    } as const;

    const env = new TypedEnv(schema);
    env.configEnvironment('.env.test');
    const config = env.init();

    expect(config.BOOL_TRUE_UPPER).toBe(true);
    expect(config.BOOL_FALSE_UPPER).toBe(false);
    expect(config.BOOL_YES_UPPER).toBe(true);
    expect(config.BOOL_NO_UPPER).toBe(false);
  });
});
