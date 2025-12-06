// @ts-nocheck
/* eslint-disable */
/* Courses Hero - Duplicated from main-hero.jsx for /courses page with courses-specific text */
"use client";

/**
 * @typedef Locale
 * string
 */

/**
 * @typedef {{
 * children?: React.ReactNode
 * locale?: Locale
 * style?: React.CSSProperties
 * className?: string
 * id?: string
 * ref?: any
 * width?: any
 * height?: any
 * layoutId?: string
}} Props

 */
import { stdin_default as stdin_default6 } from "./chunks/chunk-OGWUPM25.js";
import { stdin_default as stdin_default7 } from "./chunks/chunk-5UNLO6O5.js";
import { stdin_default as stdin_default4 } from "./chunks/chunk-E7MFKP77.js";
import "./chunks/chunk-N6D34UNV.js";
import { stdin_default as stdin_default2 } from "./chunks/chunk-BSJ7DM5L.js";
import { stdin_default as stdin_default3 } from "./chunks/chunk-UDRHTIWX.js";
import { stdin_default as stdin_default5 } from "./chunks/chunk-2N2BGU26.js";
import "./chunks/chunk-OB6MEFON.js";
import { stdin_default } from "./chunks/chunk-LYL6HVQZ.js";
import "./chunks/chunk-EKC5TL2T.js";
import { className, css, fonts } from "./chunks/chunk-EGCCNRVP.js";
import "./chunks/chunk-Q6S3NDW2.js";
import "./chunks/chunk-6X4H3KEO.js";
import "./chunks/chunk-HZSMZCXU.js";
import "./chunks/chunk-U5LHETZW.js";
import { routes } from "./chunks/chunk-UZZEI6KP.js";
// Removed SocialProofLogos for courses page

// virtual:courses-hero
import { Fragment as Fragment2 } from "react";
import { ContextProviders } from "unframer";

// /:https://framerusercontent.com/modules/j4Q2rzBaBWLy9oV3ceXo/fDJ9Q05aXx4nyiSvgxXW/S5FkFcOiX.js
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import {
	addFonts,
	addPropertyControls,
	ComponentViewportProvider,
	ControlType,
	cx,
	getFonts,
	getFontsFromSharedStyle,
	getLoadingLazyAtYPosition,
	Image,
	ResolveLinks,
	RichText,
	SmartComponentScopedContainer,
	SVG,
	useComponentViewport,
	useLocaleInfo,
	useRouter,
	useVariantState,
	withCSS,
	withFX,
	withOptimizedAppearEffect,
} from "unframer";
import { LayoutGroup, motion, MotionConfigContext } from "unframer";
import * as React from "react";
import { useRef } from "react";

// /:https://framerusercontent.com/modules/hvj6UWqlPuG46SCpbpMh/DKelYLiCvgaLrnJhr2kC/vLR8vQBpB.js
import { fontStore } from "unframer";
fontStore.loadFonts([
	"Inter-Bold",
	"Inter-Black",
	"Inter-BlackItalic",
	"Inter-BoldItalic",
]);
var fonts2 = [
	{
		explicitInter: true,
		fonts: [
			{
				family: "Inter",
				source: "framer",
				style: "normal",
				unicodeRange:
					"U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F",
				url: "https://framerusercontent.com/assets/DpPBYI0sL4fYLgAkX8KXOPVt7c.woff2",
				weight: "700",
			},
			{
				family: "Inter",
				source: "framer",
				style: "normal",
				unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116",
				url: "https://framerusercontent.com/assets/4RAEQdEOrcnDkhHiiCbJOw92Lk.woff2",
				weight: "700",
			},
			{
				family: "Inter",
				source: "framer",
				style: "normal",
				unicodeRange: "U+1F00-1FFF",
				url: "https://framerusercontent.com/assets/1K3W8DizY3v4emK8Mb08YHxTbs.woff2",
				weight: "700",
			},
			{
				family: "Inter",
				source: "framer",
				style: "normal",
				unicodeRange: "U+0370-03FF",
				url: "https://framerusercontent.com/assets/tUSCtfYVM1I1IchuyCwz9gDdQ.woff2",
				weight: "700",
			},
			{
				family: "Inter",
				source: "framer",
				style: "normal",
				unicodeRange:
					"U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF",
				url: "https://framerusercontent.com/assets/VgYFWiwsAC5OYxAycRXXvhze58.woff2",
				weight: "700",
			},
			{
				family: "Inter",
				source: "framer",
				style: "normal",
				unicodeRange:
					"U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
				url: "https://framerusercontent.com/assets/DXD0Q7LSl7HEvDzucnyLnGBHM.woff2",
				weight: "700",
			},
			{
				family: "Inter",
				source: "framer",
				style: "normal",
				unicodeRange:
					"U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB",
				url: "https://framerusercontent.com/assets/GIryZETIX4IFypco5pYZONKhJIo.woff2",
				weight: "700",
			},
			{
				family: "Inter",
				source: "framer",
				style: "normal",
				unicodeRange:
					"U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F",
				url: "https://framerusercontent.com/assets/mkY5Sgyq51ik0AMrSBwhm9DJg.woff2",
				weight: "900",
			},
			{
				family: "Inter",
				source: "framer",
				style: "normal",
				unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116",
				url: "https://framerusercontent.com/assets/X5hj6qzcHUYv7h1390c8Rhm6550.woff2",
				weight: "900",
			},
			{
				family: "Inter",
				source: "framer",
				style: "normal",
				unicodeRange: "U+1F00-1FFF",
				url: "https://framerusercontent.com/assets/gQhNpS3tN86g8RcVKYUUaKt2oMQ.woff2",
				weight: "900",
			},
			{
				family: "Inter",
				source: "framer",
				style: "normal",
				unicodeRange: "U+0370-03FF",
				url: "https://framerusercontent.com/assets/cugnVhSraaRyANCaUtI5FV17wk.woff2",
				weight: "900",
			},
			{
				family: "Inter",
				source: "framer",
				style: "normal",
				unicodeRange:
					"U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF",
				url: "https://framerusercontent.com/assets/5HcVoGak8k5agFJSaKa4floXVu0.woff2",
				weight: "900",
			},
			{
				family: "Inter",
				source: "framer",
				style: "normal",
				unicodeRange:
					"U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
				url: "https://framerusercontent.com/assets/jn4BtSPLlS0NDp1KiFAtFKiiY0o.woff2",
				weight: "900",
			},
			{
				family: "Inter",
				source: "framer",
				style: "normal",
				unicodeRange:
					"U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB",
				url: "https://framerusercontent.com/assets/P2Bw01CtL0b9wqygO0sSVogWbo.woff2",
				weight: "900",
			},
			{
				family: "Inter",
				source: "framer",
				style: "italic",
				unicodeRange:
					"U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F",
				url: "https://framerusercontent.com/assets/05KsVHGDmqXSBXM4yRZ65P8i0s.woff2",
				weight: "900",
			},
			{
				family: "Inter",
				source: "framer",
				style: "italic",
				unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116",
				url: "https://framerusercontent.com/assets/ky8ovPukK4dJ1Pxq74qGhOqCYI.woff2",
				weight: "900",
			},
			{
				family: "Inter",
				source: "framer",
				style: "italic",
				unicodeRange: "U+1F00-1FFF",
				url: "https://framerusercontent.com/assets/vvNSqIj42qeQ2bvCRBIWKHscrc.woff2",
				weight: "900",
			},
			{
				family: "Inter",
				source: "framer",
				style: "italic",
				unicodeRange: "U+0370-03FF",
				url: "https://framerusercontent.com/assets/3ZmXbBKToJifDV9gwcifVd1tEY.woff2",
				weight: "900",
			},
			{
				family: "Inter",
				source: "framer",
				style: "italic",
				unicodeRange:
					"U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF",
				url: "https://framerusercontent.com/assets/FNfhX3dt4ChuLJq2PwdlxHO7PU.woff2",
				weight: "900",
			},
			{
				family: "Inter",
				source: "framer",
				style: "italic",
				unicodeRange:
					"U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
				url: "https://framerusercontent.com/assets/g0c8vEViiXNlKAgI4Ymmk3Ig.woff2",
				weight: "900",
			},
			{
				family: "Inter",
				source: "framer",
				style: "italic",
				unicodeRange:
					"U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB",
				url: "https://framerusercontent.com/assets/efTfQcBJ53kM2pB1hezSZ3RDUFs.woff2",
				weight: "900",
			},
			{
				family: "Inter",
				source: "framer",
				style: "italic",
				unicodeRange:
					"U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F",
				url: "https://framerusercontent.com/assets/H89BbHkbHDzlxZzxi8uPzTsp90.woff2",
				weight: "700",
			},
			{
				family: "Inter",
				source: "framer",
				style: "italic",
				unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116",
				url: "https://framerusercontent.com/assets/u6gJwDuwB143kpNK1T1MDKDWkMc.woff2",
				weight: "700",
			},
			{
				family: "Inter",
				source: "framer",
				style: "italic",
				unicodeRange: "U+1F00-1FFF",
				url: "https://framerusercontent.com/assets/43sJ6MfOPh1LCJt46OvyDuSbA6o.woff2",
				weight: "700",
			},
			{
				family: "Inter",
				source: "framer",
				style: "italic",
				unicodeRange: "U+0370-03FF",
				url: "https://framerusercontent.com/assets/wccHG0r4gBDAIRhfHiOlq6oEkqw.woff2",
				weight: "700",
			},
			{
				family: "Inter",
				source: "framer",
				style: "italic",
				unicodeRange:
					"U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF",
				url: "https://framerusercontent.com/assets/WZ367JPwf9bRW6LdTHN8rXgSjw.woff2",
				weight: "700",
			},
			{
				family: "Inter",
				source: "framer",
				style: "italic",
				unicodeRange:
					"U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
				url: "https://framerusercontent.com/assets/QxmhnWTzLtyjIiZcfaLIJ8EFBXU.woff2",
				weight: "700",
			},
			{
				family: "Inter",
				source: "framer",
				style: "italic",
				unicodeRange:
					"U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB",
				url: "https://framerusercontent.com/assets/2A4Xx7CngadFGlVV4xrO06OBHY.woff2",
				weight: "700",
			},
		],
	},
];
var css2 = [
	'.framer-CUODV .framer-styles-preset-bzw91s:not(.rich-text-wrapper), .framer-CUODV .framer-styles-preset-bzw91s.rich-text-wrapper h1 { --framer-font-family: "Inter", "Inter Placeholder", sans-serif; --framer-font-family-bold: "Inter", sans-serif; --framer-font-family-bold-italic: "Inter", sans-serif; --framer-font-family-italic: "Inter", "Inter Placeholder", sans-serif; --framer-font-open-type-features: normal; --framer-font-size: 64px; --framer-font-style: normal; --framer-font-style-bold: normal; --framer-font-style-bold-italic: italic; --framer-font-style-italic: italic; --framer-font-variation-axes: normal; --framer-font-weight: 700; --framer-font-weight-bold: 900; --framer-font-weight-bold-italic: 900; --framer-font-weight-italic: 700; --framer-letter-spacing: -0.01em; --framer-line-height: 74px; --framer-paragraph-spacing: 0px; --framer-text-alignment: start; --framer-text-color: var(--token-05a7cdfd-1e0f-43da-a9f6-b4623556492c, #111827); --framer-text-decoration: none; --framer-text-stroke-color: initial; --framer-text-stroke-width: initial; --framer-text-transform: none; }',
	'@media (max-width: 1199px) and (min-width: 810px) { .framer-CUODV .framer-styles-preset-bzw91s:not(.rich-text-wrapper), .framer-CUODV .framer-styles-preset-bzw91s.rich-text-wrapper h1 { --framer-font-family: "Inter", "Inter Placeholder", sans-serif; --framer-font-family-bold: "Inter", sans-serif; --framer-font-family-bold-italic: "Inter", sans-serif; --framer-font-family-italic: "Inter", "Inter Placeholder", sans-serif; --framer-font-open-type-features: normal; --framer-font-size: 54px; --framer-font-style: normal; --framer-font-style-bold: normal; --framer-font-style-bold-italic: italic; --framer-font-style-italic: italic; --framer-font-variation-axes: normal; --framer-font-weight: 700; --framer-font-weight-bold: 900; --framer-font-weight-bold-italic: 900; --framer-font-weight-italic: 700; --framer-letter-spacing: -0.01em; --framer-line-height: 64px; --framer-paragraph-spacing: 0px; --framer-text-alignment: start; --framer-text-color: var(--token-05a7cdfd-1e0f-43da-a9f6-b4623556492c, #111827); --framer-text-decoration: none; --framer-text-stroke-color: initial; --framer-text-stroke-width: initial; --framer-text-transform: none; } }',
	'@media (max-width: 809px) and (min-width: 0px) { .framer-CUODV .framer-styles-preset-bzw91s:not(.rich-text-wrapper), .framer-CUODV .framer-styles-preset-bzw91s.rich-text-wrapper h1 { --framer-font-family: "Inter", "Inter Placeholder", sans-serif; --framer-font-family-bold: "Inter", sans-serif; --framer-font-family-bold-italic: "Inter", sans-serif; --framer-font-family-italic: "Inter", "Inter Placeholder", sans-serif; --framer-font-open-type-features: normal; --framer-font-size: 44px; --framer-font-style: normal; --framer-font-style-bold: normal; --framer-font-style-bold-italic: italic; --framer-font-style-italic: italic; --framer-font-variation-axes: normal; --framer-font-weight: 700; --framer-font-weight-bold: 900; --framer-font-weight-bold-italic: 900; --framer-font-weight-italic: 700; --framer-letter-spacing: -0.01em; --framer-line-height: 54px; --framer-paragraph-spacing: 0px; --framer-text-alignment: start; --framer-text-color: var(--token-05a7cdfd-1e0f-43da-a9f6-b4623556492c, #111827); --framer-text-decoration: none; --framer-text-stroke-color: initial; --framer-text-stroke-width: initial; --framer-text-transform: none; } }',
];
var className2 = "framer-CUODV";

// /:https://framerusercontent.com/modules/j4Q2rzBaBWLy9oV3ceXo/fDJ9Q05aXx4nyiSvgxXW/S5FkFcOiX.js
var HeroBadgeFonts = getFonts(stdin_default4);
var SmartComponentScopedContainerWithFXWithOptimizedAppearEffect =
	withOptimizedAppearEffect(withFX(SmartComponentScopedContainer));
var MotionDivWithFXWithOptimizedAppearEffect = withOptimizedAppearEffect(
	withFX(motion.div),
);
var ButtonSecondaryFonts = getFonts(stdin_default3);
var ButtonPrimaryFonts = getFonts(stdin_default);
var DesktopDashboardImageFonts = getFonts(stdin_default6);
var SocialProofFonts = getFonts(stdin_default2);
var ShimmerSecondFonts = getFonts(stdin_default7);
var SmartComponentScopedContainerWithFX = withFX(SmartComponentScopedContainer);
var ImageWithFXWithOptimizedAppearEffect = withOptimizedAppearEffect(
	withFX(Image),
);
var MetricsFonts = getFonts(stdin_default5);
var cycleOrder = ["uJv11ixgj", "abHsb8cMx", "tkiLDJXPK"];
var serializationHash = "framer-b62lb";
var variantClassNames = {
	abHsb8cMx: "framer-v-1jhznf3",
	tkiLDJXPK: "framer-v-1yba6oq",
	uJv11ixgj: "framer-v-eetyh4",
};
function addPropertyOverrides(overrides, ...variants) {
	const nextOverrides = {};
	variants?.forEach(
		(variant) => variant && Object.assign(nextOverrides, overrides[variant]),
	);
	return nextOverrides;
}
var transition1 = {
	bounce: 0.2,
	delay: 0,
	duration: 0.4,
	type: "spring",
};
var transition2 = {
	bounce: 0.2,
	delay: 0.2,
	duration: 0.7,
	type: "spring",
};
var animation = {
	opacity: 1,
	rotate: 0,
	rotateX: 0,
	rotateY: 0,
	scale: 1,
	skewX: 0,
	skewY: 0,
	transition: transition2,
	x: 0,
	y: 0,
};
var animation1 = {
	opacity: 1e-3,
	rotate: 0,
	rotateX: 0,
	rotateY: 0,
	scale: 1,
	skewX: 0,
	skewY: 0,
	x: 0,
	y: -30,
};
var transition3 = {
	bounce: 0.2,
	delay: 0,
	duration: 0.7,
	type: "spring",
};
var animation2 = {
	opacity: 1,
	rotate: 0,
	rotateX: 0,
	rotateY: 0,
	scale: 1,
	skewX: 0,
	skewY: 0,
	transition: transition3,
	x: 0,
	y: 0,
};
var animation3 = {
	opacity: 1e-3,
	rotate: 0,
	rotateX: 0,
	rotateY: 0,
	scale: 1,
	skewX: 0,
	skewY: 0,
	x: 0,
	y: 20,
};
var transition4 = {
	bounce: 0.2,
	delay: 0.3,
	duration: 0.7,
	type: "spring",
};
var animation4 = {
	opacity: 1,
	rotate: 0,
	rotateX: 0,
	rotateY: 0,
	scale: 1,
	skewX: 0,
	skewY: 0,
	transition: transition4,
	x: 0,
	y: 0,
};
var animation5 = {
	opacity: 1e-3,
	rotate: 0,
	rotateX: 0,
	rotateY: 0,
	scale: 1,
	skewX: 0,
	skewY: 0,
	x: 0,
	y: 30,
};
var transition5 = {
	bounce: 0.2,
	delay: 0.5,
	duration: 0.7,
	type: "spring",
};
var animation6 = {
	opacity: 1,
	rotate: 0,
	rotateX: 0,
	rotateY: 0,
	scale: 1,
	skewX: 0,
	skewY: 0,
	transition: transition5,
	x: 0,
	y: 0,
};
var transition6 = {
	delay: 1.5,
	duration: 8,
	ease: [0.12, 0.23, 0.5, 1],
	type: "tween",
};
var animation7 = {
	opacity: 0,
	rotate: 0,
	rotateX: 0,
	rotateY: 0,
	scale: 1,
	skewX: 0,
	skewY: 0,
	x: 780,
	y: 325,
};
var transition7 = {
	delay: 0.2,
	duration: 5.6,
	ease: [0.12, 0.23, 0.5, 1],
	type: "tween",
};
var animation8 = {
	opacity: 0,
	rotate: 0,
	rotateX: 0,
	rotateY: 0,
	scale: 0.6,
	skewX: 0,
	skewY: 0,
	x: 780,
	y: 325,
};
var transition8 = {
	delay: 0.6,
	duration: 7,
	ease: [0.12, 0.23, 0.5, 1],
	type: "tween",
};
var animation9 = {
	opacity: 0,
	rotate: 0,
	rotateX: 0,
	rotateY: 0,
	scale: 1.4,
	skewX: 0,
	skewY: 0,
	x: 780,
	y: 325,
};
var transition9 = {
	delay: 0.2,
	duration: 5.9,
	ease: [0.12, 0.23, 0.5, 1],
	type: "tween",
};
var animation10 = {
	opacity: 0,
	rotate: 0,
	rotateX: 0,
	rotateY: 0,
	scale: 1.2,
	skewX: 0,
	skewY: 0,
	x: 780,
	y: 325,
};
var transition10 = {
	delay: 2,
	duration: 6,
	ease: [0.12, 0.23, 0.5, 1],
	type: "tween",
};
var animation11 = {
	opacity: 0,
	rotate: 0,
	rotateX: 0,
	rotateY: 0,
	scale: 0.9,
	skewX: 0,
	skewY: 0,
	x: 780,
	y: 325,
};
var transition11 = {
	delay: 2.4,
	duration: 6,
	ease: [0.12, 0.23, 0.5, 1],
	type: "tween",
};
var animation12 = {
	opacity: 0,
	rotate: 0,
	rotateX: 0,
	rotateY: 0,
	scale: 0.7,
	skewX: 0,
	skewY: 0,
	x: 780,
	y: 325,
};
var transition12 = {
	delay: 3.2,
	duration: 7.4,
	ease: [0.12, 0.23, 0.5, 1],
	type: "tween",
};
var animation13 = {
	opacity: 0,
	rotate: 0,
	rotateX: 0,
	rotateY: 0,
	scale: 1.1,
	skewX: 0,
	skewY: 0,
	x: 780,
	y: 325,
};
var transition13 = {
	delay: 1,
	duration: 5,
	ease: [0.12, 0.23, 0.5, 1],
	type: "tween",
};
var animation14 = {
	opacity: 0,
	rotate: 0,
	rotateX: 0,
	rotateY: 0,
	scale: 0.8,
	skewX: 0,
	skewY: 0,
	x: 780,
	y: 325,
};
var transition14 = {
	delay: 1,
	duration: 6,
	ease: [0.12, 0.23, 0.5, 1],
	type: "tween",
};
var transition15 = {
	delay: 3,
	duration: 5.6,
	ease: [0.12, 0.23, 0.5, 1],
	type: "tween",
};
var transition16 = {
	delay: 2,
	duration: 5.4,
	ease: [0.12, 0.23, 0.5, 1],
	type: "tween",
};
var transition17 = {
	delay: 5.4,
	duration: 5.3,
	ease: [0.12, 0.23, 0.5, 1],
	type: "tween",
};
var transition18 = {
	delay: 2.3,
	duration: 5.8,
	ease: [0.12, 0.23, 0.5, 1],
	type: "tween",
};
var transition19 = {
	delay: 5.4,
	duration: 6,
	ease: [0.12, 0.23, 0.5, 1],
	type: "tween",
};
var transition20 = {
	delay: 2,
	duration: 8,
	ease: [0.12, 0.23, 0.5, 1],
	type: "tween",
};
var transition21 = {
	delay: 2,
	duration: 7,
	ease: [0.12, 0.23, 0.5, 1],
	type: "tween",
};
var Transition = ({ value, children }) => {
	const config = React.useContext(MotionConfigContext);
	const transition = value ?? config.transition;
	const contextValue = React.useMemo(
		() => ({
			...config,
			transition,
		}),
		[JSON.stringify(transition)],
	);
	return (
		<MotionConfigContext.Provider value={contextValue}>
			{children}
		</MotionConfigContext.Provider>
	);
};
var Variants = motion.create(React.Fragment);
var humanReadableVariantMap = {
	Desktop: "uJv11ixgj",
	Phone: "tkiLDJXPK",
	Tablet: "abHsb8cMx",
};
var getProps = ({ height, id, width, ...props }) => {
	return {
		...props,
		variant:
			humanReadableVariantMap[props.variant] ?? props.variant ?? "uJv11ixgj",
	};
};
var createLayoutDependency = (props, variants) => {
	if (props.layoutDependency)
		return variants.join("-") + props.layoutDependency;
	return variants.join("-");
};
var Component = /* @__PURE__ */ React.forwardRef(function (props, ref) {
	const fallbackRef = useRef(null);
	const refBinding = ref ?? fallbackRef;
	const defaultLayoutId = React.useId();
	const { activeLocale, setLocale } = useLocaleInfo();
	const componentViewport = useComponentViewport();
	const {
		style,
		className: className3,
		layoutId,
		variant,
		...restProps
	} = getProps(props);
	const {
		baseVariant,
		classNames,
		clearLoadingGesture,
		gestureHandlers,
		gestureVariant,
		isLoading,
		setGestureState,
		setVariant,
		variants,
	} = useVariantState({
		cycleOrder,
		defaultVariant: "uJv11ixgj",
		ref: refBinding,
		variant,
		variantClassNames,
	});
	const layoutDependency = createLayoutDependency(props, variants);
	const sharedStyleClassNames = [className2, className];
	const scopingClassNames = cx(serializationHash, ...sharedStyleClassNames);
	const router = useRouter();
	return (
		<LayoutGroup id={layoutId ?? defaultLayoutId}>
			<Variants animate={variants} initial={false}>
				<Transition value={transition1}>
					<motion.section
						{...restProps}
						{...gestureHandlers}
						className={cx(
							scopingClassNames,
							"framer-eetyh4",
							className3,
							classNames,
						)}
						data-framer-name={"Desktop"}
						layoutDependency={layoutDependency}
						layoutId={"uJv11ixgj"}
						ref={refBinding}
						style={{
							...style,
						}}
						{...addPropertyOverrides(
							{
								abHsb8cMx: {
									"data-framer-name": "Tablet",
								},
								tkiLDJXPK: {
									"data-framer-name": "Phone",
								},
							},
							baseVariant,
							gestureVariant,
						)}
					>
						<ImageWithFXWithOptimizedAppearEffect
							__perspectiveFX={false}
							__smartComponentFX={true}
							__targetOpacity={1}
							animate={animation}
							background={{
								alt: "",
								fit: "fill",
								loading: getLoadingLazyAtYPosition(
									(componentViewport?.y || 0) +
										88 +
										(((componentViewport?.height || 200) - 108 - 1697) / 2 +
											0 +
											0),
								),
								pixelHeight: 3600,
							pixelWidth: 2880,
								positionX: "center",
								positionY: "top",
								sizes: `min(${componentViewport?.width || "100vw"} - 160px, 1440px)`,
								src: "/images/hero.png",
							}}
							className={"framer-1edkqgx"}
							data-framer-appear-id={"1edkqgx"}
							data-framer-name={"Padding"}
							initial={animation1}
							layoutDependency={layoutDependency}
							layoutId={"rQDUU8axO"}
							optimized={true}
							style={{
								borderBottomLeftRadius: 24,
								borderBottomRightRadius: 24,
								borderTopLeftRadius: 24,
								borderTopRightRadius: 24,
							}}
							{...addPropertyOverrides(
								{
									abHsb8cMx: {
										background: {
											alt: "",
											fit: "fill",
											loading: getLoadingLazyAtYPosition(
												(componentViewport?.y || 0) +
													88 +
													(((componentViewport?.height || 200) - 120 - 1537) /
														2 +
														0 +
														0),
											),
											pixelHeight: 3600,
							pixelWidth: 2880,
											positionX: "center",
											positionY: "top",
											sizes: `min(${componentViewport?.width || "100vw"} - 52px, 1440px)`,
											src: "/images/hero.png",
										},
									},
									tkiLDJXPK: {
										background: {
											alt: "",
											fit: "fill",
											loading: getLoadingLazyAtYPosition(
												(componentViewport?.y || 0) +
													88 +
													(((componentViewport?.height || 200) - 108 - 1412) /
														2 +
														0 +
														0),
											),
											pixelHeight: 3600,
							pixelWidth: 2880,
											positionX: "center",
											positionY: "top",
											sizes: `min(${componentViewport?.width || "100vw"} - 40px, 1440px)`,
											src: "/images/hero.png",
										},
									},
								},
								baseVariant,
								gestureVariant,
							)}
						>
							<motion.div
								className={"framer-13g5sev"}
								data-framer-name={"Hero Content"}
								layoutDependency={layoutDependency}
								layoutId={"rOAPuQk23"}
							>
								<ResolveLinks
									links={[
										{
											href: {
												pathVariables: {
													wJltO2Bn9: "taskflow-beta-1-2-release",
												},
												unresolvedPathSlugs: {
													wJltO2Bn9: {
														collectionId: "cc3lY7PD8",
														collectionItemId: "obTrj78Y4",
													},
												},
												webPageId: "vTcIgI6Zm",
											},
											implicitPathVariables: void 0,
										},
										{
											href: {
												pathVariables: {
													wJltO2Bn9: "taskflow-beta-1-2-release",
												},
												unresolvedPathSlugs: {
													wJltO2Bn9: {
														collectionId: "cc3lY7PD8",
														collectionItemId: "obTrj78Y4",
													},
												},
												webPageId: "vTcIgI6Zm",
											},
											implicitPathVariables: void 0,
										},
										{
											href: {
												pathVariables: {
													wJltO2Bn9: "taskflow-beta-1-2-release",
												},
												unresolvedPathSlugs: {
													wJltO2Bn9: {
														collectionId: "cc3lY7PD8",
														collectionItemId: "obTrj78Y4",
													},
												},
												webPageId: "vTcIgI6Zm",
											},
											implicitPathVariables: void 0,
										},
									]}
								>
									{(resolvedLinks) => (
										<ComponentViewportProvider
											height={36}
											y={
												(componentViewport?.y || 0) +
												88 +
												(((componentViewport?.height || 200) - 108 - 1697) / 2 +
													0 +
													0) +
												124 +
												0 +
												0 +
												0
											}
											{...addPropertyOverrides(
												{
													abHsb8cMx: {
														y:
															(componentViewport?.y || 0) +
															88 +
															(((componentViewport?.height || 200) -
																120 -
																1537) /
																2 +
																0 +
																0) +
															124 +
															0 +
															0 +
															0,
													},
													tkiLDJXPK: {
														y:
															(componentViewport?.y || 0) +
															88 +
															(((componentViewport?.height || 200) -
																108 -
																1412) /
																2 +
																0 +
																0) +
															80 +
															0 +
															0 +
															0,
													},
												},
												baseVariant,
												gestureVariant,
											)}
										>
											<SmartComponentScopedContainerWithFXWithOptimizedAppearEffect
												__perspectiveFX={false}
												__smartComponentFX={true}
												__targetOpacity={1}
												animate={animation2}
												className={"framer-rt7a07-container"}
												data-framer-appear-id={"rt7a07"}
												initial={animation3}
												layoutDependency={layoutDependency}
												layoutId={"yCzj25qwF-container"}
												nodeId={"yCzj25qwF"}
												optimized={true}
												rendersWithMotion={true}
												scopeId={"S5FkFcOiX"}
											>
												{_jsx(stdin_default4, {
													BaAd7mo9i: "Rólunk",
													height: "100%",
													id: "yCzj25qwF",
													layoutId: "yCzj25qwF",
													lrZ6QDqlh: "https://dma.hu",
													PBhlelw1m: "20 éve a magyar vállalkozások mellett.",
													variant: "Qeolxld5Y",
													width: "100%",
													...addPropertyOverrides(
														{
															abHsb8cMx: {
																lrZ6QDqlh: resolvedLinks[1],
															},
															tkiLDJXPK: {
																lrZ6QDqlh: resolvedLinks[2],
																variant: "RH9pHFeeR",
															},
														},
														baseVariant,
														gestureVariant,
													),
												})}
											</SmartComponentScopedContainerWithFXWithOptimizedAppearEffect>
										</ComponentViewportProvider>
									)}
								</ResolveLinks>
								<MotionDivWithFXWithOptimizedAppearEffect
									__perspectiveFX={false}
									__smartComponentFX={true}
									__targetOpacity={1}
									animate={animation4}
									className={"framer-1e0p1hg"}
									data-framer-appear-id={"1e0p1hg"}
									data-framer-name={"Content Title"}
									initial={animation5}
									layoutDependency={layoutDependency}
									layoutId={"A12NeSIln"}
									optimized={true}
								>
									<RichText
										__fromCanvasComponent={true}
										className={"framer-13iyrmu"}
										fonts={["Inter"]}
										layoutDependency={layoutDependency}
										layoutId={"MZR1OGtGd"}
										style={{
											"--extracted-gdpscs":
												"var(--token-2512d5c3-fb46-42ef-a96a-5b1cd92b4a5b, rgb(255, 255, 255))",
											"--framer-link-text-color": "rgb(0, 153, 255)",
											"--framer-link-text-decoration": "underline",
										}}
										verticalAlignment={"top"}
										withExternalLayout={true}
									>
										<React.Fragment>
											<motion.h1
												className={"framer-styles-preset-bzw91s"}
												data-styles-preset={"vLR8vQBpB"}
												style={{
													"--framer-text-alignment": "center",
													"--framer-text-color":
														"var(--extracted-gdpscs, var(--token-2512d5c3-fb46-42ef-a96a-5b1cd92b4a5b, rgb(255, 255, 255)))",
												}}
											>
												{"Fedezd fel tartalmainkat"}
											</motion.h1>
										</React.Fragment>
									</RichText>
									<RichText
										__fromCanvasComponent={true}
										className={"framer-1d8sxh9"}
										fonts={["Inter"]}
										layoutDependency={layoutDependency}
										layoutId={"TQvQIl3su"}
										style={{
											"--extracted-r6o4lv":
												"var(--token-2512d5c3-fb46-42ef-a96a-5b1cd92b4a5b, rgb(255, 255, 255))",
											"--framer-link-text-color": "rgb(0, 153, 255)",
											"--framer-link-text-decoration": "underline",
										}}
										verticalAlignment={"top"}
										withExternalLayout={true}
									>
										<React.Fragment>
											<motion.p
												className={"framer-styles-preset-1f6wsl4"}
												data-styles-preset={"VYWldt3Ia"}
												style={{
													"--framer-text-alignment": "center",
													"--framer-text-color":
														"var(--extracted-r6o4lv, var(--token-2512d5c3-fb46-42ef-a96a-5b1cd92b4a5b, rgb(255, 255, 255)))",
												}}
											>
												{
													"Webinár, Akadémia, Podcast és Masterclass tartalmak szakértő Mentoroktól - válogass az azonnal alkalmazható és működő rendszereink közül"
												}
											</motion.p>
										</React.Fragment>
									</RichText>
								</MotionDivWithFXWithOptimizedAppearEffect>
								<MotionDivWithFXWithOptimizedAppearEffect
									__perspectiveFX={false}
									__smartComponentFX={true}
									__targetOpacity={1}
									animate={animation6}
									className={"framer-awkb0t"}
									data-framer-appear-id={"awkb0t"}
									data-framer-name={"Button "}
									initial={animation5}
									layoutDependency={layoutDependency}
									layoutId={"xUL2Fa5C3"}
									optimized={true}
								>
									<ComponentViewportProvider
										height={40}
										y={
											(componentViewport?.y || 0) +
											88 +
											(((componentViewport?.height || 200) - 108 - 1697) / 2 +
												0 +
												0) +
											124 +
											0 +
											0 +
											376 +
											0
										}
										{...addPropertyOverrides(
											{
												abHsb8cMx: {
													y:
														(componentViewport?.y || 0) +
														88 +
														(((componentViewport?.height || 200) - 120 - 1537) /
															2 +
															0 +
															0) +
														124 +
														0 +
														0 +
														376 +
														0,
												},
												tkiLDJXPK: {
													width: `min(min(${componentViewport?.width || "100vw"} - 40px, 1440px) - 32px, 700px)`,
													y:
														(componentViewport?.y || 0) +
														88 +
														(((componentViewport?.height || 200) - 108 - 1412) /
															2 +
															0 +
															0) +
														80 +
														0 +
														0 +
														376 +
														0 +
														0,
												},
											},
											baseVariant,
											gestureVariant,
										)}
									>
										<SmartComponentScopedContainer
											className={"framer-r4b1nv-container"}
											layoutDependency={layoutDependency}
											layoutId={"q03oD5D7d-container"}
											nodeId={"q03oD5D7d"}
											rendersWithMotion={true}
											scopeId={"S5FkFcOiX"}
										>
											{_jsx(stdin_default3, {
												bL9DUTLS5: "Ingyenes próba indítása",
												height: "100%",
												id: "q03oD5D7d",
												kI0zFLUtw:
													"/register?trial=true",
												layoutId: "q03oD5D7d",
												variant: "BzT_Mjmhp",
												width: "100%",
												...addPropertyOverrides(
													{
														tkiLDJXPK: {
															style: {
																width: "100%",
															},
														},
													},
													baseVariant,
													gestureVariant,
												),
											})}
										</SmartComponentScopedContainer>
									</ComponentViewportProvider>
									<ComponentViewportProvider
										height={40}
										y={
											(componentViewport?.y || 0) +
											88 +
											(((componentViewport?.height || 200) - 108 - 1697) / 2 +
												0 +
												0) +
											124 +
											0 +
											0 +
											376 +
											0
										}
										{...addPropertyOverrides(
											{
												abHsb8cMx: {
													y:
														(componentViewport?.y || 0) +
														88 +
														(((componentViewport?.height || 200) - 120 - 1537) /
															2 +
															0 +
															0) +
														124 +
														0 +
														0 +
														376 +
														0,
												},
												tkiLDJXPK: {
													width: `min(min(${componentViewport?.width || "100vw"} - 40px, 1440px) - 32px, 700px)`,
													y:
														(componentViewport?.y || 0) +
														88 +
														(((componentViewport?.height || 200) - 108 - 1412) /
															2 +
															0 +
															0) +
														80 +
														0 +
														0 +
														376 +
														0 +
														50,
												},
											},
											baseVariant,
											gestureVariant,
										)}
									>
										<SmartComponentScopedContainer
											className={"framer-1juq70x-container"}
											layoutDependency={layoutDependency}
											layoutId={"qa2qZyYOE-container"}
											nodeId={"qa2qZyYOE"}
											rendersWithMotion={true}
											scopeId={"S5FkFcOiX"}
										>
											{_jsx(stdin_default, {
												height: "100%",
												id: "qa2qZyYOE",
												idYdcR9Dy: "/courses",
												layoutId: "qa2qZyYOE",
												sK45rfg_7: "Tartalmaink megtekintése",
												variant: "LMljE2NbK",
												width: "100%",
												...addPropertyOverrides(
													{
														tkiLDJXPK: {
															style: {
																width: "100%",
															},
														},
													},
													baseVariant,
													gestureVariant,
												),
											})}
										</SmartComponentScopedContainer>
									</ComponentViewportProvider>
								</MotionDivWithFXWithOptimizedAppearEffect>
							</motion.div>
							<ComponentViewportProvider
								height={620}
								width={`calc(min(${componentViewport?.width || "100vw"} - 160px, 1440px) - 160px)`}
								y={
									(componentViewport?.y || 0) +
									88 +
									(((componentViewport?.height || 200) - 108 - 1697) / 2 +
										0 +
										0) +
									124 +
									496
								}
								{...addPropertyOverrides(
									{
										abHsb8cMx: {
											height: 500,
											width: `calc(min(${componentViewport?.width || "100vw"} - 52px, 1440px) - 40px)`,
											y:
												(componentViewport?.y || 0) +
												88 +
												(((componentViewport?.height || 200) - 120 - 1537) / 2 +
													0 +
													0) +
												124 +
												496,
										},
										tkiLDJXPK: {
											height: 409,
											width: "566px",
											y:
												(componentViewport?.y || 0) +
												88 +
												(((componentViewport?.height || 200) - 108 - 1412) / 2 +
													0 +
													0) +
												80 +
												530,
										},
									},
									baseVariant,
									gestureVariant,
								)}
							style={{ display: "none" }}
							>
								<SmartComponentScopedContainer
									className={"framer-1jq70zg-container"}
									layoutDependency={layoutDependency}
									layoutId={"rE7sV1GfJ-container"}
									nodeId={"rE7sV1GfJ"}
									rendersWithMotion={true}
									scopeId={"S5FkFcOiX"}
								>
									{_jsx(stdin_default6, {
										height: "100%",
										id: "rE7sV1GfJ",
										layoutId: "rE7sV1GfJ",
										style: {
											height: "100%",
											width: "100%",
										},
										width: "100%",
									})}
								</SmartComponentScopedContainer>
							</ComponentViewportProvider>
							<ComponentViewportProvider
								height={112}
								width={`calc(min(${componentViewport?.width || "100vw"} - 160px, 1440px) - 160px)`}
								y={
									(componentViewport?.y || 0) +
									88 +
									(((componentViewport?.height || 200) - 108 - 1697) / 2 +
										0 +
										0) +
									124 +
									1196
								}
								{...addPropertyOverrides(
									{
										abHsb8cMx: {
											width: `calc(min(${componentViewport?.width || "100vw"} - 52px, 1440px) - 40px)`,
											y:
												(componentViewport?.y || 0) +
												88 +
												(((componentViewport?.height || 200) - 120 - 1537) / 2 +
													0 +
													0) +
												124 +
												1076,
										},
										tkiLDJXPK: {
											width: `calc(min(${componentViewport?.width || "100vw"} - 40px, 1440px) - 32px)`,
											y:
												(componentViewport?.y || 0) +
												88 +
												(((componentViewport?.height || 200) - 108 - 1412) / 2 +
													0 +
													0) +
												80 +
												1003,
										},
									},
									baseVariant,
									gestureVariant,
								)}
							>
								{/* SocialProofLogos removed for courses page */}
								{null}
							</ComponentViewportProvider>
							<motion.div
								className={"framer-1490lq7"}
								data-framer-name={"Meteor - Frame"}
								layoutDependency={layoutDependency}
								layoutId={"Vcazw0x0X"}
								style={{
									borderBottomLeftRadius: 12,
									borderBottomRightRadius: 12,
									borderTopLeftRadius: 12,
									borderTopRightRadius: 12,
								}}
							>
								<ComponentViewportProvider
									height={1}
									width={"110px"}
									y={
										(componentViewport?.y || 0) +
										88 +
										(((componentViewport?.height || 200) - 108 - 1697) / 2 +
											0 +
											0) +
										-33 +
										40
									}
									{...addPropertyOverrides(
										{
											abHsb8cMx: {
												y:
													(componentViewport?.y || 0) +
													88 +
													(((componentViewport?.height || 200) - 120 - 1537) /
														2 +
														0 +
														0) +
													-33 +
													40,
											},
											tkiLDJXPK: {
												y:
													(componentViewport?.y || 0) +
													88 +
													(((componentViewport?.height || 200) - 108 - 1412) /
														2 +
														0 +
														0) +
													-33 +
													40,
											},
										},
										baseVariant,
										gestureVariant,
									)}
								>
									<SmartComponentScopedContainerWithFX
										__framer__loop={animation7}
										__framer__loopEffectEnabled={true}
										__framer__loopRepeatDelay={1.5}
										__framer__loopRepeatType={"loop"}
										__framer__loopTransition={transition6}
										__perspectiveFX={false}
										__smartComponentFX={true}
										__targetOpacity={1}
										className={"framer-1x5i0d3-container"}
										layoutDependency={layoutDependency}
										layoutId={"b9SJsfJR7-container"}
										nodeId={"b9SJsfJR7"}
										rendersWithMotion={true}
										scopeId={"S5FkFcOiX"}
										style={{
											rotate: 22.6,
										}}
									>
										{_jsx(stdin_default7, {
											height: "100%",
											id: "b9SJsfJR7",
											layoutId: "b9SJsfJR7",
											style: {
												height: "100%",
												width: "100%",
											},
											width: "100%",
										})}
									</SmartComponentScopedContainerWithFX>
								</ComponentViewportProvider>
								<ComponentViewportProvider
									height={1}
									width={"100px"}
									y={
										(componentViewport?.y || 0) +
										88 +
										(((componentViewport?.height || 200) - 108 - 1697) / 2 +
											0 +
											0) +
										-33 +
										70
									}
									{...addPropertyOverrides(
										{
											abHsb8cMx: {
												y:
													(componentViewport?.y || 0) +
													88 +
													(((componentViewport?.height || 200) - 120 - 1537) /
														2 +
														0 +
														0) +
													-33 +
													70,
											},
											tkiLDJXPK: {
												y:
													(componentViewport?.y || 0) +
													88 +
													(((componentViewport?.height || 200) - 108 - 1412) /
														2 +
														0 +
														0) +
													-33 +
													70,
											},
										},
										baseVariant,
										gestureVariant,
									)}
								>
									<SmartComponentScopedContainerWithFX
										__framer__loop={animation8}
										__framer__loopEffectEnabled={true}
										__framer__loopRepeatDelay={1}
										__framer__loopRepeatType={"loop"}
										__framer__loopTransition={transition7}
										__perspectiveFX={false}
										__smartComponentFX={true}
										__targetOpacity={1}
										className={"framer-t6zxzu-container"}
										layoutDependency={layoutDependency}
										layoutId={"KdjYpL00X-container"}
										nodeId={"KdjYpL00X"}
										rendersWithMotion={true}
										scopeId={"S5FkFcOiX"}
										style={{
											rotate: 22.6,
										}}
									>
										{_jsx(stdin_default7, {
											height: "100%",
											id: "KdjYpL00X",
											layoutId: "KdjYpL00X",
											style: {
												height: "100%",
												width: "100%",
											},
											width: "100%",
										})}
									</SmartComponentScopedContainerWithFX>
								</ComponentViewportProvider>
								<ComponentViewportProvider
									height={1}
									width={"100px"}
									y={
										(componentViewport?.y || 0) +
										88 +
										(((componentViewport?.height || 200) - 108 - 1697) / 2 +
											0 +
											0) +
										-33 +
										140
									}
									{...addPropertyOverrides(
										{
											abHsb8cMx: {
												y:
													(componentViewport?.y || 0) +
													88 +
													(((componentViewport?.height || 200) - 120 - 1537) /
														2 +
														0 +
														0) +
													-33 +
													140,
											},
											tkiLDJXPK: {
												y:
													(componentViewport?.y || 0) +
													88 +
													(((componentViewport?.height || 200) - 108 - 1412) /
														2 +
														0 +
														0) +
													-33 +
													140,
											},
										},
										baseVariant,
										gestureVariant,
									)}
								>
									<SmartComponentScopedContainerWithFX
										__framer__loop={animation9}
										__framer__loopEffectEnabled={true}
										__framer__loopRepeatDelay={0.6}
										__framer__loopRepeatType={"loop"}
										__framer__loopTransition={transition8}
										__perspectiveFX={false}
										__smartComponentFX={true}
										__targetOpacity={1}
										className={"framer-sijvh7-container"}
										layoutDependency={layoutDependency}
										layoutId={"dcpf12egJ-container"}
										nodeId={"dcpf12egJ"}
										rendersWithMotion={true}
										scopeId={"S5FkFcOiX"}
										style={{
											rotate: 22.6,
										}}
									>
										{_jsx(stdin_default7, {
											height: "100%",
											id: "dcpf12egJ",
											layoutId: "dcpf12egJ",
											style: {
												height: "100%",
												width: "100%",
											},
											width: "100%",
										})}
									</SmartComponentScopedContainerWithFX>
								</ComponentViewportProvider>
								<ComponentViewportProvider
									height={1}
									width={"100px"}
									y={
										(componentViewport?.y || 0) +
										88 +
										(((componentViewport?.height || 200) - 108 - 1697) / 2 +
											0 +
											0) +
										-33 +
										160
									}
									{...addPropertyOverrides(
										{
											abHsb8cMx: {
												y:
													(componentViewport?.y || 0) +
													88 +
													(((componentViewport?.height || 200) - 120 - 1537) /
														2 +
														0 +
														0) +
													-33 +
													160,
											},
											tkiLDJXPK: {
												y:
													(componentViewport?.y || 0) +
													88 +
													(((componentViewport?.height || 200) - 108 - 1412) /
														2 +
														0 +
														0) +
													-33 +
													160,
											},
										},
										baseVariant,
										gestureVariant,
									)}
								>
									<SmartComponentScopedContainerWithFX
										__framer__loop={animation10}
										__framer__loopEffectEnabled={true}
										__framer__loopRepeatDelay={1}
										__framer__loopRepeatType={"loop"}
										__framer__loopTransition={transition9}
										__perspectiveFX={false}
										__smartComponentFX={true}
										__targetOpacity={1}
										className={"framer-189rquj-container"}
										layoutDependency={layoutDependency}
										layoutId={"AkGhsNuNt-container"}
										nodeId={"AkGhsNuNt"}
										rendersWithMotion={true}
										scopeId={"S5FkFcOiX"}
										style={{
											rotate: 22.6,
										}}
									>
										{_jsx(stdin_default7, {
											height: "100%",
											id: "AkGhsNuNt",
											layoutId: "AkGhsNuNt",
											style: {
												height: "100%",
												width: "100%",
											},
											width: "100%",
										})}
									</SmartComponentScopedContainerWithFX>
								</ComponentViewportProvider>
								<ComponentViewportProvider
									height={1}
									width={"100px"}
									y={
										(componentViewport?.y || 0) +
										88 +
										(((componentViewport?.height || 200) - 108 - 1697) / 2 +
											0 +
											0) +
										-33 +
										250.0263
									}
									{...addPropertyOverrides(
										{
											abHsb8cMx: {
												y:
													(componentViewport?.y || 0) +
													88 +
													(((componentViewport?.height || 200) - 120 - 1537) /
														2 +
														0 +
														0) +
													-33 +
													250.0263,
											},
											tkiLDJXPK: {
												y:
													(componentViewport?.y || 0) +
													88 +
													(((componentViewport?.height || 200) - 108 - 1412) /
														2 +
														0 +
														0) +
													-33 +
													250.0263,
											},
										},
										baseVariant,
										gestureVariant,
									)}
								>
									<SmartComponentScopedContainerWithFX
										__framer__loop={animation11}
										__framer__loopEffectEnabled={true}
										__framer__loopRepeatDelay={5.4}
										__framer__loopRepeatType={"loop"}
										__framer__loopTransition={transition10}
										__perspectiveFX={false}
										__smartComponentFX={true}
										__targetOpacity={1}
										className={"framer-smveb3-container"}
										layoutDependency={layoutDependency}
										layoutId={"Z3HDUdVBE-container"}
										nodeId={"Z3HDUdVBE"}
										rendersWithMotion={true}
										scopeId={"S5FkFcOiX"}
										style={{
											rotate: 22.6,
										}}
									>
										{_jsx(stdin_default7, {
											height: "100%",
											id: "Z3HDUdVBE",
											layoutId: "Z3HDUdVBE",
											style: {
												height: "100%",
												width: "100%",
											},
											width: "100%",
										})}
									</SmartComponentScopedContainerWithFX>
								</ComponentViewportProvider>
								<ComponentViewportProvider
									height={1}
									width={"100px"}
									y={
										(componentViewport?.y || 0) +
										88 +
										(((componentViewport?.height || 200) - 108 - 1697) / 2 +
											0 +
											0) +
										-33 +
										-30
									}
									{...addPropertyOverrides(
										{
											abHsb8cMx: {
												y:
													(componentViewport?.y || 0) +
													88 +
													(((componentViewport?.height || 200) - 120 - 1537) /
														2 +
														0 +
														0) +
													-33 +
													-30,
											},
											tkiLDJXPK: {
												y:
													(componentViewport?.y || 0) +
													88 +
													(((componentViewport?.height || 200) - 108 - 1412) /
														2 +
														0 +
														0) +
													-33 +
													-30,
											},
										},
										baseVariant,
										gestureVariant,
									)}
								>
									<SmartComponentScopedContainerWithFX
										__framer__loop={animation12}
										__framer__loopEffectEnabled={true}
										__framer__loopRepeatDelay={2}
										__framer__loopRepeatType={"loop"}
										__framer__loopTransition={transition11}
										__perspectiveFX={false}
										__smartComponentFX={true}
										__targetOpacity={1}
										className={"framer-xso07l-container"}
										layoutDependency={layoutDependency}
										layoutId={"OCEhmD3f8-container"}
										nodeId={"OCEhmD3f8"}
										rendersWithMotion={true}
										scopeId={"S5FkFcOiX"}
										style={{
											rotate: 22.6,
										}}
									>
										{_jsx(stdin_default7, {
											height: "100%",
											id: "OCEhmD3f8",
											layoutId: "OCEhmD3f8",
											style: {
												height: "100%",
												width: "100%",
											},
											width: "100%",
										})}
									</SmartComponentScopedContainerWithFX>
								</ComponentViewportProvider>
								<ComponentViewportProvider
									height={1}
									width={"100px"}
									y={
										(componentViewport?.y || 0) +
										88 +
										(((componentViewport?.height || 200) - 108 - 1697) / 2 +
											0 +
											0) +
										-33 +
										-30
									}
									{...addPropertyOverrides(
										{
											abHsb8cMx: {
												y:
													(componentViewport?.y || 0) +
													88 +
													(((componentViewport?.height || 200) - 120 - 1537) /
														2 +
														0 +
														0) +
													-33 +
													-30,
											},
											tkiLDJXPK: {
												y:
													(componentViewport?.y || 0) +
													88 +
													(((componentViewport?.height || 200) - 108 - 1412) /
														2 +
														0 +
														0) +
													-33 +
													-30,
											},
										},
										baseVariant,
										gestureVariant,
									)}
								>
									<SmartComponentScopedContainerWithFX
										__framer__loop={animation13}
										__framer__loopEffectEnabled={true}
										__framer__loopRepeatDelay={3.2}
										__framer__loopRepeatType={"loop"}
										__framer__loopTransition={transition12}
										__perspectiveFX={false}
										__smartComponentFX={true}
										__targetOpacity={1}
										className={"framer-1212zc6-container"}
										layoutDependency={layoutDependency}
										layoutId={"SaeLGWCVg-container"}
										nodeId={"SaeLGWCVg"}
										rendersWithMotion={true}
										scopeId={"S5FkFcOiX"}
										style={{
											rotate: 22.6,
										}}
									>
										{_jsx(stdin_default7, {
											height: "100%",
											id: "SaeLGWCVg",
											layoutId: "SaeLGWCVg",
											style: {
												height: "100%",
												width: "100%",
											},
											width: "100%",
										})}
									</SmartComponentScopedContainerWithFX>
								</ComponentViewportProvider>
								<ComponentViewportProvider
									height={1}
									width={"100px"}
									y={
										(componentViewport?.y || 0) +
										88 +
										(((componentViewport?.height || 200) - 108 - 1697) / 2 +
											0 +
											0) +
										-33 +
										-40
									}
									{...addPropertyOverrides(
										{
											abHsb8cMx: {
												y:
													(componentViewport?.y || 0) +
													88 +
													(((componentViewport?.height || 200) - 120 - 1537) /
														2 +
														0 +
														0) +
													-33 +
													-40,
											},
											tkiLDJXPK: {
												y:
													(componentViewport?.y || 0) +
													88 +
													(((componentViewport?.height || 200) - 108 - 1412) /
														2 +
														0 +
														0) +
													-33 +
													-40,
											},
										},
										baseVariant,
										gestureVariant,
									)}
								>
									<SmartComponentScopedContainerWithFX
										__framer__loop={animation14}
										__framer__loopEffectEnabled={true}
										__framer__loopRepeatDelay={1}
										__framer__loopRepeatType={"loop"}
										__framer__loopTransition={transition13}
										__perspectiveFX={false}
										__smartComponentFX={true}
										__targetOpacity={1}
										className={"framer-16z5n1t-container"}
										layoutDependency={layoutDependency}
										layoutId={"lIWhHJl8v-container"}
										nodeId={"lIWhHJl8v"}
										rendersWithMotion={true}
										scopeId={"S5FkFcOiX"}
										style={{
											rotate: 22.6,
										}}
									>
										{_jsx(stdin_default7, {
											height: "100%",
											id: "lIWhHJl8v",
											layoutId: "lIWhHJl8v",
											style: {
												height: "100%",
												width: "100%",
											},
											width: "100%",
										})}
									</SmartComponentScopedContainerWithFX>
								</ComponentViewportProvider>
								<ComponentViewportProvider
									height={1}
									width={"100px"}
									y={
										(componentViewport?.y || 0) +
										88 +
										(((componentViewport?.height || 200) - 108 - 1697) / 2 +
											0 +
											0) +
										-33 +
										-40
									}
									{...addPropertyOverrides(
										{
											abHsb8cMx: {
												y:
													(componentViewport?.y || 0) +
													88 +
													(((componentViewport?.height || 200) - 120 - 1537) /
														2 +
														0 +
														0) +
													-33 +
													-40,
											},
											tkiLDJXPK: {
												y:
													(componentViewport?.y || 0) +
													88 +
													(((componentViewport?.height || 200) - 108 - 1412) /
														2 +
														0 +
														0) +
													-33 +
													-40,
											},
										},
										baseVariant,
										gestureVariant,
									)}
								>
									<SmartComponentScopedContainerWithFX
										__framer__loop={animation10}
										__framer__loopEffectEnabled={true}
										__framer__loopRepeatDelay={4.5}
										__framer__loopRepeatType={"loop"}
										__framer__loopTransition={transition14}
										__perspectiveFX={false}
										__smartComponentFX={true}
										__targetOpacity={1}
										className={"framer-kfpmno-container"}
										layoutDependency={layoutDependency}
										layoutId={"ZsScrH4T8-container"}
										nodeId={"ZsScrH4T8"}
										rendersWithMotion={true}
										scopeId={"S5FkFcOiX"}
										style={{
											rotate: 22.6,
										}}
									>
										{_jsx(stdin_default7, {
											height: "100%",
											id: "ZsScrH4T8",
											layoutId: "ZsScrH4T8",
											style: {
												height: "100%",
												width: "100%",
											},
											width: "100%",
										})}
									</SmartComponentScopedContainerWithFX>
								</ComponentViewportProvider>
								<ComponentViewportProvider
									height={1}
									width={"100px"}
									y={
										(componentViewport?.y || 0) +
										88 +
										(((componentViewport?.height || 200) - 108 - 1697) / 2 +
											0 +
											0) +
										-33 +
										-30
									}
									{...addPropertyOverrides(
										{
											abHsb8cMx: {
												y:
													(componentViewport?.y || 0) +
													88 +
													(((componentViewport?.height || 200) - 120 - 1537) /
														2 +
														0 +
														0) +
													-33 +
													-30,
											},
											tkiLDJXPK: {
												y:
													(componentViewport?.y || 0) +
													88 +
													(((componentViewport?.height || 200) - 108 - 1412) /
														2 +
														0 +
														0) +
													-33 +
													-30,
											},
										},
										baseVariant,
										gestureVariant,
									)}
								>
									<SmartComponentScopedContainerWithFX
										__framer__loop={animation7}
										__framer__loopEffectEnabled={true}
										__framer__loopRepeatDelay={3}
										__framer__loopRepeatType={"loop"}
										__framer__loopTransition={transition15}
										__perspectiveFX={false}
										__smartComponentFX={true}
										__targetOpacity={1}
										className={"framer-1o1ui2s-container"}
										layoutDependency={layoutDependency}
										layoutId={"UVUEfyRGq-container"}
										nodeId={"UVUEfyRGq"}
										rendersWithMotion={true}
										scopeId={"S5FkFcOiX"}
										style={{
											rotate: 22.6,
										}}
									>
										{_jsx(stdin_default7, {
											height: "100%",
											id: "UVUEfyRGq",
											layoutId: "UVUEfyRGq",
											style: {
												height: "100%",
												width: "100%",
											},
											width: "100%",
										})}
									</SmartComponentScopedContainerWithFX>
								</ComponentViewportProvider>
								<ComponentViewportProvider
									height={1}
									width={"100px"}
									y={
										(componentViewport?.y || 0) +
										88 +
										(((componentViewport?.height || 200) - 108 - 1697) / 2 +
											0 +
											0) +
										-33 +
										-40
									}
									{...addPropertyOverrides(
										{
											abHsb8cMx: {
												y:
													(componentViewport?.y || 0) +
													88 +
													(((componentViewport?.height || 200) - 120 - 1537) /
														2 +
														0 +
														0) +
													-33 +
													-40,
											},
											tkiLDJXPK: {
												y:
													(componentViewport?.y || 0) +
													88 +
													(((componentViewport?.height || 200) - 108 - 1412) /
														2 +
														0 +
														0) +
													-33 +
													-40,
											},
										},
										baseVariant,
										gestureVariant,
									)}
								>
									<SmartComponentScopedContainerWithFX
										__framer__loop={animation14}
										__framer__loopEffectEnabled={true}
										__framer__loopRepeatDelay={2}
										__framer__loopRepeatType={"loop"}
										__framer__loopTransition={transition16}
										__perspectiveFX={false}
										__smartComponentFX={true}
										__targetOpacity={1}
										className={"framer-r6aprj-container"}
										layoutDependency={layoutDependency}
										layoutId={"IwilgkJLs-container"}
										nodeId={"IwilgkJLs"}
										rendersWithMotion={true}
										scopeId={"S5FkFcOiX"}
										style={{
											rotate: 22.6,
										}}
									>
										{_jsx(stdin_default7, {
											height: "100%",
											id: "IwilgkJLs",
											layoutId: "IwilgkJLs",
											style: {
												height: "100%",
												width: "100%",
											},
											width: "100%",
										})}
									</SmartComponentScopedContainerWithFX>
								</ComponentViewportProvider>
								<ComponentViewportProvider
									height={1}
									width={"100px"}
									y={
										(componentViewport?.y || 0) +
										88 +
										(((componentViewport?.height || 200) - 108 - 1697) / 2 +
											0 +
											0) +
										-33 +
										-40
									}
									{...addPropertyOverrides(
										{
											abHsb8cMx: {
												y:
													(componentViewport?.y || 0) +
													88 +
													(((componentViewport?.height || 200) - 120 - 1537) /
														2 +
														0 +
														0) +
													-33 +
													-40,
											},
											tkiLDJXPK: {
												y:
													(componentViewport?.y || 0) +
													88 +
													(((componentViewport?.height || 200) - 108 - 1412) /
														2 +
														0 +
														0) +
													-33 +
													-40,
											},
										},
										baseVariant,
										gestureVariant,
									)}
								>
									<SmartComponentScopedContainerWithFX
										__framer__loop={animation8}
										__framer__loopEffectEnabled={true}
										__framer__loopRepeatDelay={1.4}
										__framer__loopRepeatType={"loop"}
										__framer__loopTransition={transition17}
										__perspectiveFX={false}
										__smartComponentFX={true}
										__targetOpacity={1}
										className={"framer-1d2z9ns-container"}
										layoutDependency={layoutDependency}
										layoutId={"vo5nEf4Hj-container"}
										nodeId={"vo5nEf4Hj"}
										rendersWithMotion={true}
										scopeId={"S5FkFcOiX"}
										style={{
											rotate: 22.6,
										}}
									>
										{_jsx(stdin_default7, {
											height: "100%",
											id: "vo5nEf4Hj",
											layoutId: "vo5nEf4Hj",
											style: {
												height: "100%",
												width: "100%",
											},
											width: "100%",
										})}
									</SmartComponentScopedContainerWithFX>
								</ComponentViewportProvider>
								<ComponentViewportProvider
									height={1}
									width={"100px"}
									y={
										(componentViewport?.y || 0) +
										88 +
										(((componentViewport?.height || 200) - 108 - 1697) / 2 +
											0 +
											0) +
										-33 +
										-40
									}
									{...addPropertyOverrides(
										{
											abHsb8cMx: {
												y:
													(componentViewport?.y || 0) +
													88 +
													(((componentViewport?.height || 200) - 120 - 1537) /
														2 +
														0 +
														0) +
													-33 +
													-40,
											},
											tkiLDJXPK: {
												y:
													(componentViewport?.y || 0) +
													88 +
													(((componentViewport?.height || 200) - 108 - 1412) /
														2 +
														0 +
														0) +
													-33 +
													-40,
											},
										},
										baseVariant,
										gestureVariant,
									)}
								>
									<SmartComponentScopedContainerWithFX
										__framer__loop={animation11}
										__framer__loopEffectEnabled={true}
										__framer__loopRepeatDelay={2}
										__framer__loopRepeatType={"loop"}
										__framer__loopTransition={transition18}
										__perspectiveFX={false}
										__smartComponentFX={true}
										__targetOpacity={1}
										className={"framer-2yt8bl-container"}
										layoutDependency={layoutDependency}
										layoutId={"xpaD346nT-container"}
										nodeId={"xpaD346nT"}
										rendersWithMotion={true}
										scopeId={"S5FkFcOiX"}
										style={{
											rotate: 22.6,
										}}
									>
										{_jsx(stdin_default7, {
											height: "100%",
											id: "xpaD346nT",
											layoutId: "xpaD346nT",
											style: {
												height: "100%",
												width: "100%",
											},
											width: "100%",
										})}
									</SmartComponentScopedContainerWithFX>
								</ComponentViewportProvider>
								<ComponentViewportProvider
									height={1}
									width={"100px"}
									y={
										(componentViewport?.y || 0) +
										88 +
										(((componentViewport?.height || 200) - 108 - 1697) / 2 +
											0 +
											0) +
										-33 +
										237.5
									}
									{...addPropertyOverrides(
										{
											abHsb8cMx: {
												y:
													(componentViewport?.y || 0) +
													88 +
													(((componentViewport?.height || 200) - 120 - 1537) /
														2 +
														0 +
														0) +
													-33 +
													237.5,
											},
											tkiLDJXPK: {
												y:
													(componentViewport?.y || 0) +
													88 +
													(((componentViewport?.height || 200) - 108 - 1412) /
														2 +
														0 +
														0) +
													-33 +
													237.5,
											},
										},
										baseVariant,
										gestureVariant,
									)}
								>
									<SmartComponentScopedContainerWithFX
										__framer__loop={animation14}
										__framer__loopEffectEnabled={true}
										__framer__loopRepeatDelay={1.7}
										__framer__loopRepeatType={"loop"}
										__framer__loopTransition={transition19}
										__perspectiveFX={false}
										__smartComponentFX={true}
										__targetOpacity={1}
										className={"framer-1gsqg92-container"}
										layoutDependency={layoutDependency}
										layoutId={"G9AtouB7c-container"}
										nodeId={"G9AtouB7c"}
										rendersWithMotion={true}
										scopeId={"S5FkFcOiX"}
										style={{
											rotate: 22.6,
										}}
									>
										{_jsx(stdin_default7, {
											height: "100%",
											id: "G9AtouB7c",
											layoutId: "G9AtouB7c",
											style: {
												height: "100%",
												width: "100%",
											},
											width: "100%",
										})}
									</SmartComponentScopedContainerWithFX>
								</ComponentViewportProvider>
								<ComponentViewportProvider
									height={1}
									width={"100px"}
									y={
										(componentViewport?.y || 0) +
										88 +
										(((componentViewport?.height || 200) - 108 - 1697) / 2 +
											0 +
											0) +
										-33 +
										10
									}
									{...addPropertyOverrides(
										{
											abHsb8cMx: {
												y:
													(componentViewport?.y || 0) +
													88 +
													(((componentViewport?.height || 200) - 120 - 1537) /
														2 +
														0 +
														0) +
													-33 +
													10,
											},
											tkiLDJXPK: {
												y:
													(componentViewport?.y || 0) +
													88 +
													(((componentViewport?.height || 200) - 108 - 1412) /
														2 +
														0 +
														0) +
													-33 +
													10,
											},
										},
										baseVariant,
										gestureVariant,
									)}
								>
									<SmartComponentScopedContainerWithFX
										__framer__loop={animation10}
										__framer__loopEffectEnabled={true}
										__framer__loopRepeatDelay={0.6}
										__framer__loopRepeatType={"loop"}
										__framer__loopTransition={transition8}
										__perspectiveFX={false}
										__smartComponentFX={true}
										__targetOpacity={1}
										className={"framer-2g5fyx-container"}
										layoutDependency={layoutDependency}
										layoutId={"JSU4mVJwU-container"}
										nodeId={"JSU4mVJwU"}
										rendersWithMotion={true}
										scopeId={"S5FkFcOiX"}
										style={{
											rotate: 22.6,
										}}
									>
										{_jsx(stdin_default7, {
											height: "100%",
											id: "JSU4mVJwU",
											layoutId: "JSU4mVJwU",
											style: {
												height: "100%",
												width: "100%",
											},
											width: "100%",
										})}
									</SmartComponentScopedContainerWithFX>
								</ComponentViewportProvider>
								<ComponentViewportProvider
									height={1}
									width={"100px"}
									y={
										(componentViewport?.y || 0) +
										88 +
										(((componentViewport?.height || 200) - 108 - 1697) / 2 +
											0 +
											0) +
										-33 +
										-30
									}
									{...addPropertyOverrides(
										{
											abHsb8cMx: {
												y:
													(componentViewport?.y || 0) +
													88 +
													(((componentViewport?.height || 200) - 120 - 1537) /
														2 +
														0 +
														0) +
													-33 +
													-30,
											},
											tkiLDJXPK: {
												y:
													(componentViewport?.y || 0) +
													88 +
													(((componentViewport?.height || 200) - 108 - 1412) /
														2 +
														0 +
														0) +
													-33 +
													-30,
											},
										},
										baseVariant,
										gestureVariant,
									)}
								>
									<SmartComponentScopedContainerWithFX
										__framer__loop={animation8}
										__framer__loopEffectEnabled={true}
										__framer__loopRepeatDelay={2}
										__framer__loopRepeatType={"loop"}
										__framer__loopTransition={transition20}
										__perspectiveFX={false}
										__smartComponentFX={true}
										__targetOpacity={1}
										className={"framer-22y9tm-container"}
										layoutDependency={layoutDependency}
										layoutId={"GNjXzpuD6-container"}
										nodeId={"GNjXzpuD6"}
										rendersWithMotion={true}
										scopeId={"S5FkFcOiX"}
										style={{
											rotate: 22.6,
										}}
									>
										{_jsx(stdin_default7, {
											height: "100%",
											id: "GNjXzpuD6",
											layoutId: "GNjXzpuD6",
											style: {
												height: "100%",
												width: "100%",
											},
											width: "100%",
										})}
									</SmartComponentScopedContainerWithFX>
								</ComponentViewportProvider>
								<ComponentViewportProvider
									height={1}
									width={"100px"}
									y={
										(componentViewport?.y || 0) +
										88 +
										(((componentViewport?.height || 200) - 108 - 1697) / 2 +
											0 +
											0) +
										-33 +
										-30
									}
									{...addPropertyOverrides(
										{
											abHsb8cMx: {
												y:
													(componentViewport?.y || 0) +
													88 +
													(((componentViewport?.height || 200) - 120 - 1537) /
														2 +
														0 +
														0) +
													-33 +
													-30,
											},
											tkiLDJXPK: {
												y:
													(componentViewport?.y || 0) +
													88 +
													(((componentViewport?.height || 200) - 108 - 1412) /
														2 +
														0 +
														0) +
													-33 +
													-30,
											},
										},
										baseVariant,
										gestureVariant,
									)}
								>
									<SmartComponentScopedContainerWithFX
										__framer__loop={animation12}
										__framer__loopEffectEnabled={true}
										__framer__loopRepeatDelay={2}
										__framer__loopRepeatType={"loop"}
										__framer__loopTransition={transition21}
										__perspectiveFX={false}
										__smartComponentFX={true}
										__targetOpacity={1}
										className={"framer-j5rna1-container"}
										layoutDependency={layoutDependency}
										layoutId={"A7r7PMDz8-container"}
										nodeId={"A7r7PMDz8"}
										rendersWithMotion={true}
										scopeId={"S5FkFcOiX"}
										style={{
											rotate: 22.6,
										}}
									>
										{_jsx(stdin_default7, {
											height: "100%",
											id: "A7r7PMDz8",
											layoutId: "A7r7PMDz8",
											style: {
												height: "100%",
												width: "100%",
											},
											width: "100%",
										})}
									</SmartComponentScopedContainerWithFX>
								</ComponentViewportProvider>
								<SVG
									className={"framer-tnsk7p"}
									data-framer-name={"Stars_BG"}
									layout={"position"}
									layoutDependency={layoutDependency}
									layoutId={"n9bdf3ZWX"}
									opacity={0.4}
									style={{
										opacity: 0.4,
									}}
									svg={
										'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 558 303"><g transform="translate(-4.698 -1.027)"><g transform="translate(0 0)"><path d="M 197.688 113.623 C 197.688 112.963 198.224 112.427 198.884 112.427 C 199.544 112.427 200.08 112.963 200.08 113.623 C 200.08 114.284 199.544 114.819 198.884 114.819 C 198.224 114.819 197.688 114.284 197.688 113.623 Z" fill="rgba(255,255,255,0.2)"></path><path d="M 107.252 80.729 C 107.252 80.068 107.787 79.533 108.447 79.533 C 109.108 79.533 109.643 80.068 109.643 80.729 C 109.643 81.389 109.108 81.925 108.447 81.925 C 107.787 81.925 107.252 81.389 107.252 80.729 Z" fill="rgba(255,255,255,0.2)"></path><path d="M 312.787 54.882 C 312.787 54.222 313.322 53.686 313.983 53.686 C 314.643 53.686 315.178 54.222 315.178 54.882 C 315.178 55.543 314.643 56.078 313.983 56.078 C 313.322 56.078 312.787 55.543 312.787 54.882 Z" fill="rgba(255,255,255,0.2)"></path><path d="M 167.15 27.862 C 167.15 27.201 167.686 26.666 168.346 26.666 C 169.007 26.666 169.542 27.201 169.542 27.862 C 169.542 28.522 169.007 29.058 168.346 29.058 C 167.686 29.058 167.15 28.522 167.15 27.862 Z" fill="rgba(255,255,255,0.2)"></path><path d="M 156.58 199.385 C 156.58 198.725 157.116 198.189 157.776 198.189 C 158.436 198.189 158.972 198.725 158.972 199.385 C 158.972 200.046 158.436 200.581 157.776 200.581 C 157.116 200.581 156.58 200.046 156.58 199.385 Z" fill="rgba(255,255,255,0.2)"></path><path d="M 87.286 104.225 C 87.286 103.564 87.821 103.029 88.481 103.029 C 89.142 103.029 89.677 103.564 89.677 104.225 C 89.677 104.885 89.142 105.421 88.481 105.421 C 87.821 105.421 87.286 104.885 87.286 104.225 Z" fill="rgba(255,255,255,0.2)"></path><path d="M 263.459 71.33 C 263.459 70.67 263.994 70.134 264.655 70.134 C 265.315 70.134 265.85 70.67 265.85 71.33 C 265.85 71.991 265.315 72.526 264.655 72.526 C 263.994 72.526 263.459 71.991 263.459 71.33 Z" fill="rgba(255,255,255,0.2)"></path><path d="M 301.043 209.959 C 301.043 209.299 301.578 208.763 302.238 208.763 C 302.899 208.763 303.434 209.299 303.434 209.959 C 303.434 210.62 302.899 211.155 302.238 211.155 C 301.578 211.155 301.043 210.62 301.043 209.959 Z" fill="rgba(255,255,255,0.2)"></path><path d="M 198.862 178.239 C 198.862 177.578 199.397 177.043 200.057 177.043 C 200.718 177.043 201.253 177.578 201.253 178.239 C 201.253 178.9 200.718 179.435 200.057 179.435 C 199.397 179.435 198.862 178.9 198.862 178.239 Z" fill="rgba(255,255,255,0.2)"></path><path d="M 237.62 16.113 C 237.62 15.453 238.155 14.917 238.815 14.917 C 239.476 14.917 240.011 15.453 240.011 16.113 C 240.011 16.774 239.476 17.309 238.815 17.309 C 238.155 17.309 237.62 16.774 237.62 16.113 Z" fill="rgba(255,255,255,0.2)"></path><path d="M 454.901 26.687 C 454.901 26.027 455.436 25.491 456.096 25.491 C 456.757 25.491 457.292 26.027 457.292 26.687 C 457.292 27.348 456.757 27.883 456.096 27.883 C 455.436 27.883 454.901 27.348 454.901 26.687 Z" fill="rgba(255,255,255,0.2)"></path><path d="M 370.337 114.798 C 370.337 114.137 370.873 113.602 371.533 113.602 C 372.194 113.602 372.729 114.137 372.729 114.798 C 372.729 115.458 372.194 115.994 371.533 115.994 C 370.873 115.994 370.337 115.458 370.337 114.798 Z" fill="rgba(255,255,255,0.2)"></path><path d="M 222.352 158.266 C 222.352 157.606 222.887 157.07 223.548 157.07 C 224.208 157.07 224.743 157.606 224.743 158.266 C 224.743 158.927 224.208 159.463 223.548 159.463 C 222.887 159.463 222.352 158.927 222.352 158.266 Z" fill="rgba(255,255,255,0.2)"></path><path d="M 8.595 34.91 C 8.595 34.25 9.13 33.714 9.791 33.714 C 10.451 33.714 10.986 34.25 10.986 34.91 C 10.986 35.571 10.451 36.106 9.791 36.106 C 9.13 36.106 8.595 35.571 8.595 34.91 Z" fill="rgba(255,255,255,0.2)"></path><path d="M 94.332 14.939 C 94.332 14.278 94.868 13.743 95.528 13.743 C 96.188 13.743 96.724 14.278 96.724 14.939 C 96.724 15.599 96.188 16.135 95.528 16.135 C 94.868 16.135 94.332 15.599 94.332 14.939 Z" fill="rgba(255,255,255,0.2)"></path><path d="M 380.907 33.736 C 380.907 33.075 381.442 32.54 382.102 32.54 C 382.763 32.54 383.298 33.075 383.298 33.736 C 383.298 34.396 382.763 34.932 382.102 34.932 C 381.442 34.932 380.907 34.396 380.907 33.736 Z" fill="rgba(255,255,255,0.2)"></path><path d="M 332.753 13.763 C 332.753 13.103 333.288 12.567 333.949 12.567 C 334.609 12.567 335.144 13.103 335.144 13.763 C 335.144 14.424 334.609 14.959 333.949 14.959 C 333.288 14.959 332.753 14.424 332.753 13.763 Z" fill="rgba(255,255,255,0.2)"></path><path d="M 245.841 134.77 C 245.841 134.11 246.377 133.574 247.037 133.574 C 247.697 133.574 248.233 134.11 248.233 134.77 C 248.233 135.431 247.697 135.966 247.037 135.966 C 246.377 135.966 245.841 135.431 245.841 134.77 Z" fill="rgba(255,255,255,0.2)"></path><path d="M 168.325 63.106 C 168.325 62.446 168.86 61.91 169.52 61.91 C 170.181 61.91 170.716 62.446 170.716 63.106 C 170.716 63.767 170.181 64.302 169.52 64.302 C 168.86 64.302 168.325 63.767 168.325 63.106 Z" fill="rgba(255,255,255,0.2)"></path><path d="M 200.036 12.589 C 200.036 11.928 200.571 11.393 201.232 11.393 C 201.892 11.393 202.427 11.928 202.427 12.589 C 202.427 13.249 201.892 13.785 201.232 13.785 C 200.571 13.785 200.036 13.249 200.036 12.589 Z" fill="rgba(255,255,255,0.2)"></path><path d="M 323.357 98.351 C 323.357 97.69 323.892 97.155 324.553 97.155 C 325.213 97.155 325.748 97.69 325.748 98.351 C 325.748 99.011 325.213 99.547 324.553 99.547 C 323.892 99.547 323.357 99.011 323.357 98.351 Z" fill="rgba(255,255,255,0.2)"></path><path d="M 282.251 208.784 C 282.251 208.123 282.786 207.588 283.446 207.588 C 284.107 207.588 284.642 208.123 284.642 208.784 C 284.642 209.444 284.107 209.98 283.446 209.98 C 282.786 209.98 282.251 209.444 282.251 208.784 Z" fill="rgba(255,255,255,0.2)"></path><g><g transform="translate(116.236 107.899)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgb(255,255,255)"></path></g><g transform="translate(24.871 74.666)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgb(255,255,255)"></path></g><g transform="translate(232.519 48.554)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgb(255,255,255)"></path></g><g transform="translate(85.385 21.255)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgb(255,255,255)"></path></g><g transform="translate(74.706 194.543)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgb(255,255,255)"></path></g><g transform="translate(4.698 98.403)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgb(255,255,255)"></path></g><g transform="translate(182.684 65.171)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgb(255,255,255)"></path></g><g transform="translate(220.653 205.224)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgb(255,255,255)"></path></g><g transform="translate(117.422 173.178)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgb(255,255,255)"></path></g><g transform="translate(156.579 9.386)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgb(255,255,255)"></path></g><g transform="translate(459.201 14.243)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgb(255,255,255)"></path></g><g transform="translate(373.768 103.26)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgb(255,255,255)"></path></g><g transform="translate(224.262 147.176)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgb(255,255,255)"></path></g><g transform="translate(8.306 22.551)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgb(255,255,255)"></path></g><g transform="translate(94.925 2.374)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgb(255,255,255)"></path></g><g transform="translate(0 108.008)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgb(255,255,255)"></path></g><g transform="translate(384.447 21.365)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgb(255,255,255)"></path></g><g transform="translate(335.797 1.187)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgb(255,255,255)"></path></g><g transform="translate(247.992 123.437)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgb(255,255,255)"></path></g><g transform="translate(169.678 51.036)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgb(255,255,255)"></path></g><g transform="translate(201.715 0)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgb(255,255,255)"></path></g><g transform="translate(326.305 86.644)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgb(255,255,255)"></path></g><g transform="translate(284.776 198.212)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgb(255,255,255)"></path></g></g><g transform="translate(202.013 204.922)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgba(255,255,255,0.4)"></path></g><g transform="translate(111.577 172.027)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgba(255,255,255,0.4)"></path></g><g transform="translate(317.112 146.181)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgba(255,255,255,0.4)"></path></g><g transform="translate(171.476 119.16)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgba(255,255,255,0.4)"></path></g><g transform="translate(160.906 290.684)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgba(255,255,255,0.4)"></path></g><g transform="translate(91.61 195.524)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgba(255,255,255,0.4)"></path></g><g transform="translate(267.784 162.629)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgba(255,255,255,0.4)"></path></g><g transform="translate(305.368 301.258)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgba(255,255,255,0.4)"></path></g><g transform="translate(203.187 269.538)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgba(255,255,255,0.4)"></path></g><g transform="translate(241.945 107.412)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgba(255,255,255,0.4)"></path></g><g transform="translate(459.225 117.985)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgba(255,255,255,0.4)"></path></g><g transform="translate(374.662 206.097)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgba(255,255,255,0.4)"></path></g><g transform="translate(226.677 249.565)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgba(255,255,255,0.4)"></path></g><g transform="translate(12.919 126.209)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgba(255,255,255,0.4)"></path></g><g transform="translate(98.658 106.237)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgba(255,255,255,0.4)"></path></g><g transform="translate(4.698 210.796)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgba(255,255,255,0.4)"></path></g><g transform="translate(385.232 125.035)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgba(255,255,255,0.4)"></path></g><g transform="translate(337.078 105.062)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgba(255,255,255,0.4)"></path></g><g transform="translate(250.167 226.069)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgba(255,255,255,0.4)"></path></g><g transform="translate(172.649 154.405)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgba(255,255,255,0.4)"></path></g><g transform="translate(204.361 103.888)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgba(255,255,255,0.4)"></path></g><g transform="translate(327.682 189.649)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgba(255,255,255,0.4)"></path></g><g transform="translate(286.575 300.082)"><path d="M 0 0.797 C 0 0.357 0.357 0 0.797 0 C 1.237 0 1.594 0.357 1.594 0.797 C 1.594 1.238 1.237 1.595 0.797 1.595 C 0.357 1.595 0 1.238 0 0.797 Z" fill="rgba(255,255,255,0.4)"></path></g><path d="M 514.493 116.414 C 514.493 115.974 514.85 115.617 515.29 115.617 C 515.73 115.617 516.087 115.974 516.087 116.414 C 516.087 116.855 515.73 117.212 515.29 117.212 C 514.85 117.212 514.493 116.855 514.493 116.414 Z" fill="rgba(255,255,255,0.7)"></path><path d="M 424.057 83.52 C 424.057 83.079 424.414 82.722 424.854 82.722 C 425.294 82.722 425.651 83.079 425.651 83.52 C 425.651 83.96 425.294 84.317 424.854 84.317 C 424.414 84.317 424.057 83.96 424.057 83.52 Z" fill="rgba(255,255,255,0.7)"></path><path d="M 483.956 30.652 C 483.956 30.212 484.313 29.855 484.753 29.855 C 485.193 29.855 485.55 30.212 485.55 30.652 C 485.55 31.093 485.193 31.45 484.753 31.45 C 484.313 31.45 483.956 31.093 483.956 30.652 Z" fill="rgba(255,255,255,0.7)"></path><path d="M 473.386 202.176 C 473.386 201.736 473.743 201.379 474.183 201.379 C 474.623 201.379 474.98 201.736 474.98 202.176 C 474.98 202.616 474.623 202.973 474.183 202.973 C 473.743 202.973 473.386 202.616 473.386 202.176 Z" fill="rgba(255,255,255,0.7)"></path><path d="M 404.09 107.016 C 404.09 106.575 404.447 106.218 404.887 106.218 C 405.327 106.218 405.684 106.575 405.684 107.016 C 405.684 107.456 405.327 107.813 404.887 107.813 C 404.447 107.813 404.09 107.456 404.09 107.016 Z" fill="rgba(255,255,255,0.7)"></path><path d="M 515.667 181.03 C 515.667 180.589 516.024 180.232 516.464 180.232 C 516.904 180.232 517.261 180.589 517.261 181.03 C 517.261 181.47 516.904 181.827 516.464 181.827 C 516.024 181.827 515.667 181.47 515.667 181.03 Z" fill="rgba(255,255,255,0.7)"></path><path d="M 554.425 18.904 C 554.425 18.464 554.782 18.107 555.222 18.107 C 555.662 18.107 556.019 18.464 556.019 18.904 C 556.019 19.344 555.662 19.701 555.222 19.701 C 554.782 19.701 554.425 19.344 554.425 18.904 Z" fill="rgba(255,255,255,0.7)"></path><path d="M 539.157 161.057 C 539.157 160.617 539.514 160.26 539.954 160.26 C 540.395 160.26 540.751 160.617 540.751 161.057 C 540.751 161.498 540.395 161.855 539.954 161.855 C 539.514 161.855 539.157 161.498 539.157 161.057 Z" fill="rgba(255,255,255,0.7)"></path><path d="M 325.399 37.701 C 325.399 37.261 325.756 36.904 326.196 36.904 C 326.637 36.904 326.994 37.261 326.994 37.701 C 326.994 38.142 326.637 38.499 326.196 38.499 C 325.756 38.499 325.399 38.142 325.399 37.701 Z" fill="rgba(255,255,255,0.7)"></path><path d="M 411.138 17.729 C 411.138 17.289 411.494 16.932 411.935 16.932 C 412.375 16.932 412.732 17.289 412.732 17.729 C 412.732 18.17 412.375 18.527 411.935 18.527 C 411.494 18.527 411.138 18.17 411.138 17.729 Z" fill="rgba(255,255,255,0.7)"></path><path d="M 317.178 122.288 C 317.178 121.848 317.535 121.491 317.976 121.491 C 318.416 121.491 318.773 121.848 318.773 122.288 C 318.773 122.729 318.416 123.086 317.976 123.086 C 317.535 123.086 317.178 122.729 317.178 122.288 Z" fill="rgba(255,255,255,0.7)"></path><path d="M 562.647 137.561 C 562.647 137.121 563.003 136.764 563.444 136.764 C 563.884 136.764 564.241 137.121 564.241 137.561 C 564.241 138.002 563.884 138.359 563.444 138.359 C 563.003 138.359 562.647 138.002 562.647 137.561 Z" fill="rgba(255,255,255,0.7)"></path><path d="M 485.129 65.897 C 485.129 65.457 485.486 65.1 485.926 65.1 C 486.367 65.1 486.723 65.457 486.723 65.897 C 486.723 66.337 486.367 66.694 485.926 66.694 C 485.486 66.694 485.129 66.337 485.129 65.897 Z" fill="rgba(255,255,255,0.7)"></path><path d="M 516.841 15.38 C 516.841 14.939 517.198 14.582 517.638 14.582 C 518.078 14.582 518.435 14.939 518.435 15.38 C 518.435 15.82 518.078 16.177 517.638 16.177 C 517.198 16.177 516.841 15.82 516.841 15.38 Z" fill="rgba(255,255,255,0.7)"></path></g></g></svg>'
									}
									svgContentId={9182568897}
									withExternalLayout={true}
								/>
							</motion.div>
						</ImageWithFXWithOptimizedAppearEffect>
						<ComponentViewportProvider
							height={153}
							width={`min(${componentViewport?.width || "100vw"} - 160px, 1440px)`}
							y={
								(componentViewport?.y || 0) +
								88 +
								(((componentViewport?.height || 200) - 108 - 1697) / 2 +
									1512 +
									32)
							}
							{...addPropertyOverrides(
								{
									abHsb8cMx: {
										width: `min(${componentViewport?.width || "100vw"} - 52px, 1440px)`,
										y:
											(componentViewport?.y || 0) +
											88 +
											(((componentViewport?.height || 200) - 120 - 1537) / 2 +
												1352 +
												32),
									},
									tkiLDJXPK: {
										width: `min(${componentViewport?.width || "100vw"} - 40px, 1440px)`,
										y:
											(componentViewport?.y || 0) +
											88 +
											(((componentViewport?.height || 200) - 108 - 1412) / 2 +
												1227 +
												32),
									},
								},
								baseVariant,
								gestureVariant,
							)}
						>
							<SmartComponentScopedContainer
								className={"framer-19nkyt9-container"}
								layoutDependency={layoutDependency}
								layoutId={"YJKPJ_vkL-container"}
								nodeId={"YJKPJ_vkL"}
								rendersWithMotion={true}
								scopeId={"S5FkFcOiX"}
							>
								{_jsx(stdin_default5, {
									height: "100%",
									id: "YJKPJ_vkL",
									layoutId: "YJKPJ_vkL",
									style: {
										maxWidth: "100%",
										width: "100%",
									},
									variant: "FhRr9HGsf",
									width: "100%",
									...addPropertyOverrides(
										{
											tkiLDJXPK: {
												variant: "v_Wjq23_V",
											},
										},
										baseVariant,
										gestureVariant,
									),
								})}
							</SmartComponentScopedContainer>
						</ComponentViewportProvider>
					</motion.section>
				</Transition>
			</Variants>
		</LayoutGroup>
	);
});
var css3 = [
	"@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }",
	".framer-b62lb.framer-190qc4i, .framer-b62lb .framer-190qc4i { display: block; }",
	".framer-b62lb.framer-eetyh4 { align-content: center; align-items: center; display: flex; flex-direction: column; flex-wrap: nowrap; gap: 32px; height: min-content; justify-content: center; overflow: visible; padding: 88px 80px 20px 80px; position: relative; width: 1200px; }",
	".framer-b62lb .framer-1edkqgx { align-content: center; align-items: center; display: flex; flex: none; flex-direction: column; flex-wrap: nowrap; gap: 80px; height: min-content; justify-content: center; max-width: 1440px; overflow: hidden; padding: 124px 80px 80px 80px; position: relative; width: 100%; will-change: var(--framer-will-change-override, transform); }",
	".framer-b62lb .framer-13g5sev { align-content: center; align-items: center; display: flex; flex: none; flex-direction: column; flex-wrap: nowrap; gap: 64px; height: min-content; justify-content: center; max-width: 700px; overflow: visible; padding: 0px; position: relative; width: 100%; z-index: 10; }",
	".framer-b62lb .framer-rt7a07-container, .framer-b62lb .framer-r4b1nv-container, .framer-b62lb .framer-1juq70x-container { flex: none; height: auto; position: relative; width: auto; }",
	".framer-b62lb .framer-1e0p1hg { align-content: center; align-items: center; display: flex; flex: none; flex-direction: column; flex-wrap: nowrap; gap: 18px; height: min-content; justify-content: center; overflow: visible; padding: 0px; position: relative; width: 100%; }",
	".framer-b62lb .framer-13iyrmu, .framer-b62lb .framer-1d8sxh9 { flex: none; height: auto; position: relative; white-space: pre-wrap; width: 100%; word-break: break-word; word-wrap: break-word; }",
	".framer-b62lb .framer-awkb0t { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 10px; height: min-content; justify-content: center; overflow: visible; padding: 0px; position: relative; width: 100%; }",
	".framer-b62lb .framer-1jq70zg-container { aspect-ratio: 1.4193548387096775 / 1; flex: none; height: var(--framer-aspect-ratio-supported, 620px); position: relative; width: 100%; z-index: 10; }",
	".framer-b62lb .framer-1tjot6i-container { flex: none; height: auto; position: relative; width: 100%; z-index: 10; }",
	".framer-b62lb .framer-1490lq7 { flex: none; height: 476px; left: -62px; overflow: visible; position: absolute; right: 0px; top: -33px; z-index: 1; }",
	".framer-b62lb .framer-1x5i0d3-container { flex: none; height: 1px; left: -110px; position: absolute; top: 40px; width: 110px; z-index: 2; }",
	".framer-b62lb .framer-t6zxzu-container { flex: none; height: 1px; left: -100px; position: absolute; top: 70px; width: 100px; z-index: 2; }",
	".framer-b62lb .framer-sijvh7-container { flex: none; height: 1px; left: -120px; position: absolute; top: 140px; width: 100px; z-index: 2; }",
	".framer-b62lb .framer-189rquj-container { flex: none; height: 1px; left: -120px; position: absolute; top: 160px; width: 100px; z-index: 2; }",
	".framer-b62lb .framer-smveb3-container { flex: none; height: 1px; left: -120px; position: absolute; top: calc(52.63157894736844% - 1px / 2); width: 100px; z-index: 2; }",
	".framer-b62lb .framer-xso07l-container { flex: none; height: 1px; left: -100px; position: absolute; top: -30px; width: 100px; z-index: 2; }",
	".framer-b62lb .framer-1212zc6-container { flex: none; height: 1px; left: -10px; position: absolute; top: -30px; width: 100px; z-index: 2; }",
	".framer-b62lb .framer-16z5n1t-container { flex: none; height: 1px; left: 50px; position: absolute; top: -40px; width: 100px; z-index: 2; }",
	".framer-b62lb .framer-kfpmno-container { flex: none; height: 1px; left: -90px; position: absolute; top: -40px; width: 100px; z-index: 2; }",
	".framer-b62lb .framer-1o1ui2s-container { flex: none; height: 1px; left: 200px; position: absolute; top: -30px; width: 100px; z-index: 2; }",
	".framer-b62lb .framer-r6aprj-container { flex: none; height: 1px; left: 290px; position: absolute; top: -40px; width: 100px; z-index: 2; }",
	".framer-b62lb .framer-1d2z9ns-container { flex: none; height: 1px; left: 120px; position: absolute; top: -40px; width: 100px; z-index: 2; }",
	".framer-b62lb .framer-2yt8bl-container { flex: none; height: 1px; left: 140px; position: absolute; top: -40px; width: 100px; z-index: 2; }",
	".framer-b62lb .framer-1gsqg92-container { flex: none; height: 1px; left: -100px; position: absolute; top: calc(50.00000000000002% - 1px / 2); width: 100px; z-index: 2; }",
	".framer-b62lb .framer-2g5fyx-container { flex: none; height: 1px; left: -120px; position: absolute; top: 10px; width: 100px; z-index: 2; }",
	".framer-b62lb .framer-22y9tm-container, .framer-b62lb .framer-j5rna1-container { flex: none; height: 1px; left: 140px; position: absolute; top: -30px; width: 100px; z-index: 2; }",
	".framer-b62lb .framer-tnsk7p { flex: none; height: 303px; left: 0px; position: absolute; top: 0px; width: 558px; }",
	".framer-b62lb .framer-19nkyt9-container { flex: none; height: auto; max-width: 1440px; position: relative; width: 100%; z-index: 10; }",
	".framer-b62lb.framer-v-1jhznf3.framer-eetyh4 { padding: 88px 32px 32px 20px; width: 810px; }",
	".framer-b62lb.framer-v-1jhznf3 .framer-1edkqgx { padding: 124px 20px 40px 20px; }",
	".framer-b62lb.framer-v-1jhznf3 .framer-1jq70zg-container { height: var(--framer-aspect-ratio-supported, 141px); }",
	".framer-b62lb.framer-v-1yba6oq.framer-eetyh4 { padding: 88px 20px 20px 20px; width: 390px; }",
	".framer-b62lb.framer-v-1yba6oq .framer-1edkqgx { align-content: flex-start; align-items: flex-start; gap: 64px; padding: 80px 16px 32px 16px; }",
	".framer-b62lb.framer-v-1yba6oq .framer-awkb0t { flex-direction: column; }",
	".framer-b62lb.framer-v-1yba6oq .framer-r4b1nv-container, .framer-b62lb.framer-v-1yba6oq .framer-1juq70x-container { width: 100%; }",
	".framer-b62lb.framer-v-1yba6oq .framer-1jq70zg-container { height: var(--framer-aspect-ratio-supported, 409px); width: 566px; }",
	...css2,
	...css,
];
var FramerS5FkFcOiX = withCSS(Component, css3, "framer-b62lb");
var stdin_default8 = FramerS5FkFcOiX;
FramerS5FkFcOiX.displayName = "Courses Hero";
FramerS5FkFcOiX.defaultProps = {
	height: 1811,
	width: 1200,
};
addPropertyControls(FramerS5FkFcOiX, {
	variant: {
		options: ["uJv11ixgj", "abHsb8cMx", "tkiLDJXPK"],
		optionTitles: ["Desktop", "Tablet", "Phone"],
		title: "Variant",
		type: ControlType.Enum,
	},
});
addFonts(
	FramerS5FkFcOiX,
	[
		{
			explicitInter: true,
			fonts: [
				{
					cssFamilyName: "Inter",
					source: "framer",
					style: "normal",
					uiFamilyName: "Inter",
					unicodeRange:
						"U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F",
					url: "https://framerusercontent.com/assets/5vvr9Vy74if2I6bQbJvbw7SY1pQ.woff2",
					weight: "400",
				},
				{
					cssFamilyName: "Inter",
					source: "framer",
					style: "normal",
					uiFamilyName: "Inter",
					unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116",
					url: "https://framerusercontent.com/assets/EOr0mi4hNtlgWNn9if640EZzXCo.woff2",
					weight: "400",
				},
				{
					cssFamilyName: "Inter",
					source: "framer",
					style: "normal",
					uiFamilyName: "Inter",
					unicodeRange: "U+1F00-1FFF",
					url: "https://framerusercontent.com/assets/Y9k9QrlZAqio88Klkmbd8VoMQc.woff2",
					weight: "400",
				},
				{
					cssFamilyName: "Inter",
					source: "framer",
					style: "normal",
					uiFamilyName: "Inter",
					unicodeRange: "U+0370-03FF",
					url: "https://framerusercontent.com/assets/OYrD2tBIBPvoJXiIHnLoOXnY9M.woff2",
					weight: "400",
				},
				{
					cssFamilyName: "Inter",
					source: "framer",
					style: "normal",
					uiFamilyName: "Inter",
					unicodeRange:
						"U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF",
					url: "https://framerusercontent.com/assets/JeYwfuaPfZHQhEG8U5gtPDZ7WQ.woff2",
					weight: "400",
				},
				{
					cssFamilyName: "Inter",
					source: "framer",
					style: "normal",
					uiFamilyName: "Inter",
					unicodeRange:
						"U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
					url: "https://framerusercontent.com/assets/GrgcKwrN6d3Uz8EwcLHZxwEfC4.woff2",
					weight: "400",
				},
				{
					cssFamilyName: "Inter",
					source: "framer",
					style: "normal",
					uiFamilyName: "Inter",
					unicodeRange:
						"U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB",
					url: "https://framerusercontent.com/assets/b6Y37FthZeALduNqHicBT6FutY.woff2",
					weight: "400",
				},
			],
		},
		...HeroBadgeFonts,
		...ButtonSecondaryFonts,
		...ButtonPrimaryFonts,
		...DesktopDashboardImageFonts,
		...SocialProofFonts,
		...ShimmerSecondFonts,
		...MetricsFonts,
		...getFontsFromSharedStyle(fonts2),
		...getFontsFromSharedStyle(fonts),
	],
	{
		supportsExplicitInterCodegen: true,
	},
);

// virtual:courses-hero
import { WithFramerBreakpoints } from "unframer";
import { jsx } from "react/jsx-runtime";
var locales = [];
var defaultResponsiveVariants = {
	base: "tkiLDJXPK",
	md: "abHsb8cMx",
	xl: "uJv11ixgj",
};
/** @type {function(Props): any} */
function ComponentWithRoot({ locale, ...rest }) {
	return (
		<ContextProviders
			routes={routes}
			framerSiteId={
				"cfe7f02456486a1b782c98a22db14254d4e15a2a92102e54c71e84b8efc93bf4"
			}
			locale={locale}
			locales={locales}
		>
			{jsx(stdin_default8, {
				...rest,
			})}
		</ContextProviders>
	);
}
/**
 * @type {import("unframer").UnframerBreakpoint}
 * Represents a responsive breakpoint for unframer.
 */

/**
 * @typedef VariantsMap
 * Partial record of UnframerBreakpoint to Props.variant, with a mandatory 'base' key.
 * { [key in UnframerBreakpoint]?: Props['variant'] } & { base: Props['variant'] }
 */

/**
 * Renders CoursesHeroFramerComponent for all breakpoints with a variants map. Variant prop is inferred per breakpoint.
 * @function
 * @param {Omit<Props, 'variant'> & {variants?: VariantsMap}} props
 * @returns {any}
 */
ComponentWithRoot.Responsive = ({ locale = "", ...rest }) => {
	return (
		<ContextProviders
			routes={routes}
			framerSiteId={
				"cfe7f02456486a1b782c98a22db14254d4e15a2a92102e54c71e84b8efc93bf4"
			}
			locale={locale}
			locales={locales}
		>
			<WithFramerBreakpoints
				Component={stdin_default8}
				variants={defaultResponsiveVariants}
				{...rest}
			/>
		</ContextProviders>
	);
};
Object.assign(ComponentWithRoot, stdin_default8);
var courses_hero_default = ComponentWithRoot;
export { courses_hero_default as default };
