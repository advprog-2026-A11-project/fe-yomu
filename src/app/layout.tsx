import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Yomu",
  description: "A tiny forum frontend",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="header">
          <div className="container nav">
            <Link href="/" className="brand">
              Yomu
            </Link>
            <div style={{display : "flex", gap: 8}}>
              <Link href="/forums">
                <button className="btn">Forums</button>
              </Link>
              <Link href="/reading">
                <button className="btn">Reading</button>
              </Link>
              <Link href="/users">
                <button className="btn" >Auth</button>
              </Link>
            </div>
          </div>
        </header>

        <main className="container">{children}</main>

        <footer
          className="container"
          style={{
            marginTop: "3rem",
            padding: "1rem 0",
            borderTop: "1px solid var(--border)",
            textAlign: "center",
          }}
        >
          <small>(c) {new Date().getFullYear()} Yomu</small>
        </footer>
      </body>
    </html>
  );
}

