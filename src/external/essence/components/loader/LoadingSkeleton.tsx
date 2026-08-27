import { Skeleton } from "@mui/material";
import Grid from "@mui/material/Grid2";

const LoadingSkeleton = () => {
  return (
    <Grid container spacing={3}>
      <Grid size={{ md: 8, xs: 12 }}>
        <Skeleton
          variant="rounded"
          width="100%"
          height={300}
          sx={{ borderRadius: 4 }}
        />
      </Grid>

      <Grid size={{ md: 4, xs: 12 }}>
        <Skeleton
          variant="rounded"
          width="100%"
          height={300}
          sx={{ borderRadius: 4 }}
        />
      </Grid>

      <Grid size={{ md: 4, xs: 12 }}>
        <Skeleton
          variant="rounded"
          width="100%"
          height={300}
          sx={{ borderRadius: 4 }}
        />
      </Grid>

      <Grid size={{ md: 8, xs: 12 }}>
        <Skeleton
          variant="rounded"
          width="100%"
          height={300}
          sx={{ borderRadius: 4 }}
        />
      </Grid>

      <Grid size={{ md: 8, xs: 12 }}>
        <Skeleton
          variant="rounded"
          width="100%"
          height={300}
          sx={{ borderRadius: 4 }}
        />
      </Grid>

      <Grid size={{ md: 4, xs: 12 }}>
        <Skeleton
          variant="rounded"
          width="100%"
          height={300}
          sx={{ borderRadius: 4 }}
        />
      </Grid>
    </Grid>
  );
};

export default LoadingSkeleton;
