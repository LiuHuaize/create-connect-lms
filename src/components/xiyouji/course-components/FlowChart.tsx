import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Sparkles, Video, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface FlowChartProps {
  productCanvas: {
    title: string;
    problem: string;
    solution: string;
    uniqueValue: string;
    userGroups: string;
    keyFeatures: string;
  };
}

const FlowChart: React.FC<FlowChartProps> = ({ productCanvas }) => {
  const [excalidrawOpen, setExcalidrawOpen] = useState(false);

  const openExcalidraw = () => {
    setExcalidrawOpen(true);
  };

  // 哔哩哔哩视频嵌入
  const bilibiliVideoId = "BV1Pd4y1C73Z";

  return (
    <div className="space-y-6">
      <Tabs defaultValue="intro" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="intro">流程图介绍</TabsTrigger>
          <TabsTrigger value="tutorial">视频教学</TabsTrigger>
          <TabsTrigger value="canvas">绘制流程图</TabsTrigger>
        </TabsList>
        
        <TabsContent value="intro" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-indigo-800">什么是流程图？</h2>
            </div>
            
            <p className="text-sm text-gray-600 mb-6">
              流程图是一种常见的图表，用于表示算法、工作流或流程，它展示了步骤间的逻辑关系，帮助我们理解复杂过程。
              对于"{productCanvas.title || '未命名产品'}"，绘制流程图可以帮助理清产品的使用流程和逻辑。
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-md p-4 bg-amber-50">
                <h3 className="text-md font-medium mb-3 text-amber-800">流程图的作用</h3>
                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
                  <li>清晰展示产品的使用流程</li>
                  <li>帮助识别流程中的问题和优化点</li>
                  <li>便于团队成员理解产品逻辑</li>
                  <li>作为开发参考的重要文档</li>
                </ul>
              </div>
              
              <div className="border rounded-md p-4 bg-blue-50">
                <h3 className="text-md font-medium mb-3 text-blue-800">流程图的要素</h3>
                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
                  <li>开始和结束点</li>
                  <li>处理步骤（用矩形表示）</li>
                  <li>决策点（用菱形表示）</li>
                  <li>流向（用箭头表示）</li>
                  <li>输入/输出（用平行四边形表示）</li>
                </ul>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <h2 className="text-xl font-bold text-indigo-800 mb-4">流程图设计指南</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-md font-medium mb-2">1. 确定主要用户场景</h3>
                <p className="text-sm text-gray-600">
                  根据"{productCanvas.title || '未命名产品'}"的需求和功能，确定需要绘制哪些关键用户场景。
                </p>
              </div>
              
              <div>
                <h3 className="text-md font-medium mb-2">2. 使用标准符号</h3>
                <p className="text-sm text-gray-600">
                  使用矩形表示步骤，菱形表示决策点，箭头表示流程方向。保持符号一致性。
                </p>
              </div>
              
              <div>
                <h3 className="text-md font-medium mb-2">3. 从用户视角出发</h3>
                <p className="text-sm text-gray-600">
                  以用户为中心，描述用户如何与产品交互，而不是系统内部处理流程。
                </p>
              </div>
              
              <div>
                <h3 className="text-md font-medium mb-2">4. 保持简洁</h3>
                <p className="text-sm text-gray-600">
                  每个流程图专注于一个特定功能或场景，避免过于复杂的图表。
                </p>
              </div>
              
              <div>
                <h3 className="text-md font-medium mb-2">5. 考虑异常情况</h3>
                <p className="text-sm text-gray-600">
                  不仅描述理想路径，也要考虑可能的错误情况和用户如何从中恢复。
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <h2 className="text-xl font-bold text-indigo-800 mb-4">流程图示例</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-md p-4">
                <h3 className="text-md font-medium mb-3">用户注册流程</h3>
                <div className="bg-gray-50 p-4 rounded-md min-h-[200px] flex items-center justify-center">
                  <img 
                    src="/assets/flow-chart-examples/signup-flow.png" 
                    alt="用户注册流程图示例" 
                    className="max-w-full max-h-[180px] object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <p className="text-gray-400 text-sm hidden">用户注册流程图示例将显示在这里</p>
                </div>
              </div>
              
              <div className="border rounded-md p-4">
                <h3 className="text-md font-medium mb-3">主要功能流程</h3>
                <div className="bg-gray-50 p-4 rounded-md min-h-[200px] flex items-center justify-center">
                  <img 
                    src="/assets/flow-chart-examples/main-feature-flow.png" 
                    alt="主要功能流程图示例" 
                    className="max-w-full max-h-[180px] object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <p className="text-gray-400 text-sm hidden">主要功能流程图示例将显示在这里</p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="tutorial">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-indigo-800">Excalidraw 流程图教学</h2>
              <a 
                href="https://www.bilibili.com/video/BV1Pd4y1C73Z/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
              >
                <ExternalLink size={14} />
                在B站观看
              </a>
            </div>
            
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
              <div style={{ position: 'relative', padding: '30% 45%' }}>
                <iframe 
                  style={{ position: 'absolute', width: '100%', height: '100%', left: 0, top: 0 }}
                  src={`https://player.bilibili.com/player.html?bvid=${bilibiliVideoId}&high_quality=1&danmaku=0`}
                  frameBorder="no" 
                  scrolling="no"
                  allowFullScreen={true}
                ></iframe>
              </div>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-800 mb-2">视频内容要点</h3>
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1.5">
                <li>Excalidraw基础界面介绍</li>
                <li>绘制基本流程图形状（矩形、菱形、箭头等）</li>
                <li>添加文本和样式设置</li>
                <li>组织和对齐图形元素</li>
                <li>保存和导出流程图</li>
              </ul>
            </div>
            
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-indigo-700">步骤教程：Excalidraw使用指南</h3>
              
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="p-4 border-b border-gray-200 bg-blue-50">
                  <h4 className="font-medium flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-sm">1</span>
                    <span>基础界面和工具栏</span>
                  </h4>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-700 mb-3">Excalidraw的界面非常简洁，主要包含以下几个部分：</p>
                  <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1.5">
                    <li><strong>顶部工具栏</strong>：包含所有绘图工具，如选择、形状、文本等</li>
                    <li><strong>左侧菜单</strong>：选中元素后显示的属性编辑菜单</li>
                    <li><strong>画布</strong>：无限大的绘图区域</li>
                  </ul>
                  <div className="mt-3 text-sm text-gray-700">
                    <p className="font-medium">小技巧：</p>
                    <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                      <li>按住空格键可以拖动画布</li>
                      <li>按<kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">+</kbd>和<kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">-</kbd>键可以放大缩小画布</li>
                      <li>按<kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Shift + ?</kbd>查看所有快捷键</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="p-4 border-b border-gray-200 bg-blue-50">
                  <h4 className="font-medium flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-sm">2</span>
                    <span>绘制基本流程图形状</span>
                  </h4>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-700 mb-3">流程图中常用的基本形状及其含义：</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div className="border border-gray-200 rounded p-3 flex items-center gap-3">
                      <div className="w-16 h-10 border-2 border-blue-500 rounded bg-blue-50 flex-shrink-0"></div>
                      <div>
                        <p className="font-medium text-sm">矩形</p>
                        <p className="text-xs text-gray-600">表示处理步骤、程序、操作</p>
                      </div>
                    </div>
                    <div className="border border-gray-200 rounded p-3 flex items-center gap-3">
                      <div className="w-16 h-10 border-2 border-amber-500 transform rotate-45 bg-amber-50 flex-shrink-0"></div>
                      <div>
                        <p className="font-medium text-sm">菱形</p>
                        <p className="text-xs text-gray-600">表示决策点、条件判断</p>
                      </div>
                    </div>
                    <div className="border border-gray-200 rounded p-3 flex items-center gap-3">
                      <div className="w-16 h-10 border-2 border-green-500 rounded-full bg-green-50 flex-shrink-0"></div>
                      <div>
                        <p className="font-medium text-sm">椭圆</p>
                        <p className="text-xs text-gray-600">表示开始/结束点</p>
                      </div>
                    </div>
                    <div className="border border-gray-200 rounded p-3 flex items-center gap-3">
                      <div className="w-16 h-10 flex justify-center items-center flex-shrink-0">
                        <div className="w-16 h-0 border-t-2 border-gray-500 relative">
                          <div className="absolute -right-1 -top-3 transform rotate-45 w-4 border-t-2 border-gray-500"></div>
                          <div className="absolute -right-1 -bottom-1 transform -rotate-45 w-4 border-t-2 border-gray-500"></div>
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-sm">箭头</p>
                        <p className="text-xs text-gray-600">表示流程方向</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-700">
                    <p className="font-medium">操作步骤：</p>
                    <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-1">
                      <li>从顶部工具栏选择需要的形状工具</li>
                      <li>在画布上点击并拖动鼠标绘制形状</li>
                      <li>按住Shift键可以绘制等比例形状（正方形、正圆等）</li>
                      <li>使用左侧菜单自定义形状的样式、颜色和边框</li>
                    </ol>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="p-4 border-b border-gray-200 bg-blue-50">
                  <h4 className="font-medium flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-sm">3</span>
                    <span>添加文本和连接元素</span>
                  </h4>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-700 mb-3">流程图中文本和元素连接是关键部分：</p>
                  <div className="space-y-3 mb-3">
                    <div>
                      <p className="font-medium text-sm mb-1">添加文本：</p>
                      <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                        <li>选择文本工具（T）或直接双击画布任意位置</li>
                        <li>输入文本内容，按Esc键完成</li>
                        <li>可以调整文本大小、颜色和对齐方式</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-sm mb-1">连接元素：</p>
                      <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                        <li>使用箭头工具（A）连接两个或多个形状</li>
                        <li>将箭头端点靠近形状边缘直到出现磁性吸附</li>
                        <li>这样当移动形状时，箭头会自动跟随调整</li>
                      </ul>
                    </div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-100 rounded p-3 text-sm">
                    <p className="font-medium text-amber-800">专业提示：</p>
                    <p className="text-gray-700">双击箭头线条可以添加标签，用于注明流程转换条件或关系</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="p-4 border-b border-gray-200 bg-blue-50">
                  <h4 className="font-medium flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-sm">4</span>
                    <span>组织和布局</span>
                  </h4>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-700 mb-3">良好的布局使流程图更易理解：</p>
                  <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1.5 mb-3">
                    <li>使用<strong>选择工具</strong>（S）可以同时选择多个元素</li>
                    <li>按住Shift键点击可以添加或移除选择中的元素</li>
                    <li>选中多个元素后可以一起移动或调整样式</li>
                    <li>使用分组功能（Ctrl+G）将相关元素组合在一起</li>
                  </ul>
                  <div className="bg-green-50 border border-green-100 rounded p-3 text-sm">
                    <p className="font-medium text-green-800">布局技巧：</p>
                    <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-1">
                      <li>从上到下或从左到右排列流程</li>
                      <li>使用网格对齐功能帮助整齐排列元素</li>
                      <li>保持足够的空间，避免元素过于拥挤</li>
                      <li>使用颜色区分不同类型的流程或功能模块</li>
                    </ol>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="p-4 border-b border-gray-200 bg-blue-50">
                  <h4 className="font-medium flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-sm">5</span>
                    <span>保存和导出</span>
                  </h4>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-700 mb-3">完成流程图后的保存和分享方法：</p>
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-sm mb-1">保存操作：</p>
                      <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                        <li>点击左上角菜单按钮</li>
                        <li>选择"保存"或"另存为"</li>
                        <li>可以保存为.excalidraw格式（可再次编辑）</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-sm mb-1">导出选项：</p>
                      <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                        <li>PNG格式：适合在文档和演示中使用</li>
                        <li>SVG格式：适合需要缩放的场景</li>
                        <li>可以导出选中的元素或整个画布</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-sm mb-1">分享协作：</p>
                      <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                        <li>点击右上角的"分享"按钮</li>
                        <li>可以生成链接邀请他人实时协作</li>
                        <li>也可以导出只读链接分享给他人查看</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="canvas">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-indigo-800">绘制"{productCanvas.title || '未命名产品'}"的流程图</h2>
              <Button variant="outline" className="gap-2">
                <Sparkles size={16} />
                生成流程图建议
              </Button>
            </div>
            
            <p className="text-sm text-gray-600 mb-6">
              根据您的产品"{productCanvas.title || '未命名产品'}"，请绘制用户使用流程图，帮助您理清产品逻辑。
            </p>
            
            <div className="relative border rounded-md p-4 flex items-center justify-center bg-white">
              <div className="text-center py-16">
                <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Sparkles className="text-indigo-400" size={24} />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">绘制流程图</h3>
                <p className="text-sm text-gray-600 max-w-md mx-auto mb-4">
                  使用Excalidraw绘制产品流程图，可以包括用户注册、登录、主要功能操作等流程。
                </p>
                <Button variant="default" onClick={openExcalidraw}>
                  打开Excalidraw
                </Button>
              </div>
            </div>
            
            {excalidrawOpen && (
              <div className="mt-6 border rounded-lg overflow-hidden">
                <div className="bg-gray-100 p-3 border-b flex justify-between items-center">
                  <h3 className="font-medium">Excalidraw 画板</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setExcalidrawOpen(false)}
                  >
                    关闭
                  </Button>
                </div>
                <div className="h-[600px] w-full bg-white">
                  <iframe 
                    src="https://excalidraw.com/" 
                    className="w-full h-full border-0"
                    title="Excalidraw流程图编辑器"
                  ></iframe>
                </div>
              </div>
            )}
          </Card>
          
          <Card className="p-6 mt-6">
            <h2 className="text-xl font-bold text-indigo-800 mb-4">任务提示</h2>
            <div className="space-y-4">
              <div className="bg-amber-50 p-4 rounded-md border border-amber-100">
                <h3 className="font-medium text-amber-800 mb-2">流程图任务</h3>
                <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-2">
                  <li>
                    <strong>打开Excalidraw</strong>：点击上方的按钮打开Excalidraw在线编辑器
                  </li>
                  <li>
                    <strong>分析产品流程</strong>：思考用户使用产品的主要步骤和路径
                  </li>
                  <li>
                    <strong>绘制流程图</strong>：使用适当的图形元素绘制流程图
                  </li>
                  <li>
                    <strong>保存流程图</strong>：完成后导出为图片或保存链接
                  </li>
                </ol>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                <h3 className="font-medium text-blue-800 mb-2">提交要求</h3>
                <p className="text-sm text-gray-700 mb-2">
                  完成流程图后，请将其保存并提交。确保您的流程图包含以下内容：
                </p>
                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                  <li>清晰的开始和结束点</li>
                  <li>主要功能操作步骤</li>
                  <li>决策点和分支路径</li>
                  <li>用户可能的交互路径</li>
                </ul>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FlowChart; 