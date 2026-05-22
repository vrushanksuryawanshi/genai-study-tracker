import "./globals.css";

export const metadata = {
  title: "GenAI Study Tracker — 200 Day Challenge",
  description:
    "Track your 200-day journey to becoming a successful Gen AI Engineer. Manage study sessions, tools, projects, and stay accountable with a built-in timer and life system.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
