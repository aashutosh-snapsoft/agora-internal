import {
	Box,
	Skeleton,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableRow,
} from "@mui/material";
import React from "react";

const TableSkeletonLoader = () => {
	return (
		<Box className=" overflow-hidden  flex-auto p-12" data-testid="table-skeleton">
			<TableContainer>
				<Table>
					<TableBody>
						{Array.from(new Array(30)).map((_, index) => (
							<TableRow key={index}>
								<TableCell height={40}>
									<Skeleton
										animation="wave"
										height={"25px"}
										variant="text"
										width={`${Math.random() * (120 - 80) + 80}px`}
									/>
								</TableCell>
								<TableCell height={40}>
									<Skeleton
										animation="wave"
										height={"25px"}
										variant="text"
										width={`${Math.random() * (70 - 40) + 40}px`}
									/>
								</TableCell>
								<TableCell height={40}>
									<Skeleton
										animation="wave"
										height={"25px"}
										variant="text"
										width={`${Math.random() * (120 - 80) + 80}px`}
									/>
								</TableCell>
								<TableCell height={40}>
									<Skeleton
										animation="wave"
										height={"25px"}
										variant="text"
										width={`${Math.random() * (120 - 90) + 90}px`}
									/>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
		</Box>
	);
};

export default TableSkeletonLoader;
