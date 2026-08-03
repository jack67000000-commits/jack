import type {Metadata} from "next";
import "./globals.css";
export const metadata:Metadata={title:"Winking.Game · Pronósticos de juegos",description:"Tendencias y referencias de juegos en una vista clara."};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="es-AR"><body>{children}</body></html>}
