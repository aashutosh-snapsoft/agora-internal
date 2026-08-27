import { CustomCellRendererProps } from '@ag-grid-community/react';
import React, { useEffect, useState } from 'react';

const NumericCellRenderer = (props: CustomCellRendererProps & { isFilterRenderer?: boolean }) => {
    const [value, setValue] = useState<string>('');

    useEffect(() => {
        if (!props.value) {
            setValue(props.isFilterRenderer ? '(Blanks)' : props.value);
        } else if (props.value === '(Select All)') {
            setValue(props.value);
        } else {
            // Format number with commas and 2 decimal places
            const formatter = new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            const formattedValue = formatter.format(Number(props.value));
            setValue(formattedValue);
        }
    }, [props.value, props.isFilterRenderer]);

    return <div dangerouslySetInnerHTML={{ __html: value }}></div>;
};

export default NumericCellRenderer; 