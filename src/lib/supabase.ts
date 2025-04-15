import { createClient } from '@supabase/supabase-js'

// 从环境变量获取 Supabase URL 和匿名密钥
// 在生产环境中，这些应该是真实的环境变量
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ooyklqqgnphynyrziqyh.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9veWtscXFnbnBoeW55cnppcXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1NzkyNDgsImV4cCI6MjA1OTE1NTI0OH0.d4Awen-9PnzlZTP51TpjjBkhrI3Dog4YELcbGlQs8jE'

// 创建 Supabase 客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 导出一个获取当前用户的辅助函数
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
} 