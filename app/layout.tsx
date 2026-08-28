import type { Metadata } from "next";
import { Cormorant_Garamond, Noto_Sans_KR } from "next/font/google";
import { MotionProvider } from "@/components/motion";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["italic", "normal"],
});

const sans = Noto_Sans_KR({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "Amadi — Find your flow",
  description: "요가웨어를 소재와 계절, 그리고 당신의 수련에 맞춰 찾는 디스커버리 카탈로그.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${display.variable} ${sans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans font-light">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
