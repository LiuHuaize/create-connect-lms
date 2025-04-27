/**
 * 文件上传服务
 * 处理BlockNote编辑器的文件上传功能
 */

/**
 * 将文件转换为Base64字符串
 * 用于内部存储和展示图片、文件等
 * 
 * @param file 要上传的文件
 * @returns Promise<string> 返回base64编码的文件内容
 */
export const uploadFileAsBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      
      reader.onloadend = () => {
        // 将文件转换为base64字符串
        const base64String = reader.result as string;
        resolve(base64String);
      };
      
      reader.onerror = () => {
        reject(new Error('读取文件失败'));
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * 上传文件到服务器
 * 当需要实际存储文件到后端时使用
 * TODO: 实现实际的文件上传逻辑
 * 
 * @param file 要上传的文件
 * @returns Promise<string> 返回文件URL
 */
export const uploadFileToServer = async (file: File): Promise<string> => {
  // 这里应该实现实际的文件上传逻辑
  // 例如使用fetch或axios将文件发送到服务器
  
  // 目前只返回Base64版本作为示例
  return uploadFileAsBase64(file);
};

/**
 * BlockNote编辑器专用的文件上传处理函数
 * 供BlockNote编辑器使用的上传函数
 * 
 * @param file 要上传的文件
 * @returns Promise<string> 返回文件URL或Base64
 */
export const handleBlockNoteFileUpload = async (file: File): Promise<string> => {
  // 目前使用Base64版本，未来可以替换为实际的服务器上传
  return uploadFileAsBase64(file);
}; 