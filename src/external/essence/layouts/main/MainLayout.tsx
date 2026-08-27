"use client";

import { FC, PropsWithChildren } from "react";
import { Box, Container, useTheme } from "@mui/material";
// CUSTOM COMPONENTS
import Footer from "./Footer";
import Header from "./Header";
// CUSTOM UTILS METHOD
import { isDark } from "@/external/essence/utils/constants";

const MainLayout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <Box bgcolor={isDark(useTheme()) ? "background.default" : "white"}>
      {/* HEADER SECTION */}
      <Container maxWidth="lg">
        <Header />
      </Container>

      {/* MAIN CONTENT RENDER SECTION */}
      {children}

      {/* FOOTER SECTION */}
      <Footer />
    </Box>
  );
};

export default MainLayout;
