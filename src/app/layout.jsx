import './globals.css'

export const metadata = {
  title: '图像搜索应用',
  description: '基于百度AI的图像搜索应用',
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
} 