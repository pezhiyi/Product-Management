import { NextResponse } from 'next/server';
import { getBosClient } from '../../utils/bosStorage';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  try {
    // 获取BOS客户端
    const client = getBosClient();
    if (!client) {
      throw new Error('无法初始化BOS客户端');
    }

    const bucket = process.env.BAIDU_BOS_BUCKET;
    const testPrefix = `test-uploads/${Date.now()}`;

    // 测试1：以buffer形式上传
    try {
      const buffer = Buffer.from('这是一个Buffer上传测试，时间戳: ' + Date.now());
      const bufferKey = `${testPrefix}/buffer-test.txt`;
      
      const bufferResult = await client.putObject(bucket, bufferKey, buffer, {
        contentType: 'text/plain'
      });
      
      results.tests.push({
        name: 'Buffer上传测试',
        method: 'putObject',
        key: bufferKey,
        success: true,
        response: bufferResult,
        url: `https://${process.env.BAIDU_BOS_DOMAIN}/${bufferKey}`
      });
    } catch (error) {
      results.tests.push({
        name: 'Buffer上传测试',
        method: 'putObject',
        success: false,
        error: error.message
      });
    }

    // 测试2：以字符串形式上传
    try {
      const stringKey = `${testPrefix}/string-test.txt`;
      const stringContent = `这是一个字符串上传测试，时间戳: ${Date.now()}`;
      
      const stringResult = await client.putObject(bucket, stringKey, stringContent, {
        contentType: 'text/plain'
      });
      
      results.tests.push({
        name: '字符串上传测试',
        method: 'putObjectFromString',
        key: stringKey,
        success: true,
        response: stringResult,
        url: `https://${process.env.BAIDU_BOS_DOMAIN}/${stringKey}`
      });
    } catch (error) {
      results.tests.push({
        name: '字符串上传测试',
        method: 'putObjectFromString',
        success: false,
        error: error.message
      });
    }

    // 测试3：以文件形式上传
    try {
      // 创建临时文件
      const tempDir = os.tmpdir();
      const tempFilePath = path.join(tempDir, `bos-test-${Date.now()}.txt`);
      fs.writeFileSync(tempFilePath, `这是一个文件上传测试，时间戳: ${Date.now()}`);
      
      const fileKey = `${testPrefix}/file-test.txt`;
      const fileData = fs.readFileSync(tempFilePath);
      
      const fileResult = await client.putObject(bucket, fileKey, fileData, {
        contentType: 'text/plain'
      });
      
      // 清理临时文件
      fs.unlinkSync(tempFilePath);
      
      results.tests.push({
        name: '文件上传测试',
        method: 'putObjectFromFile',
        key: fileKey,
        success: true,
        response: fileResult,
        url: `https://${process.env.BAIDU_BOS_DOMAIN}/${fileKey}`
      });
    } catch (error) {
      results.tests.push({
        name: '文件上传测试',
        method: 'putObjectFromFile',
        success: false,
        error: error.message
      });
    }

    // 测试4：图片上传测试
    try {
      // 创建一个简单的图像数据
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
        0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
        0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB0, 0x00, 0x00, 0x00,
        0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);
      
      const imageKey = `${testPrefix}/image-test.png`;
      
      const imageResult = await client.putObject(bucket, imageKey, pngBuffer, {
        contentType: 'image/png'
      });
      
      results.tests.push({
        name: '图片上传测试',
        method: 'putObject (image)',
        key: imageKey,
        success: true,
        response: imageResult,
        url: `https://${process.env.BAIDU_BOS_DOMAIN}/${imageKey}`
      });
    } catch (error) {
      results.tests.push({
        name: '图片上传测试',
        method: 'putObject (image)',
        success: false,
        error: error.message
      });
    }

    // 测试5：元数据测试
    try {
      const metadataKey = `${testPrefix}/metadata-test.txt`;
      const metadataContent = `这是一个带元数据的测试，时间戳: ${Date.now()}`;
      
      const metadataResult = await client.putObject(bucket, metadataKey, metadataContent, {
        contentType: 'text/plain',
        metadata: {
          'x-bce-meta-test-id': 'test-123',
          'x-bce-meta-create-time': new Date().toISOString(),
          'x-bce-meta-description': '这是一个测试元数据的示例'
        }
      });
      
      results.tests.push({
        name: '元数据上传测试',
        method: 'putObject with metadata',
        key: metadataKey,
        success: true,
        response: metadataResult,
        url: `https://${process.env.BAIDU_BOS_DOMAIN}/${metadataKey}`
      });
    } catch (error) {
      results.tests.push({
        name: '元数据上传测试',
        method: 'putObject with metadata',
        success: false,
        error: error.message
      });
    }

    // 设置测试汇总信息
    results.summary = {
      total: results.tests.length,
      successful: results.tests.filter(t => t.success).length,
      failed: results.tests.filter(t => !t.success).length
    };

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 