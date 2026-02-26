const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const esbuild = require('esbuild');
const JavaScriptObfuscator = require('javascript-obfuscator');

const scriptDir = __dirname;
const rootDir = path.resolve(scriptDir, '..');
const classifierDir = path.join(rootDir, 'src', 'lib', 'classifier');
const sourceFile = path.join(classifierDir, 'ai-service.local.ts');
const localDtsFile = path.join(classifierDir, 'ai-service.local.d.ts');
const targetDtsFile = path.join(classifierDir, 'ai-service.d.ts');
const targetJsFile = path.join(classifierDir, 'ai-service.js');

try {
    console.log('[lock-ai] 1. 生成 .d.ts 声明文件...');
    try {
        execSync('npx tsc src/lib/classifier/ai-service.local.ts --declaration --emitDeclarationOnly --outDir src/lib/classifier/ --skipLibCheck', {
            cwd: rootDir,
            stdio: 'pipe'
        });
    } catch (tscError) {
        // 单文件编译可能因子依赖报错，但只要 .d.ts 生成了就不影响
        console.log('[lock-ai] tsc 抛出警告，忽略并继续...');
    }

    console.log('[lock-ai] 2. 重命名 .d.ts 供外部调用...');
    if (fs.existsSync(localDtsFile)) {
        if (fs.existsSync(targetDtsFile)) {
            fs.unlinkSync(targetDtsFile);
        }
        fs.renameSync(localDtsFile, targetDtsFile);
    } else {
        console.warn('[lock-ai] 警告: 未找到生成的 .local.d.ts 文件！');
    }

    console.log('[lock-ai] 3. 使用 esbuild 编译为纯 JS 字符串...');
    const buildResult = esbuild.buildSync({
        entryPoints: [sourceFile],
        bundle: true,
        packages: 'external',
        write: false,
        format: 'esm',
        target: 'esnext'
    });

    const jsCode = buildResult.outputFiles[0].text;

    console.log('[lock-ai] 4. 对该字符串进行高强度混淆...');
    const obfuscatedResult = JavaScriptObfuscator.obfuscate(jsCode, {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 1,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.4,
        identifierNamesGenerator: 'hexadecimal',
        stringArray: true,
        stringArrayEncoding: ['base64'],
        unicodeEscapeSequence: true
    });

    const obfuscatedCode = obfuscatedResult.getObfuscatedCode();

    console.log('[lock-ai] 5. 将混淆后的代码写入 ai-service.js...');
    fs.writeFileSync(targetJsFile, obfuscatedCode, 'utf8');

    console.log('[lock-ai] ✅ AI 服务代码混淆成功！');

} catch (err) {
    console.error('[lock-ai] ❌ 混淆过程发生错误:', err);
    process.exit(1);
}
