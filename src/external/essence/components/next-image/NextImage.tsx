import Image, { ImageProps } from "next/image";

const NextImage = (props: ImageProps) => {
  return (
    <Image
      {...props}
      alt={props.alt || ""}
      style={{ width: "100%", height: "auto", ...props.style }}
    />
  );
};

export default NextImage;
