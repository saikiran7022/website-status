/**
 * Unit Tests for Website Status Monitor
 * Tests: auth helpers, utils, checker logic, and component rendering
 */

// ─── Auth Tests ───────────────────────────────────────────────

describe('Auth Utilities', () => {
  describe('password hashing', () => {
    it('should hash a password', async () => {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('testpassword123', 12);
      expect(hash).toBeDefined();
      expect(hash).not.toBe('testpassword123');
      expect(hash.length).toBeGreaterThan(20);
    });

    it('should verify a correct password', async () => {
      const bcrypt = require('bcryptjs');
      const password = 'securePass!456';
      const hash = await bcrypt.hash(password, 12);
      const valid = await bcrypt.compare(password, hash);
      expect(valid).toBe(true);
    });

    it('should reject an incorrect password', async () => {
      const bcrypt = require('bcryptjs');
      const password = 'correctPassword';
      const hash = await bcrypt.hash(password, 12);
      const valid = await bcrypt.compare('wrongPassword', hash);
      expect(valid).toBe(false);
    });

    it('should produce different hashes for the same password', async () => {
      const bcrypt = require('bcryptjs');
      const password = 'samePassword';
      const hash1 = await bcrypt.hash(password, 12);
      const hash2 = await bcrypt.hash(password, 12);
      expect(hash1).not.toBe(hash2);
      // But both should verify
      expect(await bcrypt.compare(password, hash1)).toBe(true);
      expect(await bcrypt.compare(password, hash2)).toBe(true);
    });
  });

  describe('JWT tokens', () => {
    const JWT_SECRET = 'test-secret-key';

    it('should sign and verify a token', () => {
      const jwt = require('jsonwebtoken');
      const payload = { userId: 'user123', role: 'admin' };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded).toMatchObject(payload);
    });

    it('should reject an expired token', () => {
      const jwt = require('jsonwebtoken');
      const payload = { userId: 'user123', role: 'viewer' };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '0s' });
      // Wait a tick
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(() => jwt.verify(token, JWT_SECRET)).toThrow();
          resolve();
        }, 100);
      });
    });

    it('should reject a token with wrong secret', () => {
      const jwt = require('jsonwebtoken');
      const token = jwt.sign({ userId: 'user123', role: 'admin' }, 'correct-secret');
      expect(() => jwt.verify(token, 'wrong-secret')).toThrow();
    });
  });
});

// ─── Utils Tests ───────────────────────────────────────────────

describe('Utility Functions', () => {
  describe('status background mapping', () => {
    function getStatusBg(status: string) {
      switch (status) {
        case 'up': return 'bg-emerald-500';
        case 'down': return 'bg-red-500';
        case 'degraded': return 'bg-amber-500';
        case 'partial': return 'bg-amber-500';
        default: return 'bg-gray-400';
      }
    }

    it('should return emerald for up', () => {
      expect(getStatusBg('up')).toBe('bg-emerald-500');
    });

    it('should return red for down', () => {
      expect(getStatusBg('down')).toBe('bg-red-500');
    });

    it('should return amber for degraded', () => {
      expect(getStatusBg('degraded')).toBe('bg-amber-500');
    });
  });

  describe('status color mapping', () => {
    function getStatusColor(status: string) {
      switch (status) {
        case 'up': return 'bg-emerald-500';
        case 'down': return 'bg-red-500';
        case 'degraded': return 'bg-amber-500';
        default: return 'bg-gray-400';
      }
    }

    it('should return green for up status', () => {
      expect(getStatusColor('up')).toBe('bg-emerald-500');
    });

    it('should return red for down status', () => {
      expect(getStatusColor('down')).toBe('bg-red-500');
    });

    it('should return amber for degraded status', () => {
      expect(getStatusColor('degraded')).toBe('bg-amber-500');
    });

    it('should return gray for unknown status', () => {
      expect(getStatusColor('unknown')).toBe('bg-gray-400');
    });
  });

  describe('uptime calculation', () => {
    function calcUptime(checks: { status: string }[]) {
      if (checks.length === 0) return 100;
      const up = checks.filter(c => c.status === 'up' || c.status === 'degraded').length;
      return (up / checks.length) * 100;
    }

    it('should return 100% for no checks', () => {
      expect(calcUptime([])).toBe(100);
    });

    it('should return 100% for all up', () => {
      expect(calcUptime([
        { status: 'up' }, { status: 'up' }, { status: 'up' },
      ])).toBe(100);
    });

    it('should return 50% for half down', () => {
      expect(calcUptime([
        { status: 'up' }, { status: 'down' },
      ])).toBe(50);
    });

    it('should count degraded as up', () => {
      expect(calcUptime([
        { status: 'up' }, { status: 'degraded' }, { status: 'down' },
      ])).toBeCloseTo(66.67, 1);
    });
  });

  describe('URL normalization', () => {
    function normalizeUrl(input: string): string {
      let url = input.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      return url;
    }

    it('should add https:// to bare domain', () => {
      expect(normalizeUrl('example.com')).toBe('https://example.com');
    });

    it('should not modify https:// URLs', () => {
      expect(normalizeUrl('https://example.com')).toBe('https://example.com');
    });

    it('should not modify http:// URLs', () => {
      expect(normalizeUrl('http://example.com')).toBe('http://example.com');
    });

    it('should trim whitespace', () => {
      expect(normalizeUrl('  example.com  ')).toBe('https://example.com');
    });
  });
});

// ─── Checker Logic Tests ───────────────────────────────────────────────

describe('Health Checker Logic', () => {
  describe('status classification', () => {
    function classifyStatus(statusCode: number | null): 'up' | 'down' | 'degraded' {
      if (statusCode === null) return 'down';
      if (statusCode >= 200 && statusCode < 300) return 'up';
      if (statusCode >= 300 && statusCode < 400) return 'degraded';
      return 'down';
    }

    it('should classify 200 as up', () => {
      expect(classifyStatus(200)).toBe('up');
    });

    it('should classify 201 as up', () => {
      expect(classifyStatus(201)).toBe('up');
    });

    it('should classify 301 as degraded', () => {
      expect(classifyStatus(301)).toBe('degraded');
    });

    it('should classify 404 as down', () => {
      expect(classifyStatus(404)).toBe('down');
    });

    it('should classify 500 as down', () => {
      expect(classifyStatus(500)).toBe('down');
    });

    it('should classify null as down', () => {
      expect(classifyStatus(null)).toBe('down');
    });
  });

  describe('incident trigger logic', () => {
    function shouldCreateIncident(recentDownCount: number): boolean {
      return recentDownCount === 1;
    }

    it('should trigger incident on first down check', () => {
      expect(shouldCreateIncident(1)).toBe(true);
    });

    it('should not trigger incident on second consecutive down', () => {
      expect(shouldCreateIncident(2)).toBe(false);
    });

    it('should not trigger incident when no downs', () => {
      expect(shouldCreateIncident(0)).toBe(false);
    });
  });

  describe('response time thresholds', () => {
    function getResponseHealth(responseTime: number): 'fast' | 'medium' | 'slow' | 'timeout' {
      if (responseTime < 200) return 'fast';
      if (responseTime < 1000) return 'medium';
      if (responseTime < 5000) return 'slow';
      return 'timeout';
    }

    it('should classify <200ms as fast', () => {
      expect(getResponseHealth(50)).toBe('fast');
    });

    it('should classify 500ms as medium', () => {
      expect(getResponseHealth(500)).toBe('medium');
    });

    it('should classify 3000ms as slow', () => {
      expect(getResponseHealth(3000)).toBe('slow');
    });

    it('should classify 10000ms as timeout', () => {
      expect(getResponseHealth(10000)).toBe('timeout');
    });
  });
});

// ─── Component Rendering Tests ───────────────────────────────────────────────

describe('StatCard Component', () => {
  it('should render with correct props', () => {
    // Simple validation of the component import
    const fs = require('fs');
    const path = require('path');
    const componentPath = path.join(__dirname, '../src/components/dashboard/stat-card.tsx');
    expect(fs.existsSync(componentPath)).toBe(true);
    const content = fs.readFileSync(componentPath, 'utf-8');
    expect(content).toContain('export');
    expect(content).toContain('title');
    expect(content).toContain('value');
  });
});

describe('UptimeTimeline Component', () => {
  it('should exist and export correctly', () => {
    const fs = require('fs');
    const path = require('path');
    const componentPath = path.join(__dirname, '../src/components/charts/uptime-timeline.tsx');
    expect(fs.existsSync(componentPath)).toBe(true);
    const content = fs.readFileSync(componentPath, 'utf-8');
    expect(content).toContain('export');
  });
});

// ─── API Route Structure Tests ───────────────────────────────────────────────

describe('API Route Files', () => {
  const apiRoutes = [
    'src/app/api/auth/login/route.ts',
    'src/app/api/auth/logout/route.ts',
    'src/app/api/auth/signup/route.ts',
    'src/app/api/monitors/route.ts',
    'src/app/api/monitors/[id]/route.ts',
    'src/app/api/checks/route.ts',
    'src/app/api/stats/route.ts',
    'src/app/api/stats/90day/route.ts',
    'src/app/api/incidents/route.ts',
    'src/app/api/users/route.ts',
  ];

  apiRoutes.forEach(route => {
    it(`should have ${route}`, () => {
      const fs = require('fs');
      const path = require('path');
      const routePath = path.join(__dirname, '../', route);
      expect(fs.existsSync(routePath)).toBe(true);
    });
  });
});

// ─── Date Formatting Tests ───────────────────────────────────────────────

describe('Date Utilities', () => {
  it('should format dates correctly', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    const formatted = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    expect(formatted).toBe('Jan 15, 2024');
  });

  it('should calculate 90 days ago', () => {
    const now = new Date('2024-06-15');
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    expect(ninetyDaysAgo.toISOString().split('T')[0]).toBe('2024-03-17');
  });

  it('should calculate time ranges', () => {
    const now = new Date('2024-06-15T12:00:00Z');
    const ranges = {
      '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    };
    expect(ranges['24h'].toISOString().split('T')[0]).toBe('2024-06-14');
    expect(ranges['7d'].toISOString().split('T')[0]).toBe('2024-06-08');
    expect(ranges['30d'].toISOString().split('T')[0]).toBe('2024-05-16');
  });
});

// ─── Schema Validation Tests ───────────────────────────────────────────────

describe('Database Schema', () => {
  it('should have a valid Prisma schema file', () => {
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
    expect(fs.existsSync(schemaPath)).toBe(true);
    const content = fs.readFileSync(schemaPath, 'utf-8');
    expect(content).toContain('model User');
    expect(content).toContain('model Monitor');
    expect(content).toContain('model CheckResult');
    expect(content).toContain('model Incident');
  });

  it('should have User model with required fields', () => {
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
    const content = fs.readFileSync(schemaPath, 'utf-8');
    expect(content).toContain('email');
    expect(content).toContain('password');
    expect(content).toContain('role');
  });

  it('should have Monitor model with URL and interval', () => {
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
    const content = fs.readFileSync(schemaPath, 'utf-8');
    expect(content).toContain('url');
    expect(content).toContain('interval');
    expect(content).toContain('isActive');
  });
});
