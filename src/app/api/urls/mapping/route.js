import { NextResponse } from 'next/server';
import { getAllUrlMappings } from '../../../../utils/urlStorage';

export async function GET(request) {
  try {
    const urlMappings = getAllUrlMappings();
    return NextResponse.json(urlMappings);
  } catch (error) {
    console.error('获取URL映射失败:', error);
    return NextResponse.json({ error: '获取URL映射失败' }, { status: 500 });
  }
} 