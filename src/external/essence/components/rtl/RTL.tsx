"use client";

import { FC, PropsWithChildren, useEffect } from "react";
import createCache, { StylisPlugin } from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { useTheme } from "@mui/material/styles";
import { prefixer } from "stylis";
import stylisRTLPlugin from "stylis-plugin-rtl";

const RTL: FC<PropsWithChildren> = ({ children }) => {
  const theme = useTheme();

  useEffect(() => {
    document.dir = theme.direction;
  }, [theme.direction]);

  const cacheRTL = createCache({
    key: theme.direction === "rtl" ? "rtl" : "css",
    stylisPlugins:
      theme.direction === "rtl"
        ? ([prefixer, stylisRTLPlugin] as StylisPlugin[])
        : [],
  });

  cacheRTL.compat = true;

  return <CacheProvider value={cacheRTL}>{children}</CacheProvider>;
};

export default RTL;
