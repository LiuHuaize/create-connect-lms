import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// 导入BlockNote必要的样式
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

createRoot(document.getElementById("root")!).render(<App />);
