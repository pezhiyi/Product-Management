import { NextResponse } from 'next/server';
// import { getAccessToken } from '../../../utils/baiduApi';
import { getBosClient } from '../../utils/bosStorage';

export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  };
  
  // 1. 检查环境变量配置
  results.environment_vars = {
    bos_endpoint: !!process.env.BAIDU_BOS_ENDPOINT,
    bos_ak: !!process.env.BAIDU_BOS_AK, 
    bos_sk: !!process.env.BAIDU_BOS_SK,
    bos_bucket: !!process.env.BAIDU_BOS_BUCKET,
    bos_domain: !!process.env.BAIDU_BOS_DOMAIN,
    product_library: !!process.env.PRODUCT_LIBRARY_URL
  };
  
  // 2. 检查BOS客户端
  try {
    const client = getBosClient();
    results.bos_client = {
      success: !!client,
      endpoint: process.env.BAIDU_BOS_ENDPOINT,
      bucket: process.env.BAIDU_BOS_BUCKET,
      domain: process.env.BAIDU_BOS_DOMAIN
    };
  } catch (e) {
    results.bos_client = { success: false, error: e.message };
  }

  // 3. 检查上传配置
  try {
    const uploadEndpoint = '/api/baidu/add';
    results.upload_config = {
      endpoint: uploadEndpoint,
      content_type: 'multipart/form-data'
    };
  } catch (e) {
    results.upload_config = { error: e.message };
  }
  
  return NextResponse.json(results);
} 