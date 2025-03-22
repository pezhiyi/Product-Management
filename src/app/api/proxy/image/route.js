import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const contSign = searchParams.get('cont_sign');
  const score = searchParams.get('score') || 0;
  
  // 创建简单的SVG占位符
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
      <rect width="100%" height="100%" fill="#f0f0f0" />
      <text x="150" y="80" font-family="Arial" font-size="14" text-anchor="middle" fill="#888">
        无法获取图片
      </text>
      <text x="150" y="100" font-family="Arial" font-size="12" text-anchor="middle" fill="#888">
        相似度: ${Math.round(parseFloat(score) * 100)}%
      </text>
      <text x="150" y="120" font-family="Arial" font-size="10" text-anchor="middle" fill="#888">
        ${contSign ? contSign.substring(0, 20) + '...' : '无签名'}
      </text>
    </svg>
  `;
  
  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400'
    }
  });
} 