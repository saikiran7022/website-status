import { prisma } from "@/lib/db";

export interface CheckResult {
  monitorId: string;
  timestamp: Date;
  responseTime: number | null;
  statusCode: number | null;
  success: boolean;
  errorMessage: string | null;
  attempt: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

async function performCheck(url: string, monitorId: string, timeout: number = 30000): Promise<CheckResult> {
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(url.startsWith('http') ? url : `https://${url}`, {
      method: 'GET',
      headers: { 'User-Agent': 'WebsiteStatus/1.0' },
      signal: controller.signal,
      redirect: 'manual',
    });
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    const success = response.status >= 200 && response.status < 400;
    return {
      monitorId,
      timestamp: new Date(),
      responseTime,
      statusCode: response.status,
      success,
      errorMessage: success ? null : `HTTP ${response.status}`,
      attempt: 1,
    };
  } catch (error: any) {
    return {
      monitorId,
      timestamp: new Date(),
      responseTime: Date.now() - startTime,
      statusCode: null,
      success: false,
      errorMessage: error?.message || 'Connection failed',
      attempt: 1,
    };
  }
}

export async function checkMonitorWithRetry(monitor: { id: string; url: string; timeout?: number | null }): Promise<CheckResult> {
  let lastResult: CheckResult | null = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    lastResult = await performCheck(monitor.url, monitor.id, monitor.timeout ?? 30000);
    if (lastResult.success) {
      await prisma.checkResult.create({
        data: {
          monitorId: monitor.id,
          status: 'up',
          statusCode: lastResult.statusCode,
          responseTime: lastResult.responseTime ?? 0,
          error: null,
        },
      });
      return lastResult;
    }
    if (attempt < MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * attempt));
    }
  }
  if (lastResult) {
    await prisma.checkResult.create({
      data: {
        monitorId: monitor.id,
        status: 'down',
        statusCode: lastResult.statusCode,
        responseTime: lastResult.responseTime ?? 0,
        error: lastResult.errorMessage,
      },
    });
  }
  return lastResult ?? { monitorId: monitor.id, timestamp: new Date(), responseTime: null, statusCode: null, success: false, errorMessage: 'Check failed', attempt: MAX_RETRIES };
}

export async function runAllChecks() {
  const monitors = await prisma.monitor.findMany({ where: { isActive: true } });
  const results: { monitor: { id: string; name: string; url: string }; result: CheckResult }[] = [];
  for (const monitor of monitors) {
    const result = await checkMonitorWithRetry(monitor);
    results.push({ monitor: { id: monitor.id, name: monitor.name, url: monitor.url }, result });
  }
  return results;
}

export async function testMonitor(monitor: { id: string; url: string; timeout?: number | null }): Promise<CheckResult> {
  return checkMonitorWithRetry(monitor);
}
