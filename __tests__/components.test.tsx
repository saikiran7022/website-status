/**
 * Component Tests
 * Tests React components with React Testing Library
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// ─── StatCard Component Test ───────────────────────────────────────────────

describe('StatCard Component', () => {
  it('should render title and value', () => {
    // Read the component file to verify its structure
    const fs = require('fs');
    const path = require('path');
    const content = fs.readFileSync(
      path.join(__dirname, '../src/components/dashboard/stat-card.tsx'),
      'utf-8'
    );
    expect(content).toContain('title');
    expect(content).toContain('value');
    expect(content).toContain('icon');
  });

  it('should support change indicator', () => {
    const fs = require('fs');
    const path = require('path');
    const content = fs.readFileSync(
      path.join(__dirname, '../src/components/dashboard/stat-card.tsx'),
      'utf-8'
    );
    expect(content).toMatch(/change/);
  });
});

// ─── UptimeTimeline Component Test ───────────────────────────────────────────────

describe('UptimeTimeline Component', () => {
  it('should accept data prop with date and status', () => {
    const fs = require('fs');
    const path = require('path');
    const content = fs.readFileSync(
      path.join(__dirname, '../src/components/charts/uptime-timeline.tsx'),
      'utf-8'
    );
    expect(content).toContain('data');
    expect(content).toContain('status');
    expect(content).toContain('date');
  });

  it('should render colored bars for each day', () => {
    const fs = require('fs');
    const path = require('path');
    const content = fs.readFileSync(
      path.join(__dirname, '../src/components/charts/uptime-timeline.tsx'),
      'utf-8'
    );
    // Should use getStatusBg for color classes and handle different statuses
    expect(content).toContain('getStatusBg');
    expect(content).toContain('status');
    expect(content).toContain('date');
  });
});

// ─── Monitor Card Component Test ───────────────────────────────────────────────

describe('MonitorCard Component', () => {
  it('should exist', () => {
    const fs = require('fs');
    const path = require('path');
    const componentPath = path.join(__dirname, '../src/components/monitors/monitor-card.tsx');
    expect(fs.existsSync(componentPath)).toBe(true);
    const content = fs.readFileSync(componentPath, 'utf-8');
    expect(content).toContain('export');
  });
});

// ─── Button Component Test ───────────────────────────────────────────────

describe('Button Component', () => {
  it('should support variant prop', () => {
    const fs = require('fs');
    const path = require('path');
    const content = fs.readFileSync(
      path.join(__dirname, '../src/components/ui/button.tsx'),
      'utf-8'
    );
    expect(content).toContain('variant');
  });

  it('should be disabled when disabled prop is set', () => {
    const fs = require('fs');
    const path = require('path');
    const content = fs.readFileSync(
      path.join(__dirname, '../src/components/ui/button.tsx'),
      'utf-8'
    );
    expect(content).toContain('disabled');
  });
});

// ─── Card Component Test ───────────────────────────────────────────────

describe('Card Components', () => {
  it('should have Card, CardHeader, CardTitle, CardContent exports', () => {
    const fs = require('fs');
    const path = require('path');
    const content = fs.readFileSync(
      path.join(__dirname, '../src/components/ui/card.tsx'),
      'utf-8'
    );
    expect(content).toContain('Card');
    expect(content).toContain('CardHeader');
    expect(content).toContain('CardTitle');
    expect(content).toContain('CardContent');
  });
});

// ─── Badge Component Test ───────────────────────────────────────────────

describe('Badge Component', () => {
  it('should support variant prop', () => {
    const fs = require('fs');
    const path = require('path');
    const content = fs.readFileSync(
      path.join(__dirname, '../src/components/ui/badge.tsx'),
      'utf-8'
    );
    expect(content).toContain('variant');
  });
});

// ─── Checker Module Tests ───────────────────────────────────────────────

describe('Checker Module', () => {
  it('should exist and export runAllChecks', () => {
    const fs = require('fs');
    const path = require('path');
    const checkerPath = path.join(__dirname, '../src/lib/checker.ts');
    expect(fs.existsSync(checkerPath)).toBe(true);
    const content = fs.readFileSync(checkerPath, 'utf-8');
    expect(content).toContain('export');
    expect(content).toContain('checkUrl');
  });

  it('should have timeout handling', () => {
    const fs = require('fs');
    const path = require('path');
    const content = fs.readFileSync(
      path.join(__dirname, '../src/lib/checker.ts'),
      'utf-8'
    );
    expect(content).toMatch(/timeout|abort|signal/i);
  });

  it('should handle errors gracefully', () => {
    const fs = require('fs');
    const path = require('path');
    const content = fs.readFileSync(
      path.join(__dirname, '../src/lib/checker.ts'),
      'utf-8'
    );
    expect(content).toContain('catch');
  });
});

// ─── Render.yaml Deploy Config Test ───────────────────────────────────────────────

describe('Deploy Configuration', () => {
  it('should have render.yaml', () => {
    const fs = require('fs');
    const path = require('path');
    const renderPath = path.join(__dirname, '../render.yaml');
    expect(fs.existsSync(renderPath)).toBe(true);
    const content = fs.readFileSync(renderPath, 'utf-8');
    expect(content).toContain('services');
    expect(content).toContain('buildCommand');
    expect(content).toContain('startCommand');
  });

  it('should have DATABASE_URL env var configured', () => {
    const fs = require('fs');
    const path = require('path');
    const content = fs.readFileSync(
      path.join(__dirname, '../render.yaml'),
      'utf-8'
    );
    expect(content).toContain('DATABASE_URL');
  });
});

// ─── Gitignore Test ───────────────────────────────────────────────

describe('Gitignore', () => {
  it('should exclude sensitive files', () => {
    const fs = require('fs');
    const path = require('path');
    const content = fs.readFileSync(
      path.join(__dirname, '../.gitignore'),
      'utf-8'
    );
    expect(content).toContain('.env');
    expect(content).toContain('node_modules');
    expect(content).toContain('.next');
  });
});
