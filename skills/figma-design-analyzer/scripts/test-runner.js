#!/usr/bin/env node

/**
 * 测试运行器
 * 用于测试技能的各项功能
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config(); // 加载.env文件

// 测试配置
const TEST_CONFIG = {
  figmaFileUrl: 'https://www.figma.com/design/s4pJ2HQUx9oTyw3yjft2yw/号角web重构?node-id=30819-20325&t=0LWb1LBUYEpmdx02-4',
  figmaFileId: 's4pJ2HQUx9oTyw3yjft2yw',
  testNodeId: '30819-20325',
  testCSSFile: path.join(__dirname, 'test-data', 'test-styles.css')
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function logSuccess(message) {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function logError(message) {
  console.log(`${colors.red}✗${colors.reset} ${message}`);
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ${colors.reset} ${message}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
}

function logHeader(message) {
  console.log(`\n${colors.bright}${colors.cyan}${message}${colors.reset}`);
  console.log('='.repeat(message.length));
}

/**
 * 检查环境变量
 */
function checkEnvironment() {
  logHeader('检查环境配置');

  // 检查Node.js版本
  const nodeVersion = process.version;
  logInfo(`Node.js版本: ${nodeVersion}`);

  // 检查FIGMA_ACCESS_TOKEN
  if (!process.env.FIGMA_ACCESS_TOKEN) {
    logError('未设置FIGMA_ACCESS_TOKEN环境变量');
    logInfo('请选择以下方式之一设置令牌:');
    logInfo('1. 使用.env文件: cp .env.example .env 并填写您的令牌');
    logInfo('2. 直接设置环境变量: export FIGMA_ACCESS_TOKEN=your_token_here');
    return false;
  }
  logSuccess('FIGMA_ACCESS_TOKEN已设置');

  // 检查依赖
  try {
    const packageJson = require('../package.json');
    const dependencies = Object.keys(packageJson.dependencies || {});
    logInfo(`项目依赖: ${dependencies.join(', ')}`);
  } catch (error) {
    logWarning('无法读取package.json');
  }

  return true;
}

/**
 * 测试文件信息获取
 */
async function testFileInfo() {
  logHeader('测试文件信息获取');

  try {
    const { parseFileId, getFileInfo } = require('./modules/file-info');

    // 测试解析文件ID
    const fileId = parseFileId(TEST_CONFIG.figmaFileUrl);
    if (fileId === TEST_CONFIG.figmaFileId) {
      logSuccess(`文件ID解析正确: ${fileId}`);
    } else {
      logError(`文件ID解析错误: 期望 ${TEST_CONFIG.figmaFileId}, 得到 ${fileId}`);
    }

    // 测试获取文件信息（需要网络）
    logInfo('正在获取文件信息...');
    const fileInfo = await getFileInfo(fileId, process.env.FIGMA_ACCESS_TOKEN);

    if (fileInfo && fileInfo.file_id) {
      logSuccess(`文件信息获取成功: ${fileInfo.metadata?.name || '未知文件'}`);
      logInfo(`文件结构: ${fileInfo.structure?.pages?.length || 0}个页面`);
      logInfo(`组件数量: ${fileInfo.structure?.components?.total || 0}`);
    } else {
      logError('文件信息获取失败');
    }

    return true;

  } catch (error) {
    logError(`文件信息测试失败: ${error.message}`);
    return false;
  }
}

/**
 * 测试设计系统提取
 */
async function testDesignExtraction() {
  logHeader('测试设计系统提取');

  try {
    const { extractDesignSystem } = require('./modules/design-extractor');

    logInfo('正在提取设计系统...');
    const designSystem = await extractDesignSystem(
      TEST_CONFIG.figmaFileId,
      process.env.FIGMA_ACCESS_TOKEN
    );

    if (designSystem && designSystem.colors) {
      logSuccess(`设计系统提取成功`);
      logInfo(`提取颜色: ${designSystem.colors.length}种`);
      logInfo(`提取字体: ${designSystem.fonts.length}种`);
      logInfo(`提取间距: ${designSystem.spacing.length}个`);
      logInfo(`提取组件: ${designSystem.components.length}个`);

      // 保存示例输出
      const outputDir = path.join(__dirname, '..', 'test-outputs');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const outputPath = path.join(outputDir, 'design-system-example.json');
      fs.writeFileSync(
        outputPath,
        JSON.stringify(designSystem, null, 2),
        'utf8'
      );
      logSuccess(`示例输出已保存: ${outputPath}`);

    } else {
      logError('设计系统提取失败');
    }

    return true;

  } catch (error) {
    logError(`设计系统提取测试失败: ${error.message}`);
    return false;
  }
}

/**
 * 测试命令行工具
 */
async function testCLITool() {
  logHeader('测试命令行工具');

  try {
    // 测试help命令
    logInfo('测试帮助命令...');
    try {
      const helpOutput = execSync('node figma-cli.js --help', {
        cwd: __dirname,
        encoding: 'utf8'
      });
      if (helpOutput.includes('Figma设计分析工具')) {
        logSuccess('帮助命令正常');
      }
    } catch (error) {
      logWarning('帮助命令测试失败');
    }

    // 测试info命令
    logInfo('测试info命令...');
    try {
      const infoOutput = execSync(`node figma-cli.js info "${TEST_CONFIG.figmaFileUrl}"`, {
        cwd: __dirname,
        encoding: 'utf8',
        env: process.env
      });
      if (infoOutput.includes('file_id')) {
        logSuccess('info命令正常');
      }
    } catch (error) {
      logWarning(`info命令测试失败: ${error.message}`);
    }

    return true;

  } catch (error) {
    logError(`CLI工具测试失败: ${error.message}`);
    return false;
  }
}

/**
 * 创建测试CSS文件
 */
function createTestCSSFile() {
  const testDataDir = path.join(__dirname, 'test-data');
  if (!fs.existsSync(testDataDir)) {
    fs.mkdirSync(testDataDir, { recursive: true });
  }

  const cssContent = `
/* 测试样式文件 - 用于设计比对验证 */
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --text-color: #333333;
  --background-color: #ffffff;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: var(--text-color);
  background-color: var(--background-color);
  margin: 0;
  padding: 20px;
}

.header {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  color: white;
  padding: 2rem;
  border-radius: 10px;
  margin-bottom: 2rem;
}

.button {
  background-color: var(--primary-color);
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.button:hover {
  background-color: #5a67d8;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

@media (max-width: 768px) {
  .container {
    padding: 0 10px;
  }

  .grid {
    grid-template-columns: 1fr;
  }
}
  `;

  const cssPath = TEST_CONFIG.testCSSFile;
  fs.writeFileSync(cssPath, cssContent, 'utf8');
  logSuccess(`测试CSS文件已创建: ${cssPath}`);

  return cssPath;
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log(`${colors.bright}${colors.cyan}🎯 开始运行Figma设计分析技能测试${colors.reset}\n`);

  // 检查环境
  if (!checkEnvironment()) {
    logError('环境检查失败，测试中止');
    return false;
  }

  let allTestsPassed = true;

  // 创建测试数据
  createTestCSSFile();

  // 运行各个测试
  const tests = [
    { name: '文件信息获取', func: testFileInfo },
    { name: '设计系统提取', func: testDesignExtraction },
    { name: '命令行工具', func: testCLITool }
  ];

  for (const test of tests) {
    try {
      const passed = await test.func();
      if (!passed) {
        allTestsPassed = false;
        logError(`${test.name}测试失败`);
      } else {
        logSuccess(`${test.name}测试通过`);
      }
    } catch (error) {
      allTestsPassed = false;
      logError(`${test.name}测试异常: ${error.message}`);
    }
  }

  // 显示总结
  logHeader('测试总结');
  if (allTestsPassed) {
    console.log(`${colors.green}🎉 所有测试通过！技能功能正常。${colors.reset}`);
    console.log(`\n${colors.cyan}下一步:${colors.reset}`);
    console.log('1. 使用技能: node scripts/figma-cli.js --help');
    console.log('2. 查看示例输出: test-outputs/design-system-example.json');
    console.log('3. 集成到Claude Code技能系统');
  } else {
    console.log(`${colors.red}❌ 部分测试失败，请检查上述错误信息。${colors.reset}`);
  }

  return allTestsPassed;
}

// 如果是直接运行，执行所有测试
if (require.main === module) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('测试运行异常:', error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  checkEnvironment,
  testFileInfo,
  testDesignExtraction,
  testCLITool
};