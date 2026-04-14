# 开发指南

本文档说明如何扩展和修改Figma设计分析技能。

## 项目架构

### 模块结构
```
scripts/
├── figma-cli.js          # 命令行入口
├── test-runner.js        # 测试工具
└── modules/
    ├── file-info.js      # 文件信息模块
    ├── design-extractor.js # 设计提取模块
    ├── screenshot-exporter.js # 截图导出模块
    └── design-comparator.js # 比对验证模块
```

### 数据流
1. **输入**: 用户提供Figma文件URL和命令参数
2. **处理**: CLI分发到对应模块处理
3. **API调用**: 调用Figma REST API获取数据
4. **分析**: 提取、分析、比对设计数据
5. **输出**: 生成JSON、HTML、图片等格式输出

## 扩展功能

### 1. 添加新的设计属性提取

#### 修改 `design-extractor.js`

```javascript
// 在 traverseNode 函数中添加新属性提取
function traverseNode(node, result) {
  // ... 现有代码 ...

  // 示例：提取边框属性
  if (node.strokes && node.strokes.length > 0) {
    node.strokes.forEach(stroke => {
      if (stroke.type === 'SOLID') {
        const borderKey = `${stroke.weight}-${figmaColorToHex(stroke.color)}`;
        
        if (!result.borders.some(b => b.key === borderKey)) {
          result.borders.push({
            weight: stroke.weight,
            color: figmaColorToHex(stroke.color),
            type: stroke.type,
            key: borderKey,
            source: `node:${node.id}`
          });
        }
      }
    });
  }

  // 示例：提取特效属性
  if (node.effects && node.effects.length > 0) {
    node.effects.forEach(effect => {
      if (effect.type === 'BACKGROUND_BLUR') {
        result.effects.push({
          type: 'background_blur',
          radius: effect.radius,
          source: `node:${node.id}`
        });
      }
    });
  }
}

// 在 extractDesignSystem 函数中初始化新数组
async function extractDesignSystem(fileId, token) {
  const result = {
    // ... 现有属性 ...
    borders: [],      // 新增
    effects: []       // 新增
  };

  // ... 处理逻辑 ...
}
```

### 2. 添加新的比对维度

#### 修改 `design-comparator.js`

```javascript
// 在 compareDesignSystems 函数中添加新维度比对
function compareDesignSystems(figmaDesign, implementation) {
  const comparison = {
    // ... 现有属性 ...
    details: {
      // ... 现有维度 ...
      borders: [],      // 新增
      effects: []       // 新增
    }
  };

  // 比对边框
  if (figmaDesign.borders && implementation.borders) {
    figmaDesign.borders.forEach(figmaBorder => {
      const matched = implementation.borders.some(implBorder =>
        bordersMatch(figmaBorder, implBorder)
      );

      comparison.details.borders.push({
        figma_border: `${figmaBorder.weight}px ${figmaBorder.color}`,
        matched: matched
      });

      comparison.total_checks++;
      if (matched) comparison.passed++; else comparison.failed++;
    });
  }

  return comparison;
}

// 添加比对函数
function bordersMatch(figmaBorder, implBorder) {
  // 实现边框比对逻辑
  return figmaBorder.weight === implBorder.weight &&
         figmaBorder.color === implBorder.color;
}
```

### 3. 添加新的命令行命令

#### 修改 `figma-cli.js`

```javascript
// 添加新命令处理器
async function handleNewCommand(fileInput, options) {
  const token = getFigmaToken();
  const fileId = parseFileId(fileInput);

  console.log(`执行新命令: ${fileId}`);
  const result = await newModuleFunction(fileId, token, options);

  if (options.output) {
    saveOutput(result, options.output);
  }

  return result;
}

// 注册新命令
program
  .command('new-command')
  .description('新功能描述')
  .argument('<file>', 'Figma文件URL或ID')
  .option('-o, --output <path>', '输出文件路径')
  .action(async (file, options) => {
    try {
      await handleNewCommand(file, options);
    } catch (error) {
      console.error(chalk.red(`执行失败: ${error.message}`));
      process.exit(1);
    }
  });
```

## 测试开发

### 添加单元测试

创建 `scripts/modules/__tests__/` 目录，添加测试文件：

```javascript
// file-info.test.js
const { parseFileId } = require('../file-info');

describe('parseFileId', () => {
  test('从完整URL解析文件ID', () => {
    const url = 'https://www.figma.com/file/abc123/Design-System';
    expect(parseFileId(url)).toBe('abc123');
  });

  test('从设计URL解析文件ID', () => {
    const url = 'https://www.figma.com/design/def456/Another-Design';
    expect(parseFileId(url)).toBe('def456');
  });

  test('直接返回文件ID', () => {
    expect(parseFileId('xyz789')).toBe('xyz789');
  });
});
```

### 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试
npx jest modules/file-info.test.js

# 生成覆盖率报告
npx jest --coverage
```

## 性能优化

### 1. 缓存策略

```javascript
// 实现内存缓存
class FigmaCache {
  constructor(ttl = 300000) { // 5分钟
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear() {
    this.cache.clear();
  }
}
```

### 2. 批量处理

```javascript
// 批量处理节点
async function processNodesInBatch(nodeIds, batchSize = 50) {
  const results = [];
  
  for (let i = 0; i < nodeIds.length; i += batchSize) {
    const batch = nodeIds.slice(i, i + batchSize);
    console.log(`处理批次 ${Math.floor(i / batchSize) + 1}/${Math.ceil(nodeIds.length / batchSize)}`);
    
    const batchResults = await Promise.all(
      batch.map(nodeId => processSingleNode(nodeId))
    );
    
    results.push(...batchResults);
  }
  
  return results;
}
```

### 3. 增量加载

```javascript
// 增量获取文件数据
async function getFileIncremental(fileId, token, depth = 1) {
  // 先获取基本信息
  const basicInfo = await getFileInfo(fileId, token);
  
  // 如果需要更多细节，再获取详细信息
  if (depth > 1) {
    const detailedInfo = await getFileNodes(fileId, token, depth);
    return { ...basicInfo, ...detailedInfo };
  }
  
  return basicInfo;
}
```

## 错误处理改进

### 1. 重试逻辑

```javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await axios.get(url, options);
    } catch (error) {
      lastError = error;
      
      if (error.response?.status === 429) {
        // 速率限制，等待指数退避
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`速率限制，等待 ${delay}ms 后重试 (${attempt}/${maxRetries})`);
        await wait(delay);
        continue;
      }
      
      if (error.code === 'ECONNRESET' && attempt < maxRetries) {
        // 连接重置，等待后重试
        await wait(1000);
        continue;
      }
      
      break;
    }
  }
  
  throw lastError;
}
```

### 2. 优雅降级

```javascript
async function extractDesignSystemWithFallback(fileId, token) {
  try {
    // 尝试完整提取
    return await extractDesignSystem(fileId, token);
  } catch (error) {
    if (error.response?.status === 429 || error.code === 'ECONNRESET') {
      // API限制或网络问题，返回基本信息和错误提示
      console.warn('完整提取失败，返回基本信息');
      return {
        file_id: fileId,
        basic_info: await getBasicFileInfo(fileId, token),
        error: error.message,
        suggestion: '请稍后重试或分批次处理'
      };
    }
    
    throw error;
  }
}
```

## 集成扩展

### 1. 添加Webhook支持

```javascript
// webhook-handler.js
const express = require('express');

class FigmaWebhookHandler {
  constructor() {
    this.app = express();
    this.setupRoutes();
  }

  setupRoutes() {
    // Figma文件变更webhook
    this.app.post('/webhook/figma', (req, res) => {
      const event = req.body;
      
      switch (event.event_type) {
        case 'FILE_UPDATE':
          this.handleFileUpdate(event);
          break;
        case 'FILE_COMMENT':
          this.handleFileComment(event);
          break;
        case 'FILE_VERSION_UPDATE':
          this.handleFileVersionUpdate(event);
          break;
      }
      
      res.status(200).send('OK');
    });
  }

  async handleFileUpdate(event) {
    const { file_key, file_name } = event;
    
    // 自动重新分析文件
    const designSystem = await extractDesignSystem(file_key, process.env.FIGMA_ACCESS_TOKEN);
    
    // 发送通知或触发其他动作
    this.notifyTeam(file_name, designSystem);
  }
}
```

### 2. 集成设计系统工具

```javascript
// design-system-integration.js
class DesignSystemIntegration {
  // 生成Tailwind配置
  generateTailwindConfig(designSystem) {
    const colors = {};
    designSystem.colors.forEach(color => {
      const name = this.generateColorName(color.hex);
      colors[name] = color.hex;
    });

    return {
      theme: {
        extend: {
          colors,
          fontSize: this.extractFontSizes(designSystem.fonts),
          spacing: this.extractSpacingScale(designSystem.spacing)
        }
      }
    };
  }

  // 生成CSS变量
  generateCSSVariables(designSystem) {
    let css = ':root {\n';
    
    designSystem.colors.forEach((color, index) => {
      const varName = `--color-${this.generateColorName(color.hex)}`;
      css += `  ${varName}: ${color.hex};\n`;
    });
    
    css += '}\n';
    return css;
  }
}
```

## 发布流程

### 1. 版本管理

```bash
# 更新版本号
npm version patch  # 修复bug
npm version minor  # 新增功能
npm version major  # 不兼容变更

# 创建发布标签
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

### 2. 更新文档

更新以下文件：
- `CHANGELOG.md`: 记录变更
- `README.md`: 更新功能和示例
- `SKILL.md`: 更新技能描述
- `evals/evals.json`: 添加新测试用例

### 3. 发布到skills.sh

```bash
# 确保技能结构正确
tree skills/figma-design-analyzer

# 创建发布包
tar -czf figma-design-analyzer.tar.gz skills/figma-design-analyzer/

# 更新skills.sh索引
# (需要仓库维护者权限)
```

## 调试技巧

### 1. 调试API调用

```javascript
// 启用详细日志
const DEBUG = process.env.DEBUG === 'true';

async function debugAPICall(url, options) {
  if (DEBUG) {
    console.log(`API调用: ${url}`);
    console.log('请求头:', options.headers);
  }
  
  try {
    const response = await axios.get(url, options);
    
    if (DEBUG) {
      console.log(`响应状态: ${response.status}`);
      console.log('响应头:', response.headers);
    }
    
    return response;
  } catch (error) {
    if (DEBUG) {
      console.error('API调用失败:', error.message);
      if (error.response) {
        console.error('响应数据:', error.response.data);
      }
    }
    throw error;
  }
}
```

### 2. 性能分析

```javascript
// 添加性能监控
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
  }

  start(operation) {
    this.metrics.set(operation, {
      start: performance.now(),
      end: null,
      duration: null
    });
  }

  end(operation) {
    const metric = this.metrics.get(operation);
    if (metric) {
      metric.end = performance.now();
      metric.duration = metric.end - metric.start;
      
      console.log(`${operation}: ${metric.duration.toFixed(2)}ms`);
    }
  }

  report() {
    console.log('\n=== 性能报告 ===');
    this.metrics.forEach((metric, operation) => {
      console.log(`${operation}: ${metric.duration.toFixed(2)}ms`);
    });
  }
}

// 使用示例
const perf = new PerformanceMonitor();
perf.start('extract-design-system');
// ... 执行操作 ...
perf.end('extract-design-system');
perf.report();
```

## 贡献指南

1. 遵循现有代码风格
2. 添加详细的注释和文档
3. 编写单元测试
4. 更新相关文档
5. 提交清晰的提交信息

### 代码风格
- 使用ES6+语法
- 2空格缩进
- 使用单引号
- 添加JSDoc注释
- 导出函数前添加描述

### 提交信息格式
```
type(scope): description

[详细描述]

[相关Issue]
```

类型：
- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- style: 代码格式
- refactor: 重构
- test: 测试
- chore: 构建/工具