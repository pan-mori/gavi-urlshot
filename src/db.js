import { PrismaClient } from '@prisma/client';

// Jednoduchá Prisma 6 konfigurace (jako DPF projekt)
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// Initialize database
async function initDb() {
  try {
    await prisma.$connect();
    console.log('Prisma Postgres connected');
    return prisma;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

// Get URL by short code
async function getUrlByShortCode(shortCode) {
  return await prisma.url.findUnique({
    where: { shortCode }
  });
}

// Get all URLs with click counts
async function getAllUrls() {
  const urls = await prisma.url.findMany({
    include: {
      _count: {
        select: { clicks: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return urls.map(url => ({
    id: url.id,
    short_code: url.shortCode,
    target_url: url.targetUrl,
    description: url.description,
    created_at: url.createdAt,
    click_count: url._count.clicks
  }));
}

// Create new URL mapping
async function createUrl(shortCode, targetUrl, description = null) {
  const url = await prisma.url.create({
    data: {
      shortCode,
      targetUrl,
      description
    }
  });

  return {
    id: url.id,
    short_code: url.shortCode,
    target_url: url.targetUrl,
    description: url.description
  };
}

// Update URL mapping
async function updateUrl(id, targetUrl, description) {
  try {
    await prisma.url.update({
      where: { id },
      data: {
        targetUrl,
        description
      }
    });
    return true;
  } catch (error) {
    if (error.code === 'P2025') {
      return false;
    }
    throw error;
  }
}

// Delete URL mapping
async function deleteUrl(id) {
  try {
    await prisma.url.delete({
      where: { id }
    });
    return true;
  } catch (error) {
    if (error.code === 'P2025') {
      return false;
    }
    throw error;
  }
}

// Log a click
async function logClick(urlId, userAgent = null, referrer = null) {
  await prisma.click.create({
    data: {
      urlId,
      userAgent,
      referrer
    }
  });
}

// Get statistics for a URL
async function getStats(urlId) {
  const total = await prisma.click.count({
    where: { urlId }
  });

  const clicks = await prisma.click.findMany({
    where: { urlId },
    select: {
      clickedAt: true
    },
    orderBy: { clickedAt: 'desc' },
    take: 1000
  });

  const byDayMap = new Map();
  clicks.forEach(click => {
    const date = click.clickedAt.toISOString().split('T')[0];
    byDayMap.set(date, (byDayMap.get(date) || 0) + 1);
  });

  const byDay = Array.from(byDayMap.entries())
    .map(([date, count]) => ({ date, count }))
    .slice(0, 30);

  return {
    total,
    byDay
  };
}

// Graceful shutdown
async function disconnect() {
  await prisma.$disconnect();
}

export {
  initDb,
  getUrlByShortCode,
  getAllUrls,
  createUrl,
  updateUrl,
  deleteUrl,
  logClick,
  getStats,
  disconnect,
  prisma
};
