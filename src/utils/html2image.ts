import html2canvas from 'html2canvas';

/**
 * 将HTML字符串转换为canvas，然后转换为数据URL
 * @param htmlString HTML字符串
 * @param width 可选的宽度，默认1024px
 * @param options 可选的html2canvas配置
 * @returns 返回图片的数据URL (base64)
 */
export async function htmlToImage(
  htmlString: string,
  width: number = 1024,
  options: Partial<html2canvas.Options> = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // 创建一个临时容器
      const container = document.createElement('div');
      
      // 设置容器的样式和大小
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      container.style.width = `${width}px`;
      
      // 注入HTML内容
      container.innerHTML = htmlString;
      
      // 将容器添加到DOM
      document.body.appendChild(container);
      
      // 延迟一点时间以确保所有资源（字体、图片等）已加载
      setTimeout(async () => {
        try {
          // 使用html2canvas将DOM元素转换为canvas
          const canvas = await html2canvas(container, {
            allowTaint: true, // 允许跨域图像
            useCORS: true,    // 使用CORS加载跨域图像
            scale: 2,         // 2x缩放以获得更高质量
            backgroundColor: null, // 透明背景
            logging: false,   // 关闭日志
            ...options        // 合并用户自定义选项
          });
          
          // 将canvas转换为数据URL
          const dataUrl = canvas.toDataURL('image/png');
          
          // 从DOM中移除临时容器
          document.body.removeChild(container);
          
          // 返回数据URL
          resolve(dataUrl);
        } catch (error) {
          document.body.removeChild(container);
          reject(new Error(`HTML转换为图像失败: ${error.message}`));
        }
      }, 500); // 给资源加载500ms的时间
    } catch (error) {
      reject(new Error(`创建HTML渲染容器失败: ${error.message}`));
    }
  });
}

/**
 * 将HTML字符串转换为Blob对象，可用于上传或创建Object URL
 */
export async function htmlToBlob(
  htmlString: string,
  width: number = 1024,
  options: Partial<html2canvas.Options> = {}
): Promise<Blob> {
  const dataUrl = await htmlToImage(htmlString, width, options);
  
  // 将数据URL转换为Blob
  const byteString = atob(dataUrl.split(',')[1]);
  const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
  
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  
  return new Blob([ab], { type: mimeString });
}

/**
 * 下载HTML生成的图像
 */
export function downloadHtmlImage(dataUrl: string, filename: string = 'card.png'): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 将HTML字符串转换为图像并保存到Supabase Storage
 * 这需要在组件中实现，因为它依赖于supabase客户端
 */
// export async function saveHtmlImageToStorage(
//   htmlString: string,
//   bucketName: string,
//   filePath: string,
//   supabaseClient: any
// ): Promise<string> {
//   const blob = await htmlToBlob(htmlString);
//   
//   const { data, error } = await supabaseClient.storage
//     .from(bucketName)
//     .upload(filePath, blob, {
//       contentType: 'image/png',
//       upsert: true
//     });
//   
//   if (error) {
//     throw new Error(`保存图像到Storage失败: ${error.message}`);
//   }
//   
//   const { data: urlData } = supabaseClient.storage
//     .from(bucketName)
//     .getPublicUrl(filePath);
//   
//   return urlData.publicUrl;
// } 