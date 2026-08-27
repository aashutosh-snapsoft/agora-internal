import { FC, Fragment } from "react";
// CUSTOM COMPONENTS
import { FlexBox } from "../flexbox";
import { Percentage } from "../percentage";
import { H6, Paragraph, Span } from "../typography";
// CUSTOM UTILS METHOD
import { numberFormat } from "@/external/essence/utils/numberFormat";

// ==============================================================
type TitleProps = {
  subtitle: string;
  titlePrefix?: string;
  title: string | number;
  percentage: string | number;
  percentageType?: "primary" | "success" | "error";
};
// ==============================================================

const Title: FC<TitleProps> = ({
  title,
  subtitle,
  percentage,
  titlePrefix,
  percentageType = "success",
}) => {
  return (
    <Fragment>
      <FlexBox alignItems="center" gap={1} component="header">
        <H6>
          {titlePrefix && (
            <Span fontWeight={500} fontSize={18} color="grey.400">
              {titlePrefix}
            </Span>
          )}

          {typeof title === "number" ? numberFormat(title) : title}
        </H6>

        <Percentage type={percentageType}>{percentage}</Percentage>
      </FlexBox>

      <Paragraph color="text.secondary">{subtitle}</Paragraph>
    </Fragment>
  );
};

export default Title;
