import { describe, it, expect } from 'vitest';
import { parseCSharpFile, shouldAutoExclude } from './csharpParser';

const SAMPLE_CS = `
namespace MyApp.Services;

/// <summary>
/// Manages user authentication
/// </summary>
public class AuthService : BaseService, IAuthService
{
    private readonly string _connectionString;
    public string ServiceName { get; set; } = "Auth";

    public AuthService(string connectionString)
    {
        _connectionString = connectionString;
    }

    public async Task<bool> LoginAsync(string username, string password)
    {
        return await Task.FromResult(true);
    }

    public void Logout(string sessionId) { }
}

public interface IAuthService
{
    Task<bool> LoginAsync(string username, string password);
}
`;

describe('csharpParser', () => {
  describe('parseCSharpFile', () => {
    it('extracts namespace', () => {
      const classes = parseCSharpFile('AuthService.cs', SAMPLE_CS);
      expect(classes[0].namespace).toBe('MyApp.Services');
    });

    it('extracts class name and modifiers', () => {
      const classes = parseCSharpFile('AuthService.cs', SAMPLE_CS);
      const authService = classes.find((c) => c.name === 'AuthService');
      expect(authService).toBeDefined();
      expect(authService?.accessModifier).toBe('public');
      expect(authService?.isAbstract).toBe(false);
      expect(authService?.isInterface).toBe(false);
    });

    it('extracts base class', () => {
      const classes = parseCSharpFile('AuthService.cs', SAMPLE_CS);
      const authService = classes.find((c) => c.name === 'AuthService');
      expect(authService?.baseClass).toBe('BaseService');
    });

    it('extracts interface', () => {
      const classes = parseCSharpFile('AuthService.cs', SAMPLE_CS);
      const iface = classes.find((c) => c.name === 'IAuthService');
      expect(iface).toBeDefined();
      expect(iface?.isInterface).toBe(true);
    });

    it('extracts properties', () => {
      const classes = parseCSharpFile('AuthService.cs', SAMPLE_CS);
      const authService = classes.find((c) => c.name === 'AuthService');
      expect(authService?.properties.length).toBeGreaterThan(0);
      const prop = authService?.properties.find((p) => p.name === 'ServiceName');
      expect(prop).toBeDefined();
      expect(prop?.type).toBe('string');
    });

    it('extracts methods', () => {
      const classes = parseCSharpFile('AuthService.cs', SAMPLE_CS);
      const authService = classes.find((c) => c.name === 'AuthService');
      const loginMethod = authService?.methods.find((m) => m.name === 'LoginAsync');
      expect(loginMethod).toBeDefined();
      expect(loginMethod?.parameters.length).toBe(2);
    });

    it('extracts private fields', () => {
      const classes = parseCSharpFile('AuthService.cs', SAMPLE_CS);
      const authService = classes.find((c) => c.name === 'AuthService');
      const field = authService?.fields.find((f) => f.name === '_connectionString');
      expect(field).toBeDefined();
      expect(field?.type).toBe('string');
    });

    it('returns empty array for file with no classes', () => {
      const classes = parseCSharpFile('empty.cs', 'using System;');
      expect(classes).toHaveLength(0);
    });
  });

  describe('shouldAutoExclude', () => {
    it('excludes Migrations folder', () => {
      expect(shouldAutoExclude('src/Migrations/20240101_Init.cs')).toBe(true);
    });

    it('excludes .Designer.cs files', () => {
      expect(shouldAutoExclude('Forms/MainForm.Designer.cs')).toBe(true);
    });

    it('excludes .g.cs files', () => {
      expect(shouldAutoExclude('obj/Release/MainWindow.g.cs')).toBe(true);
    });

    it('excludes test folders', () => {
      expect(shouldAutoExclude('src/Tests/AuthTest.cs')).toBe(true);
    });

    it('does not exclude normal source files', () => {
      expect(shouldAutoExclude('src/Services/AuthService.cs')).toBe(false);
    });
  });
});
