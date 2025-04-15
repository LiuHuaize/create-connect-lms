import React from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Code, Monitor, FileCode, Paintbrush } from 'lucide-react';

interface WebsiteCreationProps {
  productCanvas: {
    title: string;
    problem: string;
    solution: string;
    uniqueValue: string;
    userGroups: string;
    keyFeatures: string;
  };
}

const WebsiteCreation: React.FC<WebsiteCreationProps> = ({ productCanvas }) => {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold text-indigo-800 mb-4">网站原型制作</h2>
        <p className="text-sm text-gray-600 mb-6">
          基于您的产品"{productCanvas.title || '未命名产品'}"，创建一个简单的网站原型，展示核心功能和价值。
        </p>
        
        <Tabs defaultValue="preview">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Monitor size={16} />
              <span className="hidden sm:inline">预览</span>
            </TabsTrigger>
            <TabsTrigger value="html" className="flex items-center gap-2">
              <Code size={16} />
              <span className="hidden sm:inline">HTML</span>
            </TabsTrigger>
            <TabsTrigger value="css" className="flex items-center gap-2">
              <Paintbrush size={16} />
              <span className="hidden sm:inline">CSS</span>
            </TabsTrigger>
            <TabsTrigger value="js" className="flex items-center gap-2">
              <FileCode size={16} />
              <span className="hidden sm:inline">JavaScript</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="relative rounded-md overflow-hidden border min-h-[500px]">
            <div className="w-full h-full bg-white p-4 flex flex-col">
              <div className="bg-gray-800 text-white p-3 flex items-center justify-between">
                <div className="text-sm font-medium">{productCanvas.title || '未命名产品'}</div>
                <div className="flex gap-3">
                  <span className="text-xs cursor-pointer hover:underline">首页</span>
                  <span className="text-xs cursor-pointer hover:underline">功能</span>
                  <span className="text-xs cursor-pointer hover:underline">关于</span>
                  <span className="text-xs cursor-pointer hover:underline">联系我们</span>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto p-4">
                <div className="max-w-4xl mx-auto">
                  <div className="text-center py-12">
                    <h1 className="text-3xl font-bold mb-4">{productCanvas.title || '未命名产品'}</h1>
                    <p className="text-gray-600 max-w-lg mx-auto mb-8">
                      {productCanvas.uniqueValue || '为用户提供独特价值的创新产品'}
                    </p>
                    <div className="flex justify-center gap-4">
                      <Button>了解更多</Button>
                      <Button variant="outline">立即体验</Button>
                    </div>
                  </div>
                  
                  <div className="py-12">
                    <h2 className="text-2xl font-bold mb-6 text-center">核心功能</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {productCanvas.keyFeatures ? (
                        productCanvas.keyFeatures.split('\n').map((feature, index) => (
                          <div key={index} className="border rounded-lg p-4 text-center">
                            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-3">
                              <span className="text-indigo-600 font-bold">{index + 1}</span>
                            </div>
                            <h3 className="font-medium mb-2">{feature}</h3>
                            <p className="text-sm text-gray-500">功能描述文本</p>
                          </div>
                        ))
                      ) : (
                        Array.from({ length: 3 }).map((_, index) => (
                          <div key={index} className="border rounded-lg p-4 text-center">
                            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-3">
                              <span className="text-indigo-600 font-bold">{index + 1}</span>
                            </div>
                            <h3 className="font-medium mb-2">功能 {index + 1}</h3>
                            <p className="text-sm text-gray-500">功能描述文本</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  
                  <div className="py-12 bg-gray-50 -mx-4 px-4">
                    <h2 className="text-2xl font-bold mb-6 text-center">解决的问题</h2>
                    <div className="max-w-2xl mx-auto">
                      <p className="text-center text-gray-700 mb-6">
                        {productCanvas.problem || '这里描述产品解决的主要问题...'}
                      </p>
                      <p className="text-center text-gray-700">
                        {productCanvas.solution || '这里描述产品的解决方案...'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 text-white p-4 text-center text-sm">
                © 2023 {productCanvas.title || '未命名产品'}. 保留所有权利.
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="html" className="relative rounded-md overflow-hidden border">
            <div className="bg-gray-900 text-gray-200 p-4 h-[500px] overflow-auto font-mono text-sm">
              <pre>{`<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${productCanvas.title || '未命名产品'}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <div class="logo">${productCanvas.title || '未命名产品'}</div>
        <nav>
            <ul>
                <li><a href="#">首页</a></li>
                <li><a href="#">功能</a></li>
                <li><a href="#">关于</a></li>
                <li><a href="#">联系我们</a></li>
            </ul>
        </nav>
    </header>
    
    <section class="hero">
        <h1>${productCanvas.title || '未命名产品'}</h1>
        <p>${productCanvas.uniqueValue || '为用户提供独特价值的创新产品'}</p>
        <div class="cta">
            <button class="primary">了解更多</button>
            <button class="secondary">立即体验</button>
        </div>
    </section>
    
    <section class="features">
        <h2>核心功能</h2>
        <div class="feature-grid">
            <div class="feature">
                <div class="feature-icon">1</div>
                <h3>功能1</h3>
                <p>功能描述文本</p>
            </div>
            <div class="feature">
                <div class="feature-icon">2</div>
                <h3>功能2</h3>
                <p>功能描述文本</p>
            </div>
            <div class="feature">
                <div class="feature-icon">3</div>
                <h3>功能3</h3>
                <p>功能描述文本</p>
            </div>
        </div>
    </section>
    
    <section class="problem">
        <h2>解决的问题</h2>
        <p>${productCanvas.problem || '这里描述产品解决的主要问题...'}</p>
        <p>${productCanvas.solution || '这里描述产品的解决方案...'}</p>
    </section>
    
    <footer>
        <p>© 2023 ${productCanvas.title || '未命名产品'}. 保留所有权利.</p>
    </footer>
    
    <script src="script.js"></script>
</body>
</html>`}</pre>
            </div>
          </TabsContent>
          
          <TabsContent value="css" className="relative rounded-md overflow-hidden border">
            <div className="bg-gray-900 text-gray-200 p-4 h-[500px] overflow-auto font-mono text-sm">
              <pre>{`/* 基础样式 */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
}

/* 头部导航 */
header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    background-color: #222;
    color: white;
}

.logo {
    font-weight: bold;
    font-size: 1.2rem;
}

nav ul {
    display: flex;
    list-style: none;
}

nav ul li {
    margin-left: 1.5rem;
}

nav ul li a {
    color: white;
    text-decoration: none;
    font-size: 0.9rem;
}

nav ul li a:hover {
    text-decoration: underline;
}

/* 英雄区域 */
.hero {
    text-align: center;
    padding: 4rem 2rem;
}

.hero h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
}

.hero p {
    max-width: 600px;
    margin: 0 auto 2rem;
    color: #666;
}

.cta {
    display: flex;
    justify-content: center;
    gap: 1rem;
}

button {
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
}

button.primary {
    background-color: #4f46e5;
    color: white;
    border: none;
}

button.secondary {
    background-color: transparent;
    color: #4f46e5;
    border: 1px solid #4f46e5;
}

/* 功能区域 */
.features {
    padding: 4rem 2rem;
}

.features h2 {
    text-align: center;
    font-size: 2rem;
    margin-bottom: 2rem;
}

.feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    max-width: 1200px;
    margin: 0 auto;
}

.feature {
    text-align: center;
    padding: 1.5rem;
    border: 1px solid #eee;
    border-radius: 8px;
}

.feature-icon {
    width: 3rem;
    height: 3rem;
    background-color: #e0e7ff;
    color: #4f46e5;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem;
    font-weight: bold;
}

.feature h3 {
    margin-bottom: 0.5rem;
}

.feature p {
    color: #666;
    font-size: 0.9rem;
}

/* 问题区域 */
.problem {
    padding: 4rem 2rem;
    background-color: #f9fafb;
}

.problem h2 {
    text-align: center;
    font-size: 2rem;
    margin-bottom: 2rem;
}

.problem p {
    text-align: center;
    max-width: 800px;
    margin: 0 auto 1rem;
    color: #4b5563;
}

/* 页脚 */
footer {
    background-color: #222;
    color: white;
    text-align: center;
    padding: 1.5rem;
    font-size: 0.9rem;
}`}</pre>
            </div>
          </TabsContent>
          
          <TabsContent value="js" className="relative rounded-md overflow-hidden border">
            <div className="bg-gray-900 text-gray-200 p-4 h-[500px] overflow-auto font-mono text-sm">
              <pre>{`// 等待DOM完全加载
document.addEventListener('DOMContentLoaded', function() {
    // 平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
    
    // 添加交互效果
    const features = document.querySelectorAll('.feature');
    features.forEach(feature => {
        feature.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
            this.style.transition = 'all 0.3s ease';
        });
        
        feature.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
    });
    
    // 简单的表单验证
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const nameInput = this.querySelector('input[name="name"]');
            const emailInput = this.querySelector('input[name="email"]');
            const messageInput = this.querySelector('textarea[name="message"]');
            
            let isValid = true;
            
            if (!nameInput.value.trim()) {
                isValid = false;
                showError(nameInput, '请输入您的姓名');
            } else {
                hideError(nameInput);
            }
            
            if (!emailInput.value.trim() || !isValidEmail(emailInput.value)) {
                isValid = false;
                showError(emailInput, '请输入有效的邮箱地址');
            } else {
                hideError(emailInput);
            }
            
            if (!messageInput.value.trim()) {
                isValid = false;
                showError(messageInput, '请输入您的留言');
            } else {
                hideError(messageInput);
            }
            
            if (isValid) {
                // 模拟表单提交
                alert('表单提交成功！');
                this.reset();
            }
        });
    }
    
    function isValidEmail(email) {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }
    
    function showError(input, message) {
        const formControl = input.parentElement;
        const errorElement = formControl.querySelector('.error-message') || document.createElement('div');
        
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        
        if (!formControl.querySelector('.error-message')) {
            formControl.appendChild(errorElement);
        }
        
        input.classList.add('error-input');
    }
    
    function hideError(input) {
        const formControl = input.parentElement;
        const errorElement = formControl.querySelector('.error-message');
        
        if (errorElement) {
            formControl.removeChild(errorElement);
        }
        
        input.classList.remove('error-input');
    }
});`}</pre>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
      
      <Card className="p-6">
        <h2 className="text-xl font-bold text-indigo-800 mb-4">网站设计指南</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-md font-medium mb-2">1. 保持简洁</h3>
            <p className="text-sm text-gray-600">
              网站应该清晰展示产品的核心价值和功能，避免不必要的元素干扰用户。
            </p>
          </div>
          
          <div>
            <h3 className="text-md font-medium mb-2">2. 用户体验为先</h3>
            <p className="text-sm text-gray-600">
              设计直观的导航和交互方式，确保用户能够轻松找到所需信息并完成任务。
            </p>
          </div>
          
          <div>
            <h3 className="text-md font-medium mb-2">3. 响应式设计</h3>
            <p className="text-sm text-gray-600">
              确保网站在不同设备（桌面、平板、手机）上都能良好显示和操作。
            </p>
          </div>
          
          <div>
            <h3 className="text-md font-medium mb-2">4. 视觉一致性</h3>
            <p className="text-sm text-gray-600">
              保持颜色、字体、按钮样式等设计元素的一致性，提升品牌辨识度。
            </p>
          </div>
          
          <div>
            <h3 className="text-md font-medium mb-2">5. 性能优化</h3>
            <p className="text-sm text-gray-600">
              优化图片大小、减少不必要的脚本，确保网站加载速度快，反应灵敏。
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default WebsiteCreation; 