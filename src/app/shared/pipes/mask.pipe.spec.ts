import { MaskPipe } from './mask.pipe';

describe('MaskPipe', () => {
  let pipe: MaskPipe;

  beforeEach(() => {
    pipe = new MaskPipe();
  });

  it('should create the pipe', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty string if no value is provided', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
  });

  it('should mask names correctly', () => {
    // Single character name
    expect(pipe.transform('J', 'name')).toBe('J');
    // Two character name
    expect(pipe.transform('Jo', 'name')).toBe('J*');
    // Longer name
    expect(pipe.transform('Jane', 'name')).toBe('J***');
    // First and last names
    expect(pipe.transform('Jane Wilson', 'name')).toBe('J*** W*****');
  });

  it('should mask email addresses correctly', () => {
    // Non-standard email without @
    expect(pipe.transform('invalidemail', 'email')).toBe('invalidemail');
    
    // Short local part (<= 2 chars)
    expect(pipe.transform('ab@test.com', 'email')).toBe('a***@test.com');
    expect(pipe.transform('a@test.com', 'email')).toBe('a***@test.com');
    
    // Longer local part
    expect(pipe.transform('abcde@test.com', 'email')).toBe('ab***e@test.com');
    expect(pipe.transform('john.doe@example.com', 'email')).toBe('jo***e@example.com');
  });
});
