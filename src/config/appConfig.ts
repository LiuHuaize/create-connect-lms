// 应用程序配置
export const appConfig = {
  // 课程数据刷新配置
  courseData: {
    // 是否在完成课时后自动刷新课程数据
    // 设置为false可以避免数据刷新时的潜在问题
    autoRefreshAfterCompletion: false,
    
    // 是否在提交测验后自动刷新课程数据
    // 设置为false可以避免简答题提交后的数据丢失问题
    autoRefreshAfterQuizSubmit: false,
  },
  
  // 调试配置
  debug: {
    // 是否在控制台显示详细的调试信息
    logRefreshEvents: true,
  }
}; 