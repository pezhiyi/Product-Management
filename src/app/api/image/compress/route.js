import sharp from 'sharp';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image');
    
    if (!file) {
      return new Response('No image provided', { status: 400 });
    }
    
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // 使用sharp压缩图片
    const compressedBuffer = await sharp(buffer)
      .resize(1920, null, { withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
    
    return new Response(compressedBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': compressedBuffer.length.toString()
      }
    });
  } catch (error) {
    console.error('Image compression error:', error);
    return new Response('Image processing failed', { status: 500 });
  }
} 