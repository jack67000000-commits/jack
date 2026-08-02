import type {Metadata} from "next";
import "./globals.css";
export const metadata:Metadata={title:"WinScope · Pronósticos de juegos",description:"Tendencias y referencias de juegos en una vista clara."};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="zh-CN"><body>{children}</body></html>}