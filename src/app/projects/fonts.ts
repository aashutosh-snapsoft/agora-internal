import { Inter } from "next/font/google";

/**
 * Inter — the design system's typeface (Figma node 111:300, "Type Scale": every
 * step from Heading 1 down to Overline is Inter).
 *
 * Scoped to this route on purpose. The rest of Agora renders in Satoshi:
 * essence's `typography.ts` hardcodes "Satoshi Variable" on all 17 variants and
 * `createTheme.ts` sets it again on `html, body` with `!important`. Moving the
 * whole app to Inter is a product-wide change and its own piece of work; until
 * then /projects is deliberately the one surface on the DS type scale, and will
 * not match its neighbours.
 *
 * Loaded through `next/font` rather than a `@font-face` block beside Satoshi's
 * in `Styles/fonts.css`: next/font self-hosts the files at build time, so this
 * adds no runtime request to Google and no font binaries to the repo.
 *
 * `fallback` is the stack the design system file states verbatim, minus Inter
 * itself, which next/font puts in front.
 */
export const inter = Inter({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	display: "swap",
	fallback: [
		"-apple-system",
		"BlinkMacSystemFont",
		"Segoe UI",
		"Roboto",
		"Helvetica",
		"Arial",
		"sans-serif",
	],
});
