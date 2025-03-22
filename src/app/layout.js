export const metadata = {
  title: '图片搜索系统',
  description: 'YnnAI独立开发的图片搜索系统',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', sizes: '32x32' },
    ],
    apple: { url: '/apple-icon.png', sizes: '180x180' },
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  )
}
