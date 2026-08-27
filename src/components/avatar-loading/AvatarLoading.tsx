import { Avatar, AvatarProps, useTheme } from "@mui/material";
import { FC } from "react";
import { isDark } from "@/external/essence/utils/constants";

// ==============================================================
interface Props extends AvatarProps {
  percentage: number;
  borderSize?: number;
}
// ==============================================================

const AvatarLoading: FC<Props> = ({
  percentage,
  borderSize = 1,
  src,
  alt,
  sx,
  ...props
}) => {
  const theme = useTheme();

  const MAIN = theme.palette.primary.main;
  const GREY_800 = theme.palette.grey[800];
  const GREY_200 = theme.palette.grey[200];

  const DEG = Math.round((percentage / 100) * 360);

  return (
    <Avatar
      alt={alt || "user"}
      src={src || "/static/user/user-11.png"}
      sx={{
        backgroundOrigin: "border-box",
        border: `double ${borderSize}px transparent`,
        backgroundClip: "padding-box, border-box",
        backgroundImage: `linear-gradient(white, white), conic-gradient(from 0deg, ${MAIN} ${DEG}deg, ${GREY_200} 0deg)`,
        ...(isDark(theme) && {
          backgroundImage: `linear-gradient(${GREY_800}, ${GREY_800}), conic-gradient(from 0deg, ${MAIN} ${DEG}deg, ${GREY_800} 0deg)`,
        }),
        ...sx,
      }}
      {...props}
    />
  );
};

export default AvatarLoading;
