import { useEffect, useState, useCallback, useRef } from 'react';
import { useCreateBlockNote } from "@blocknote/react";
import { zhDictionary } from "@/components/editor/locales/zh";
import { handleBlockNoteFileUpload } from "@/services/fileUploadService";

interface UseBlockNoteEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  theme?: 'light' | 'dark';
}

export const useBlockNoteEditor = ({
  initialContent = '',
  onChange,
  theme = 'light'
}: UseBlockNoteEditorProps) => {
  // 编辑器全屏状态
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // 检测移动设备
  const [isMobile, setIsMobile] = useState(false);
  
  // 编辑器容器引用
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  
  // 安全解析内容函数
  const safelyParseContent = (content: string) => {
    // 如果是空字符串，直接返回默认块
    if (!content.trim()) {
      return [
        {
          type: "paragraph",
          content: ""
        }
      ];
    }
    
    try {
      // 尝试作为JSON解析
      return JSON.parse(content);
    } catch (e) {
      // 如果不是有效的JSON，那么创建一个默认段落块
      console.warn('初始内容不是有效的JSON格式，将创建默认段落块');
      return [
        {
          type: "paragraph",
          content: content
        }
      ];
    }
  };
  
  // 自定义侧边菜单初始化函数
  const setupCustomSideMenu = (editor) => {
    if (!editor) return;
    
    // 创建自定义侧边菜单元素
    let sideMenuElement: HTMLElement | null = null;
    
    editor.sideMenu.onUpdate((sideMenuState) => {
      // 如果元素不存在，创建它
      if (!sideMenuElement) {
        sideMenuElement = document.createElement('div');
        sideMenuElement.className = 'bn-side-menu-custom';
        sideMenuElement.style.position = 'absolute';
        sideMenuElement.style.background = 'white';
        sideMenuElement.style.borderRadius = '4px';
        sideMenuElement.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        sideMenuElement.style.zIndex = '100';
        sideMenuElement.style.display = 'none';
        
        // 添加对齐选项
        const alignmentOptions = [
          { id: 'left', label: '左对齐', value: 'left' },
          { id: 'center', label: '居中', value: 'center' },
          { id: 'right', label: '右对齐', value: 'right' },
          { id: 'justify', label: '两端对齐', value: 'justify' }
        ];
        
        // 创建对齐按钮容器
        const alignmentContainer = document.createElement('div');
        alignmentContainer.className = 'alignment-options';
        alignmentContainer.style.padding = '6px';
        alignmentContainer.style.display = 'flex';
        alignmentContainer.style.flexDirection = 'column';
        alignmentContainer.style.gap = '4px';
        
        alignmentOptions.forEach(option => {
          const button = document.createElement('button');
          button.textContent = option.label;
          button.setAttribute('data-alignment', option.value);
          button.style.padding = '4px 8px';
          button.style.border = 'none';
          button.style.borderRadius = '4px';
          button.style.textAlign = 'left';
          button.style.cursor = 'pointer';
          button.style.background = 'transparent';
          button.style.width = '100%';
          
          button.onmouseover = () => {
            button.style.background = '#f0f0f0';
          };
          
          button.onmouseout = () => {
            button.style.background = 'transparent';
          };
          
          button.onclick = () => {
            if (sideMenuState.block) {
              // 更新块的textAlignment属性
              editor.updateBlock(sideMenuState.block, {
                props: { textAlignment: option.value }
              });
              
              // 隐藏菜单
              if (sideMenuElement) {
                sideMenuElement.style.display = 'none';
              }
            }
          };
          
          alignmentContainer.appendChild(button);
        });
        
        sideMenuElement.appendChild(alignmentContainer);
        
        // 添加到文档
        document.body.appendChild(sideMenuElement);
        
        // 添加拖拽功能按钮（仅在原侧边菜单显示时）
        document.addEventListener('click', (e) => {
          const target = e.target as HTMLElement;
          // 检查点击是否在侧边菜单的六个点上
          if (target.classList.contains('bn-side-menu-button') || 
              target.closest('.bn-side-menu-button')) {
            // 显示自定义侧边菜单
            if (sideMenuElement && sideMenuState.block) {
              const sideMenuButton = document.querySelector('.bn-side-menu-button');
              if (sideMenuButton) {
                const rect = sideMenuButton.getBoundingClientRect();
                sideMenuElement.style.display = 'block';
                sideMenuElement.style.top = `${rect.top}px`;
                sideMenuElement.style.left = `${rect.right + 5}px`;
              }
            }
          } else if (!target.closest('.bn-side-menu-custom')) {
            // 如果点击在自定义侧边菜单之外，隐藏它
            if (sideMenuElement) {
              sideMenuElement.style.display = 'none';
            }
          }
        });
      }
      
      // 根据sideMenuState更新菜单显示
      if (sideMenuState.show) {
        // 原生侧边菜单将会显示
        // 我们不在这里显示自定义菜单，而是等待用户点击侧边菜单按钮时显示
      } else {
        // 隐藏自定义菜单
        if (sideMenuElement) {
          sideMenuElement.style.display = 'none';
        }
      }
    });
    
    return () => {
      // 清理函数
      if (sideMenuElement) {
        document.body.removeChild(sideMenuElement);
      }
    };
  };
  
  // 创建BlockNote编辑器实例
  const editor = useCreateBlockNote({
    initialContent: initialContent ? safelyParseContent(initialContent) : undefined,
    uploadFile: handleBlockNoteFileUpload, // 使用文件上传服务
    dictionary: {
      ...zhDictionary,
      placeholders: {
        ...zhDictionary.placeholders,
        // 仅覆盖标题块的占位符为空字符串
        heading: "",
        // 保留default和emptyDocument的默认值，让用户看到提示
        // default: "在此输入文本或输入 '/' 使用命令",
        // emptyDocument: "开始输入...",
      },
    },
    // 启用表格功能并允许对齐
    tables: {
      // 启用表格单元格拆分和合并
      splitCells: true,
      // 启用单元格背景色
      cellBackgroundColor: true,
      // 启用单元格文本颜色
      cellTextColor: true,
      // 启用表头
      headers: true
    },
  });
  
  // 在编辑器初始化后设置自定义侧边菜单
  useEffect(() => {
    if (editor) {
      return setupCustomSideMenu(editor);
    }
  }, [editor]);
  
  // 在内容变化时触发onChange回调
  useEffect(() => {
    if (!editor || !onChange) return;
    
    // 监听编辑器内容变化
    const unsubscribe = editor.onChange(() => {
      try {
        // 将编辑器内容转换为JSON字符串
        // 获取编辑器内容的JSON结构
        const blocks = editor.topLevelBlocks;
        const jsonString = JSON.stringify(blocks);
        
        // 调用外部onChange回调
        onChange(jsonString);
      } catch (error) {
        console.error('处理BlockNote内容变化失败:', error);
      }
    });
    
    // 清理订阅
    return unsubscribe;
  }, [editor, onChange]);
  
  // 检测移动设备
  useEffect(() => {
    // 简单的移动设备检测
    const checkIfMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod|android|blackberry|mini|windows\sce|palm/i.test(userAgent);
    };
    
    const checkDeviceSize = () => {
      return window.innerWidth < 768;
    };
    
    // 设置初始移动设备状态
    setIsMobile(checkIfMobile() || checkDeviceSize());
    
    // 监听窗口大小变化
    const handleResize = () => {
      setIsMobile(checkIfMobile() || checkDeviceSize());
    };
    
    window.addEventListener('resize', handleResize);
    
    // 清理
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // 监听全屏状态变化，在进入全屏时滚动到顶部
  useEffect(() => {
    if (isFullscreen) {
      // 首先滚动整个窗口到顶部
      window.scrollTo(0, 0);
      
      // 添加一个较长的延迟，确保DOM完全渲染
      setTimeout(() => {
        // 尝试多种方法找到可滚动的容器
        
        // 1. 使用editorContainerRef
        if (editorContainerRef.current) {
          const scrollElements = editorContainerRef.current.querySelectorAll('.overflow-auto');
          scrollElements.forEach(element => {
            if (element instanceof HTMLElement) {
              element.scrollTop = 0;
            }
          });
        }
        
        // 2. 查找编辑器相关的容器
        const editorElements = document.querySelectorAll('.bn-container, .bn-editor, [class*="blocknote"]');
        editorElements.forEach(element => {
          if (element instanceof HTMLElement) {
            element.scrollTop = 0;
            
            // 查找父级可滚动元素
            let parent = element.parentElement;
            while (parent) {
              if (parent instanceof HTMLElement) {
                const style = window.getComputedStyle(parent);
                if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
                  parent.scrollTop = 0;
                }
              }
              parent = parent.parentElement;
            }
          }
        });
        
        // 3. 查找页面中所有的overflow: auto/scroll元素
        const allScrollableElements = document.querySelectorAll('[class*="overflow-auto"], [class*="overflow-scroll"]');
        allScrollableElements.forEach(element => {
          if (element instanceof HTMLElement) {
            element.scrollTop = 0;
          }
        });
        
        // 4. 如果编辑器实例存在，尝试聚焦并滚动
        if (editor) {
          editor.focus();
        }
      }, 300);
    }
  }, [isFullscreen, editor]);
  
  return {
    editor,
    isFullscreen,
    setIsFullscreen,
    isMobile,
    editorContainerRef
  };
}; 