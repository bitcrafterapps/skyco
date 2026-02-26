import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Skyco Station Tracker",
  description: "Production order tracking system",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Skyco Station Tracker",
  },
  other: {
    "theme-color": "#005B97",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`
          ${inter.variable}
          font-sans antialiased
          bg-white text-slate-900
          overflow-hidden
          select-none
        `}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme_preference");var theme=t==="dark"?"dark":"light";document.documentElement.setAttribute("data-theme",theme);}catch(e){document.documentElement.setAttribute("data-theme","light");}})();`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
