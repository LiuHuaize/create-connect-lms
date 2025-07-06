/**
 * 系列问答缓存管理器
 * 负责处理所有缓存相关的逻辑，提供统一的缓存接口
 */
export class SeriesQuestionnaireCacheManager {
  private static instance: SeriesQuestionnaireCacheManager;
  private cache: Record<string, any> = {};
  private cacheTimestamps: Record<string, number> = {};
  private readonly defaultExpiryTime: number;

  private constructor(expiryTime: number = 5 * 60 * 1000) {
    this.defaultExpiryTime = expiryTime;
  }

  static getInstance(expiryTime?: number): SeriesQuestionnaireCacheManager {
    if (!SeriesQuestionnaireCacheManager.instance) {
      SeriesQuestionnaireCacheManager.instance = new SeriesQuestionnaireCacheManager(expiryTime);
    }
    return SeriesQuestionnaireCacheManager.instance;
  }

  /**
   * 清除过期缓存
   */
  private clearExpiredCache(): void {
    const now = Date.now();
    Object.keys(this.cacheTimestamps).forEach(key => {
      if (now - this.cacheTimestamps[key] > this.defaultExpiryTime) {
        delete this.cache[key];
        delete this.cacheTimestamps[key];
      }
    });
  }

  /**
   * 设置缓存
   */
  set<T = any>(key: string, data: T): void {
    this.clearExpiredCache();
    this.cache[key] = data;
    this.cacheTimestamps[key] = Date.now();
  }

  /**
   * 获取缓存
   */
  get<T = any>(key: string): T | undefined {
    this.clearExpiredCache();
    return this.cache[key];
  }

  /**
   * 检查缓存是否存在
   */
  has(key: string): boolean {
    this.clearExpiredCache();
    return key in this.cache;
  }

  /**
   * 清除特定模式的缓存
   */
  clearPattern(pattern: string): void {
    Object.keys(this.cache).forEach(key => {
      if (key.includes(pattern)) {
        delete this.cache[key];
        delete this.cacheTimestamps[key];
      }
    });
  }

  /**
   * 清除所有缓存
   */
  clearAll(): void {
    this.cache = {};
    this.cacheTimestamps = {};
  }

  /**
   * 生成缓存键
   */
  static generateKey(prefix: string, ...args: (string | number | undefined)[]): string {
    const validArgs = args.filter(arg => arg !== undefined);
    return `${prefix}_${validArgs.join('_')}`;
  }

  /**
   * 为教师端问答列表生成缓存键
   */
  static generateQuestionnaireListKey(params: {
    lesson_id?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): string {
    return this.generateKey(
      'questionnaires',
      params.lesson_id || 'all',
      params.page || 1,
      params.limit || 10,
      params.search || ''
    );
  }

  /**
   * 缓存装饰器，用于方法级别的缓存
   */
  static withCache<T extends (...args: any[]) => Promise<any>>(
    keyGenerator: (...args: Parameters<T>) => string,
    ttl?: number
  ) {
    return function (
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) {
      const originalMethod = descriptor.value;
      const cacheManager = SeriesQuestionnaireCacheManager.getInstance(ttl);

      descriptor.value = async function (...args: Parameters<T>) {
        const cacheKey = keyGenerator(...args);
        const cachedResult = cacheManager.get(cacheKey);

        if (cachedResult !== undefined) {
          return cachedResult;
        }

        const result = await originalMethod.apply(this, args);
        cacheManager.set(cacheKey, result);
        return result;
      };

      return descriptor;
    };
  }
}