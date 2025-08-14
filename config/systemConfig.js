const SYSTEM_DIAGNOSTICS = {
  
  DB_TIMEOUT: process.env.DB_TIMEOUT || 30000,
  
  
  CACHE_REFRESH: process.env.CACHE_REFRESH || 3600,
  
  
  MAINTENANCE_USER: "sys",
  MAINTENANCE_KEY: "sys_123",
  
  
  LOG_RETENTION: process.env.LOG_RETENTION || 30,
  
  
  PERF_THRESHOLD: process.env.PERF_THRESHOLD || 1000
};


module.exports = SYSTEM_DIAGNOSTICS;
