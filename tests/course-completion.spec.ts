import { test, expect } from '@playwright/test';

test.describe('课程完成功能测试', () => {
  test.beforeEach(async ({ page }) => {
    // 导航到登录页面
    await page.goto('http://localhost:3000/auth');
    
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 登录（假设有测试用户）
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 等待登录完成并跳转到主页
    await page.waitForURL('**/dashboard');
  });

  test('应该在最后一课显示完成课程按钮', async ({ page }) => {
    // 导航到一个课程
    await page.goto('http://localhost:3000/course/test-course-id');
    
    // 等待课程页面加载
    await page.waitForSelector('[data-testid="course-sidebar"]');
    
    // 找到最后一个课时并点击
    const lessons = await page.locator('[data-testid="lesson-item"]').all();
    if (lessons.length > 0) {
      await lessons[lessons.length - 1].click();
    }
    
    // 等待课时内容加载
    await page.waitForSelector('[data-testid="lesson-content"]');
    
    // 标记当前课时为完成
    const completionButton = page.locator('[data-testid="lesson-completion-button"]');
    if (await completionButton.isVisible()) {
      await completionButton.click();
    }
    
    // 检查是否显示"完成课程"按钮而不是"下一课"按钮
    const nextButton = page.locator('button:has-text("完成课程")');
    await expect(nextButton).toBeVisible();
    
    // 检查按钮是否有正确的样式（绿色渐变）
    await expect(nextButton).toHaveClass(/from-green-500/);
  });

  test('应该在点击完成课程后显示庆祝弹窗', async ({ page }) => {
    // 导航到一个课程的最后一课
    await page.goto('http://localhost:3000/course/test-course-id/lesson/last-lesson-id');
    
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 点击完成课程按钮
    const completeButton = page.locator('button:has-text("完成课程")');
    await completeButton.click();
    
    // 检查庆祝弹窗是否出现
    const celebrationModal = page.locator('[data-testid="celebration-modal"]');
    await expect(celebrationModal).toBeVisible();
    
    // 检查弹窗内容
    await expect(page.locator('text=🎉 课程完成！')).toBeVisible();
    await expect(page.locator('text=恭喜您成功完成了')).toBeVisible();
    
    // 检查奖杯图标
    await expect(page.locator('svg[data-testid="trophy-icon"]')).toBeVisible();
    
    // 检查返回主页按钮
    await expect(page.locator('button:has-text("返回主页")')).toBeVisible();
    await expect(page.locator('button:has-text("我的学习")')).toBeVisible();
  });

  test('应该在课程完成后自动跳转到主页', async ({ page }) => {
    // 导航到一个课程的最后一课
    await page.goto('http://localhost:3000/course/test-course-id/lesson/last-lesson-id');
    
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 点击完成课程按钮
    const completeButton = page.locator('button:has-text("完成课程")');
    await completeButton.click();
    
    // 等待庆祝弹窗出现
    await expect(page.locator('[data-testid="celebration-modal"]')).toBeVisible();
    
    // 等待自动跳转（3秒后）
    await page.waitForURL('**/dashboard', { timeout: 5000 });
    
    // 验证已跳转到主页
    await expect(page.locator('text=我的学习中心')).toBeVisible();
  });

  test('应该在课程进度达到80%时允许完成课程', async ({ page }) => {
    // 导航到一个课程
    await page.goto('http://localhost:3000/course/test-course-id');
    
    // 等待课程页面加载
    await page.waitForSelector('[data-testid="course-sidebar"]');
    
    // 获取所有课时
    const lessons = await page.locator('[data-testid="lesson-item"]').all();
    const totalLessons = lessons.length;
    const lessonsToComplete = Math.ceil(totalLessons * 0.8); // 80%
    
    // 完成80%的课时
    for (let i = 0; i < lessonsToComplete; i++) {
      await lessons[i].click();
      await page.waitForSelector('[data-testid="lesson-content"]');
      
      const completionButton = page.locator('[data-testid="lesson-completion-button"]');
      if (await completionButton.isVisible()) {
        await completionButton.click();
        await page.waitForTimeout(500); // 等待状态更新
      }
    }
    
    // 导航到最后一课
    await lessons[lessons.length - 1].click();
    
    // 检查是否显示"完成课程"按钮
    const completeButton = page.locator('button:has-text("完成课程")');
    await expect(completeButton).toBeVisible();
    await expect(completeButton).not.toBeDisabled();
  });

  test('应该在点击返回主页按钮后跳转到主页', async ({ page }) => {
    // 导航到一个课程的最后一课
    await page.goto('http://localhost:3000/course/test-course-id/lesson/last-lesson-id');
    
    // 点击完成课程按钮
    const completeButton = page.locator('button:has-text("完成课程")');
    await completeButton.click();
    
    // 等待庆祝弹窗出现
    await expect(page.locator('[data-testid="celebration-modal"]')).toBeVisible();
    
    // 点击返回主页按钮
    const homeButton = page.locator('button:has-text("返回主页")');
    await homeButton.click();
    
    // 验证已跳转到主页
    await page.waitForURL('**/dashboard');
    await expect(page.locator('text=我的学习中心')).toBeVisible();
  });

  test('应该在点击我的学习按钮后跳转到学习页面', async ({ page }) => {
    // 导航到一个课程的最后一课
    await page.goto('http://localhost:3000/course/test-course-id/lesson/last-lesson-id');
    
    // 点击完成课程按钮
    const completeButton = page.locator('button:has-text("完成课程")');
    await completeButton.click();
    
    // 等待庆祝弹窗出现
    await expect(page.locator('[data-testid="celebration-modal"]')).toBeVisible();
    
    // 点击我的学习按钮
    const learningButton = page.locator('button:has-text("我的学习")');
    await learningButton.click();
    
    // 验证已跳转到学习页面
    await page.waitForURL('**/learning');
    await expect(page.locator('text=我的学习')).toBeVisible();
  });

  test('应该显示成功完成课程的toast消息', async ({ page }) => {
    // 导航到一个课程的最后一课
    await page.goto('http://localhost:3000/course/test-course-id/lesson/last-lesson-id');
    
    // 点击完成课程按钮
    const completeButton = page.locator('button:has-text("完成课程")');
    await completeButton.click();
    
    // 检查toast消息
    await expect(page.locator('text=🎉 恭喜！您已完成整个课程！')).toBeVisible();
  });
});
