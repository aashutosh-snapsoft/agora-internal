import { Avatar, AvatarProps, useTheme } from "@mui/material";
import { FC, useState } from "react";
import { isDark } from "@/external/essence/utils/constants";
import { getSafeAvatarUrl } from "@/lib/utils/avatar";

interface Props extends AvatarProps {
	percentage: number;
	borderSize?: number;
}

const AvatarLoading: FC<Props> = ({
	percentage,
	borderSize = 1,
	src,
	alt,
	sx,
	...props
}) => {
	const [imageFailed, setImageFailed] = useState(false);
	const theme = useTheme();

	const MAIN = theme.palette.primary.main;
	const GREY_800 = theme.palette.grey[800];
	const GREY_200 = theme.palette.grey[200];

	const DEG = Math.round((percentage / 100) * 360);

	// Use safe avatar url
	const avatarSrc = getSafeAvatarUrl(
		imageFailed ? null : src,
		"/static/avatar/avatar_neutral.svg"
	);

	console.log("Avatar URL:", avatarSrc);

	return (
		<Avatar
			alt={alt || "user"}
			src={avatarSrc}
		onError={e => {
			if (!imageFailed) {
				setImageFailed(true);
				// Try fallback directly for broken images
				(e.currentTarget as HTMLImageElement).src = "/static/avatar/avatar_neutral.svg";
			}
		}}
			sx={{
				backgroundOrigin: "border-box",
				border: `double ${borderSize}px transparent`,
				backgroundClip: "padding-box, border-box",
				...sx,
			}}
			{...props}
		>
			{imageFailed && (alt || "user")}
		</Avatar>
	);
};

export default AvatarLoading;
