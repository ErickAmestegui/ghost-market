import type { Metadata } from "next";
import { Cormorant_Garamond, IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";
const inter=Inter({subsets:["latin"],variable:"--font-inter"});
const display=Cormorant_Garamond({subsets:["latin"],weight:["400","500"],variable:"--font-display"});
const mono=IBM_Plex_Mono({subsets:["latin"],weight:["400","500"],variable:"--font-ibm"});
export const metadata:Metadata={title:"GHOST MARKET Beta 0.8 — Social Pulse 2.0",description:"Official issuer news, clearly limited social context, read-only wallet inspection and verifiable BNB Chain evidence for tokenized equities.",icons:{icon:"/favicon.svg",shortcut:"/favicon.svg"}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body className={`${inter.variable} ${display.variable} ${mono.variable} antialiased`}>{children}</body></html>}
