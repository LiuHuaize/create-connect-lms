console.log('🧹 开始清理缓存...'); localStorage.clear(); indexedDB.deleteDatabase('ConnectLMS-Cache').then(() => console.log('✅ 缓存清理完成，请刷新页面')).catch(err => console.error('❌ 清理失败:', err));
