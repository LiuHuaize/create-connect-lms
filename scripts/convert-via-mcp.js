/**
 * Base64图片转换脚本 - 使用MCP直接操作
 * 
 * 这个脚本会：
 * 1. 查找包含base64图片的lessons
 * 2. 提取base64图片数据
 * 3. 将图片上传到Supabase Storage
 * 4. 更新数据库中的URL引用
 */

console.log('🚀 Base64图片转换脚本');
console.log('📋 使用说明:');
console.log('1. 这个脚本需要通过MCP工具执行');
console.log('2. 会自动处理数据库中的base64图片');
console.log('3. 转换为Supabase Storage URL');
console.log('');

// 配置常量
const CONFIG = {
  BUCKET_NAME: 'course_media',
  FOLDER_PATH: 'lessons',
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  BATCH_SIZE: 3, // 每批处理数量
};

/**
 * 解析base64图片数据
 */
function parseBase64Image(base64String) {
  const matches = base64String.match(/^data:image\/([a-zA-Z]*);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return null;
  }
  
  return {
    mimeType: `image/${matches[1]}`,
    extension: matches[1] === 'jpeg' ? 'jpg' : matches[1],
    data: matches[2],
    size: Math.ceil(matches[2].length * 0.75) // base64大小估算
  };
}

/**
 * 生成唯一文件名
 */
function generateFileName(lessonId, imageIndex, extension) {
  const timestamp = Date.now();
  return `${CONFIG.FOLDER_PATH}/${timestamp}_lesson_${lessonId}_img_${imageIndex}.${extension}`;
}

/**
 * 检查并统计base64图片
 */
function analyzeBase64Content(contentStr) {
  const base64Matches = contentStr.match(/data:image\/[^"]+/g) || [];
  let totalSize = 0;
  const images = [];
  
  base64Matches.forEach((match, index) => {
    const imageData = parseBase64Image(match);
    if (imageData) {
      images.push({
        index: index + 1,
        ...imageData,
        original: match
      });
      totalSize += imageData.size;
    }
  });
  
  return {
    count: images.length,
    totalSize,
    images
  };
}

console.log('✅ 脚本加载完成');
console.log('📝 请使用MCP工具执行以下步骤:');
console.log('');
console.log('第一步: 分析当前数据库中的base64图片情况');
console.log('第二步: 批量转换base64图片到Storage');
console.log('第三步: 验证转换结果');

export { CONFIG, parseBase64Image, generateFileName, analyzeBase64Content }; 