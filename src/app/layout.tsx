"use client";
import "./globals.css";
import "./Styles/ag-grid-styles.css";
import "./Styles/fm-styles.css";
import "./Styles/project-onboarding.css";
import "./Styles/fonts.css";
import "./index";
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css"; // Optional Theme applied to the Data Grid
import { MathJaxContext } from "better-react-mathjax";
import DashboardLayout from "@/external/essence/layouts/dashboard/DashboardLayout";
import SettingsProvider from "@/external/essence/contexts/settingsContext";
import ThemeProvider from "@/external/essence/theme/ThemeProvider";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import AppInitializer from "@/components/AppInitializer/AppInitializer";
import ReduxProvider from "@/store/Providers/ReduxProvider";
import QueryProvider from "@/store/Providers/QueryProvider";
import { config } from "@/config";
import { AlertProvider } from "@/context/alerts-context";
import { AvatarProvider } from "@/context/avatar-context";

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<head>
				<link rel="icon" href="/favicon.png" type="image/png" />
			</head>
			<body>
				{config.gaMeasurementId && (
					<GoogleAnalytics GA_MEASUREMENT_ID={config.gaMeasurementId} />
				)}
					<ReduxProvider>
						<QueryProvider>
							<AppInitializer>
								<SettingsProvider>
									<ThemeProvider>
										<AlertProvider>
											<AvatarProvider>
												<MathJaxContext
													config={{
														tex: {
															inlineMath: [
																["$", "$"],
																["\\(", "\\)"],
															],
															displayMath: [
																["$$", "$$"],
																["\\[", "\\]"],
															],
														},
														startup: {
															typeset: true,
														},
													}}
												>
													<DashboardLayout>{children}</DashboardLayout>
												</MathJaxContext>
											</AvatarProvider>
										</AlertProvider>
									</ThemeProvider>
								</SettingsProvider>
							</AppInitializer>
						</QueryProvider>
					</ReduxProvider>
			</body>
		</html>
	);
}
