import html2canvas from 'html2canvas';

// 用于记录日志的函数
function logInfo(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [HTML2Image-INFO] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function logError(message: string, error: any) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [HTML2Image-ERROR] ${message}`);
  console.error(error);
}

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
  logInfo("开始将HTML转换为图像", { htmlLength: htmlString.length });
  
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
          logInfo("开始动态导入html2canvas");
          const importStartTime = Date.now();
          // 动态导入html2canvas
          const html2canvas = (await import('html2canvas')).default;
          const importTime = Date.now() - importStartTime;
          logInfo(`html2canvas导入完成，耗时${importTime}ms`);
          
          // 使用html2canvas将DOM元素转换为canvas
          logInfo("开始执行html2canvas渲染");
          const renderStartTime = Date.now();
          const canvas = await html2canvas(container, {
            allowTaint: true, // 允许跨域图像
            useCORS: true,    // 使用CORS加载跨域图像
            scale: 2,         // 2x缩放以获得更高质量
            backgroundColor: null, // 透明背景
            logging: true,   // 开启html2canvas自身的日志
            ...options        // 合并用户自定义选项
          });
          const renderTime = Date.now() - renderStartTime;
          logInfo(`html2canvas渲染完成，耗时${renderTime}ms`, {
            canvasWidth: canvas.width,
            canvasHeight: canvas.height
          });
          
          // 将canvas转换为数据URL
          logInfo("开始将canvas转换为dataURL");
          const dataUrl = canvas.toDataURL('image/png');
          logInfo("dataURL生成完成", { dataUrlLength: dataUrl.length });
          
          // 从DOM中移除临时容器
          document.body.removeChild(container);
          
          // 返回数据URL
          resolve(dataUrl);
        } catch (error) {
          document.body.removeChild(container);
          logError("HTML转换为图像失败", error);
          reject(new Error(`HTML转换为图像失败: ${error instanceof Error ? error.message : '未知错误'}`));
        }
      }, 500); // 给资源加载500ms的时间
    } catch (error) {
      logError("创建HTML渲染容器失败", error);
      reject(new Error(`创建HTML渲染容器失败: ${error instanceof Error ? error.message : '未知错误'}`));
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
  logInfo("开始下载图像", { filename });
  
  try {
    // 创建一个临时链接并触发下载
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    
    logInfo("创建了下载链接，准备触发点击");
    a.click();
    
    // 清理
    logInfo("移除临时下载链接");
    document.body.removeChild(a);
  } catch (error) {
    logError("下载图像过程中发生错误", error);
    console.error("Error downloading image:", error);
  }
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